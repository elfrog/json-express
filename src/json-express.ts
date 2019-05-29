import md5 from 'md5';
import TemplateExpression from './template-expression';
import FlatSchemaMatcher, { FlatSchema, FlatSchemaColumn } from './flat-schema-matcher';

interface JsonExpressContext {
  [key: string]: any;
}

interface JsonExpressHandler {
  schema: FlatSchema;
  placeholder?(value: object): any;
}

interface JsonExpressTransformer extends JsonExpressHandler {
  transform(value: object, context?: JsonExpressContext): object | Promise<object>;
}

interface JsonExpressBuilder extends JsonExpressHandler {
  build(value: any, context?: JsonExpressContext): any | Promise<any>;
}

interface JsonExpressHandlerItem {
  matcher: FlatSchemaMatcher;
  handler: JsonExpressHandler;
}

interface JsonExpressReturnCallback {
  (value: any): void;
}

class JsonExpress {
  static Template = TemplateExpression;

  private static templateCache: Map<string, any> = new Map<string, any>();
  private handlerItems: JsonExpressHandlerItem[] = [];

  constructor(handlers: JsonExpressHandler[] = []) {
    handlers.forEach(handler => this.addHandler(handler));
  }

  addHandler(handler: JsonExpressHandler) {
    const matcher = new FlatSchemaMatcher(handler.schema);
    const item = {
      matcher,
      handler
    };

    if (this.handlerItems.some(p => p.matcher.schemaHash === matcher.schemaHash)) {
      throw new Error('Duplicate schema: ' + matcher.toString());
    }

    // Sort by the number of columns in descending order
    // so the handler that has more constraints would be applied first.
    let i = 0;

    for (; i < this.handlerItems.length; i++) {
      if (this.handlerItems[i].matcher.columns.length < item.matcher.columns.length) {
        break;
      }
    }

    this.handlerItems.splice(i, 0, item);
  }

  async build(expression: any, context: JsonExpressContext = {}, cb?: JsonExpressReturnCallback) {
    return new Promise(resolve => {
      this.buildExpression(expression, context, root => {
        if (cb) {
          cb(root);
        }

        resolve(root);
      });
    });
  }

  private buildExpression(expression: any, context: JsonExpressContext = {}, cb: JsonExpressReturnCallback) {
    if (Array.isArray(expression)) {
      const arr = [];
      const checker = new Array<boolean>(expression.length).fill(false);
      let completed = false;

      for (let i = 0; i < expression.length; i++) {
        this.buildExpression(expression[i], context, v => {
          arr[i] = v;
          checker[i] = true;

          if (completed || checker.every(ch => ch)) {
            completed = true;
            cb(arr);
          }
        });
      }
    } else if (typeof expression === 'string') {
      const hash = md5(expression);
      let t = null;

      if (JsonExpress.templateCache.has(hash)) {
        t = JsonExpress.templateCache.get(hash);
      } else {
        t = new TemplateExpression(expression);
        JsonExpress.templateCache.set(hash, t);
      }

      t.execute(context).then(cb);
    } else if (typeof expression === 'object') {
      const item = this.getHandlerItem(expression);
      const rest = {};
      const target = item.matcher.restColumn ? { [item.matcher.restColumn.name]: rest } : {};
      const keys = Object.keys(expression);
      const handleKeys = [];

      for (const key of keys) {
        const v = expression[key];

        if (key in item.matcher.schema) {
          const column = item.matcher.schema[key] as FlatSchemaColumn;

          if (column.unhandled) {
            target[key] = v;
          } else {
            handleKeys.push(key);
          }
        } else {
          rest[key] = v;
        }
      }

      if (handleKeys.length > 0) {
        const checker = new Set<string>();

        for (const key of handleKeys) {
          this.buildExpression(expression[key], context, v => {
            target[key] = v;
            checker.add(key);

            if (checker.size === handleKeys.length) {
              this.buildObject(target, context, item.handler, cb);
            }
          });
        }
      } else {
        this.buildObject(target, context, item.handler, cb);
      }
    } else {
      cb(expression);
    }
  }

  private buildObject(target: object, context: JsonExpressContext, handler: JsonExpressHandler, cb: JsonExpressReturnCallback) {
    if ('placeholder' in handler) {
      cb(handler.placeholder(target));
    }

    if ('transform' in handler) {
      const childContext = Object.assign({}, context);
      const result = (handler as JsonExpressTransformer).transform(target, childContext); 

      if (result instanceof Promise) {
        result.then(v => this.buildExpression(v, childContext, cb));
      } else {
        this.buildExpression(result, childContext, cb);
      }
    } else {
      const result = (handler as JsonExpressBuilder).build(target, context);

      if (result instanceof Promise) {
        result.then(cb);
      } else {
        cb(result);
      }
    }
  }

  private getHandlerItem(expression) {
    const item = this.handlerItems.find(item => item.matcher.test(expression));

    if (!item) {
      throw new Error('No matched schema: ' + JSON.stringify(expression));
    }
    
    return item;
  }
}

export default JsonExpress;
