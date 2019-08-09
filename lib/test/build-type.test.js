"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
var assert_1 = require("assert");
var type_checker_generator_1 = __importDefault(require("../type-checker-generator"));
var build_type_1 = __importDefault(require("../build-type"));
describe('BuildType', function () {
    it('checkes primitive types', function () {
        var typeChecker = type_checker_generator_1.default({
            stringType: 'string',
            numberType: 'number',
            booleanType: 'boolean',
            arrayType: '(string | boolean)[]'
        });
        assert_1.doesNotThrow(function () {
            typeChecker({
                stringType: 'this is string',
                numberType: 12345,
                booleanType: true,
                arrayType: ['string', 'is', 'ok', true, false]
            });
        });
    });
    it('parses into BuildType', function () {
        var b1 = new build_type_1.default('string');
        var b2 = new build_type_1.default('{a: string, b: (number | boolean)}');
        var b3 = new build_type_1.default('{a: string, ...: any}');
        var b4 = new build_type_1.default('{a: string, b?: number}');
        assert_1.equal(b1.type, 'string');
        assert_1.equal(b2.type, '@record');
        assert_1.equal(b2.record.b.type, '@choice');
        assert_1.equal(b3.type, '@record');
        assert_1.equal(b3.record['...'].type, 'any');
        assert_1.equal(b4.type, '@record');
        assert_1.equal(b4.record.b.optional, true);
    });
});
