/**
 * TemplateExpression has two types of string expression.
 * One is the returning string that literally returns a value of any types
 * including not only string but number, boolean, object, etc as is evaluated.
 * And another one is the template string that returns a string value
 * that concatinates literals and interpolated expressions into one.
 *
 * === PEG for TemplateExpression ===
 * String <- ReturningString / TemplateString
 * ReturningString <- '{=' _ Expression _ '}'
 * TemplateString <- '{' _ Expression _ '}' / Text
 * Expression <- Binding (_ '|' _ PipeExpression)*
 * PipeExpression <- Name (_ PipeArg)*
 * PipeArg <- Number | QuotedText | Binding
 * QuotedText <- '"' ((&'\\"' / !'"') .)* '"' / "'" ((&"\\'" / !"'") .)* "'"
 * Binding = Name ('.' Name)*
 * Name <- [a-zA-Z$_] [a-zA-Z0-9$_]
 * Text <- .+
 * Number <- '-'? Digit+ ('.' Digit*)?
 * Digit <- [0-9]
 * _ <- [ \t]*
 */
declare const enum TemplateParserNodeType {
    NAME = "NAME",
    NUMBER = "NUMBER",
    TEXT = "TEXT",
    RETURNING_STRING = "RETURNING_STRING",
    TEMPLATE_STRING = "TEMPLATE_STRING",
    EXPRESSION = "EXPRESSION",
    BINDING = "BINDING",
    PIPE_EXPRESSION = "PIPE_EXPRESSION"
}
interface TemplateParserNode {
    type: TemplateParserNodeType;
    value: any;
    children: TemplateParserNode[];
}
declare class TemplateParser {
    static parse(source: string): TemplateParserNode;
    private static parseReturningString;
    private static parseTemplateString;
    private static parseExpression;
    private static parseBinding;
    private static parsePipeExpression;
    private static parseName;
    private static parseQuotedText;
    private static parseNumber;
}
export default TemplateParser;
export { TemplateParserNode, TemplateParserNodeType };
