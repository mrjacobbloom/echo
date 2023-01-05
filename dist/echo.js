/** 
 * echo.js by Jacob Bloom
 * This software is provided as-is, yadda yadda yadda
 */
(function () {
  'use strict';

  let colorMode = 'browser';
  if (typeof process !== undefined) {
      try {
          if (process.stdout.isTTY && process.stdout.getColorDepth() >= 4) {
              colorMode = 'ansi';
          }
          else {
              colorMode = 'off';
          }
      }
      catch (e) { }
  }
  var options = {
      colorMode,
      bracketNotationOptional: true,
      constructorParensOptional: true,
      parensOptional: true,
      stringDelimiter: "'",
      theme: (typeof navigator !== 'undefined' && navigator.userAgent.includes('Firefox')) ? 'firefox' : 'chrome',
      autoLog: true,
      autoLogMinLength: 1,
  };

  const ECHO_INTERNALS = Symbol('ECHO_INTERNALS');
  const ECHO_SELF = Symbol('ECHO_SELF');

  const specialIdentTypes = new Map(Object.entries({
      'undefined': 'undefined',
      'null': 'null',
      'true': 'boolean',
      'false': 'boolean',
      'Infinity': 'keyword',
      '-Infinity': 'keyword',
      'NaN': 'keyword',
  }));
  /**
   * Wrap a string in the selected delimiter and escape that delimiter in the string.
   * @param {string} string String to escape
   * @returns {string} Escaped string, including delimiters.
   */
  function escapeString(string) {
      const d = string.match('\n') ? '`' : options.stringDelimiter;
      const regexp = new RegExp(d, 'g');
      return d + string.replace(regexp, '\\' + d) + d;
  }
  /**
   * Determine whether the function was called as a template tag
   * @param {any[]} args Arguments list of the apply
   * @returns {args is [TemplateStringsArray, ...any[]]}
   */
  function calledAsTemplateTag(args) {
      return args[0] && Array.isArray(args[0]) && Array.isArray(args[0].raw);
  }
  /**
   * Tokenize a template literal from arguments to template tag
   * @param {any[]} args Arguments list of the apply
   * @returns {Token[]} Reconstructed literal, including backticks
   */
  function tokenizeTemplateLiteralFromTagArgs([{ raw }, ...args]) {
      let prevToken = { value: `\`${raw[0]}`, type: 'string' };
      const tokens = [prevToken];
      for (let i = 0; i < args.length; i++) {
          prevToken.value += '${';
          tokens.push(...tokenizeValue(args[i]));
          prevToken = { value: `}${raw[i + 1]}`, type: 'string' };
          tokens.push(prevToken);
      }
      prevToken.value += '`';
      return tokens;
  }
  /**
   * Tags to generate tokens from template strings, and whitespace getter.
   */
  const T = {
      operator([value]) {
          return { value, type: 'operator' };
      },
      string([value]) {
          return { value, type: 'string' };
      },
      keyword([value]) {
          return { value, type: 'keyword' };
      },
      default([value]) {
          return { value, type: 'default' };
      },
      space() {
          return { value: ' ', type: 'default' };
      }
  };
  /**
   * Return the best-guess tokenized form of a JS value
   * @param value Value to tokenize
   * @returns {Token[]}
   */
  function tokenizeValue(value) {
      if (value && value[ECHO_SELF]) {
          return tokenizeEcho(value[ECHO_SELF]);
      }
      const out = [];
      switch (typeof value) {
          case 'string': {
              out.push({ value: escapeString(value), type: 'string' });
              break;
          }
          case 'function': {
              if (value.name) {
                  out.push({ value: value.name, type: 'variable' });
              }
              else {
                  out.push({ value: String(value), type: 'default' });
              }
              break;
          }
          case 'object': {
              if (value) {
                  const name = value.__proto__.name || value.constructor.name;
                  if (Array.isArray(value)) {
                      out.push(T.operator `[`, ...tokenizeArgumentsList(value), T.operator `]`);
                  }
                  else if (name && name != 'Object') {
                      // in my experience this is almost always wrong, but closer than [object Object]
                      out.push({ value: `${name} {}`, type: 'object' });
                  }
                  else {
                      out.push({ value: '{}', type: 'object' });
                  }
              }
              else {
                  out.push({ value: 'null', type: 'null' });
              }
              break;
          }
          case 'bigint': {
              out.push({ value: String(value) + 'n', type: 'number' });
              break;
          }
          default: {
              if (specialIdentTypes.has(String(value))) {
                  out.push({ value: String(value), type: specialIdentTypes.get(String(value)) });
              }
              else {
                  out.push({ value: String(value), type: typeof value });
              }
              break;
          }
      }
      return out;
  }
  /**
   * Tokenize an arguments list (i.e. Echo was applied or constructed)
   * @param args arguments list
   * @returns {Token[]}
   */
  function tokenizeArgumentsList(args) {
      const out = [];
      args.forEach((arg, idx) => {
          out.push(...tokenizeValue(arg));
          if (idx < args.length - 1)
              out.push(T.operator `,`, T.space());
      });
      return out;
  }
  // Attempt to parse as a stringified object, e.g. `[object Foo]`
  const stringifiedObjectRegex = /\[object ([^\]]+)\]/;
  // Heuristic to determine if a property key is a valid identifier, or if we should use bracket notation
  // This is NOT spec-compliant: https://stackoverflow.com/a/9337047
  const identRegEx = /^[_$a-zA-Z][_$a-zA-Z0-9]*$/;
  /**
   * Render a given Echo into an array of Tokens (strings bundled with type info).
   * @param {Echo} Echo Echo to tokenize
   * @returns {Token[]} Token list.
   */
  function tokenizeEcho(Echo) {
      const stack = Echo[ECHO_INTERNALS].stack;
      let out = [];
      for (let i = 0; i < stack.length; i++) {
          const prevType = i > 0 ? stack[i - 1].type : '';
          const item = stack[i];
          switch (item.type) {
              case 'get': {
                  // determining types for property accesses is harder than argument lists since everything is stringified
                  if (!out.length) {
                      out = [{ value: String(item.identifier), type: 'variable' }];
                  }
                  else if (typeof item.identifier === 'symbol') {
                      const description = item.identifier.description;
                      const symbolTokens = [{ value: 'Symbol', type: 'variable' }, T.operator `(`, { value: escapeString(description), type: 'string' }, T.operator `)`];
                      out = [...out, T.operator `[`, ...symbolTokens, T.operator `]`];
                  }
                  else {
                      let identToken;
                      if (specialIdentTypes.has(item.identifier)) {
                          // it's a special identifier (like a keyword) with a hard-coded type
                          identToken = { value: item.identifier, type: specialIdentTypes.get(item.identifier) };
                      }
                      else if (!item.identifier.trim()) {
                          identToken = { value: escapeString(item.identifier), type: 'string' };
                      }
                      else if (!Number.isNaN(Number(item.identifier))) {
                          identToken = { value: item.identifier, type: 'number' };
                      }
                      else if (stringifiedObjectRegex.test(item.identifier)) {
                          const [, name] = item.identifier.match(stringifiedObjectRegex);
                          if (name && name != 'Object') {
                              // in my experience this is almost always wrong, but closer than [object Object]
                              identToken = { value: `${name} {}`, type: 'object' };
                          }
                          else {
                              identToken = { value: '{}', type: 'object' };
                          }
                      }
                      else if (!options.bracketNotationOptional || !identRegEx.test(item.identifier)) {
                          // it's a string and is either not a valid identifier or bracketNotationOptional is off
                          identToken = { value: escapeString(item.identifier), type: 'string' };
                      }
                      else {
                          identToken = { value: item.identifier, type: 'property' };
                      }
                      // If !parensOptional or heuristics say we need parens, wrap prior stuff in parens
                      if (!options.parensOptional || prevType === 'construct') {
                          out = [T.operator `(`, ...out, T.operator `)`];
                      }
                      if (identToken.type === 'property') {
                          out = [...out, T.operator `.`, identToken];
                      }
                      else {
                          out = [...out, T.operator `[`, identToken, T.operator `]`];
                      }
                  }
                  break;
              }
              case 'construct': {
                  // handle arguments list and whether parens are necessary at all
                  let args = [];
                  if (!options.constructorParensOptional || item.args.length) {
                      args = [T.operator `(`, ...tokenizeArgumentsList(item.args), T.operator `)`];
                  }
                  // decide whether to wrap the constructor in parentheses for clarity
                  if (options.parensOptional && prevType !== 'apply') {
                      out = [T.keyword `new`, T.space(), ...out, ...args];
                  }
                  else {
                      out = [T.keyword `new`, T.space(), T.operator `(`, ...out, T.operator `)`, ...args];
                  }
                  break;
              }
              case 'apply': {
                  if (calledAsTemplateTag(item.args)) {
                      if (prevType === 'construct') {
                          out = [T.operator `(`, ...out, T.operator `)`, ...tokenizeTemplateLiteralFromTagArgs(item.args)];
                      }
                      else {
                          out = [...out, ...tokenizeTemplateLiteralFromTagArgs(item.args)];
                      }
                  }
                  else {
                      if (!options.parensOptional || prevType === 'construct') {
                          out = [T.operator `(`, ...out, T.operator `)`, T.operator `(`, ...tokenizeArgumentsList(item.args), T.operator `)`];
                      }
                      else {
                          out = [...out, T.operator `(`, ...tokenizeArgumentsList(item.args), T.operator `)`];
                      }
                  }
                  break;
              }
          }
      }
      return out;
  }

  const ANSI = {
      reset: "\x1b[0m",
      red: "\x1b[31m",
      green: "\x1b[32m",
      yellow: "\x1b[33m",
      blue: "\x1b[34m",
      magenta: "\x1b[35m",
      cyan: "\x1b[36m",
  };
  const THEMES = {
      // https://github.com/ChromeDevTools/devtools-frontend/blob/master/front_end/ui/inspectorSyntaxHighlight.css
      chrome: {
          browser: {
              'keyword': 'color: hsl(310, 86%, 36%)',
              'number': 'color: hsl(248, 100%, 41%)',
              'string': 'color: hsl(1, 80%, 43%)',
              'boolean': 'color: hsl(248, 100%, 41%)',
              'object': 'color: black',
              'null': 'color: hsl(310, 86%, 36%)',
              'undefined': 'color: hsl(310, 86%, 36%)',
              'operator': 'color: black',
              'variable': 'color: black',
              'property': 'color: black',
              'default': 'color: black',
          },
          ansi: {
              'keyword': ANSI.magenta,
              'number': ANSI.blue,
              'string': ANSI.red,
              'boolean': ANSI.blue,
              'object': ANSI.reset,
              'null': ANSI.magenta,
              'undefined': ANSI.magenta,
              'operator': ANSI.reset,
              'variable': ANSI.reset,
              'property': ANSI.reset,
              'default': ANSI.reset,
          },
      },
      // https://searchfox.org/mozilla-central/source/devtools/client/shared/sourceeditor/codemirror/lib/codemirror.css
      // https://searchfox.org/mozilla-central/source/devtools/client/themes/light-theme.css
      // https://searchfox.org/mozilla-central/source/devtools/client/themes/variables.css
      firefox: {
          browser: {
              'keyword': 'color: #dd00a9',
              'number': 'color: #30a',
              'string': 'color: #30a',
              'boolean': 'color: #dd00a9',
              'object': 'color: black',
              'null': 'color: #dd00a9',
              'undefined': 'color: #dd00a9',
              'operator': 'color: black',
              'variable': 'color: #8000d7',
              'property': 'color: #085;',
              'default': 'color: black',
          },
          ansi: {
              'keyword': ANSI.magenta,
              'number': ANSI.blue,
              'string': ANSI.blue,
              'boolean': ANSI.magenta,
              'object': ANSI.reset,
              'null': ANSI.magenta,
              'undefined': ANSI.magenta,
              'operator': ANSI.reset,
              'variable': ANSI.blue,
              'property': ANSI.green,
              'default': ANSI.reset,
          },
      },
  };

  /**
   * Converts an array of Tokens to the format specified by options.colorMode and
   * prints it.
   * @param tokens
   * @param options
   */
  function prettyPrint(tokens) {
      const ret = {
          tokens,
          plaintext: tokens.map(token => typeof token === 'string' ? token : token.value).join(''),
          formatted: null,
          theme: null,
      };
      if (options.colorMode === 'off') {
          ret.formatted = [ret.plaintext];
      }
      else if (options.colorMode === 'browser') {
          ret.theme = typeof options.theme === 'string' ? THEMES[options.theme].browser : options.theme;
          let formatString = '';
          const styles = [];
          let prevStyle;
          for (const token of tokens) {
              const style = ret.theme[token.type] || ret.theme.default || 'color: black';
              if (style !== prevStyle) {
                  formatString += '%c';
                  styles.push(style);
              }
              formatString += token.value.replace(/%/g, '%%');
              prevStyle = style;
          }
          ret.formatted = [formatString, ...styles];
      }
      else {
          ret.theme = typeof options.theme === 'string' ? THEMES[options.theme].ansi : options.theme;
          let out = '';
          let prevColorCode;
          for (const token of tokens) {
              const colorCode = ret.theme[token.type] || ret.theme.default || ANSI.reset;
              if (colorCode !== prevColorCode)
                  out += colorCode;
              out += token.value;
              prevColorCode = colorCode;
          }
          out += ANSI.reset; // force reset
          ret.formatted = [out];
      }
      return ret;
  }

  const ignoreIdents = [
      // public interface
      'render', 'options', 'then', 'print', 'toString', '__registerPublicGetter',
      // avoid breaking the console, or JavaScript altogether
      'valueOf', 'constructor', 'prototype', '__proto__', 'name',
      // symbols
      'Symbol(nodejs.util.inspect.custom)', 'Symbol(Symbol.toPrimitive)'
  ];
  const customPublicGetters = new Map();
  const symbolInspect = typeof process !== 'undefined' ? Symbol.for('nodejs.util.inspect.custom') : null;
  const handler = {
      get(target, identifier) {
          if (identifier === ECHO_SELF)
              return target;
          if (customPublicGetters.has(identifier)) {
              return customPublicGetters.get(identifier)(target);
          }
          if (ignoreIdents.includes(String(identifier))) {
              if (identifier == 'options')
                  target[ECHO_INTERNALS].autoLogDisabled.value = true;
              return target[identifier];
          }
          target[ECHO_INTERNALS].stack.push({ type: 'get', identifier });
          return target[ECHO_INTERNALS].proxy;
      },
      construct(target, args) {
          target[ECHO_INTERNALS].stack.push({ type: 'construct', args });
          return target[ECHO_INTERNALS].proxy;
      },
      apply(target, that, args) {
          target[ECHO_INTERNALS].stack.push({ type: 'apply', args });
          return target[ECHO_INTERNALS].proxy;
      },
      has(target, identifier) {
          return ignoreIdents.includes(String(identifier)) || customPublicGetters.has(identifier);
      },
      getOwnPropertyDescriptor(target, identifier) {
          if (identifier === 'name') {
              return { value: 'Echo', configurable: true };
          }
          else if (ignoreIdents.includes(String(identifier))) {
              return Object.getOwnPropertyDescriptor(target, identifier);
          }
          else if (customPublicGetters.has(identifier)) {
              return { value: customPublicGetters.get(identifier)(target), configurable: true };
          }
          return { value: null, configurable: true };
      },
      ownKeys(target) {
          return [...Reflect.ownKeys(target).filter((i) => i !== ECHO_INTERNALS), 'name'];
      }
  };
  function generateEcho(autoLogDisabled, id) {
      const Echo = function Echo() { }; // eslint-disable-line
      Echo[ECHO_INTERNALS] = {
          autoLogDisabled,
          stack: [{ type: 'get', identifier: 'Echo' }],
          proxy: new Proxy(Echo, handler),
          id
      };
      Echo.render = (disableAutoLog = true) => {
          if (disableAutoLog)
              autoLogDisabled.value = true;
          const t = tokenizeEcho(Echo);
          return prettyPrint(t);
      };
      Echo.print = () => console.log(...Echo.render().formatted);
      //eslint-disable-next-line @typescript-eslint/explicit-function-return-type
      Echo.then = (...args) => Promise.prototype.then.apply(Promise.resolve(Echo.render()), args);
      Echo.toString = () => Echo.render(id === 0).plaintext; // don't disable autoLog when being stringified in another Echo's get-brackets
      Echo[Symbol.toPrimitive] = Echo.toString;
      if (symbolInspect) {
          Echo[symbolInspect] = () => Echo.render(false).formatted[0];
      }
      Echo.__registerPublicGetter = (identifier, getter) => { customPublicGetters.set(identifier, getter); };
      Echo.options = options;
      delete Echo.__proto__;
      delete Echo.name;
      delete Echo.length;
      return Echo;
  }

  /**
   * Attach a getter to a given property of the global object
   * @param property Property to attach to global
   * @param getter Getter function when that property is accessed
   */
  function attachToGlobal(property, getter) {
      const global_ = typeof globalThis !== 'undefined' ? globalThis :
          typeof self !== 'undefined' ? self :
              typeof window !== 'undefined' ? window :
                  typeof global !== 'undefined' ? global : null;
      if (global_ === null)
          throw new Error('Unable to locate global object');
      Object.defineProperty(global_, property, { get: getter });
  }

  const autoLogDisabled = { value: false };
  let echoCount = 0;
  let maxTokensLength = 0;
  let formatted = [];
  attachToGlobal('Echo', () => {
      const Echo = generateEcho(autoLogDisabled, echoCount);
      if (echoCount === 0)
          autoLogDisabled.value = false;
      if (options.autoLog) {
          echoCount++;
          setTimeout(() => {
              // deal with race between the whole expression and each of its sub-
              // expressions, as well as arguments that are other Echoes: just wait a
              // tick 'till they've all evaluated and use whichever stringified 
              // version is longest
              const prettyPrinted = Echo.render(false);
              if (prettyPrinted.tokens.length > maxTokensLength) {
                  maxTokensLength = prettyPrinted.tokens.length;
                  formatted = prettyPrinted.formatted;
              }
              echoCount--;
              if (echoCount === 0) {
                  if (maxTokensLength >= options.autoLogMinLength && !autoLogDisabled.value)
                      console.log(...formatted);
                  autoLogDisabled.value = false;
                  maxTokensLength = 0;
                  formatted = [];
              }
          }, 0);
      }
      return Echo[ECHO_INTERNALS].proxy;
  });

}());
