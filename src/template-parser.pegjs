
Template "template"
  = ReturningString / TemplateString

ReturningString "returning string"
  = '{=' _ exp: Expression _ '}'
  { return { type: 'return', value: exp }; }

TemplateString "template string"
  = splits:('{' _ exp:Expression _ '}' { return exp; }  / PlainText)+
  { return { type: 'template', value: splits }; }

PlainText "plain text"
  = (!'{'.)+ { return { type: 'text', value: text() }; }

Expression "expression"
  = binding:Binding pipes:(_ '|' _ PipeExpression)*
  { return { type: 'expression', value: binding }; }

PipeExpression "pipe expression"
  = Name (_ PipeArg)*

PipeArg "pipe argument"
  = Number / QuotedText / Binding

QuotedText "text"
  = '"' value:$((&'\\"' / !'"') .)* '"' { return value; }
  / "'" value:$((&"\\'" / !"'") .)* "'" { return value; }

Binding "binding"
  = PropBinding / ArrayBinding / bindingName:Name { return { type: 'binding', name: bindingName }; } 

PropBinding "binding"
  = bindingName:(ArrayBinding / Name) prop:('.' Binding) { return { type: 'binding', name: bindingName, prop: prop[1] }; }

ArrayBinding "binding"
  = bindingName:Name suffices:('[' (Integer / QuotedText / Binding) ']')+
  { return { type: 'binding', name: bindingName, prop: suffices.map(p => p[1]) }; }

Name "name"
  = [a-zA-Z$_] [a-zA-Z0-9$_]* { return text(); }

Number "number"
  = '-'? Digit+ ('.' Digit*)? { return Number(text()); }
  
Integer "integer"
  = '-'? Digit+ { return Number(text()); }

Digit "digit"
  = [0-9]

_ "whitespace"
  = [ \t\n\r]*
