# Echo [![license](https://img.shields.io/npm/l/echo-proxy)](https://github.com/mrjacobbloom/echo/blob/master/LICENSE) [![Build Status](https://travis-ci.com/mrjacobbloom/echo.svg?branch=master)](https://travis-ci.com/mrjacobbloom/echo) [![npm](https://img.shields.io/npm/v/echo-proxy)](https://www.npmjs.com/package/echo-proxy)

Fun with proxies. Do any combination of calls, constructs, and dot-walks
starting with `Echo`, and an approximation of what you typed is logged to the
console (with syntax highlighting!) Play with it in your browser on
[RunKit](https://runkit.com/mrjacobbloom/play-with-echo/1.4.0/clone?results=false)!

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

_Requirements: Browsers released after 2018. Node 11 or newer._

### RunKit

The easiest way to play with Echo is in your browser on [RunKit](https://runkit.com/mrjacobbloom/play-with-echo/1.4.0/clone?results=false)!

### Browser

Another way to use Echo is to paste [`dist/echo.min.js`](https://raw.githubusercontent.com/mrjacobbloom/echo/master/dist/echo.min.js)
into your console (note: Echo is harmless, but you should always
[be careful about pasting code into your console!](https://en.wikipedia.org/wiki/Self-XSS)).

### Node

```shell
npm install echo-proxy
node --require echo-proxy
```

You can also import it into your code. Note that Echo attaches itself to the global,
so you don't actually want the import to be named Echo.

```javascript
// in ES module (package.json type=module)
import {} from 'echo-proxy';

// or in script (non-module)
require('echo-proxy');
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
  tokens: {value: string, type: string}[] -- The output broken up into typed "tokens," which is what Echo uses to do syntax highlighting.
  plaintext: string -- The tokens strung together without any syntax highlighting.
  formatted: string[] -- The tokens with syntax highlighting, formatted as arguments to console.log.
  theme: { [tokenType]: [colorString] } -- The "theme" object that maps "token types" to either ANSI colors or hsl colors (or null if options.colorMode='off').
}
```

### `Echo.print()`

_Example: `const value = Echo.foo(); value.print();`_

Logs the value to the console.

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
| `bracketNotationOptional` | Boolean | `true` | When true, use heuristics to decide when to use dot notation. Otherwise, always use square-bracket notation. |
| `parensOptional` | Boolean | `true` | When true, use heuristics to decide whether to wrap sub-expressions in parentheses. When false, always wrap them. |
| `constructorParensOptional` | Boolean | `true` | When true, drop parentheses for constructors with no arguments. |
| `stringDelimiter` | String | `"'"` | What character is used to delimit (bookend) strings, and is escaped from strings. If the string contains a newline, this is ignored and the string is rendered as a template string. |
| `colorMode` | `"browser"`, `"ansi"`, `"off"` | [auto detected] | Enable or disable syntax highlighting and the mode used to set colors. |
| `theme` | `"chrome"`, `"firefox"` | [auto detected] | Which DevTools' syntax highlighting theme to use. Defaults to Chrome unless you're using Firefox.
| `autoLog` | Boolean | `true` | When true, automatically console.log the output. See below. |
| `autoLogMinLength` | Number | `1` | The minimum number of tokens required to log to console. You can use this to avoid printing in some autocomplete situations. See below. |

#### The Auto-Logging Problem

When `Echo.options.autoLog=true`, the output is automatically logged to the
console. If you're in an environment with autocomplete (like Chrome console),
this mode may cause Echo to be logged several times as you type.

A little explanation of the way Echo's auto-logging works: it never knows if the
code has finished evaluating and if it's time to print the output. Here
are a couple examples to illustrate the problem:

- Consider the expression `Echo.foo.bar`. The sub-expression `Echo.foo` is completely evaluated before it looks for `.bar`. While this sub-expression is evaluating, all Echo knows is that the user tried to access `Echo.foo`, it can never tell if that getter is the last one in the chain or if there are more to come.
- Consider the expression `Echo(Echo.foo)`. We don't want to print the inner Echo on its own line, we want them both to appear in one line.

Echo circumvents this by using setTimeout to wait 1 tick. All the various Echoes
in your code calculate their outputs individually, and then the longest output
is printed.

This timeout process is skipped when you manually call `Echo.render()` or
`Echo.print()`. Instead of waiting a tick and logging, everything is handled
immediately.

So that's how auto-logging works. So why does your browser sometimes cause it to
print while you're typing? This happens when your browser tries to inspect the
Echo object to populate the console's autocomplete/intellisense system. From
Echo's perspective, this snooping looks the same as accessing values on it, so
it tries to render the output.

To mitigate the extra rendering, we have `Echo.options.autoLogMinLength`. This
says that any Echo output less than minLength items long shouldn't be printed.
