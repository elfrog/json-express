"use strict";
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
var md5_1 = __importDefault(require("md5"));
var template_expression_1 = __importDefault(require("./template-expression"));
var flat_schema_matcher_1 = __importDefault(require("./flat-schema-matcher"));
var JsonExpress = /** @class */ (function () {
    function JsonExpress(handlers) {
        if (handlers === void 0) { handlers = []; }
        var _this = this;
        this.handlerItems = [];
        handlers.forEach(function (handler) { return _this.addHandler(handler); });
    }
    JsonExpress.prototype.addHandler = function (handler) {
        var matcher = new flat_schema_matcher_1.default(handler.schema);
        var item = {
            matcher: matcher,
            handler: handler
        };
        if (this.handlerItems.some(function (p) { return p.matcher.schemaHash === matcher.schemaHash; })) {
            throw new Error('Duplicate schema: ' + matcher.toString());
        }
        // Sort by the number of columns in descending order
        // so the handler that has more constraints would be applied first.
        var i = 0;
        for (; i < this.handlerItems.length; i++) {
            if (this.handlerItems[i].matcher.columns.length < item.matcher.columns.length) {
                break;
            }
        }
        this.handlerItems.splice(i, 0, item);
    };
    JsonExpress.prototype.build = function (expression, context, cb) {
        if (context === void 0) { context = {}; }
        return __awaiter(this, void 0, void 0, function () {
            var _this = this;
            return __generator(this, function (_a) {
                return [2 /*return*/, new Promise(function (resolve) {
                        _this.buildExpression(expression, context, function (root) {
                            if (cb) {
                                cb(root);
                            }
                            resolve(root);
                        });
                    })];
            });
        });
    };
    JsonExpress.prototype.buildExpression = function (expression, context, cb) {
        var _this = this;
        if (context === void 0) { context = {}; }
        var _a;
        if (Array.isArray(expression)) {
            this.buildArray(expression, context, cb);
        }
        else if (typeof expression === 'string') {
            this.buildString(expression, context, cb);
        }
        else if (typeof expression === 'object') {
            var item_1 = this.getHandlerItem(expression);
            var rest = {};
            var target_1 = item_1.matcher.restColumn ? (_a = {}, _a[item_1.matcher.restColumn.name] = rest, _a) : {};
            var keys_2 = Object.keys(expression);
            var handleKeys = [];
            var checker_1 = new Set();
            for (var _i = 0, keys_1 = keys_2; _i < keys_1.length; _i++) {
                var key = keys_1[_i];
                var v = expression[key];
                if (key in item_1.matcher.schema) {
                    var column = item_1.matcher.schema[key];
                    if (column.unhandled) {
                        target_1[key] = v;
                        checker_1.add(key);
                    }
                    else {
                        handleKeys.push(key);
                    }
                }
                else {
                    rest[key] = v;
                    checker_1.add(key);
                }
            }
            if (handleKeys.length > 0) {
                var _loop_1 = function (key) {
                    this_1.buildExpression(expression[key], context, function (v) {
                        target_1[key] = v;
                        checker_1.add(key);
                        if (checker_1.size === keys_2.length) {
                            _this.buildObject(target_1, context, item_1.handler, cb);
                        }
                    });
                };
                var this_1 = this;
                for (var _b = 0, handleKeys_1 = handleKeys; _b < handleKeys_1.length; _b++) {
                    var key = handleKeys_1[_b];
                    _loop_1(key);
                }
            }
            else {
                this.buildObject(target_1, context, item_1.handler, cb);
            }
        }
        else {
            cb(expression);
        }
    };
    JsonExpress.prototype.buildArray = function (expression, context, cb) {
        var arr = [];
        var checker = new Array(expression.length).fill(false);
        var _loop_2 = function (i) {
            this_2.buildExpression(expression[i], context, function (v) {
                arr[i] = v;
                checker[i] = true;
                if (checker.every(function (ch) { return ch; })) {
                    cb(arr);
                }
            });
        };
        var this_2 = this;
        for (var i = 0; i < expression.length; i++) {
            _loop_2(i);
        }
    };
    JsonExpress.prototype.buildString = function (expression, context, cb) {
        var hash = md5_1.default(expression);
        var t = null;
        if (JsonExpress.templateCache.has(hash)) {
            t = JsonExpress.templateCache.get(hash);
        }
        else {
            t = new template_expression_1.default(expression);
            JsonExpress.templateCache.set(hash, t);
        }
        t.execute(context).then(cb);
    };
    JsonExpress.prototype.buildObject = function (target, context, handler, cb) {
        var _this = this;
        if ('placeholder' in handler) {
            cb(handler.placeholder(target));
        }
        if ('transform' in handler) {
            var childContext_1 = Object.assign({}, context);
            var result = handler.transform(target, childContext_1);
            if (result instanceof Promise) {
                result.then(function (v) { return _this.buildExpression(v, childContext_1, cb); });
            }
            else {
                this.buildExpression(result, childContext_1, cb);
            }
        }
        else {
            var result = handler.build(target, context);
            if (result instanceof Promise) {
                result.then(cb);
            }
            else {
                cb(result);
            }
        }
    };
    JsonExpress.prototype.getHandlerItem = function (expression) {
        var item = this.handlerItems.find(function (item) { return item.matcher.test(expression); });
        if (!item) {
            throw new Error('No matched schema: ' + JSON.stringify(expression));
        }
        return item;
    };
    JsonExpress.Template = template_expression_1.default;
    JsonExpress.templateCache = new Map();
    return JsonExpress;
}());
exports.default = JsonExpress;