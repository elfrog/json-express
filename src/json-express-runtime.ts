import EventEmitter from 'eventemitter3';
import { JsonExpressContext, JsonExpressHandler, JsonExpressHandlerItem } from './json-express';
import TemplateExpression from './template-expression';
import BuildType, { BuildTypeRecord } from './build-type';

interface RuntimeContinuation {
  (value: any, completed: boolean): void;
}

class JsonExpressRuntime extends EventEmitter {
  private handlerItems: JsonExpressHandlerItem[] = [];
  private namedHandlerItems: { [key: string]: JsonExpressHandlerItem } = {};

  constructor(handlerItems: JsonExpressHandlerItem[]) {
    super();

    this.handlerItems = handlerItems;

    for (const item of handlerItems) {
      if (item.handler.name) {
        this.namedHandlerItems[item.handler.name] = item;
      }
    }
  }

  run(expression: any, context: JsonExpressContext = {}) {
    try {
      this.buildExpression(
        expression,
        context,
        (value, completed) => {
          if (completed) {
            this.emit('completed', value);
          } else {
            this.emit('update', value);
          }
        },
        0,
        null
      );
    } catch (e) {
      this.emit('error', e);
    }
  }

  private buildExpression(
    expression: any,
    context: JsonExpressContext,
    continuation: RuntimeContinuation,
    plainLevel: number,
    buildType: BuildType
  ) {
    if (buildType) {
      if (!this.buildByBuildType(expression, context, continuation, plainLevel, buildType)) {
        throw new Error('No matched type: ' + JSON.stringify(expression));
      }
    } else {
      this.buildAny(expression, context, continuation, plainLevel);
    }
  }

  private buildByBuildType(
    expression: any,
    context: JsonExpressContext,
    continuation: RuntimeContinuation,
    plainLevel: number,
    buildType: BuildType
  ) {
    switch (buildType.type) {
      case 'string':
        if (typeof expression !== 'string') {
          return false;
        }

        this.buildString(expression, context, continuation);

        return true;
      case 'array':
        if (!Array.isArray(expression)) {
          return false;
        }

        this.buildArray(
          expression,
          context,
          continuation,
          plainLevel,
          buildType.children ? buildType.children[0] : null
        );
        
        return true;
      case 'tuple':
        if (!Array.isArray(expression) || expression.length !== buildType.children.length) {
          return false;
        }

        this.buildTuple(
          expression,
          context,
          continuation,
          plainLevel,
          buildType.children
        );
        
        return true;
      case 'record':
        if (typeof expression !== 'object') {
          return false;
        }

        this.buildRecord(expression, context, continuation, buildType.record);

        return true;
      case 'choice':
        for (const subType of buildType.children) {
          if (this.buildByBuildType(expression, context, continuation, plainLevel, subType)) {
            return true;
          }
        }

        return false;
      case 'number':
        if (typeof expression !== 'number') {
          return false;
        }

        continuation(expression, true);

        return true;
      case 'boolean':
        if (typeof expression !== 'boolean') {
          return false;
        }

        continuation(expression, true);

        return true;
      case 'null':
        if (expression !== null) {
          return false;
        }

        continuation(expression, true);

        return true;
      case 'any':
        this.buildAny(expression, context, continuation, plainLevel);

        return true;
      default:
        const item = this.namedHandlerItems[buildType.type];

        if (!item) {
          return false;
        }

        if (!item.matcher.test(item)) {
          return false;
        }

        this.buildWholeObject(
          expression,
          context,
          continuation,
          item
        );

        return true;
    }
  }

  private buildAny(
    expression: any,
    context: JsonExpressContext,
    continuation: RuntimeContinuation,
    plainLevel: number
  ) {
    if (typeof expression === 'string') {
      this.buildString(expression, context, continuation);
    } else if (Array.isArray(expression)) {
      this.buildArray(expression, context, continuation, plainLevel, null);
    } else if (typeof expression === 'object') {
      if (plainLevel === 0) {
        const item = this.getHandlerItem(expression);

        if (!item) {
          throw new Error('No matched schema: ' + JSON.stringify(expression));
        }

        this.buildWholeObject(expression, context, continuation, item);
      } else {
        this.buildPlainObject(expression, context, continuation, plainLevel);
      }
    } else {
      continuation(expression, true);
    }
  }

