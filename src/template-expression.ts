import TemplateParser, { TemplateParserNode, TemplateParserNodeType } from './template-parser';
import builtinPipes from './builtin-template-pipes';

const enum TemplateExpressionOpcode {
  PUSH, // push value to stack
  STRCONCAT, // pop n items from stack and concat the items as a string and push the result
  FETCH, // fetch value from context and push the result
  PIPE, // pop n + 1 items (n items for pipe arguments and 1 item for pipe value) from stack and call pipe function and push the result
  END // stop the program returning top most stack item
}

interface TemplateExpressionInstruction {
  opcode: TemplateExpressionOpcode;
  n?: number;
  v?: any;
}

interface TemplateExpressionContext {
  [key: string]: any;
}

interface TemplateExpressionPipeHandler {
  (value: any, ...args: any[]): Promise<any> | any;
}

interface TemplateExpressionPipeHandlerDictionary {
  [key: string]: TemplateExpressionPipeHandler;
}

class TemplateExpressionProgram {
  instructions: TemplateExpressionInstruction[] = [];

  add(opcode: TemplateExpressionOpcode, n: number = null, v: any = null) {
    this.instructions.push({ opcode, n, v });
  }

  addn(opcode: TemplateExpressionOpcode, n: number) {
    this.instructions.push({ opcode, n });
  }
  
  addv(opcode: TemplateExpressionOpcode, v: any) {
    this.instructions.push({ opcode, v });
  }
}

class TemplateExpression {
  private static pipeHandlers: TemplateExpressionPipeHandlerDictionary = Object.assign({}, builtinPipes);

  private program: TemplateExpressionProgram;
  source: string;

  constructor(source: string) {
    const parsedRoot = TemplateParser.parse(source);

    this.source = source;
    this.program = TemplateExpression.compile(parsedRoot);
  }

  async execute(context: TemplateExpressionContext) {
    const instructions = this.program.instructions;
    const stack = [];

    for (const instruction of instructions) {
      switch (instruction.opcode) {
        case TemplateExpressionOpcode.PUSH: {
          stack.push(instruction.v);
          break;
        }
        case TemplateExpressionOpcode.STRCONCAT: {
          let str = '';

          for (let i = 0; i < instruction.n; i++) {
            str = String(stack.pop()) + str;
          }

          stack.push(str);
          break;
        }
        case TemplateExpressionOpcode.FETCH: {
          const binding = instruction.v;
          let v = context[binding[0]];

          if (v === undefined) {
            throw new Error('Undefined variable: ' + binding[0]);
          }

          for (let i = 1; i < binding.length; i++) {
            v = v[binding[i]];
          }

          stack.push(v);
          break;
        }
        case TemplateExpressionOpcode.PIPE: {
          const args = stack.splice(stack.length - instruction.n, instruction.n);
          const v = stack.pop();
          const pipeHandler = TemplateExpression.pipeHandlers[instruction.v];

          if (!pipeHandler) {
            throw new Error('Undefined pipe handler: ' + instruction.v);
          }

          const r = pipeHandler(v, ...args);

          stack.push(r instanceof Promise ? await r : r);
          break;
        }
        case TemplateExpressionOpcode.END: {
          return stack.pop();
        }
        default:
          throw new Error('Invalid instruction');
      }
    }

    return stack.pop();
  }

  private static compile(root: TemplateParserNode) {
    const program = new TemplateExpressionProgram();

    if (root.type === TemplateParserNodeType.RETURNING_STRING) {
      TemplateExpression.compileExpressionNode(root.children[0], program);
    } else {
      for (const node of root.children) {
        if (node.type === TemplateParserNodeType.TEXT || node.type === TemplateParserNodeType.NUMBER) {
          program.addv(TemplateExpressionOpcode.PUSH, node.value);
        } else {
          TemplateExpression.compileExpressionNode(node, program);
        }
      }

      if (root.children.length > 1) {
        program.addn(TemplateExpressionOpcode.STRCONCAT, root.children.length);
      }
    }

    program.add(TemplateExpressionOpcode.END);

    return program;
  }

  private static compileBindingNode(bindingNode: TemplateParserNode, program: TemplateExpressionProgram) {
    program.addv(TemplateExpressionOpcode.FETCH, bindingNode.children.map(node => node.value));
  }

  private static compileExpressionNode(node: TemplateParserNode, program: TemplateExpressionProgram) {
    TemplateExpression.compileBindingNode(node.children[0], program);

    for (let i = 1; i < node.children.length; i++) {
      const pipeNode = node.children[i];

      for (let j = 1; j < pipeNode.children.length; j++) {
        const argNode = pipeNode.children[j];

        if (argNode.type === TemplateParserNodeType.BINDING) {
          TemplateExpression.compileBindingNode(argNode, program);
        } else {
          program.addv(TemplateExpressionOpcode.PUSH, argNode.value);
        }
      }

      program.add(TemplateExpressionOpcode.PIPE, pipeNode.children.length - 1, pipeNode.value);
    }
  }

  static addPipeHandler(name: string, handler: TemplateExpressionPipeHandler) {
    TemplateExpression.pipeHandlers[name] = handler;
  }

  static removePipeHandler(name: string) {
    if (name in TemplateExpression.pipeHandlers) {
      delete TemplateExpression.pipeHandlers[name];
    }
  }
}

export default TemplateExpression;
