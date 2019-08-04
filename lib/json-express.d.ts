import TemplateExpression from './template-expression';
import FlatSchemaMatcher, { FlatSchema } from './flat-schema-matcher';
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
interface JsonExpressTypeChecker {
    (target: object): void;
}
interface JsonExrpessTypeCheckerGenerator {
    (types: object, name?: string, schema?: FlatSchema): JsonExpressTypeChecker;
}
declare class JsonExpress {
    static Template: typeof TemplateExpression;
    private handlerItems;
    private _typeCheckerGenerator;
    constructor(handlers?: JsonExpressHandler[]);
    typeCheckerGenerator: JsonExrpessTypeCheckerGenerator;
    private generateTypeChecker;
    addHandler(handler: JsonExpressHandler): void;
    build(expression: any, context?: JsonExpressContext, cb?: JsonExpressReturnCallback): Promise<unknown>;
}
export default JsonExpress;
export { JsonExpressContext, JsonExpressHandler, JsonExpressHandlerItem, JsonExpressTypeChecker };
