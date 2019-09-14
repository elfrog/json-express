import TemplateExpression from './template-expression';
import FlatSchemaMatcher, { FlatSchema, FlatSchemaColumn } from './flat-schema-matcher';
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
interface JsonExpressTypeChecker {
    (value: any): void;
}
interface JsonExpressTypeCheckerMap {
    [key: string]: JsonExpressTypeChecker;
}
interface JsonExpressTypeCheckerGenerator {
    (type: any, schemaColumn?: FlatSchemaColumn): JsonExpressTypeChecker;
}
declare class JsonExpress {
    static Template: typeof TemplateExpression;
    private handlerItems;
    private _typeCheckerGenerator;
    constructor(handlers?: JsonExpressHandler[]);
    typeCheckerGenerator: JsonExpressTypeCheckerGenerator;
    private generateTypeCheckers;
    addHandler(handler: JsonExpressHandler): void;
    build(expression: any, context?: JsonExpressContext, cb?: JsonExpressReturnCallback): Promise<unknown>;
}
export default JsonExpress;
export { JsonExpressContext, JsonExpressHandler, JsonExpressHandlerItem, JsonExpressTypeChecker };
