"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
var type_parser_1 = __importDefault(require("./type-parser"));
var BuildType = /** @class */ (function () {
    function BuildType(value) {
        this.record = null;
        this.children = null;
        this.optional = false;
        var parsed = type_parser_1.default(value, {});
        this.type = parsed.type;
        this.record = parsed.record;
        this.children = parsed.children;
    }
    return BuildType;
}());
exports.default = BuildType;
