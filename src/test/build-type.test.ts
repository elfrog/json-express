import { equal, doesNotThrow } from 'assert';
import typeCheckerGenerator from '../type-checker-generator';
import BuildType from '../build-type';

describe('BuildType', function () {
  it('checks primitive types', () => {
    const stringTypeChecker = typeCheckerGenerator('string');
    const numberTypeChecker = typeCheckerGenerator('number');
    const booleanTypeChecker = typeCheckerGenerator('boolean');
    const arrayTypeChecker = typeCheckerGenerator('(string | boolean)[]');

    doesNotThrow(() => {
      stringTypeChecker('this is string');
      numberTypeChecker(12345);
      booleanTypeChecker(true);
      arrayTypeChecker(['string', 'is', 'ok', true, false]);
    });
  });

  it('parses into BuildType', () => {
    const b1 = new BuildType('string');
    const b2 = new BuildType('{a: string, b: (number | boolean)}');
    const b3 = new BuildType('{a: string, ...: any}');
    const b4 = new BuildType('{a: string, b?: number}');

    equal(b1.type, 'string');
    equal(b2.type, '@record');
    equal(b2.record.b.type, '@choice');
    equal(b3.type, '@record');
    equal(b3.record['...'].type, 'any');
    equal(b4.type, '@record');
    equal(b4.record.b.optional, true);
  });
});
