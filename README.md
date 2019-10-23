Fun with proxies. Do any combination of calls, constructs, and dot-walks
starting with `Echo`, and an approximation of what you typed is logged to the
console (now with syntax highlighting)

![Demo of Echo in action](https://raw.githubusercontent.com/mrjacobbloom/echo/master/demo.gif)

## Usage

```javascript
// in ES module
import {} from './echo.js'; // attaches itself to the global, so you don't actually want the import to be named Echo
// or in Node <12.??
require('./echo.js');

/* > */ Echo
/* < */ Echo

/* > */ new Echo.foo
/* < */ new Echo.foo

/* > */ new ((new Echo).bar.baz(1, Echo.qux, new Echo(7)))
/* < */ new ((new Echo).bar.baz(1, Echo.qux, new Echo(7)))

/* > */ Echo.gfdgfd[4][' fff '](undefined, true, -Infinity)
/* < */ Echo.gfdgfd[4][' fff '](undefined, true, -Infinity)
```

## Options

Echo has a few options that can be configured in the `Echo.options` object:

| Property | Type/Options | Default | Explanation |
| -------- | ------- | ------- | ----------- |
| `alwaysBracketNotation` | Boolean | `false` | When true, always use bracket notation for gets. Otherwise, use heuristics to decide when to use dot notation. |
| `parensOptional` | Boolean | `true` | When true, use heuristics to decide whether to wrap subexpressions in parentheses. When false, always wrap them. |
| `constructorParensOptional` | Boolean | `true` | When true, drop parentheses for constructors with no arguments. |
| `stringDelimiter` | `"'"`, `"\""`, ``"`"`` | `"'"` | What character is used to delimit (bookend) strings, and is escaped from strings. |
| `colorMode` | `"browser"`, `"ansi"`, `"off"` | [auto detected] | Enable or disable syntax highlighting and the mode used to set colors. |
| `theme` | `"chrome"`, `"firefox"` | [auto detected] | Which DevTools' syntax highlighting theme to use. Defaults to Chrome unless you're using Firefox.
| `output` | `"log"`, `"toString"`, `"promise"` | `"log"` | Select the strategy for the output to be printed. See below. |

### `options.output`

The way Echo works means it never knows if the expresion has finished evaluating and if it's time to print the output. For example, in the expression `Echo.foo.bar`, all Echo knows is that it's been invoked 3 times, it can never tell if the invocation it's on is the last in the chain or if there are more to come. Its arguments may also be other Echoes, and we don't want to print their values on their own lines, we only want them to appear in the full output. Echo provides 3 strategies to work around this:

- `"log"` (default) - Echo uses setTimeout to wait 1 tick. Then, it prints the longest token list found to the console
- `"toString"` - As many stringifier functions as possible cast to the output. Chrome's console shows this stringified value, while Firefox's does not. This also makes the output usable from code via `String(...)`. Affected functions include:
  - `Echo.toString`
  - `Echo[Symbol.toPrimitive]`
  - `Echo[Symbol.for('nodejs.util.inspect.custom')]`
- `"promise"` - Echo becomes a thenable that resolves to an object with the following shape:

  ```
  {
    tokens: (string|{value: string, type: string})[] -- Strings which may or may not contain token type information, which is what Echo uses to do syntax highlighting
    plaintext: string -- the tokens strung together without any syntax highlighting
    formatted: string[] -- the tokens with syntax highlighting, formatted as arguments to the console
  }
  ```
