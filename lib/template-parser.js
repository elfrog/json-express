"use strict";
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
var __spreadArrays = (this && this.__spreadArrays) || function () {
    for (var s = 0, i = 0, il = arguments.length; i < il; i++) s += arguments[i].length;
    for (var r = Array(s), k = 0, i = 0; i < il; i++)
        for (var a = arguments[i], j = 0, jl = a.length; j < jl; j++, k++)
            r[k] = a[j];
    return r;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
var peekable_string_1 = __importDefault(require("./peekable-string"));
function isAlpha(ch) {
    var code = ch.charCodeAt(0);
    return (code > 64 && code < 91) || (code > 96 && code < 123);
}
function isNumeric(ch) {
    var code = ch.charCodeAt(0);
    return (code > 47 && code < 58);
}
var TemplateParser = /** @class */ (function () {
    function TemplateParser() {
    }
    TemplateParser.parse = function (source) {
        var input = new peekable_string_1.default(source);
        var returningStringNode = TemplateParser.parseReturningString(input);
        if (returningStringNode) {
            return returningStringNode;
        }
        var templateStringNode = TemplateParser.parseTemplateString(input);
        return templateStringNode;
    };
    TemplateParser.parseReturningString = function (input) {
        if (input.peek() !== '{') {
            return null;
        }
        if (input.peek(1) !== '=') {
            return null;
        }
        input.next(2);
        var expressionNode = TemplateParser.parseExpression(input);
        if (!expressionNode) {
            throw new Error('Invalid returning expression');
        }
        input.trim();
        if (input.peek() !== '}') {
            throw new Error('Unexpected end of expression');
        }
        input.next();
        return {
            type: "RETURNING_STRING" /* RETURNING_STRING */,
            value: null,
            children: [expressionNode]
        };
    };
    TemplateParser.parseTemplateString = function (input) {
        var node = {
            type: "TEMPLATE_STRING" /* TEMPLATE_STRING */,
            value: null,
            children: []
        };
        var text = [];
        while (true) {
            var ch = input.peek();
            // use '{' literally next to '\' 
            if (ch === '\\' && input.peek(1) === '{') {
                text.push('{');
                input.next(2);
                continue;
            }
            input.next();
            // push text node before expression begins or at the end of string
            if (ch === '{' || ch === null) {
                if (text.length > 0) {
                    var textNode = {
                        type: "TEXT" /* TEXT */,
                        value: text.join(''),
                        children: null
                    };
                    node.children.push(textNode);
                    text = [];
                }
            }
            else {
                text.push(ch);
            }
            if (ch === '{') {
                var expressionNode = TemplateParser.parseExpression(input);
                if (!expressionNode) {
                    throw new Error('Invalid template expression');
                }
                node.children.push(expressionNode);
                input.trim();
                if (input.peek() !== '}') {
                    throw new Error('Unexpected end of expression');
                }
                input.next();
            }
            else if (ch === null) {
                break;
            }
        }
        return node;
    };
    TemplateParser.parseExpression = function (input) {
        var node = {
            type: "EXPRESSION" /* EXPRESSION */,
            value: null,
            children: []
        };
        var bindingNode = TemplateParser.parseBinding(input);
        var pipeNodes = [];
        if (!bindingNode) {
            return null;
        }
        while (true) {
            input.trim();
            if (input.peek() === '|') {
                input.next();
                var pipeNode = TemplateParser.parsePipeExpression(input);
                pipeNodes.push(pipeNode);
            }
            else {
                break;
            }
        }
        node.children = __spreadArrays([bindingNode], pipeNodes);
        return node;
    };
    TemplateParser.parseBinding = function (input) {
        var node = {
            type: "BINDING" /* BINDING */,
            value: null,
            children: []
        };
        var nameNode = TemplateParser.parseName(input);
        if (!nameNode) {
            return null;
        }
        var keyNodes = [];
        while (true) {
            input.trim();
            if (input.peek() === '.') {
                input.next();
                var keyNode = TemplateParser.parseName(input);
                if (!keyNode) {
                    throw new Error('Invalid property name of binding: ' + nameNode.value);
                }
                keyNodes.push(keyNode);
            }
            else {
                break;
            }
        }
        node.value = nameNode.value;
        node.children = __spreadArrays([nameNode], keyNodes);
        return node;
    };
    TemplateParser.parsePipeExpression = function (input) {
        var nameNode = TemplateParser.parseName(input);
        if (!nameNode) {
            throw new Error('Invalid pipe expression');
        }
        var argNodes = [];
        while (true) {
            var numberNode = TemplateParser.parseNumber(input);
            if (numberNode) {
                argNodes.push(numberNode);
                continue;
            }
            var textNode = TemplateParser.parseQuotedText(input);
            if (textNode) {
                argNodes.push(textNode);
                continue;
            }
            var bindingNode = TemplateParser.parseBinding(input);
            if (bindingNode) {
                argNodes.push(bindingNode);
                continue;
            }
            break;
        }
        var node = {
            type: "PIPE_EXPRESSION" /* PIPE_EXPRESSION */,
            value: nameNode.value,
            children: __spreadArrays([nameNode], argNodes)
        };
        return node;
    };
    TemplateParser.parseName = function (input) {
        input.trim();
        var head = input.peek();
        var rest = [];
        if (!isAlpha(head) && head !== '$' && head !== '_') {
            return null;
        }
        input.next();
        while (true) {
            var ch = input.peek();
            if (ch === null || (!isAlpha(ch) && !isNumeric(ch) && ch !== '$' && ch !== '_')) {
                break;
            }
            rest.push(ch);
            input.next();
        }
        var name = head + rest.join('');
        var node = {
            type: "NAME" /* NAME */,
            value: name,
            children: null
        };
        return node;
    };
    TemplateParser.parseQuotedText = function (input) {
        input.trim();
        var head = input.peek();
        if (head !== '"' && head !== '\'') {
            return null;
        }
        input.next();
        var text = [];
        var prev = null;
        while (true) {
            var ch = input.peek();
            if (ch === head && prev !== '\\') {
                input.next();
                break;
            }
            else if (ch === null) {
                throw new Error('Unexpected end of string');
            }
            else {
                text.push(ch);
                input.next();
                prev = ch;
            }
        }
        var node = {
            type: "TEXT" /* TEXT */,
            value: text.join(''),
            children: null
        };
        return node;
    };
    TemplateParser.parseNumber = function (input) {
        input.trim();
        var head = input.peek();
        var rest = [];
        if (!isNumeric(head) && head !== '-') {
            return null;
        }
        input.next();
        while (true) {
            var ch = input.peek();
            if (isNumeric(ch)) {
                rest.push(ch);
                input.next();
            }
            else {
                break;
            }
        }
        if (input.peek() === '.') {
            rest.push('.');
            input.next();
            while (true) {
                var ch = input.peek();
                if (isNumeric(ch)) {
                    rest.push(ch);
                    input.next();
                }
                else {
                    break;
                }
            }
        }
        var value = Number(head + rest.join(''));
        if (Number.isNaN(value)) {
            throw new Error('Invalid number: ' + (head + rest.join('')));
        }
        var node = {
            type: "NUMBER" /* NUMBER */,
            value: value,
            children: null
        };
        return node;
    };
    return TemplateParser;
}());
exports.default = TemplateParser;
