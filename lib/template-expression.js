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
var template_parser_1 = __importDefault(require("./template-parser"));
var builtin_template_pipes_1 = __importDefault(require("./builtin-template-pipes"));
var TemplateExpressionProgram = /** @class */ (function () {
    function TemplateExpressionProgram() {
        this.instructions = [];
    }
    TemplateExpressionProgram.prototype.add = function (opcode, n, v) {
        if (n === void 0) { n = null; }
        if (v === void 0) { v = null; }
        this.instructions.push({ opcode: opcode, n: n, v: v });
    };
    TemplateExpressionProgram.prototype.addn = function (opcode, n) {
        this.instructions.push({ opcode: opcode, n: n });
    };
    TemplateExpressionProgram.prototype.addv = function (opcode, v) {
        this.instructions.push({ opcode: opcode, v: v });
    };
    return TemplateExpressionProgram;
}());
var TemplateExpression = /** @class */ (function () {
    function TemplateExpression(source) {
        var parsedRoot = template_parser_1.default.parse(source);
        this.source = source;
        this.program = TemplateExpression.compile(parsedRoot);
    }
    TemplateExpression.prototype.execute = function (context) {
        return __awaiter(this, void 0, void 0, function () {
            var instructions, stack, _i, instructions_1, instruction, _a, str, i, binding, v, i, args, v, pipeHandler, r, _b, _c, _d;
            return __generator(this, function (_e) {
                switch (_e.label) {
                    case 0:
                        instructions = this.program.instructions;
                        stack = [];
                        _i = 0, instructions_1 = instructions;
                        _e.label = 1;
                    case 1:
                        if (!(_i < instructions_1.length)) return [3 /*break*/, 12];
                        instruction = instructions_1[_i];
                        _a = instruction.opcode;
                        switch (_a) {
                            case 0 /* PUSH */: return [3 /*break*/, 2];
                            case 1 /* STRCONCAT */: return [3 /*break*/, 3];
                            case 2 /* FETCH */: return [3 /*break*/, 4];
                            case 3 /* PIPE */: return [3 /*break*/, 5];
                            case 4 /* END */: return [3 /*break*/, 9];
                        }
                        return [3 /*break*/, 10];
                    case 2:
                        {
                            stack.push(instruction.v);
                            return [3 /*break*/, 11];
                        }
                        _e.label = 3;
                    case 3:
                        {
                            str = '';
                            for (i = 0; i < instruction.n; i++) {
                                str = String(stack.pop()) + str;
                            }
                            stack.push(str);
                            return [3 /*break*/, 11];
                        }
                        _e.label = 4;
                    case 4:
                        {
                            binding = instruction.v;
                            v = context[binding[0]];
                            if (v === undefined) {
                                throw new Error('Undefined variable: ' + binding[0]);
                            }
                            for (i = 1; i < binding.length; i++) {
                                v = v[binding[i]];
                            }
                            stack.push(v);
                            return [3 /*break*/, 11];
                        }
                        _e.label = 5;
                    case 5:
                        args = stack.splice(stack.length - instruction.n, instruction.n);
                        v = stack.pop();
                        pipeHandler = TemplateExpression.pipeHandlers[instruction.v];
                        if (!pipeHandler) {
                            throw new Error('Undefined pipe handler: ' + instruction.v);
                        }
                        r = pipeHandler.apply(void 0, [v].concat(args));
                        _c = (_b = stack).push;
                        if (!(r instanceof Promise)) return [3 /*break*/, 7];
                        return [4 /*yield*/, r];
                    case 6:
                        _d = _e.sent();
                        return [3 /*break*/, 8];
                    case 7:
                        _d = r;
                        _e.label = 8;
                    case 8:
                        _c.apply(_b, [_d]);
                        return [3 /*break*/, 11];
                    case 9:
                        {
                            return [2 /*return*/, stack.pop()];
                        }
                        _e.label = 10;
                    case 10: throw new Error('Invalid instruction');
                    case 11:
                        _i++;
                        return [3 /*break*/, 1];
                    case 12: return [2 /*return*/, stack.pop()];
                }
            });
        });
    };
    TemplateExpression.compile = function (root) {
        var program = new TemplateExpressionProgram();
        if (root.type === "RETURNING_STRING" /* RETURNING_STRING */) {
            TemplateExpression.compileExpressionNode(root.children[0], program);
        }
        else {
            for (var _i = 0, _a = root.children; _i < _a.length; _i++) {
                var node = _a[_i];
                if (node.type === "TEXT" /* TEXT */ || node.type === "NUMBER" /* NUMBER */) {
                    program.addv(0 /* PUSH */, node.value);
                }
                else {
                    TemplateExpression.compileExpressionNode(node, program);
                }
            }
            if (root.children.length > 1) {
                program.addn(1 /* STRCONCAT */, root.children.length);
            }
        }
        program.add(4 /* END */);
        return program;
    };
    TemplateExpression.compileBindingNode = function (bindingNode, program) {
        program.addv(2 /* FETCH */, bindingNode.children.map(function (node) { return node.value; }));
    };
    TemplateExpression.compileExpressionNode = function (node, program) {
        TemplateExpression.compileBindingNode(node.children[0], program);
        for (var i = 1; i < node.children.length; i++) {
            var pipeNode = node.children[i];
            for (var j = 1; j < pipeNode.children.length; j++) {
                var argNode = pipeNode.children[j];
                if (argNode.type === "BINDING" /* BINDING */) {
                    TemplateExpression.compileBindingNode(argNode, program);
                }
                else {
                    program.addv(0 /* PUSH */, argNode.value);
                }
            }
            program.add(3 /* PIPE */, pipeNode.children.length - 1, pipeNode.value);
        }
    };
    TemplateExpression.addPipeHandler = function (name, handler) {
        TemplateExpression.pipeHandlers[name] = handler;
    };
    TemplateExpression.removePipeHandler = function (name) {
        if (name in TemplateExpression.pipeHandlers) {
            delete TemplateExpression.pipeHandlers[name];
        }
    };
    TemplateExpression.pipeHandlers = Object.assign({}, builtin_template_pipes_1.default);
    return TemplateExpression;
}());
exports.default = TemplateExpression;
