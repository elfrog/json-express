Expression "expression"
  = buildType:RootType ARROW resultType:RootType
  { return { type: "@build", children: [buildType, resultType] }; }
  / RootType

RootType "type"
  = _ expression:(Choice / PostfixedArrayType / TupleType / GroupedChoice / ArrayType / RecordType / NamedType)
  { return expression; }
  
GroupedChoice "grouped choice"
  = LPAR choice:Choice RPAR
  { return choice; }

Choice "choice"
  = first:(TupleType / ArrayType / PostfixedArrayType / RecordType / NamedType) rest:(BAR (TupleType / ArrayType / PostfixedArrayType / RecordType / NamedType))+
  { return { type: "@choice", children: [first, ...rest.map(t => t[3])] }; }

ArrayType "array type"
  = ARRAYTYPE buildType:RootType
  { return { type: "array", children: [buildType] }; }

PostfixedArrayType "array type"
  = buildType:(TupleType / GroupedChoice / ArrayType / RecordType / NamedType) LBRK RBRK
  { return { type: "array", children: [buildType] }; }

RecordType "record type"
  = LWING first:RecordProperty rest:(COMMA RecordProperty)* RWING
  { return { type: "@record", record: Object.assign({}, first, ...rest.map(t => t[1])) }; }

RecordProperty "record property"
  = key:RecordKey optional:(OPTIONALMARK?) COLON type:RootType
  { return { [key]: optional ? { ...type, optional: true } : type }; }

RecordKey "record key"
  = ELLIPSIS { return '...'; } / name:Name _ { return name; }

TupleType "tuple type"
  = LBRK first:RootType rest:(COMMA RootType)* RBRK
  { return { type: "@tuple", children: [first, ...rest.map(t => t[3])] }; }

NamedType "named type"
  = typeName:$(PrimitiveType / Name) _
  { return { type: typeName }; }

PrimitiveType "primitive type"
  = "string" / "number" / "boolean" / "object" / "array" / "null" / "any"

Name "name"
  = [a-zA-Z$_][a-zA-Z0-9$_]* { return text(); }
  
ARROW = '->' _
ARRAYTYPE = 'array' _
ELLIPSIS = '...' _
OPTIONALMARK = '?' _
COLON = ':' _
COMMA = ',' _
BAR = '|' _
LWING = '{' _
RWING = '}' _
LBRK = '[' _
RBRK = ']' _
LPAR = '(' _
RPAR = ')' _

_ "whitespace"
  = [ \t\n\r]*
