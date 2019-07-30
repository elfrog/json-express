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
var typify_1 = __importDefault(require("typify"));
var eventemitter3_1 = __importDefault(require("eventemitter3"));
var template_expression_1 = __importDefault(require("./template-expression"));
var flat_schema_matcher_1 = __importDefault(require("./flat-schema-matcher"));
function defaultTypeCheckerGenerator(types) {
    var keys = Object.keys(types);
    var typeDecl = '{' + keys.map(function (key) { return key + ':' + types[key]; }).join(',') + '}';
    return function (target) {
        if (!typify_1.default.check(typeDecl, target)) {
            throw new TypeError(JSON.stringify(target) + " is not matched to " + typeDecl);
        }
    };
}
var JsonExpressRuntime = /** @class */ (function (_super) {
    __extends(JsonExpressRuntime, _super);
    function JsonExpressRuntime(handlerItems) {
        var _this = _super.call(this) || this;
        _this.handlerItems = [];
        _this.handlerItems = handlerItems;
        return _this;
    }
    JsonExpressRuntime.prototype.run = function (expression, context) {
        var _this = this;
        this.buildExpression(expression, context, function (value, completed) {
            if (completed) {
                _this.emit('completed', value);
            }
            else {
                _this.emit('update', value);
            }
        });
    };
    JsonExpressRuntime.prototype.buildExpression = function (expression, context, cb, plainLevel) {
        var _this = this;
        if (plainLevel === void 0) { plainLevel = 0; }
        if (typeof expression === 'string') {
            JsonExpress
                .template(expression, context)
                .then(function (r) { return cb(r, true); })
                .catch(function (e) { return _this.emitError(e); });
        }
        else if (Array.isArray(expression)) {
            this.buildArray(expression, context, cb, plainLevel);
        }
        else if (typeof expression === 'object') {
            if (plainLevel === 0) {
                this.buildWholeObject(expression, context, cb);
            }
            else {
                this.buildPlainObject(expression, context, cb, plainLevel);
            }
        }
        else {
            cb(expression, true);
        }
    };
    JsonExpressRuntime.prototype.buildArray = function (expression, context, cb, plainLevel) {
        if (context === void 0) { context = {}; }
        if (plainLevel === void 0) { plainLevel = 0; }
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
                    cb(arr, completeCount === checkCount);
                }
            }, nextPlainLevel);
        };
        var this_1 = this;
        for (var i = 0; i < expression.length; i++) {
            _loop_1(i);
        }
    };
    JsonExpressRuntime.prototype.buildWholeObject = function (expression, context, cb) {
        var _a;
        var _this = this;
        if (context === void 0) { context = {}; }
        var _b = this.getHandlerItem(expression), handler = _b.handler, matcher = _b.matcher, typeChecker = _b.typeChecker;
        var rest = {};
        var target = matcher.restColumn ? (_a = {}, _a[matcher.restColumn.name] = rest, _a) : {};
        var keys = Object.keys(expression);
        var _loop_2 = function (key) {
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
            _loop_2(key);
        }
        var checker = new Set();
        var propertyNames = Object.keys(target);
        var completeCount = 0;
        var _loop_3 = function (key) {
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
                                }, column.plainLevel);
                            })];
                    });
                }); };
                target[key] = thunk;
                checker.add(key);
                completeCount++;
                if (checker.size === propertyNames.length) {
                    var allCompleted = checker.size === completeCount;
                    this_2.buildObjectWithTypeCheck(target, context, handler, typeChecker, allCompleted, cb);
                }
            }
            else {
                this_2.buildExpression(target[key], context, function (v, completed) {
                    target[key] = v;
                    checker.add(key);
                    if (completed) {
                        completeCount++;
                    }
                    if (checker.size === propertyNames.length) {
                        var allCompleted = checker.size === completeCount;
                        _this.buildObjectWithTypeCheck(target, context, handler, typeChecker, allCompleted, cb);
                    }
                }, column.plainLevel);
            }
        };
        var this_2 = this;
        for (var _c = 0, propertyNames_1 = propertyNames; _c < propertyNames_1.length; _c++) {
            var key = propertyNames_1[_c];
            _loop_3(key);
        }
    };
    JsonExpressRuntime.prototype.buildPlainObject = function (expression, context, cb, plainLevel) {
        if (context === void 0) { context = {}; }
        if (plainLevel === void 0) { plainLevel = 0; }
        var nextPlainLevel = plainLevel > 0 ? plainLevel - 1 : plainLevel;
        var target = {};
        var checker = new Set();
        var propertyNames = Object.keys(expression);
        var completeCount = 0;
        var _loop_4 = function (key) {
            this_3.buildExpression(expression[key], context, function (v, completed) {
                target[key] = v;
                checker.add(key);
                if (completed) {
                    completeCount++;
                }
                if (checker.size === propertyNames.length) {
                    var allCompleted = checker.size === completeCount;
                    cb(target, allCompleted);
                }
            }, nextPlainLevel);
        };
        var this_3 = this;
        for (var _i = 0, propertyNames_2 = propertyNames; _i < propertyNames_2.length; _i++) {
            var key = propertyNames_2[_i];
            _loop_4(key);
        }
    };
    JsonExpressRuntime.prototype.buildObjectWithTypeCheck = function (target, context, handler, typeChecker, allCompleted, cb) {
        try {
            typeChecker(target);
        }
        catch (e) {
            this.emitError(e);
            return;
        }
        if ('placeholder' in handler) {
            cb(handler.placeholder(target), false);
        }
        var result = handler.build(target, context);
        if (result instanceof Promise) {
            result.then(function (r) { return cb(r, allCompleted); });
        }
        else {
            cb(result, allCompleted);
        }
    };
    JsonExpressRuntime.prototype.getHandlerItem = function (expression) {
        var item = this.handlerItems.find(function (item) { return item.matcher.test(expression); });
        if (!item) {
            throw new Error('No matched schema: ' + JSON.stringify(expression));
        }
        return item;
    };
    JsonExpressRuntime.prototype.emitError = function (e) {
        this.emit('error', e);
    };
    return JsonExpressRuntime;
}(eventemitter3_1.default));
var JsonExpress = /** @class */ (function () {
    function JsonExpress(handlers) {
        var _this = this;
        if (handlers === void 0) { handlers = []; }
        this.handlerItems = [];
        this._typeCheckerGenerator = defaultTypeCheckerGenerator;
        handlers.forEach(function (handler) { return _this.addHandler(handler); });
    }
    Object.defineProperty(JsonExpress.prototype, "typeCheckerGenerator", {
        get: function () {
            return this._typeCheckerGenerator;
        },
        set: function (gen) {
            var _this = this;
            this._typeCheckerGenerator = gen;
            this.handlerItems = this.handlerItems.map(function (item) { return (__assign({}, item, { typeChecker: _this.generateTypeChecker(item.matcher.types) })); });
        },
        enumerable: true,
        configurable: true
    });
    JsonExpress.prototype.generateTypeChecker = function (types) {
        if (!types || Object.keys(types).length === 0) {
            return function () { };
        }
        if (this._typeCheckerGenerator) {
            return this._typeCheckerGenerator(types);
        }
        return function () { };
    };
    JsonExpress.prototype.addHandler = function (handler) {
        var matcher = new flat_schema_matcher_1.default(handler.schema);
        if (this.handlerItems.some(function (p) { return p.matcher.schemaHash === matcher.schemaHash; })) {
            throw new Error('Duplicate schema ' + ': ' + matcher.toString());
        }
        var item = {
            matcher: matcher,
            handler: handler,
            typeChecker: this.generateTypeChecker(matcher.types)
        };
        // Sort by the number of columns in descending order
        // so the handler that has more constraints would be applied first.
        var i = 0;
        for (; i < this.handlerItems.length; i++) {
            var p = Object.keys(this.handlerItems[i].matcher.schema).length;
            var q = Object.keys(item.matcher.schema).length;
            if (p < q) {
                break;
            }
        }
        this.handlerItems.splice(i, 0, item);
    };
    JsonExpress.prototype.build = function (expression, context, cb) {
        var _this = this;
        if (context === void 0) { context = {}; }
        return new Promise(function (resolve, reject) {
            var runtime = new JsonExpressRuntime(_this.handlerItems);
            // When some error occurs, all processes will stop and the callback will be called only once with the promise rejection.
            runtime.on('error', function (e) {
                if (cb) {
                    cb(null, false, e);
                }
                reject(e);
            });
            // resolves when completed (when no placeholder founds)
            runtime.on('completed', function (value) {
                if (cb) {
                    cb(value, true, null);
                }
                resolve(value);
            });
            runtime.on('update', function (value) {
                if (cb) {
                    cb(value, false, null);
                }
            });
            runtime.run(expression, context);
        });
    };
    JsonExpress.template = function (expression, context) {
        if (context === void 0) { context = {}; }
        return __awaiter(this, void 0, void 0, function () {
            var hash, t;
            return __generator(this, function (_a) {
                hash = md5_1.default(expression);
                t = null;
                if (JsonExpress.templateCache.has(hash)) {
                    t = JsonExpress.templateCache.get(hash);
                }
                else {
                    t = new template_expression_1.default(expression);
                    JsonExpress.templateCache.set(hash, t);
                }
                return [2 /*return*/, t.execute(context)];
            });
        });
    };
    JsonExpress.Template = template_expression_1.default;
    JsonExpress.templateCache = new Map();
    return JsonExpress;
}());
exports.default = JsonExpress;
