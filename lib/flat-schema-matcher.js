"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
var md5_1 = __importDefault(require("md5"));
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
            if (value) {
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
        return md5_1.default(this.columns.map(function (column) { return column.name; }).join(','));
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
    FlatSchemaMatcher.normalizeSchemaColumns = function (schema) {
        var columns = [];
        var restColumn = null;
        for (var key in schema) {
            var v = schema[key];
            if (typeof v === 'string') {
                var t = /^([\^\?]*)(string|number|integer|boolean|array|object|any|null|\.\.\.)?(?:=(.+))?$/i.exec(v);
                var required = t[1].indexOf('?') < 0;
                var unhandled = t[1].indexOf('^') >= 0;
                var columnType = t[2] ? t[2].toLowerCase() : 'any';
                var columnValue = columnType === 'number' ? Number(t[3]) : (columnType === 'boolean' ? t[3] === 'true' : t[3]);
                var column = {
                    type: columnType,
                    value: columnValue,
                    name: key,
                    required: required,
                    unhandled: unhandled
                };
                if (column.type === "..." /* REST */) {
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
            case "string" /* STRING */:
                return typeof value === 'string';
            case "number" /* NUMBER */:
                return typeof value === 'number';
            case "integer" /* INTEGER */:
                return Number.isSafeInteger(value);
            case "boolean" /* BOOLEAN */:
                return typeof value === 'boolean';
            case "array" /* ARRAY */:
                return Array.isArray(value);
            case "object" /* OBJECT */:
                return typeof value === 'object';
            case "any" /* ANY */:
                return true;
            case "null" /* NULL */:
                return value === null;
            default:
                return false;
        }
    };
    return FlatSchemaMatcher;
}());
exports.default = FlatSchemaMatcher;
