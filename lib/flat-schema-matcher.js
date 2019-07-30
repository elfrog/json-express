"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
var md5_1 = __importDefault(require("md5"));
var FlatSchemaMatcher = /** @class */ (function () {
    function FlatSchemaMatcher(schema) {
        this.schema = {};
        this.types = {};
        var _a = FlatSchemaMatcher.normalizeSchemaColumns(schema), types = _a.types, columns = _a.columns, restColumn = _a.restColumn;
        this.types = types;
        this.columns = columns;
        this.restColumn = restColumn;
        this.schemaHash = this.getSchemaHash();
        for (var _i = 0, columns_1 = columns; _i < columns_1.length; _i++) {
            var column = columns_1[_i];
            this.schema[column.name] = column;
        }
        if (restColumn) {
            this.schema[restColumn.name] = restColumn;
        }
    }
    FlatSchemaMatcher.prototype.test = function (expression) {
        var _this = this;
        for (var _i = 0, _a = this.columns; _i < _a.length; _i++) {
            var column = _a[_i];
            var value = expression[column.name];
            if (value !== undefined) {
                if (column.value) {
                    if (column.value instanceof RegExp) {
                        if (!column.value.test(value)) {
                            return false;
                        }
                    }
                    else if (column.value !== value) {
                        return false;
                    }
                }
            }
            else if (column.required) {
                return false;
            }
        }
        var isSubset = Object.keys(expression).every(function (key) { return key in _this.schema; });
        if (this.restColumn) {
            if (this.restColumn.required && isSubset) {
                return false;
            }
        }
        else if (!isSubset) {
            return false;
        }
        return true;
    };
    FlatSchemaMatcher.prototype.getSchemaHash = function () {
        var t = this.columns.map(function (column) {
            if (column.value === undefined) {
                return column.name;
            }
            else {
                return column.name + '=' + String(column.value);
            }
        }).join(',');
        if (this.restColumn && this.restColumn.required) {
            t + '...';
        }
        return md5_1.default(t);
    };
    FlatSchemaMatcher.columnToString = function (column) {
        var t = column.name;
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
    };
    FlatSchemaMatcher.prototype.toString = function () {
        var tokens = this.columns.map(FlatSchemaMatcher.columnToString);
        if (this.restColumn) {
            tokens.push(FlatSchemaMatcher.columnToString(this.restColumn));
        }
        return '{\n  ' + tokens.join(',\n  ') + '\n}';
    };
    FlatSchemaMatcher.normalizeSchemaColumns = function (schema) {
        var columns = [];
        var types = {};
        var restColumn = null;
        for (var key in schema) {
            var v = schema[key];
            var col = {
                name: key,
                type: v.type,
                value: v.value,
                plainLevel: v.plainLevel || 0,
                rest: v.rest || false,
                required: v.required === undefined ? true : v.required,
                lazy: v.lazy || false
            };
            if (col.rest) {
                if (restColumn) {
                    throw new Error('Duplicate rest column: ' + restColumn.name + ', ' + key);
                }
                else {
                    restColumn = col;
                }
            }
            else {
                columns.push(col);
            }
            if ('type' in v && v.type !== undefined) {
                types[key] = v.type;
            }
        }
        return {
            types: types,
            columns: columns.sort(function (a, b) { return a.name.localeCompare(b.name); }),
            restColumn: restColumn
        };
    };
    return FlatSchemaMatcher;
}());
exports.default = FlatSchemaMatcher;
