"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
var assert_1 = require("assert");
var template_parser_1 = __importDefault(require("../template-parser"));
describe('TemplateParser', function () {
    it('parses returning string', function () {
        var root = template_parser_1.default.parse('{=$test.name}');
        assert_1.deepEqual(root, {
            type: 'RETURNING_STRING',
            value: null,
            children: [{
                    type: 'EXPRESSION',
                    value: null,
                    children: [{
                            type: 'BINDING',
                            value: '$test',
                            children: [
                                {
                                    type: 'NAME',
                                    value: '$test',
                                    children: null
                                }, {
                                    type: 'NAME',
                                    value: 'name',
                                    children: null
                                }
                            ]
                        }]
                }]
        });
    });
    it('parses template string', function () {
        var root = template_parser_1.default.parse('My name is {$test.name}.');
        assert_1.deepEqual(root, {
            type: 'TEMPLATE_STRING',
            value: null,
            children: [
                {
                    type: 'TEXT',
                    value: 'My name is ',
                    children: null
                },
                {
                    type: 'EXPRESSION',
                    value: null,
                    children: [{
                            type: 'BINDING',
                            value: '$test',
                            children: [
                                {
                                    type: 'NAME',
                                    value: '$test',
                                    children: null
                                }, {
                                    type: 'NAME',
                                    value: 'name',
                                    children: null
                                }
                            ]
                        }]
                },
                {
                    type: 'TEXT',
                    value: '.',
                    children: null
                }
            ]
        });
    });
    it('parses pipe expression', function () {
        var root = template_parser_1.default.parse('{=name | upperCase | stars 3 "*"}');
        assert_1.deepEqual(root, {
            type: 'RETURNING_STRING',
            value: null,
            children: [{
                    type: 'EXPRESSION',
                    value: null,
                    children: [
                        {
                            type: 'BINDING',
                            value: 'name',
                            children: [
                                {
                                    type: 'NAME',
                                    value: 'name',
                                    children: null
                                }
                            ]
                        },
                        {
                            type: 'PIPE_EXPRESSION',
                            value: 'upperCase',
                            children: [
                                {
                                    type: 'NAME',
                                    value: 'upperCase',
                                    children: null
                                }
                            ]
                        },
                        {
                            type: 'PIPE_EXPRESSION',
                            value: 'stars',
                            children: [
                                {
                                    type: 'NAME',
                                    value: 'stars',
                                    children: null
                                },
                                {
                                    type: 'NUMBER',
                                    value: '3',
                                    children: null
                                },
                                {
                                    type: 'TEXT',
                                    value: '*',
                                    children: null
                                }
                            ]
                        }
                    ]
                }]
        });
    });
    it('throws on invalid template string', function () {
        assert_1.throws(function () {
            template_parser_1.default.parse('My name is {=$test.name}.');
        });
        assert_1.throws(function () {
            template_parser_1.default.parse('My name is {$test.name');
        });
        assert_1.throws(function () {
            template_parser_1.default.parse('My name is {name | upperCase "\\"}');
        });
    });
});
