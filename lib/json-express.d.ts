import TemplateExpression from './template-expression';
import { FlatSchema } from './flat-schema-matcher';
interface JsonExpressContext {
    [key: string]: any;
}
interface JsonExpressHandler {
    schema: FlatSchema;
    placeholder?(value: object): any;
}
interface JsonExpressReturnCallback {
    (value: any, completed?: boolean): void;
}
declare class JsonExpress {
    static Template: typeof TemplateExpression;
    private static templateCache;
    private handlerItems;
    constructor(handlers?: JsonExpressHandler[]);
    addHandler(handler: JsonExpressHandler): void;
    build(expression: any, context?: JsonExpressContext, cb?: JsonExpressReturnCallback): Promise<unknown>;
    private buildExpression;
    private buildObject;
    private getHandlerItem;
}
export default JsonExpress;
