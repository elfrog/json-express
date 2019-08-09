import md5 from 'md5';
import BuildType, { BuildTypeRecord } from './build-type';

interface FlatSchemaColumn {
  type?: any;
  name?: string;
  value?: any;
  plainLevel?: number; // DEPRECATED: this property will be removed in the next version.
  rest?: boolean;
  required?: boolean;
  lazy?: boolean;
  buildType?: string;
}

interface FlatSchema {
  [key: string]: FlatSchemaColumn;
}

class FlatSchemaMatcher {
  schema: FlatSchema = {};
  columns: FlatSchemaColumn[];
  restColumn: FlatSchemaColumn;
  types: object = {};
  buildTypes: BuildTypeRecord = {};
  schemaHash: string;

  constructor(schema: FlatSchema) {
    const { types, buildTypes, columns, restColumn } = FlatSchemaMatcher.normalizeSchemaColumns(schema);

    this.types = types;
    this.buildTypes = buildTypes;
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

  test(expression: object) {
    for (const column of this.columns) {
      const value = expression[column.name];

      if (value !== undefined) {
        if (column.value) {
          if (column.value instanceof RegExp) {
            if (!column.value.test(value)) {
              return false;
            }
          } else if (column.value !== value) {
            return false;
          }
        }
      } else if (column.required) {
        return false;
      }
    }

    const isSubset = Object.keys(expression).every(key => key in this.schema);

    if (this.restColumn) {
      if (this.restColumn.required && isSubset) {
        return false;
      }
    } else if (!isSubset) {
      return false;
    }

    return true;
  }

  getSchemaHash() {
    const t = this.columns.map(column => {
      if (column.value === undefined) {
        return column.name;
      } else {
        return column.name + '=' + String(column.value)
      }
    }).join(',');

    if (this.restColumn && this.restColumn.required) {
      t + '...';
    }

    return md5(t);
  }

  private static columnToString(column: FlatSchemaColumn) {
    let t = column.name;

    if (!column.required) {
      t += '?';
    }

    if (column.plainLevel) {
      t += ':' + String(column.plainLevel);
    }

    if (column.value && column.value !== 'undefined') {
      t += ' = ' + String(column.value);
    }

    if (column.rest) {
      t = '...' + t;
    }

    if (column.lazy) {
      t = 'lazy ' + t;
    }

    return t;
  }

  toString() {
    const tokens = this.columns.map(FlatSchemaMatcher.columnToString);

    if (this.restColumn) {
      tokens.push(FlatSchemaMatcher.columnToString(this.restColumn));
    }

    return '{\n  ' + tokens.join(',\n  ') + '\n}';
  }

  private static normalizeSchemaColumns(schema: FlatSchema) {
    const columns: FlatSchemaColumn[] = [];
    const types = {};
    const buildTypes = {};
    let restColumn: FlatSchemaColumn = null;

    for (const key in schema) {
      const v: FlatSchemaColumn = schema[key];
      const col = {
        name: key,
        type: v.type,
        value: v.value,
        plainLevel: v.plainLevel || 0,
        rest: v.rest || false,
        required: v.required === undefined ? true : v.required,
        lazy: v.lazy || false,
        buildType: v.buildType
      };

      if (col.rest) {
        if (restColumn) {
          throw new Error('Duplicate rest column: ' + restColumn.name + ', ' + key);
        } else {
          restColumn = col;
        }
      } else {
        columns.push(col);
      }

      if (v.type !== undefined) {
        types[key] = v.type;
      }

      if (v.buildType !== undefined) {
        const buildType =  new BuildType(v.buildType);

        if (buildType.type === '@build') {
          buildTypes[key] = buildType.children[0];
          types[key] = buildType.children[1];
        } else {
          buildTypes[key] = buildType;
        }
      }
    }

    return {
      types,
      buildTypes,
      columns: columns.sort((a, b) => a.name.localeCompare(b.name)),
      restColumn
    };
  }
}

export default FlatSchemaMatcher;

export {
  FlatSchema,
  FlatSchemaColumn
};
