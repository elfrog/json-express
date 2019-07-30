interface FlatSchemaColumn {
    type?: any;
    name?: string;
    value?: any;
    plainLevel?: number;
    rest?: boolean;
    required?: boolean;
    lazy?: boolean;
}
interface FlatSchema {
    [key: string]: FlatSchemaColumn;
}
declare class FlatSchemaMatcher {
    schema: FlatSchema;
    columns: FlatSchemaColumn[];
    restColumn: FlatSchemaColumn;
    types: object;
    schemaHash: string;
    constructor(schema: FlatSchema);
    test(expression: object): boolean;
    getSchemaHash(): any;
    private static columnToString;
    toString(): string;
    private static normalizeSchemaColumns;
}
export default FlatSchemaMatcher;
export { FlatSchema, FlatSchemaColumn };
