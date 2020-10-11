"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
var build_type_1 = __importDefault(require("./build-type"));
function checkValueType(value, type) {
    switch (type.type) {
        case '@choice':
            if (!type.children.some(function (subType) { return checkValueType(value, subType); })) {
                return false;
            }
            break;
        case '@tuple':
            if (!Array.isArray(value)) {
                return false;
            }
            if (value.length !== type.children.length) {
                return false;
            }
            for (var i = 0; i < type.children.length; i++) {
                if (!checkValueType(value[i], type.children[i])) {
                    return false;
                }
            }
            break;
        case '@record':
            {
                var restType_1 = type.record['...'];
                var restValues = [];
                for (var key in value) {
                    if (!(key in type.record)) {
                        if (!restType_1) {
                            return false;
                        }
                        restValues.push(value[key]);
                    }
                }
                for (var key in type.record) {
                    if (key === '...') {
                        continue;
                    }
                    if (!(key in value)) {
                        if (!type.record[key].optional) {
                            return false;
                        }
                    }
                    else if (!checkValueType(value[key], type.record[key])) {
                        return false;
                    }
                }
                if (restType_1) {
                    if (!restValues.every(function (v) { return checkValueType(v, restType_1); })) {
                        return false;
                    }
                }
            }
            break;
        case 'string':
            if (typeof value !== 'string') {
                return false;
            }
            break;
        case 'array':
            if (!Array.isArray(value)) {
                return false;
            }
            if (!!type.children) {
                var subType_1 = type.children[0];
                if (!value.every(function (v) { return checkValueType(v, subType_1); })) {
                    return false;
                }
            }
            break;
        case 'boolean':
            if (typeof value !== 'boolean') {
                return false;
            }
            break;
        case 'number':
            if (typeof value !== 'number') {
                return false;
            }
            break;
        case 'null':
            if (value !== null) {
                return false;
            }
            break;
        case 'any':
            break;
        default:
            return false;
    }
    return true;
}
function typeCheckerGenerator(type) {
    var parsedType = new build_type_1.default(type);
    return function (value) {
        if (!checkValueType(value, parsedType)) {
            throw new TypeError('Invalid type with: ' + JSON.stringify(value));
        }
    };
}
exports.default = typeCheckerGenerator;
