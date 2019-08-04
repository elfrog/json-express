import EventEmitter from 'eventemitter3';
import { JsonExpressContext, JsonExpressHandlerItem } from './json-express';
declare class JsonExpressRuntime extends EventEmitter {
    private handlerItems;
    private namedHandlerItems;
    constructor(handlerItems: JsonExpressHandlerItem[]);
    run(expression: any, context?: JsonExpressContext): void;
    private buildExpression;
    private buildByBuildType;
    private buildAny;
    private buildString;
    private buildArray;
    private buildTuple;
    private buildWholeObject;
    private buildRecord;
    private buildPlainObject;
    private buildObject;
    private getHandlerItem;
}
export default JsonExpressRuntime;
