import { equal } from 'assert';
import TemplateExpression from '../template-expression';

describe('TemplateExpression', function () {
  it('executes template expressions', async () => {
    const t = new TemplateExpression('My name is {$.name} and I am a {$.job}.');
    const context = {
      $: {
        name: 'Dongho',
        job: 'student'
      }
    };

    const result = await t.execute(context);

    equal(result, 'My name is Dongho and I am a student.');
  });

  it('gets returning value', async () => {
    const t = new TemplateExpression('{=age}');
    const result = await t.execute({ age: 34 });

    equal(typeof result, 'number');
    equal(result, 34);
  });
  
  it('works on pipe handlers', async () => {
    TemplateExpression.addPipeHandler('capitalize', value => value.toString().toUpperCase());
    TemplateExpression.addPipeHandler('decorate', (value, args) => {
      const count = args[0] || 1;
      let stars = '';

      for (let i = 0; i < count; i++) {
        stars += '*';
      }

      return stars + value + stars;
    });
    
    const t = new TemplateExpression('My name is {name | capitalize | decorate 2}.');
    const result = await t.execute({ name: 'Dongho' });

    equal(result, 'My name is **DONGHO**.');
  });
  
  it('works on builtin pipe handlers', async () => {
    const t = new TemplateExpression('{num | currency} - {d | date "YYYY/MM/DD"}');
    const result = await t.execute({ 
      num: 12345678,
      d: new Date('2018-04-01')
    });
    equal(result, '12,345,678 - 2018/04/01');
  });
});
