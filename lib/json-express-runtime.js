"use strict";
var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
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
var eventemitter3_1 = __importDefault(require("eventemitter3"));
var template_expression_1 = __importDefault(require("./template-expression"));
var JsonExpressRuntime = /** @class */ (function (_super) {
    __extends(JsonExpressRuntime, _super);
    function JsonExpressRuntime(handlerItems) {
        var _this = _super.call(this) || this;
        _this.handlerItems = [];
        _this.namedHandlerItems = {};
        _this.handlerItems = handlerItems;
        for (var _i = 0, handlerItems_1 = handlerItems; _i < handlerItems_1.length; _i++) {
            var item = handlerItems_1[_i];
            if (item.handler.name) {
                _this.namedHandlerItems[item.handler.name] = item;
            }
        }
        return _this;
    }
    JsonExpressRuntime.prototype.run = function (expression, context) {
        var _this = this;
        if (context === void 0) { context = {}; }
        try {
            this.buildExpression(expression, context, function (value, completed) {
                if (completed) {
                    _this.emit('completed', value);
                }
                else {
                    _this.emit('update', value);
                }
            }, 0, null);
        }
        catch (e) {
            this.emit('error', e);
        }
    };
    JsonExpressRuntime.prototype.buildExpression = function (expression, context, continuation, plainLevel, buildType) {
        if (buildType) {
            if (!this.buildByBuildType(expression, context, continuation, plainLevel, buildType)) {
                throw new Error('No matched type: ' + JSON.stringify(expression));
            }
        }
        else {
            this.buildAny(expression, context, continuation, plainLevel);
        }
    };
    JsonExpressRuntime.prototype.buildByBuildType = function (expression, context, continuation, plainLevel, buildType) {
        switch (buildType.type) {
            case '@tuple':
                if (!Array.isArray(expression) || expression.length !== buildType.children.length) {
                    return false;
                }
                this.buildTuple(expression, context, continuation, plainLevel, buildType.children);
                return true;
            case '@record':
                if (typeof expression !== 'object') {
                    return false;
                }
                this.buildRecord(expression, context, continuation, buildType.record);
                return true;
            case '@choice':
                for (var _i = 0, _a = buildType.children; _i < _a.length; _i++) {
                    var subType = _a[_i];
                    if (this.buildByBuildType(expression, context, continuation, plainLevel, subType)) {
                        return true;
                    }
                }
                return false;
            case 'string':
                if (typeof expression !== 'string') {
                    return false;
                }
                this.buildString(expression, context, continuation);
                return true;
            case 'array':
                if (!Array.isArray(expression)) {
                    return false;
                }
                this.buildArray(expression, context, continuation, plainLevel, buildType.children ? buildType.children[0] : null);
                return true;
            case 'number':
                if (typeof expression !== 'number') {
                    return false;
                }
                continuation(expression, true);
                return true;
            case 'boolean':
                if (typeof expression !== 'boolean') {
                    return false;
                }
                continuation(expression, true);
                return true;
            case 'null':
                if (expression !== null) {
                    return false;
                }
                continuation(expression, true);
                return true;
            case 'any':
                this.buildAny(expression, context, continuation, plainLevel);
                return true;
            default:
                var item = this.namedHandlerItems[buildType.type];
                if (!item || typeof item !== 'object') {
                    return false;
                }
                if (!item.matcher.test(expression)) {
                    return false;
                }
                this.buildWholeObject(expression, context, continuation, item);
                return true;
        }
    };
    JsonExpressRuntime.prototype.buildAny = function (expression, context, continuation, plainLevel) {
        if (typeof expression === 'string') {
            this.buildString(expression, context, continuation);
        }
        else if (Array.isArray(expression)) {
            this.buildArray(expression, context, continuation, plainLevel, null);
        }
        else if (typeof expression === 'object') {
            if (plainLevel === 0) {
                var item = this.getHandlerItem(expression);
                if (!item) {
                    throw new Error('No matched schema: ' + JSON.stringify(expression));
                }
                this.buildWholeObject(expression, context, continuation, item);
            }
            else {
                this.buildPlainObject(expression, context, continuation, plainLevel);
            }
        }
        else {
            continuation(expression, true);
        }
    };
    JsonExpressRuntime.prototype.buildString = function (expression, context, continuation) {
        var _this = this;
        template_expression_1.default
            .cache(expression, context)
            .then(function (r) { return continuation(r, true); })
            .catch(function (e) { return _this.emit('error', e); });
    };
    JsonExpressRuntime.prototype.buildArray = function (expression, context, continuation, plainLevel, buildType) {
        var nextPlainLevel = plainLevel > 0 ? plainLevel - 1 : plainLevel;
        var arr = [];
        var checker = new Array(expression.length).fill(false);
        var checkCount = 0;
        var completeCount = 0;
        var _loop_1 = function (i) {
            this_1.buildExpression(expression[i], context, function (v, completed) {
                arr[i] = v;
                if (!checker[i]) {
                    checker[i] = true;
                    checkCount++;
                }
                // callbacks that completed is set true will appear exactly once per each
                if (completed) {
                    completeCount++;
                }
                if (checkCount === checker.length) {
                    continuation(arr, completeCount === checkCount);
                }
            }, nextPlainLevel, buildType);
        };
        var this_1 = this;
        for (var i = 0; i < expression.length; i++) {
            _loop_1(i);
        }
    };
    JsonExpressRuntime.prototype.buildTuple = function (expression, context, continuation, plainLevel, buildTypes) {
        var nextPlainLevel = plainLevel > 0 ? plainLevel - 1 : plainLevel;
        var arr = [];
        var checker = new Array(expression.length).fill(false);
        var checkCount = 0;
        var completeCount = 0;
        var _loop_2 = function (i) {
            this_2.buildExpression(expression[i], context, function (v, completed) {
                arr[i] = v;
                if (!checker[i]) {
                    checker[i] = true;
                    checkCount++;
                }
                // callbacks that completed is set true will appear exactly once per each
                if (completed) {
                    completeCount++;
                }
                if (checkCount === checker.length) {
                    continuation(arr, completeCount === checkCount);
                }
            }, nextPlainLevel, buildTypes[i]);
        };
        var this_2 = this;
        for (var i = 0; i < expression.length; i++) {
            _loop_2(i);
        }
    };
    JsonExpressRuntime.prototype.buildWholeObject = function (expression, context, continuation, _a) {
        var _b;
        var _this = this;
        var handler = _a.handler, matcher = _a.matcher, typeChecker = _a.typeChecker;
        var rest = {};
        var target = matcher.restColumn ? (_b = {}, _b[matcher.restColumn.name] = rest, _b) : {};
        var keys = Object.keys(expression);
        var _loop_3 = function (key) {
            var v = expression[key];
            if (matcher.columns.some(function (col) { return col.name === key; })) {
                target[key] = v;
            }
            else {
                rest[key] = v;
            }
        };
        for (var _i = 0, keys_1 = keys; _i < keys_1.length; _i++) {
            var key = keys_1[_i];
            _loop_3(key);
        }
        var checker = new Set();
        var propertyNames = Object.keys(target);
        var completeCount = 0;
        var _loop_4 = function (key) {
            var column = matcher.schema[key];
            if (column.lazy) {
                var oldValue_1 = target[key];
                var thunk = function (lazyContext) { return __awaiter(_this, void 0, void 0, function () {
                    var _this = this;
                    return __generator(this, function (_a) {
                        return [2 /*return*/, new Promise(function (resolve) {
                                _this.buildExpression(oldValue_1, lazyContext, function (v, completed) {
                                    if (completed) {
                                        resolve(v);
                                    }
                                }, column.plainLevel, matcher.buildTypes[key]);
                            })];
                    });
                }); };
                target[key] = thunk;
                checker.add(key);
                completeCount++;
                if (checker.size === propertyNames.length) {
                    typeChecker(target);
                    this_3.buildObject(target, context, continuation, handler, checker.size === completeCount);
                }
            }
            else {
                this_3.buildExpression(target[key], context, function (v, completed) {
                    target[key] = v;
                    checker.add(key);
                    if (completed) {
                        completeCount++;
                    }
                    if (checker.size === propertyNames.length) {
                        typeChecker(target);
                        _this.buildObject(target, context, continuation, handler, checker.size === completeCount);
                    }
                }, column.plainLevel, matcher.buildTypes[key]);
            }
        };
        var this_3 = this;
        for (var _c = 0, propertyNames_1 = propertyNames; _c < propertyNames_1.length; _c++) {
            var key = propertyNames_1[_c];
            _loop_4(key);
        }
    };
    JsonExpressRuntime.prototype.buildRecord = function (expression, context, continuation, record) {
        var target = {};
        var checker = new Set();
        var propertyNames = Object.keys(expression);
        var completeCount = 0;
        for (var key in record) {
            if (!record[key].optional && key !== '...' && !(key in expression)) {
                throw new TypeError('No matched record type: ' + JSON.stringify(expression));
            }
        }
        var _loop_5 = function (key) {
            var buildType = null;
            if (!(key in record)) {
                if (!('...' in record)) {
                    throw new TypeError('No matched record type: ' + JSON.stringify(expression));
                }
                buildType = record['...'];
            }
            else {
                buildType = record[key];
            }
            this_4.buildExpression(expression[key], context, function (value, completed) {
                target[key] = value;
                checker.add(key);
                if (completed) {
                    completeCount++;
                }
                if (checker.size === propertyNames.length) {
                    var allCompleted = checker.size === completeCount;
                    continuation(target, allCompleted);
                }
            }, 0, buildType);
        };
        var this_4 = this;
        for (var _i = 0, propertyNames_2 = propertyNames; _i < propertyNames_2.length; _i++) {
            var key = propertyNames_2[_i];
            _loop_5(key);
        }
    };
    JsonExpressRuntime.prototype.buildPlainObject = function (expression, context, continuation, plainLevel) {
        var nextPlainLevel = plainLevel > 0 ? plainLevel - 1 : plainLevel;
        var target = {};
        var checker = new Set();
        var propertyNames = Object.keys(expression);
        var completeCount = 0;
        var _loop_6 = function (key) {
            this_5.buildAny(expression[key], context, function (v, completed) {
                target[key] = v;
                checker.add(key);
                if (completed) {
                    completeCount++;
                }
                if (checker.size === propertyNames.length) {
                    var allCompleted = checker.size === completeCount;
                    continuation(target, allCompleted);
                }
            }, nextPlainLevel);
        };
        var this_5 = this;
        for (var _i = 0, propertyNames_3 = propertyNames; _i < propertyNames_3.length; _i++) {
            var key = propertyNames_3[_i];
            _loop_6(key);
        }
    };
    JsonExpressRuntime.prototype.buildObject = function (expression, context, continuation, handler, allCompleted) {
        if ('placeholder' in handler) {
            continuation(handler.placeholder(expression), false);
        }
        var result = handler.build(expression, context);
        if (result instanceof Promise) {
            result.then(function (r) { return continuation(r, allCompleted); });
        }
        else {
            continuation(result, allCompleted);
        }
    };
    JsonExpressRuntime.prototype.getHandlerItem = function (expression) {
        var item = this.handlerItems.find(function (item) { return !item.handler.exclusive && item.matcher.test(expression); });
        return item;
    };
    return JsonExpressRuntime;
}(eventemitter3_1.default));
exports.default = JsonExpressRuntime;
