Template "template"
  = ReturningString / TemplateString

ReturningString "returning string"
  = LWINGEQ exp: TemplateExpression RWING
  { return { type: 'return', value: exp }; }

TemplateString "template string"
  = splits:(LWING exp:TemplateExpression RWING { return exp; }  / PlainText)+
  { return { type: 'template', value: splits }; }

PlainText "plain text"
  = (!LWING.)+ { return { type: 'text', value: text() }; }

TemplateExpression "expression"
  = expr:Expression pipes:(PIPE PipeExpression)*
  {
    return {
      type: 'expression',
      value: expr,
      pipes: pipes.map(p => p[1])
    };
  }

PipeExpression "pipe expression"
  = handler:Binding args:(Expression)*
  { return { type: 'pipe', handler, args }; }
  
Expression
  = LogicalExpression
  
LogicalExpression
  = value:AddExpression stack:((LAND / LOR) AddExpression)*
  {
    return stack.length > 0 ?
      {
        type: 'operation',
        stack: [value, ...stack.map(p => ({ type: p[0], value: p[1] }))]
      } :
      value;
  }
  
AddExpression
  = value:MulExpression stack:((ADD / SUB) MulExpression)*
  {
    return stack.length > 0 ?
      {
        type: 'operation',
        stack: [value, ...stack.map(p => ({ type: p[0], value: p[1] }))]
      } :
      value;
  }

MulExpression
  = value:UnaryExpression stack:((MUL / DIV / MOD) UnaryExpression)*
  {
    return stack.length > 0 ?
      {
        type: 'operation',
        stack: [value, ...stack.map(p => ({ type: p[0], value: p[1] }))]
      } :
      value;
  }
  
UnaryExpression
  = operator:(LNOT / BNOT / PLUS / MINUS) value:Primary
  { return { type: operator, value }; }
  / Primary
  
Primary
  = Binding
  / value:Number { return { type: 'number', value }; }
  / value:QuotedText { return { type: 'string', value }; }
  / LPAR expr:Expression RPAR { return expr; }

Binding "binding"
  = PropBinding / ArrayBinding / bindingName:Name _ { return { type: 'binding', name: bindingName }; } 

PropBinding "binding"
  = bindingName:(ArrayBinding / Name) prop:('.' Binding) _ { return { type: 'binding', name: bindingName, prop: prop[1] }; }

ArrayBinding "binding"
  = bindingName:Name suffices:(LBRK Primary RBRK)+
  { return { type: 'binding', name: bindingName, prop: suffices.map(p => p[1]) }; }

QuotedText "text"
  = '"' value:$((&'\\"' / !'"') .)* '"' _ { return value; }
  / "'" value:$((&"\\'" / !"'") .)* "'" _ { return value; }

Name "name"
  = [a-zA-Z$_] [a-zA-Z0-9$_]* { return text(); }

Number "number"
  = '-'? Digit+ ('.' Digit*)? _ { return Number(text()); }
  
Integer "integer"
  = '-'? Digit+ _ { return Number(text()); }

Digit "digit"
  = [0-9]
  
BNOT = '~' _ { return 'bnot'; }  
BAND = '&' _ { return 'band'; }
BOR = '|' _ { return 'bor'; }
LNOT = '!' _ { return 'lnot'; }
LAND = '&&' _ { return 'land'; }
LOR = '||' _ { return 'lor'; }
MINUS = '-' _ { return 'minus'; }
PLUS = '+' _ { return 'plus'; }
DIV = '/' _ { return 'div'; }
MUL = '*' _ { return 'mul'; }
MOD = '%' _ { return 'mod'; }
ADD = '+' _ { return 'add'; }
SUB = '-' _ { return 'sub'; }
PIPE = '|' _ { return 'pipe'; }
LPAR = '(' _
RPAR = ')' _
LWING = '{' _
RWING = '}' _
LBRK = '[' _
RBRK = ']' _
LWINGEQ = '{=' _

_ "whitespace"
  = [ \t\n\r]* 
  