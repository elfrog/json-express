/**
 * TemplateExpression has two types of string expression.
 * One is the returning string that literally returns a value of any types
 * including not only string but number, boolean, object, etc as is evaluated.
 * And another one is the template string that returns a string value
 * that concatinates literals and interpolated expressions into one.
 *
 * === EBNF Of TemplateExpression ===
 * TEXT = any visible characters include white spaces
 * DIGIT = `0`...`9`
 * NAME = (`a`...`z` | `A`...`Z` | `$` | `_`) {`a`...`z` | `A`...`Z` | `$` | `_` | DIGIT}
 * NUMBER = [`-`] DIGIT {DIGIT} [`.` {DIGIT}]
 * string = returningstring | templatestring
 * returningstring = `{=` expression `}`
 * templatestring = {TEXT | `{` expression `}`}
 * expression = binding {`|` pipeexpression}
 * binding = NAME {`.` NAME}
 * pipeexpression = NAME {pipearg}
 * pipearg = NUMBER | quotedtext | binding
 * quotedtext = `"` TEXT `"` | `'` TEXT `'`
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
