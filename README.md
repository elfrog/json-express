# json-express
Parse JSON expression with string templates and transform it into another forms that can be a XML data, React component, etc.

## Install
    npm install json-express --save

## Example
See basic example on [CodeSandbox][sandbox].

## Usage
```javascript
import JsonExpress from 'json-express';

const je = new JsonExpress([]);

je.build('Hello, {name}!', { name: 'world' }).then(result => {
  console.log(result);
});
```

### TemplateExpression
JsonExpress has a built-in string template system named TemplateExpression. So every string element parsed by JsonExpress (if not marked as ``unhandled``) will be processed within its context.

You can get TemplateExpression object directly from ``JsonExpress.Template``. And don't forget its result will always be a Promise object.

TemplateExpression takes two types of expression: ReturningString and TemplateString.

ReturningString is to get expression result directly without converting it to string. ReturningString has only one form like ``"{=expresion}"``.

And TemplateString is to concatenate all its expression results into one string. TemplateString can include a number of template expressions with literal text like: ``"This is {expression1} and {expression2}"``.

#### Examples
```javascript
const context = {
  foo: 7,
  user: {
    name: 'Dongho',
    age: 29
  }
};
```

| Expression         | Result     |
---------------------|-------------
| ``"{=foo}"``       | 7          |
| ``"{=user.name}"``  | "Dongho"   |
| ``"Name: {user.name}, Age: {user.age}"`` | "Name: Dongho, Age: 29" |

#### Pipes
Pipes can be used with the template expressions and consume its result as an argument and return another result. Let's get an example:

```
"{=user.name | upperCase}"
```

The result would be: ``"DONGHO"``.

And pipes can be followed by another like this:

```
"{=user.name | upperCase | truncate 6}"
```

The result would be: ``"DON..."``

### Builder And Transformers
The constructor of ``JsonExpress`` takes a list of builder and transformers.

The builder contains ``schema`` and ``build`` properties.
``schema`` property is an object that determines whether it can process or not. If the schema object matches the given JSON data, builder processes with its ``build`` callback. And ``build`` gets JSON data of which all properties are processed already.

Similary, the transformer contains ``schema`` and ``transform`` properties.
``schema`` property is same as the builder's. But the result of ``transform`` callback will be processed again as if it's origianl JSON data. So the transformers are somewhat like macros or non-terminals.

And the builder and transformers can have optional ``placeholder`` callback. Actually, ``build`` and ``transform`` callbacks can be async function, and instead of waiting for the async result, JsonExpress uses the result of ``placeholder``.

Thus, JsonExpress may return a result several times repeatedly because ``placeholder`` changes the result whenever async ``build`` and ``transform`` return. So you need to take the result from third argument of ``JsonExpress.build`` method:

```javascript
const je = new JsonExpress([...]);

je.build(expression, {}, result => {
  doSomething(result);
});
```

### Schema
A schema object can be defined like below:

```javascript
{
  name: {
    type: 'string',
    value: 'Dongho'
  },
  age: {
    type: 'number',
    required: false
  },
  rest: {
    type: '...'
  }
}
```

And it matches:

```javascript
{
  name: 'Dongho',
  age: 29
}
```

```javascript
{
  name: 'Dongho',
  foo: true
}
```

Not matches:

```javascript
{
  name: 'Jonghyeon'
}
```

You can also use abbreviated forms:

```javascript
{
  name: '=Dongho',
  age: '?number',
  rest: '...'
}
```

The abbreviated form has three parts. First part can be omitted and is one of **^**, **?**, **^?** and it means **"unhandled"**, **"optional"**, **"unhandled and optional"**. Second part is type name that defaults to "any" if you omit it. Type name can be one of belows:

* string
* number
* integer
* boolean
* array
* object
* any
* null
* ...

And third part is a matching value preceded by **"="**. For now, it should match given value exactly same. It automatically converts the value according to its property type.

## License

Licensed under the [MIT](LICENSE.txt) license.

[sandbox]: https://codesandbox.io/s/jsonexpress-jr4eq
