import md5 from 'md5';

const enum FlatSchemaColumnType {
  STRING = 'string',
  BOOLEAN = 'boolean',
  NUMBER = 'number',
  INTEGER = 'integer',
  ARRAY = 'array',
  OBJECT = 'object',
  ANY = 'any',
  NULL = 'null',
  REST = '...'
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

class FlatSchemaMatcher {
  schema: FlatSchema = {};
  columns: FlatSchemaColumn[];
  restColumn: FlatSchemaColumn;
  schemaHash: string;

  constructor(schema: FlatSchema) {
    const { columns, restColumn } = FlatSchemaMatcher.normalizeSchemaColumns(schema);

    this.columns = columns;
    this.restColumn = restColumn;
    this.schemaHash = this.getSchemaHash();

    for (const column of columns) {
      this.schema[column.name] = column;
    }

    if (restColumn) {
      this.schema[restColumn.name] = restColumn;
    }
  }

  test(expression: any) {
    for (const column of this.columns) {
      const value = expression[column.name];

      if (value) {
        if (!FlatSchemaMatcher.checkColumnType(value, column.type)) {
          return false;
        }

        if (column.value !== undefined && column.value !== value) {
          return false;
        }
      } else if (column.required) {
        return false;
      }
    }

    if (this.restColumn) {
      // TODO: check required property for rest column
    } else {
      return Object.keys(expression).every(key => key in this.schema);
    }

    return true;
  }

  getSchemaHash() {
    return md5(this.columns.map(column => column.name).join(','));
  }

  private static columnToString(column: FlatSchemaColumn) {
    let t = column.name + ': "';

    if (!column.required) {
      t += '?';
    }

    if (column.unhandled) {
      t += '^';
    }

    t += column.type.toString();

    if (column.value) {
      t += '=' + column.value;
    }

    return t + '"';
  }

  toString() {
    const tokens = this.columns.map(FlatSchemaMatcher.columnToString);

    if (this.restColumn) {
      tokens.push(FlatSchemaMatcher.columnToString(this.restColumn));
    }

    return '{' + tokens.join(', ') + '}';
  }

  private static normalizeSchemaColumns(schema: FlatSchema) {
    const columns: FlatSchemaColumn[] = [];
    let restColumn: FlatSchemaColumn = null;

    for (const key in schema) {
      const v = schema[key];

      if (typeof v === 'string') {
        const t = /^([\^\?]*)(string|number|integer|boolean|array|object|any|null|\.\.\.)?(?:=(.+))?$/i.exec(v);
        const required = t[1].indexOf('?') < 0;
        const unhandled = t[1].indexOf('^') >= 0;
        const columnType = t[2] ? t[2].toLowerCase() : 'any';
        const columnValue = columnType === 'number' ? Number(t[3]) : (columnType === 'boolean' ? t[3] === 'true' : t[3]);
        const column = {
          type: columnType as FlatSchemaColumnType,
          value: columnValue,
          name: key,
          required,
          unhandled
        };

        if (column.type === FlatSchemaColumnType.REST) {
          if (restColumn) {
            throw new Error('Duplicate rest column: ' + column.name);
          }

          restColumn = column;
        } else {
          columns.push(column);
        }
      } else {
        columns.push({
          type: v.type,
          value: v.value,
          name: key,
          required: v.required === undefined ? true : v.required,
          unhandled: v.unhandled || false
        });
      }
    }

    return {
      columns: columns.sort((a, b) => a.name.localeCompare(b.name)),
      restColumn
    };
  }

  private static checkColumnType(value: any, type: FlatSchemaColumnType) {
    switch (type) {
      case FlatSchemaColumnType.STRING:
        return typeof value === 'string';
      case FlatSchemaColumnType.NUMBER:
        return typeof value === 'number';
      case FlatSchemaColumnType.INTEGER:
        return Number.isSafeInteger(value);
      case FlatSchemaColumnType.BOOLEAN:
        return typeof value === 'boolean';
      case FlatSchemaColumnType.ARRAY:
        return Array.isArray(value);
      case FlatSchemaColumnType.OBJECT:
        return typeof value === 'object';
      case FlatSchemaColumnType.ANY:
        return true;
      case FlatSchemaColumnType.NULL:
        return value === null;
      default:
        return false;
    }
  }
}

export default FlatSchemaMatcher;

export {
  FlatSchema,
  FlatSchemaColumn,
  FlatSchemaColumnType
};
