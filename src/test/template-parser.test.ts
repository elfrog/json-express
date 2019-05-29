import { deepEqual, throws } from 'assert';
import TemplateParser from '../template-parser';

describe('TemplateParser', function () {
  it('parses returning string', () => {
    const root = TemplateParser.parse('{=$test.name}');

    deepEqual(root, {
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

  it('parses template string', () => {
    const root = TemplateParser.parse('My name is {$test.name}.');

    deepEqual(root, {
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

  it('parses pipe expression', () => {
    const root = TemplateParser.parse('{=name | upperCase | stars 3 "*"}');

    deepEqual(root, {
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

  it('throws on invalid template string', () => {
    throws(() => {
      TemplateParser.parse('My name is {=$test.name}.');
    });

    throws(() => {
      TemplateParser.parse('My name is {$test.name');
    });

    throws(() => {
      TemplateParser.parse('My name is {name | upperCase "\\"}');
    });
  });
});
