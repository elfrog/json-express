import md5 from 'md5';
import typify from 'typify';
import EventEmitter from 'eventemitter3';
import TemplateExpression from './template-expression';
import FlatSchemaMatcher, { FlatSchema } from './flat-schema-matcher';

interface JsonExpressContext {
  [key: string]: any;
}

interface JsonExpressHandler {
  name?: string;
  schema: FlatSchema;
  placeholder?(value: object): any;
  build(value: any, context?: JsonExpressContext): any | Promise<any>;
}

interface JsonExpressHandlerItem {
  matcher: FlatSchemaMatcher;
  handler: JsonExpressHandler;
  typeChecker: JsonExpressTypeChecker;
}

interface JsonExpressReturnCallback {
  (value: any, completed?: boolean, error?: Error): void;
}

interface JsonExpressRuntimeCallback {
  (value: any, completed: boolean): void;
}

// TypeChecker throws TypeError when type mismatched.
interface JsonExpressTypeChecker {
  (target: object): void;
}

interface JsonExrpessTypeCheckerGenerator {
  (types: object, name?: string, schema?: FlatSchema): JsonExpressTypeChecker;
}

function defaultTypeCheckerGenerator(types: object): JsonExpressTypeChecker {
  const keys = Object.keys(types);
  const typeDecl = '{' + keys.map(key => key + ':' + types[key]).join(',') + '}';

  return (target) => {
    if (!typify.check(typeDecl, target)) {
      throw new TypeError(`${JSON.stringify(target)} is not matched to ${typeDecl}`);
    }
  };
}

class JsonExpressRuntime extends EventEmitter {
  private handlerItems: JsonExpressHandlerItem[] = [];

  constructor(handlerItems: JsonExpressHandlerItem[]) {
    super();

    this.handlerItems = handlerItems;
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
      JsonExpress
        .template(expression, context)
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
    const item = this.handlerItems.find(item => item.matcher.test(expression));

    if (!item) {
      throw new Error('No matched schema: ' + JSON.stringify(expression));
    }
    
    return item;
  }

  private emitError(e: Error) {
    this.emit('error', e);
  }
}

class JsonExpress {
  static Template = TemplateExpression;

  private static templateCache: Map<string, any> = new Map<string, any>();
  private handlerItems: JsonExpressHandlerItem[] = [];
  private _typeCheckerGenerator: JsonExrpessTypeCheckerGenerator = defaultTypeCheckerGenerator;

  constructor(handlers: JsonExpressHandler[] = []) {
    handlers.forEach(handler => this.addHandler(handler));
  }

  get typeCheckerGenerator() {
    return this._typeCheckerGenerator;
  }

  set typeCheckerGenerator(gen: JsonExrpessTypeCheckerGenerator) {
    this._typeCheckerGenerator = gen;
    this.handlerItems = this.handlerItems.map(item => ({
      ...item,
      typeChecker: this.generateTypeChecker(item.matcher.types)
    }))
  }

  generateTypeChecker(types: {}): JsonExpressTypeChecker {
    if (!types || Object.keys(types).length === 0) {
      return () => {};
    }

    if (this._typeCheckerGenerator) {
      return this._typeCheckerGenerator(types);
    }

    return () => {};
  }

  addHandler(handler: JsonExpressHandler) {
    const matcher = new FlatSchemaMatcher(handler.schema);

    if (this.handlerItems.some(p => p.matcher.schemaHash === matcher.schemaHash)) {
      throw new Error('Duplicate schema ' + ': ' + matcher.toString());
    }

    const item = {
      matcher,
      handler,
      typeChecker: this.generateTypeChecker(matcher.types)
    };

    // Sort by the number of columns in descending order
    // so the handler that has more constraints would be applied first.
    let i = 0;

    for (; i < this.handlerItems.length; i++) {
      const p = Object.keys(this.handlerItems[i].matcher.schema).length;
      const q = Object.keys(item.matcher.schema).length;

      if (p < q) {
        break;
      }
    }

    this.handlerItems.splice(i, 0, item);
  }

  build(expression: any, context: JsonExpressContext = {}, cb?: JsonExpressReturnCallback) {
    return new Promise((resolve, reject) => {
      const runtime = new JsonExpressRuntime(this.handlerItems);

      // When some error occurs, all processes will stop and the callback will be called only once with the promise rejection.
      runtime.on('error', e => {
        if (cb) {
          cb(null, false, e);
        }

        reject(e);
      });
      // resolves when completed (when no placeholder founds)
      runtime.on('completed', value => {
        if (cb) {
          cb(value, true, null);
        }

        resolve(value);
      });
      runtime.on('update', value => {
        if (cb) {
          cb(value, false, null);
        }
      });
      runtime.run(expression, context);
    });
  }

  static async template(expression: any, context: JsonExpressContext = {}) {
    const hash = md5(expression);
    let t = null;

    if (JsonExpress.templateCache.has(hash)) {
      t = JsonExpress.templateCache.get(hash);
    } else {
      t = new TemplateExpression(expression);
      JsonExpress.templateCache.set(hash, t);
    }

    return t.execute(context);
  }
}

export default JsonExpress;
