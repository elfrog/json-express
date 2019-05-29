"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var PeekableString = /** @class */ (function () {
    function PeekableString(source) {
        this.index = 0;
        this.source = null;
        this.source = source;
    }
    PeekableString.prototype.clear = function () {
        this.index = 0;
    };
    PeekableString.prototype.peek = function (rel) {
        if (rel === void 0) { rel = 0; }
        var index = this.index + rel;
        if (index >= this.source.length || index < 0) {
            return null;
        }
        return this.source.charAt(index);
    };
    PeekableString.prototype.next = function (rel) {
        if (rel === void 0) { rel = 1; }
        var index = this.index + rel;
        if (index > this.source.length || index < 0) {
            return;
        }
        this.index = index;
    };
    PeekableString.prototype.trim = function () {
        while (this.index < this.source.length) {
            var ch = this.source.charAt(this.index);
            if (ch !== ' ' && ch !== '\n' && ch !== '\t') {
                return;
            }
            this.index++;
        }
    };
    return PeekableString;
}());
exports.default = PeekableString;
