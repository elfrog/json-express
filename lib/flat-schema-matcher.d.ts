declare const enum FlatSchemaColumnType {
    STRING = "string",
    BOOLEAN = "boolean",
    NUMBER = "number",
    INTEGER = "integer",
    ARRAY = "array",
    OBJECT = "object",
    ANY = "any",
    NULL = "null",
    REST = "..."
}
interface FlatSchemaColumn {
    type: FlatSchemaColumnType;
    name?: string;
    value?: any;
    unhandled?: boolean;
    required?: boolean;
}
interface FlatSchema {
    [key: string]: FlatSchemaColumn | string;
}
declare class FlatSchemaMatcher {
    schema: FlatSchema;
    columns: FlatSchemaColumn[];
    restColumn: FlatSchemaColumn;
    schemaHash: string;
    constructor(schema: FlatSchema);
    test(expression: any): boolean;
    getSchemaHash(): any;
    private static columnToString;
    toString(): string;
    private static normalizeSchemaColumns;
    private static checkColumnType;
}
export default FlatSchemaMatcher;
export { FlatSchema, FlatSchemaColumn, FlatSchemaColumnType };
