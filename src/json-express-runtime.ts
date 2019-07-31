import EventEmitter from 'eventemitter3';
import { JsonExpressContext, JsonExpressHandler, JsonExpressHandlerItem, JsonExpressTypeChecker } from './json-express';
import TemplateExpression from './template-expression';

interface JsonExpressRuntimeCallback {
  (value: any, completed: boolean): void;
}

class JsonExpressRuntime extends EventEmitter {
  private handlerStack: JsonExpressHandlerItem[][] = [];

  constructor(rootHandlerItems: JsonExpressHandlerItem[]) {
    super();

    this.handlerStack.push(rootHandlerItems);
  }

  run(expression: any, context: JsonExpressContext) {
    this.buildExpression(expression, context, (value, completed) => {
      if (completed) {
        this.emit('completed', value);
      } else {
        this.emit('update', value);
      }
    });
  }

  private buildExpression(expression: any, context: JsonExpressContext, cb: JsonExpressRuntimeCallback, plainLevel = 0) {
    if (typeof expression === 'string') {
      TemplateExpression
        .cache(expression, context)
        .then(r => cb(r, true))
        .catch(e => this.emitError(e));
    } else if (Array.isArray(expression)) {
      this.buildArray(expression, context, cb, plainLevel);
    } else if (typeof expression === 'object') {
      if (plainLevel === 0) {
        this.buildWholeObject(expression, context, cb);
      } else {
        this.buildPlainObject(expression, context, cb, plainLevel);
      }
    } else {
      cb(expression, true);
    }
  }

  private buildArray(expression: any, context: JsonExpressContext = {}, cb: JsonExpressRuntimeCallback, plainLevel = 0) {
    const nextPlainLevel = plainLevel > 0 ? plainLevel - 1 : plainLevel;
    const arr = [];
    const checker = new Array<boolean>(expression.length).fill(false);
    let checkCount = 0;
    let completeCount = 0;

    for (let i = 0; i < expression.length; i++) {
      this.buildExpression(
        expression[i],
        context,
        (v, completed) => {
          arr[i] = v;
          
          if (!checker[i]) {
            checker[i] = true;
            checkCount++;
          }

          // callbacks that completed is set true will appear exactly once per each
          if (completed) {
            completeCount++;
          }

          if (checkCount === checker.length) {
            cb(arr, completeCount === checkCount);
          }
        },
        nextPlainLevel
      );
    }
  }

  private buildWholeObject(expression: any, context: JsonExpressContext = {}, cb: JsonExpressRuntimeCallback) {
    const { handler, matcher, typeChecker } = this.getHandlerItem(expression);
    const rest = {};
    const target = matcher.restColumn ? { [matcher.restColumn.name]: rest } : {};
    const keys = Object.keys(expression);

    for (const key of keys) {
      const v = expression[key];

      if (matcher.columns.some(col => col.name === key)) {
        target[key] = v;
      } else {
        rest[key] = v;
      }
    }

    const checker = new Set<string>();
    const propertyNames = Object.keys(target);
    let completeCount = 0;

    for (const key of propertyNames) {
      const column = matcher.schema[key];

      if (column.lazy) {
        const oldValue = target[key];
        const thunk = async (lazyContext) => {
          return new Promise((resolve) => {
            this.buildExpression(
              oldValue,
              lazyContext,
              (v, completed) => {
                if (completed) {
                  resolve(v);
                }
              },
              column.plainLevel
            );
          });
        };

        target[key] = thunk;
        checker.add(key);
        completeCount++;

        if (checker.size === propertyNames.length) {
          const allCompleted = checker.size === completeCount;
          this.buildObjectWithTypeCheck(target, context, handler, typeChecker, allCompleted, cb);
        }
      } else {
        this.buildExpression(
          target[key],
          context,
          (v, completed) => {
            target[key] = v;
            checker.add(key);

            if (completed) {
              completeCount++;
            }

            if (checker.size === propertyNames.length) {
              const allCompleted = checker.size === completeCount;
              this.buildObjectWithTypeCheck(target, context, handler, typeChecker, allCompleted, cb);
            }
          },
          column.plainLevel
        );
      }
    }
  }

  private buildPlainObject(expression: any, context: JsonExpressContext = {}, cb: JsonExpressRuntimeCallback, plainLevel = 0) {
    const nextPlainLevel = plainLevel > 0 ? plainLevel - 1 : plainLevel;
    const target = {};
    const checker = new Set<string>();
    const propertyNames = Object.keys(expression);
    let completeCount = 0;

    for (const key of propertyNames) {
      this.buildExpression(
        expression[key],
        context,
        (v, completed) => {
          target[key] = v;
          checker.add(key);

          if (completed) {
            completeCount++;
          }

          if (checker.size === propertyNames.length) {
            const allCompleted = checker.size === completeCount;

            cb(target, allCompleted);
          }
        },
        nextPlainLevel
      );
    }
  }

  private buildObjectWithTypeCheck(target: object, context: JsonExpressContext, handler: JsonExpressHandler, typeChecker: JsonExpressTypeChecker, allCompleted: boolean, cb: JsonExpressRuntimeCallback) {
    try {
      typeChecker(target);
    } catch (e) {
      this.emitError(e);
      return;
    }

    if ('placeholder' in handler) {
      cb(handler.placeholder(target), false);
    }

    const result = handler.build(target, context);

    if (result instanceof Promise) {
      result.then(r => cb(r, allCompleted));
    } else {
      cb(result, allCompleted);
    }
  }

  private getHandlerItem(expression) {
    for (let i = this.handlerStack.length - 1; i >= 0; --i) {
      const handlerItems = this.handlerStack[i];
      const item = handlerItems.find(item => item.matcher.test(expression));

      if (item) {
        return item;
      }
    }

    throw new Error('No matched schema: ' + JSON.stringify(expression));
  }

  private emitError(e: Error) {
    this.emit('error', e);
  }
}

export default JsonExpressRuntime;
