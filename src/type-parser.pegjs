Expression "expression"
  = buildType:RootType _ "->" _ resultType:RootType
  { return { type: "@build", children: [buildType, resultType] }; }
  / RootType

RootType "type"
  = _ expression:(Choice / PostfixedArrayType / TupleType / GroupedChoice / ArrayType / RecordType / NamedType) _
  { return expression; }
  
GroupedChoice "grouped choice"
  = "(" _ choice:Choice _ ")"
  { return choice; }

Choice "choice"
  = first:(TupleType / ArrayType / PostfixedArrayType / RecordType / NamedType) rest:(_ "|" _ (TupleType / ArrayType / PostfixedArrayType / RecordType / NamedType))+
  { return { type: "@choice", children: [first, ...rest.map(t => t[3])] }; }

ArrayType "array type"
  = "array" _ buildType:RootType
  { return { type: "array", children: [buildType] }; }

PostfixedArrayType "array type"
  = buildType:(TupleType / GroupedChoice / ArrayType / RecordType / NamedType) _ "[]"
  { return { type: "array", children: [buildType] }; }

RecordType "record type"
  = "{" first:RecordProperty rest:("," RecordProperty)* "}"
  { return { type: "@record", record: Object.assign({}, first, ...rest.map(t => t[1])) }; }

RecordProperty "record property"
  = _ key:RecordKey _ optional:("?"?) _ ":" _ type:RootType _
  { return { [key]: optional ? { ...type, optional: true } : type }; }

RecordKey "record key"
  = "..." / Name
  { return text(); }

TupleType "tuple type"
  = "[" _ first:RootType rest:(_ "," _ RootType)* _ "]"
  { return { type: "@tuple", children: [first, ...rest.map(t => t[3])] }; }

NamedType "named type"
  = typeName:$(PrimitiveType / Name)
  { return { type: typeName }; }

PrimitiveType "primitive type"
  = "string" / "number" / "boolean" / "object" / "array" / "null" / "any"

Name "name"
  = [a-zA-Z$_][a-zA-Z0-9$_]* { return text(); }

_ "whitespace"
  = [ \t\n\r]*