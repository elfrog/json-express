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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
var template_expression_1 = __importDefault(require("./template-expression"));
var flat_schema_matcher_1 = __importDefault(require("./flat-schema-matcher"));
var json_express_runtime_1 = __importDefault(require("./json-express-runtime"));
var type_checker_generator_1 = __importDefault(require("./type-checker-generator"));
// To check name mangling
var AnonymousClass = /** @class */ (function () {
    function AnonymousClass() {
    }
    AnonymousClass.prototype.foo = function () {
        return 'bar';
    };
    return AnonymousClass;
}());
var JsonExpress = /** @class */ (function () {
    function JsonExpress(handlers) {
        var _this = this;
        if (handlers === void 0) { handlers = []; }
        this.handlerItems = [];
        this._typeCheckerGenerator = type_checker_generator_1.default;
        handlers.forEach(function (handler) { return _this.addHandler(handler); });
    }
    Object.defineProperty(JsonExpress.prototype, "typeCheckerGenerator", {
        get: function () {
            return this._typeCheckerGenerator;
        },
        set: function (gen) {
            var _this = this;
            this._typeCheckerGenerator = gen;
            this.handlerItems = this.handlerItems.map(function (item) { return (__assign(__assign({}, item), { typeCheckers: _this.generateTypeCheckers(item.matcher.types) })); });
        },
        enumerable: false,
        configurable: true
    });
    JsonExpress.prototype.generateTypeCheckers = function (types) {
        if (!types || Object.keys(types).length === 0) {
            return {};
        }
        var typeCheckers = {};
        if (this._typeCheckerGenerator) {
            for (var key in types) {
                typeCheckers[key] = this._typeCheckerGenerator(types[key]);
            }
        }
        return typeCheckers;
    };
    JsonExpress.prototype.addHandler = function (handler) {
        var matcher = new flat_schema_matcher_1.default(handler.schema);
        var handlerName = handler.name === AnonymousClass.name ? null : handler.name;
        if (handlerName && this.handlerItems.some(function (p) { return p.handlerName === handlerName; })) {
            throw new Error('Duplicate schema name: ' + handlerName);
        }
        if (this.handlerItems.some(function (p) { return p.matcher.schemaHash === matcher.schemaHash; })) {
            throw new Error('Duplicate schema: ' + matcher.toString());
        }
        var item = {
            handlerName: handlerName,
            matcher: matcher,
            handler: handler,
            typeCheckers: this.generateTypeCheckers(matcher.types)
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
            var runtime = new json_express_runtime_1.default(_this.handlerItems);
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
    JsonExpress.Template = template_expression_1.default;
    return JsonExpress;
}());
exports.default = JsonExpress;
