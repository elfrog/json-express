"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
var md5_1 = __importDefault(require("md5"));
var FlatSchemaColumnType;
(function (FlatSchemaColumnType) {
    FlatSchemaColumnType["STRING"] = "string";
    FlatSchemaColumnType["BOOLEAN"] = "boolean";
    FlatSchemaColumnType["NUMBER"] = "number";
    FlatSchemaColumnType["INTEGER"] = "integer";
    FlatSchemaColumnType["ARRAY"] = "array";
    FlatSchemaColumnType["OBJECT"] = "object";
    FlatSchemaColumnType["ANY"] = "any";
    FlatSchemaColumnType["NULL"] = "null";
    FlatSchemaColumnType["REST"] = "...";
})(FlatSchemaColumnType || (FlatSchemaColumnType = {}));
exports.FlatSchemaColumnType = FlatSchemaColumnType;
var FlatSchemaMatcher = /** @class */ (function () {
    function FlatSchemaMatcher(schema) {
        this.schema = {};
        var _a = FlatSchemaMatcher.normalizeSchemaColumns(schema), columns = _a.columns, restColumn = _a.restColumn;
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
                if (!FlatSchemaMatcher.checkColumnType(value, column.type)) {
                    return false;
                }
                if (column.value !== undefined && column.value !== value) {
                    return false;
                }
            }
            else if (column.required) {
                return false;
            }
        }
        if (this.restColumn) {
            // TODO: check required property for rest column
        }
        else {
            return Object.keys(expression).every(function (key) { return key in _this.schema; });
        }
        return true;
    };
    FlatSchemaMatcher.prototype.getSchemaHash = function () {
        return md5_1.default(this.columns.map(function (column) {
            if (column.value === undefined) {
                return column.name;
            }
            else {
                return column.name + '=' + column.value;
            }
        }).join(','));
    };
    FlatSchemaMatcher.columnToString = function (column) {
        var t = column.name + ': "';
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
    };
    FlatSchemaMatcher.prototype.toString = function () {
        var tokens = this.columns.map(FlatSchemaMatcher.columnToString);
        if (this.restColumn) {
            tokens.push(FlatSchemaMatcher.columnToString(this.restColumn));
        }
        return '{' + tokens.join(', ') + '}';
    };
    FlatSchemaMatcher.parseColumnValue = function (type, value) {
        if (value === undefined) {
            return undefined;
        }
        switch (type) {
            case 'integer':
            case 'number': return Number(value);
            case 'boolean': return value === 'true';
            default: return value;
        }
    };
    FlatSchemaMatcher.normalizeSchemaColumns = function (schema) {
        var columnTypes = Object.values(FlatSchemaColumnType);
        var columns = [];
        var restColumn = null;
        for (var key in schema) {
            var v = schema[key];
            if (typeof v === 'string') {
                var t = /^([\^\?]*)([^=]+)?(?:=(.+))?$/i.exec(v);
                if (!t) {
                    throw new Error('Invalid schema column: ' + v);
                }
                var required = t[1].indexOf('?') < 0;
                var unhandled = t[1].indexOf('^') >= 0;
                var columnType = t[2] ? t[2].toLowerCase() : 'any';
                if (!columnTypes.includes(columnType)) {
                    throw new Error('Invalid column type: ' + columnType);
                }
                var column = {
                    type: columnType,
                    value: FlatSchemaMatcher.parseColumnValue(columnType, t[3]),
                    name: key,
                    required: required,
                    unhandled: unhandled
                };
                if (column.type === FlatSchemaColumnType.REST) {
                    if (restColumn) {
                        throw new Error('Duplicate rest column: ' + column.name);
                    }
                    restColumn = column;
                }
                else {
                    columns.push(column);
                }
            }
            else {
                if (!columnTypes.includes(v.type)) {
                    throw new Error('Invalid column type: ' + v.type);
                }
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
            columns: columns.sort(function (a, b) { return a.name.localeCompare(b.name); }),
            restColumn: restColumn
        };
    };
    FlatSchemaMatcher.checkColumnType = function (value, type) {
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
    };
    return FlatSchemaMatcher;
}());
exports.default = FlatSchemaMatcher;
