interface TemplateExpressionContext {
    [key: string]: any;
}
interface TemplateExpressionPipeHandler {
    (value: any, args?: any[], context?: TemplateExpressionContext): Promise<any> | any;
}
declare class TemplateExpression {
    private static pipeHandlers;
    private program;
    source: string;
    constructor(source: string);
    execute(context: TemplateExpressionContext): Promise<any>;
    private static compile;
    private static compileBindingNode;
    private static compileExpressionNode;
    static addPipeHandler(name: string, handler: TemplateExpressionPipeHandler): void;
    static removePipeHandler(name: string): void;
}
export default TemplateExpression;
