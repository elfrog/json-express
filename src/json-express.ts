import TemplateExpression from './template-expression';
import FlatSchemaMatcher, { FlatSchema, FlatSchemaColumn } from './flat-schema-matcher';
import JsonExpressRuntime from './json-express-runtime';
import typeCheckerGenerator from './type-checker-generator';

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
  handlerName: string;
  matcher: FlatSchemaMatcher;
  handler: JsonExpressHandler;
  typeCheckers: JsonExpressTypeCheckerMap;
}

interface JsonExpressReturnCallback {
  (value: any, completed?: boolean, error?: Error): void;
}

// TypeChecker throws TypeError when type mismatched.
interface JsonExpressTypeChecker {
  (value: any): void;
}

interface JsonExpressTypeCheckerMap {
  [key: string]: JsonExpressTypeChecker;
}

interface JsonExpressTypeCheckerGenerator {
  (type: any, schemaColumn?: FlatSchemaColumn): JsonExpressTypeChecker;
}

// To check name mangling
class AnonymousClass {
  foo() {
    return 'bar';
  }
}

class JsonExpress {
  static Template = TemplateExpression;

  private handlerItems: JsonExpressHandlerItem[] = [];
  private _typeCheckerGenerator: JsonExpressTypeCheckerGenerator = typeCheckerGenerator;

  constructor(handlers: JsonExpressHandler[] = []) {
    handlers.forEach(handler => this.addHandler(handler));
  }

  get typeCheckerGenerator() {
    return this._typeCheckerGenerator;
  }

  set typeCheckerGenerator(gen: JsonExpressTypeCheckerGenerator) {
    this._typeCheckerGenerator = gen;
    this.handlerItems = this.handlerItems.map(item => ({
      ...item,
      typeCheckers: this.generateTypeCheckers(item.matcher.types)
    }))
  }

  private generateTypeCheckers(types: object): JsonExpressTypeCheckerMap {
    if (!types || Object.keys(types).length === 0) {
      return {};
    }

    const typeCheckers = {};

    if (this._typeCheckerGenerator) {
      for (const key in types) {
        typeCheckers[key] = this._typeCheckerGenerator(types[key]);
      }
    }

    return typeCheckers;
  }

  addHandler(handler: JsonExpressHandler) {
    const matcher = new FlatSchemaMatcher(handler.schema);
    const handlerName = handler.name === AnonymousClass.name ? null : handler.name;

    if (handlerName && this.handlerItems.some(p => p.handlerName === handlerName)) {
      throw new Error('Duplicate schema name: ' + handlerName);
    }

    if (this.handlerItems.some(p => p.matcher.schemaHash === matcher.schemaHash)) {
      throw new Error('Duplicate schema: ' + matcher.toString());
    }

    const item = {
      handlerName,
      matcher,
      handler,
      typeCheckers: this.generateTypeCheckers(matcher.types)
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
