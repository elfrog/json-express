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

const TableHeaderBuilder = {
  schema: {
    columns: {
      type: 'array',
      buildType: 'array string'
    }
  },
  build: (data) => {
    let t = '<tr>';

    for (const col of data.columns)  {
      t += '<th>' + col + '</th>';
    }

    return t + '</tr>';
  }
};

const TodoBuilder = {
  schema: {
    todos: {
      type: 'array',
      buildType: '{ todo: string, date: string }[]'
    }
  },
  build: (data) => {
    let t = '<ol>';

    for (const item of data.todos) {
      t += '<li>' + item.todo + ' <small>' + item.date + '</small></li>';
    }

    return t + '</ol>';
  }
};

describe('JsonExpress', function () {
  it('matches types', async () => {
    const je = new JsonExpress([BodyBuilder, ListBuilder]);

    await rejects(async () => {
      await je.build({
        body: {
          items: 'test'
        }
      });
    });

    await doesNotReject(async () => {
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

  it('works with build types', async () => {
    const je = new JsonExpress([ TableHeaderBuilder, TodoBuilder ]);

    await rejects(async () => {
      await je.build({
        columns: 'not an array'
      });
    });

    await doesNotReject(async () => {
      await je.build({
        columns: [
          'id',
          'name',
          'date'
        ]
      });
    });

    await rejects(async () => {
      await je.build({
        todos: [
          { todo: 'waking up early', date: '2019-01-01' },
          { todo: 'going to school', date: '2019-01-02', anotherProp: true }
        ]
      });
    });

    const todoResult = await je.build({
      todos: [
        { todo: 'waking up early', date: '2019-01-01' },
        { todo: 'going to school', date: '2019-01-02' }
      ]
    });

    equal(todoResult, '<ol><li>waking up early <small>2019-01-01</small></li><li>going to school <small>2019-01-02</small></li></ol>');
  });
});
