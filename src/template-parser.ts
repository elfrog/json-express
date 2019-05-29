
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

import PeekableString from './peekable-string';

const enum TemplateParserNodeType {
  NAME = 'NAME',
  NUMBER = 'NUMBER',
  TEXT = 'TEXT',
  RETURNING_STRING = 'RETURNING_STRING',
  TEMPLATE_STRING = 'TEMPLATE_STRING',
  EXPRESSION = 'EXPRESSION',
  BINDING = 'BINDING',
  PIPE_EXPRESSION = 'PIPE_EXPRESSION'
}

interface TemplateParserNode {
  type: TemplateParserNodeType;
  value: any;
  children: TemplateParserNode[];
}

function isAlpha(ch) {
  const code = ch.charCodeAt(0);
  return (code > 64 && code < 91) || (code > 96 && code < 123);
}

function isNumeric(ch) {
  const code = ch.charCodeAt(0);
  return (code > 47 && code < 58);
}

class TemplateParser {
  static parse(source: string): TemplateParserNode {
    const input = new PeekableString(source);
    const returningStringNode = TemplateParser.parseReturningString(input);

    if (returningStringNode) {
      return returningStringNode;
    }

    const templateStringNode = TemplateParser.parseTemplateString(input);
    return templateStringNode;
  }

  private static parseReturningString(input: PeekableString): TemplateParserNode {
    if (input.peek() !== '{') {
      return null;
    }

    if (input.peek(1) !== '=') {
      return null;
    }

    input.next(2);

    const expressionNode = TemplateParser.parseExpression(input); 

    if (!expressionNode) {
      throw new Error('Invalid returning expression');
    }

    input.trim();

    if (input.peek() !== '}') {
      throw new Error('Unexpected end of expression');
    }

    input.next();

    return {
      type: TemplateParserNodeType.RETURNING_STRING,
      value: null,
      children: [expressionNode]
    };
  }
  
  private static parseTemplateString(input: PeekableString) {
    const node: TemplateParserNode = {
      type: TemplateParserNodeType.TEMPLATE_STRING,
      value: null,
      children: []
    };
    let text = [];

    while (true) {
      const ch = input.peek();

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
          const textNode: TemplateParserNode = {
            type: TemplateParserNodeType.TEXT,
            value: text.join(''),
            children: null
          };

          node.children.push(textNode);
          text = [];
        }
      } else {
        text.push(ch);
      }

      if (ch === '{') {
        const expressionNode = TemplateParser.parseExpression(input);

        if (!expressionNode) {
          throw new Error('Invalid template expression');
        }

        node.children.push(expressionNode);
        input.trim();

        if (input.peek() !== '}') {
          throw new Error('Unexpected end of expression');
        }

        input.next();
      } else if (ch === null) {
        break;
      }
    }

    return node;
  }

  private static parseExpression(input: PeekableString) {
    const node: TemplateParserNode = {
      type: TemplateParserNodeType.EXPRESSION,
      value: null,
      children: []
    };
    const bindingNode = TemplateParser.parseBinding(input);
    const pipeNodes = [];

    if (!bindingNode) {
      return null;
    }

    while (true) {
      input.trim();

      if (input.peek() === '|') {
        input.next();
        const pipeNode = TemplateParser.parsePipeExpression(input);
        pipeNodes.push(pipeNode);
      } else {
        break;
      }
    }

    node.children = [bindingNode, ...pipeNodes];

    return node;
  }

  private static parseBinding(input: PeekableString) {
    const node: TemplateParserNode = {
      type: TemplateParserNodeType.BINDING,
      value: null,
      children: []
    };
    const nameNode = TemplateParser.parseName(input);

    if (!nameNode) {
      return null;
    }

    const keyNodes = [];

    while (true) {
      input.trim();

      if (input.peek() === '.') {
        input.next();

        const keyNode = TemplateParser.parseName(input);

        if (!keyNode) {
          throw new Error('Invalid property name of binding: ' + nameNode.value);
        }

        keyNodes.push(keyNode);
      } else {
        break;
      }
    }

    node.value = nameNode.value;
    node.children = [nameNode, ...keyNodes];

    return node;
  }

  private static parsePipeExpression(input: PeekableString) {
    const nameNode = TemplateParser.parseName(input);

    if (!nameNode) {
      throw new Error('Invalid pipe expression');
    }

    const argNodes = [];

    while (true) {
      const numberNode = TemplateParser.parseNumber(input);

      if (numberNode) {
        argNodes.push(numberNode);
        continue;
      }
      
      const textNode = TemplateParser.parseQuotedText(input);

      if (textNode) {
        argNodes.push(textNode);
        continue;
      }

      const bindingNode = TemplateParser.parseBinding(input);

      if (bindingNode) {
        argNodes.push(bindingNode);
        continue;
      }

      break;
    }

    const node: TemplateParserNode = {
      type: TemplateParserNodeType.PIPE_EXPRESSION,
      value: nameNode.value,
      children: [nameNode, ...argNodes]
    };

    return node;
  }

  private static parseName(input: PeekableString) {
    input.trim();

    const head = input.peek();
    const rest = [];

    if (!isAlpha(head) && head !== '$' && head !== '_') {
      return null;
    }

    input.next();

    while (true) {
      const ch = input.peek();

      if (ch === null || (!isAlpha(ch) && !isNumeric(ch) && ch !== '$' && ch !== '_')) {
        break;
      }

      rest.push(ch);
      input.next();
    }

    const name = head + rest.join('');
    const node: TemplateParserNode = {
      type: TemplateParserNodeType.NAME,
      value: name,
      children: null
    };

    return node;
  }

  private static parseQuotedText(input: PeekableString) {
    input.trim();

    const head = input.peek();

    if (head !== '"' && head !== '\'') {
      return null;
    }

    input.next();

    const text = [];
    let prev = null;

    while (true) {
      const ch = input.peek();

      if (ch === head && prev !== '\\') {
        input.next();
        break;
      } else if (ch === null) {
        throw new Error('Unexpected end of string');
      } else {
        text.push(ch);
        input.next();
        prev = ch;
      }
    }

    const node: TemplateParserNode = {
      type: TemplateParserNodeType.TEXT,
      value: text.join(''),
      children: null
    };

    return node;
  }

  private static parseNumber(input: PeekableString) {
    input.trim();

    const head = input.peek();
    const rest = [];

    if (!isNumeric(head) && head !== '-') {
      return null;
    }

    input.next();

    while (true) {
      const ch = input.peek();

      if (isNumeric(ch)) {
        rest.push(ch);
        input.next();
      } else {
        break;
      }
    }

    if (input.peek() === '.') {
      rest.push('.');
      input.next();

      while (true) {
        const ch = input.peek();

        if (isNumeric(ch)) {
          rest.push(ch);
          input.next();
        } else {
          break;
        }
      }
    }

    const value = Number(head + rest.join(''));

    if (Number.isNaN(value)) {
      throw new Error('Invalid number: ' + (head + rest.join('')));
    }

    const node: TemplateParserNode = {
      type: TemplateParserNodeType.NUMBER,
      value,
      children: null
    };

    return node;
  }
}

export default TemplateParser;

export {
  TemplateParserNode,
  TemplateParserNodeType
};
