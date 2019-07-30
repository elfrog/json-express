import TemplateExpression from './template-expression';
import { FlatSchema } from './flat-schema-matcher';
interface JsonExpressContext {
    [key: string]: any;
}
interface JsonExpressHandler {
    name?: string;
    schema: FlatSchema;
    placeholder?(value: object): any;
    build(value: any, context?: JsonExpressContext): any | Promise<any>;
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
    private static templateCache;
    private handlerItems;
    private _typeCheckerGenerator;
    constructor(handlers?: JsonExpressHandler[]);
    typeCheckerGenerator: JsonExrpessTypeCheckerGenerator;
    generateTypeChecker(types: {}): JsonExpressTypeChecker;
    addHandler(handler: JsonExpressHandler): void;
    build(expression: any, context?: JsonExpressContext, cb?: JsonExpressReturnCallback): Promise<unknown>;
    static template(expression: any, context?: JsonExpressContext): Promise<any>;
}
export default JsonExpress;