  private buildString(
    expression: any,
    context: JsonExpressContext,
    continuation: RuntimeContinuation
  ) {
    TemplateExpression
      .cache(expression, context)
      .then(r => continuation(r, true))
      .catch(e => this.emit('error', e));
  }

  private buildArray(
    expression: any,
    context: JsonExpressContext,
    continuation: RuntimeContinuation,
    plainLevel: number,
    buildType: BuildType
  ) {
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
            continuation(arr, completeCount === checkCount);
          }
        },
        nextPlainLevel,
        buildType
      );
    }
  }

  private buildTuple(
    expression: any,
    context: JsonExpressContext,
    continuation: RuntimeContinuation,
    plainLevel: number,
    buildTypes: BuildType[]
  ) {
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
            continuation(arr, completeCount === checkCount);
          }
        },
        nextPlainLevel,
        buildTypes[i]
      );
    }
  }

  private buildWholeObject(
    expression: any,
    context: JsonExpressContext,
    continuation: RuntimeContinuation,
    { handler, matcher, typeChecker }: JsonExpressHandlerItem
  ) {
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
              column.plainLevel,
              matcher.buildTypes[key]
            );
          });
        };

        target[key] = thunk;
        checker.add(key);
        completeCount++;

        if (checker.size === propertyNames.length) {
          typeChecker(target);
          this.buildObject(
            target,
            context,
            continuation,
            handler,
            checker.size === completeCount
          );
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
              typeChecker(target);
              this.buildObject(
                target,
                context,
                continuation, 
                handler,
                checker.size === completeCount
              );
            }
          },
          column.plainLevel,
          matcher.buildTypes[key]
        );
      }
    }
  }

  private buildRecord(
    expression: object,
    context: JsonExpressContext,
    continuation: RuntimeContinuation,
    record: BuildTypeRecord
  ) {
    const target = {};
    const checker = new Set<string>();
    const propertyNames = Object.keys(expression);
    let completeCount = 0;

    for (const key in record) {
      if (key !== '...' && !(key in expression)) {
        throw new TypeError('No matched record type: ' + JSON.stringify(expression));
      }
    }

    for (const key of propertyNames) {
      let buildType = null;

      if (!(key in record)) {
        if (!('...' in record)) {
          throw new TypeError('No matched record type: ' + JSON.stringify(expression));
        }

        buildType = record['...'];
      } else {
        buildType = record[key];
      }

      this.buildExpression(
        expression[key],
        context,
        (value, completed) => {
          target[key] = value;
          checker.add(key);

          if (completed) {
            completeCount++;
          }

          if (checker.size === propertyNames.length) {
            const allCompleted = checker.size === completeCount;

            continuation(target, allCompleted);
          }
        },
        0,
        buildType
      );
    }
  }

  private buildPlainObject(
    expression: any,
    context: JsonExpressContext,
    continuation: RuntimeContinuation,
    plainLevel: number
  ) {
    const nextPlainLevel = plainLevel > 0 ? plainLevel - 1 : plainLevel;
    const target = {};
    const checker = new Set<string>();
    const propertyNames = Object.keys(expression);
    let completeCount = 0;

    for (const key of propertyNames) {
      this.buildAny(
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

            continuation(target, allCompleted);
          }
        },
        nextPlainLevel
      );
    }
  }

  private buildObject(
    expression: any,
    context: JsonExpressContext,
    continuation: RuntimeContinuation,
    handler: JsonExpressHandler,
    allCompleted: boolean
  ) {
    if ('placeholder' in handler) {
      continuation(handler.placeholder(expression), false);
    }

    const result = handler.build(expression, context);

    if (result instanceof Promise) {
      result.then(r => continuation(r, allCompleted));
    } else {
      continuation(result, allCompleted);
    }
  }

  private getHandlerItem(expression) {
    const item = this.handlerItems.find(item => item.matcher.test(expression));

    return item;
  }
}

export default JsonExpressRuntime;
