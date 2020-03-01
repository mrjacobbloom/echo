# Echo [![Build Status](https://travis-ci.com/mrjacobbloom/echo.svg?branch=master)](https://travis-ci.com/mrjacobbloom/echo)

Fun with proxies. Do any combination of calls, constructs, and dot-walks
starting with `Echo`, and an approximation of what you typed is logged to the
console (now with syntax highlighting)

![Demo of Echo in action](https://raw.githubusercontent.com/mrjacobbloom/echo/master/demo.gif)

```javascript
/* > */ Echo
/* < */ Echo

/* > */ new Echo.foo
/* < */ new Echo.foo

/* > */ new ((new Echo).bar.baz(1, Echo.qux, new Echo(7)))
/* < */ new ((new Echo).bar.baz(1, Echo.qux, new Echo(7)))

/* > */ Echo.gfdgfd[4][' fff '](undefined, true, -Infinity)
/* < */ Echo.gfdgfd[4][' fff '](undefined, true, -Infinity)

/* > */ Echo`foo${[1, 2, 3, 4]}bar`.baz
/* < */ Echo`foo${[1, 2, 3, 4]}bar`.baz
```

## Usage

### Browser

The easiest way to use Echo is to paste [`dist/echo.min.js`](https://raw.githubusercontent.com/mrjacobbloom/echo/master/dist/echo.min.js) into your console (note: Echo is harmless, but you should always [be careful about pasting code into your console!](https://en.wikipedia.org/wiki/Self-XSS)).

### Node

Echo requires Node 10.12 or later.

```shell
npm install echo # TODO: update this when we know what the package name is
node --require echo
```

You can also import it into your code. Note that Echo attaches itself to the global,
so you don't actually want the import to be named Echo.

```javascript
// in ES module
import {} from 'echo'; // todo: verify that this doesn't fail horribly

// or in script (non-module)
require('./echo.js');
```

## API

The public API gets special treatment, and is not echoed. This also goes for
JS-internal things like `__proto__` that lead to weird behavior when messed
with. The following builtin functions are overridden to return the stringified
Echo:

- `Echo.toString`
- `Echo[Symbol.toPrimitive]`
- `Echo[Symbol.for('nodejs.util.inspect.custom')]`

### `Echo.render()`

_Example: `const { tokens } = Echo.foo().render()`_

Returns an object with the following shape:

```
{
  tokens: {value: string, type: string}[] -- The output broken up into typed "tokens," which is what Echo uses to do syntax highlighting
  plaintext: string -- the tokens strung together without any syntax highlighting
  formatted: string[] -- the tokens with syntax highlighting, formatted as arguments to console.log
}
```

### `Echo.then(...)`

_Example: `const { tokens } = await Echo.foo()`_

Resolves to the value of `Echo.render()`.

### `Echo.options`

_Example: `Echo.options.theme = 'firefox'`_

Can be used to configure Echo. This includes options to make it reflect how you
would write code (for example, to always use parentheses with a constructor),
and options that affect its behavior in other ways.

| Property | Type/Options | Default | Explanation |
| -------- | ------- | ------- | ----------- |
| `bracketNotationOptional` | Boolean | `true` | When true, use heuristics to decide when to use dot notation. Otherwise, always use square-braket notation. |
| `parensOptional` | Boolean | `true` | When true, use heuristics to decide whether to wrap subexpressions in parentheses. When false, always wrap them. |
| `constructorParensOptional` | Boolean | `true` | When true, drop parentheses for constructors with no arguments. |
| `stringDelimiter` | String | `"'"` | What character is used to delimit (bookend) strings, and is escaped from strings. If the string contains a newline, this is ignored and the string is rendered as a template string. |
| `colorMode` | `"browser"`, `"ansi"`, `"off"` | [auto detected] | Enable or disable syntax highlighting and the mode used to set colors. |
| `theme` | `"chrome"`, `"firefox"` | [auto detected] | Which DevTools' syntax highlighting theme to use. Defaults to Chrome unless you're using Firefox.
| `autoLog` | Boolean | `true` | When true, automatically console.log the output. See below. |

#### `Echo.options.autoLog`

When autoLog is `true`, the output is automatically logged to the console. If
you're in an environment with autocomplete (like Chrome console), this mode may
cause Echo to be logged several times as you type.

This is because the way Echo's auto-logging works means it never knows if the
expression has finished evaluating and if it's time to print the output. Here
are a couple examples to illustrate the problem:

- Consider the expression `Echo.foo.bar`. The subexpression `Echo.foo` is completely evaluated before it looks for `.bar`. While this subexpression is evaluating, all Echo knows is that it's handled one get for `.foo`, it can never tell if that getter is the last one in the chain or if there are more to come.
- Consider the expression `Echo(Echo.foo)`. We don't want to print the inner Echo on its own line, we want them both to appear in one line.

Echo circumvents this by using setTimeout to wait 1 tick. Then, it prints the
longest token list found to the console. If a browser console's autocomplete
tries to inspect Echo as you type, it triggers this process.