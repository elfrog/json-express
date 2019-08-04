"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var build_type_parser_1 = require("./build-type-parser");
var BuildType = /** @class */ (function () {
    function BuildType(value) {
        this.record = null;
        this.children = null;
        var parsed = build_type_parser_1.parse(value);
        this.type = parsed.type;
        this.record = parsed.record;
        this.children = parsed.children;
    }
    return BuildType;
}());
exports.default = BuildType;
