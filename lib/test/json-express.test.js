"use strict";
var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (_) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
var assert_1 = require("assert");
var json_express_1 = __importDefault(require("../json-express"));
var BodyBuilder = {
    schema: {
        body: {}
    },
    build: function (data) {
        return '<body>' + data.body + '</body>';
    }
};
var ListBuilder = {
    schema: {
        items: {
            type: 'array'
        }
    },
    build: function (data) { return __awaiter(void 0, void 0, void 0, function () {
        return __generator(this, function (_a) {
            return [2 /*return*/, '<ul>' + data.items.map(function (p) { return '<li>' + p + '</li>'; }).join('') + '</ul>'];
        });
    }); }
};
var DataBinder = {
    schema: {
        binding: {
            required: false
        },
        data: {
            plainLevel: 1,
        },
        rest: {
            rest: true,
            lazy: true
        }
    },
    build: function (data, ctx) {
        var _a;
        return data.rest(__assign(__assign({}, ctx), (_a = {}, _a[data.bidning || '$'] = data.data, _a)));
    }
};
var PlaceholderBuilder = {
    schema: {
        placeholderValue: {
            required: false
        }
    },
    placeholder: function () { return 'Loading...'; },
    build: function (data) { return __awaiter(void 0, void 0, void 0, function () {
        return __generator(this, function (_a) {
            return [2 /*return*/, data.placeholderValue];
        });
    }); }
};
var TableHeaderBuilder = {
    schema: {
        columns: {
            type: 'array',
            buildType: 'array string'
        }
    },
    build: function (data) {
        var t = '<tr>';
        for (var _i = 0, _a = data.columns; _i < _a.length; _i++) {
            var col = _a[_i];
            t += '<th>' + col + '</th>';
        }
        return t + '</tr>';
    }
};
var TodoBuilder = {
    schema: {
        todos: {
            type: 'array',
            buildType: '{ todo: string, date: string }[]'
        }
    },
    build: function (data) {
        var t = '<ol>';
        for (var _i = 0, _a = data.todos; _i < _a.length; _i++) {
            var item = _a[_i];
            t += '<li>' + item.todo + ' <small>' + item.date + '</small></li>';
        }
        return t + '</ol>';
    }
};
describe('JsonExpress', function () {
    var _this = this;
    it('matches types', function () { return __awaiter(_this, void 0, void 0, function () {
        var je;
        var _this = this;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    je = new json_express_1.default([BodyBuilder, ListBuilder]);
                    return [4 /*yield*/, assert_1.rejects(function () { return __awaiter(_this, void 0, void 0, function () {
                            return __generator(this, function (_a) {
                                switch (_a.label) {
                                    case 0: return [4 /*yield*/, je.build({
                                            body: {
                                                items: 'test'
                                            }
                                        })];
                                    case 1:
                                        _a.sent();
                                        return [2 /*return*/];
                                }
                            });
                        }); })];
                case 1:
                    _a.sent();
                    return [4 /*yield*/, assert_1.doesNotReject(function () { return __awaiter(_this, void 0, void 0, function () {
                            return __generator(this, function (_a) {
                                switch (_a.label) {
                                    case 0: return [4 /*yield*/, je.build({
                                            body: {
                                                items: '{=test}'
                                            }
                                        }, {
                                            test: ['this', 'is', 'an', 'array']
                                        })];
                                    case 1:
                                        _a.sent();
                                        return [2 /*return*/];
                                }
                            });
                        }); })];
                case 2:
                    _a.sent();
                    return [2 /*return*/];
            }
        });
    }); });
    it('works with builders', function () { return __awaiter(_this, void 0, void 0, function () {
        var je, result;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    je = new json_express_1.default([BodyBuilder, ListBuilder, DataBinder]);
                    return [4 /*yield*/, je.build({
                            data: {
                                name: 'Dongho',
                                age: 29
                            },
                            body: {
                                items: ['my name is {$.name} ', 'and age is {$.age}.']
                            }
                        })];
                case 1:
                    result = _a.sent();
                    assert_1.equal(result, '<body><ul><li>my name is Dongho </li><li>and age is 29.</li></ul></body>');
                    return [2 /*return*/];
            }
        });
    }); });
    it('does not accept duplicate schema', function () {
        assert_1.throws(function () {
            new json_express_1.default([
                {
                    schema: {
                        type: { value: 'test' },
                        body: { required: false },
                        rest: { rest: true }
                    },
                    build: function () { return 'test'; }
                },
                {
                    schema: {
                        body: {},
                        type: { value: 'test' }
                    },
                    build: function () { return 'test'; }
                }
            ]);
        });
    });
    it('allows schema that have same keys but different matches', function () {
        assert_1.doesNotThrow(function () {
            new json_express_1.default([
                {
                    schema: {
                        type: { value: 'test1' },
                        body: {}
                    },
                    build: function () { return test; }
                },
                {
                    schema: {
                        type: { value: 'test2' },
                        body: {}
                    },
                    build: function () { return test; }
                }
            ]);
        });
    });
    it('uses placeholder before complete build', function () { return __awaiter(_this, void 0, void 0, function () {
        var je, midResults, finalResult;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    je = new json_express_1.default([PlaceholderBuilder, ListBuilder]);
                    midResults = [];
                    return [4 /*yield*/, je.build({
                            items: [
                                { placeholderValue: 'test1' },
                                { placeholderValue: 'test2' },
                                { placeholderValue: 'test3' }
                            ]
                        }, {}, function (r) {
                            midResults.push(r);
                        })];
                case 1:
                    finalResult = _a.sent();
                    assert_1.equal(finalResult, '<ul><li>test1</li><li>test2</li><li>test3</li></ul>');
                    assert_1.equal(midResults.length, 4);
                    return [2 /*return*/];
            }
        });
    }); });
    it('works with build types', function () { return __awaiter(_this, void 0, void 0, function () {
        var je, todoResult;
        var _this = this;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    je = new json_express_1.default([TableHeaderBuilder, TodoBuilder]);
                    return [4 /*yield*/, assert_1.rejects(function () { return __awaiter(_this, void 0, void 0, function () {
                            return __generator(this, function (_a) {
                                switch (_a.label) {
                                    case 0: return [4 /*yield*/, je.build({
                                            columns: 'not an array'
                                        })];
                                    case 1:
                                        _a.sent();
                                        return [2 /*return*/];
                                }
                            });
                        }); })];
                case 1:
                    _a.sent();
                    return [4 /*yield*/, assert_1.doesNotReject(function () { return __awaiter(_this, void 0, void 0, function () {
                            return __generator(this, function (_a) {
                                switch (_a.label) {
                                    case 0: return [4 /*yield*/, je.build({
                                            columns: [
                                                'id',
                                                'name',
                                                'date'
                                            ]
                                        })];
                                    case 1:
                                        _a.sent();
                                        return [2 /*return*/];
                                }
                            });
                        }); })];
                case 2:
                    _a.sent();
                    return [4 /*yield*/, assert_1.rejects(function () { return __awaiter(_this, void 0, void 0, function () {
                            return __generator(this, function (_a) {
                                switch (_a.label) {
                                    case 0: return [4 /*yield*/, je.build({
                                            todos: [
                                                { todo: 'waking up early', date: '2019-01-01' },
                                                { todo: 'going to school', date: '2019-01-02', anotherProp: true }
                                            ]
                                        })];
                                    case 1:
                                        _a.sent();
                                        return [2 /*return*/];
                                }
                            });
                        }); })];
                case 3:
                    _a.sent();
                    return [4 /*yield*/, je.build({
                            todos: [
                                { todo: 'waking up early', date: '2019-01-01' },
                                { todo: 'going to school', date: '2019-01-02' }
                            ]
                        })];
                case 4:
                    todoResult = _a.sent();
                    assert_1.equal(todoResult, '<ol><li>waking up early <small>2019-01-01</small></li><li>going to school <small>2019-01-02</small></li></ol>');
                    return [2 /*return*/];
            }
        });
    }); });
    it('passes null value', function () { return __awaiter(_this, void 0, void 0, function () {
        var je, result;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    je = new json_express_1.default([BodyBuilder]);
                    return [4 /*yield*/, je.build({
                            body: null
                        })];
                case 1:
                    result = _a.sent();
                    assert_1.equal(result, '<body>null</body>');
                    return [2 /*return*/];
            }
        });
    }); });
});
