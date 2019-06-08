import { equal, throws } from 'assert';
import JsonExpress from '../json-express';

const SchemaMatchBuilder = {
  schema: {
    type: '=SchemaMatch',
    name: '?^string=SchemaMatchBuilder',
    data: '^string',
    notable: 'boolean'
  },
  build: (data) => {
    return data.data;
  }
};

const BodyBuilder = {
  schema: {
    body: 'any'
  },
  build: (data) => {
    return '<body>' + data.body + '</body>';
  }
};

const ListBuilder = {
  schema: {
    items: 'array'
  },
  build: async (data) => {
    return '<ul>' + data.items.map(p => '<li>' + p + '</li>').join('') + '</ul>';
  }
};

const DataBinder = {
  schema: {
    binding: '?^string',
    data: '^any',
    rest: '...'
  },
  transform: async (data, ctx) => {
    ctx[data.binding || '$'] = data.data;
    return data.rest;
  }
};

const PlaceholderTransformer = {
  schema: {
    placeholderValue: '^string'
  },
  placeholder: () => 'Loading...',
  transform: async (data) => {
    return data.placeholderValue;
  }
};

describe('JsonExpress', function () {
  it('works with builders', async () => {
    const je = new JsonExpress([ BodyBuilder, ListBuilder, DataBinder ]);
    const result = await je.build({
      data: {
        name: 'Dongho',
        age: 29
      },
      body: {
        items: [ 'my name is {$.name} ', 'and age is {$.age}.' ]
      }
    });

    equal(result, '<body><ul><li>my name is Dongho </li><li>and age is 29.</li></ul></body>');
  });

  it('matches schema types', async () => {
    const je = new JsonExpress([ SchemaMatchBuilder ]);
    const result = await je.build({
      type: 'SchemaMatch',
      data: '{=name}',
      notable: false
    }, {
      name: 'test'
    });

    equal(result, '{=name}');
  });

  it('does not accept duplicate schema', () => {
    throws(() => {
      new JsonExpress([
        {
          schema: {
            type: '=test',
            body: '?object',
            rest: '...'
          }
        },
        {
          schema: {
            body: 'object',
            type: 'string=test'
          }
        }
      ]);
    });
  });

  it('uses placeholder before complete build', async () => {
    const je = new JsonExpress([ PlaceholderTransformer, ListBuilder ]);
    const midResults = [];
    const finalResult = await je.build({
      items: [
        { placeholderValue: 'test1' },
        { placeholderValue: 'test2' },
        { placeholderValue: 'test3' }
      ]
    }, {}, r => {
      midResults.push(r);
    });

    equal(finalResult, '<ul><li>test1</li><li>test2</li><li>test3</li></ul>');
    equal(midResults.length, 4);
  });
});
