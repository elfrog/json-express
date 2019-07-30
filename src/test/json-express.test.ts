import { equal, throws, doesNotThrow, rejects, doesNotReject } from 'assert';
import JsonExpress from '../json-express';

const BodyBuilder = {
  schema: {
    body: {}
  },
  build: (data) => {
    return '<body>' + data.body + '</body>';
  }
};

const ListBuilder = {
  schema: {
    items: {
      type: 'array'
    }
  },
  build: async (data) => {
    return '<ul>' + data.items.map(p => '<li>' + p + '</li>').join('') + '</ul>';
  }
};

const DataBinder = {
  schema: {
    binding: {
      required: false
    },
    data: {
      plainLevel: 1,
    },
    rest: {
      rest: true,
      lazy: true
    }
  },
  build: (data, ctx) => {
    return data.rest({
      ...ctx,
      [data.bidning || '$']: data.data
    });
  }
};

const PlaceholderBuilder = {
  schema: {
    placeholderValue: {
      required: false
    }
  },
  placeholder: () => 'Loading...',
  build: async (data) => {
    return data.placeholderValue;
  }
};

describe('JsonExpress', function () {
  it('matches types', () => {
    const je = new JsonExpress([BodyBuilder, ListBuilder]);

    rejects(async () => {
      await je.build({
        body: {
          items: 'test'
        }
      });
    });

    doesNotReject(async () => {
      await je.build({
        body: {
          items: '{=test}'
        }
      }, {
        test: ['this', 'is', 'an', 'array']
      });
    });
  });

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

  it('does not accept duplicate schema', () => {
    throws(() => {
      new JsonExpress([
        {
          schema: {
            type: { value: 'test' },
            body: { required: false },
            rest: { rest: true }
          },
          build: () => 'test'
        },
        {
          schema: {
            body: {},
            type: { value: 'test' }
          },
          build: () => 'test'
        }
      ]);
    });
  });

  it('allows schema that have same keys but different matches', () => {
    doesNotThrow(() => {
      new JsonExpress([
        {
          schema: {
            type: { value: 'test1' },
            body: {}
          },
          build: () => test
        },
        {
          schema: {
            type: { value: 'test2' },
            body: {}
          },
          build: () => test
        }
      ]);
    });
  });

  it('uses placeholder before complete build', async () => {
    const je = new JsonExpress([ PlaceholderBuilder, ListBuilder ]);
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
