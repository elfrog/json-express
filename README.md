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

The first argument of `je.build` is an expression that needs to be processed, and second argument is a context from where the builder searches the values of its given variables. The third argument is not shown above but it's a callback to be called when intermediate results and final result are processed.

`je.build` returns a promise that resolves when final result processed. Intermediate results are also processed if placeholders are there but only final result resolves.

### TemplateExpression

JsonExpress has a built-in string template system named TemplateExpression. So every string element parsed by JsonExpress will be processed within its context.

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

You can add your custom pipes by `JsonExpress.Template.addPipeHandler`.

```javascript
JsonExpress.Template.addPipeHandler("not", function (value) {
  return !value;
});
```

More arguments not only can be given, also it can be asynchronous.

```javascript
JsonExpress.Template.addPipeHandler("delay", async function (value, ms) {
  return Promise(function (resolve) {
    setTimeout(function () {
      resolve(value);
    }, ms);
  });
});
```

And there are built-in pipe handlers:

| Pipe Name    | Example                   |
---------------|----------------------------
| byte         | `{1024 | byte} -> "1kb"`    |
| percentage   | `{0.8 | percentage} -> "80%"` |
| currency     | `{1024 | currency} -> "1,024"` |
| byteLength   | `{"abc" | byteLength} -> 3` |
| pad          | `{32 | pad 5} -> "00032"`   |
| truncate     | `{"this is long" | truncate 5} -> "this…"` |
| upperCase    | `{"CamelCase" | upperCase} -> "CAMELCASE"` |
| lowerCase    | `{"CamelCase" | lowerCase} -> "camelcase"` |
| date         | `{"2019-07-30T10:50:12.049Z" | date "YYYY/MM/DD"} -> "2019/07/30"` |
| timeAgo      | `{"2019-07-30T10:50:12.049Z" | timeAgo} -> "today"` |

### Object Builder

The constructor of ``JsonExpress`` takes an array of builders.

The builder contains ``schema`` and ``build`` properties.
``schema`` property is an object that determines whether it can process or not. If the schema object matches the given JSON data, builder processes with its ``build`` callback. And ``build`` gets JSON data of which all properties are processed already.

And the builder can have optional ``placeholder`` callback. Actually, ``build`` callback can be async function, and instead of waiting for the async result, JsonExpress uses the result of ``placeholder``.

Thus, JsonExpress may return a result several times repeatedly because ``placeholder`` changes the result whenever async ``build`` returns. So you need to take the result from third argument of ``JsonExpress.build`` method:

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
    rest: true,
    required: false
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

#### Schema Column

A schema column is a property of a schema object and can have optional properties. 

There are three state of the object in the object building process. I call `the source` that is the very first object you give, and `the processed object` in which its properties are all processed by the building process but not itself, so it is a plain object yet. And lastly, `the built object` is the final output of the building process, but it can be a property value of another object if it is not the root.

| Property     | Description            |
---------------|-------------------------
| type         | Type checking is occured for the processed object not for the source. So it checks its type of the processed value at runtime. The `type` property accepts string by default though, you can customize the handling of type checking easily. |
| value        | The `value` property can be a RegExp or any primitive value like a string. It's for the source unlike the `type` property, so it can match to the proper builder. |
| plainLevel   | In the builder process, `plainLevel` suppresses the object building when `plainLevel` is not zero. Technically, it decreases each time the builder process get deepened into an array or an object until it reaches zero again. It's useful when to want the plain object, not the built object. If you want the deep-plain object then set its value as `-1`. |
| rest         | If it's `true` then it gathers the rest properties that are not declared explicitly in the schema and make it into one independent object. |
| required     | Set if this column is required. It's `true` by default. |
| lazy         | Instead of giving value directly, it gives an async function that will put the processed value to the place you want. Its lazy function accepts a context as an argument. Beware that if lazy is set `true`, don't set the `type` property since the lazy property always gives a function. So to say the lazy type checking is up to you. |

#### Type Check

At the first version of JsonExpress, the type of schema columns was evaluated in the schema matching. But it turns out that it's meaningless defining all the types as `any` in the end, since the type of the column value changes along with the buliding process.

So the `type` property becomes to use the runtime type checker like [typify][typify] that is the default type checker for JsonExpress. You can replace it with another type checker like [Ajv][ajv] or [Yup][yup] by assigning to `JsonExpress.typeCheckerGenerator`:

```javascript
import * as yup from 'yup';

JsonExpress.typeCheckerGenerator = function (types) {
  const validator = yup.object().shape(types);

  return function (target) {
    validator.validateSync(target);
  };
};
```

Are type checkings asynchronous, you can catch type errors and other asynchronous errors from the callback given by third argument of `JsonExpress.build` method:

```javascript
const je = new JsonExpress([...]);

je.build(expression, context, (value, completed, error) => {
  if (error) {
    ...
  } else {
    ...
  }
});
```

## License

Licensed under the [MIT](LICENSE.txt) license.

[sandbox]: https://codesandbox.io/s/jsonexpress-jr4eq
[typify]: https://github.com/phadej/typify
[ajv]: https://github.com/epoberezkin/ajv
[yup]: https://github.com/jquense/yup
