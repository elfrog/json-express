import typify from 'typify';
import TemplateExpression from './template-expression';
import FlatSchemaMatcher, { FlatSchema } from './flat-schema-matcher';
import JsonExpressRuntime from './json-express-runtime';

interface JsonExpressContext {
  [key: string]: any;
}

interface JsonExpressHandler {
  name?: string;
  exclusive?: boolean;
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

class JsonExpress {
  static Template = TemplateExpression;

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

  private generateTypeChecker(types: {}): JsonExpressTypeChecker {
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

    if (handler.name && this.handlerItems.some(p => p.handler.name === handler.name)) {
      throw new Error('Duplicate schema name: ' + handler.name);
    }

    if (this.handlerItems.some(p => p.matcher.schemaHash === matcher.schemaHash)) {
      throw new Error('Duplicate schema: ' + matcher.toString());
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
}

export default JsonExpress;

export {
  JsonExpressContext,
  JsonExpressHandler,
  JsonExpressHandlerItem,
  JsonExpressTypeChecker
};
