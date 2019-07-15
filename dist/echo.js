/** 
 * echo.js by Jacob Bloom
 * This software is provided as-is, yadda yadda yadda
 */
(function () {
  'use strict';

  var options = {
      alwaysBracketNotation: false,
      constructorParensOptional: true,
      parensOptional: true,
      colorMode: typeof process === 'undefined' ? 'browser' : 'ansi',
      stringDelimiter: "'",
      theme: (typeof navigator !== 'undefined' && navigator.userAgent.includes('Firefox')) ? 'firefox' : 'chrome',
      output: 'log',
  };

  var specialIdentTypes = {
      'undefined': 'undefined',
      'null': 'null',
      'true': 'boolean',
      'false': 'boolean',
      'Infinity': 'keyword',
      '-Infinity': 'keyword',
      'NaN': 'keyword',
  };
  /**
   * Wrap a string in the selected delimiter and escape that delimiter in the string.
   * @param string String to escape
   * @param options
   */
  function escapeString(string) {
      var d = options.stringDelimiter;
      var regexp = new RegExp(d, 'g');
      return d + string.replace(regexp, '\\' + d) + d;
  }
  /**
   * Tokenize an arguments list
   * @param args
   * @param options
   */
  function handleArgs(args) {
      var out = [];
      args.forEach(function (arg, idx) {
          if (arg && arg._self) {
              out.push.apply(out, renderTokens(arg._self.stack));
          }
          else {
              if (typeof arg === 'string') {
                  out.push({ value: escapeString(arg), type: 'string' });
              }
              else if (typeof arg === 'function') {
                  if (arg.name) {
                      out.push({ value: arg.name, type: 'variable' });
                  }
                  else {
                      out.push({ value: String(arg), type: 'function' });
                  }
              }
              else if (typeof arg === 'object') {
                  // in my experience this is almost always wrong, but closer than [object Object]
                  if (arg) {
                      var name = arg.__proto__.name || arg.constructor.name;
                      if (name && name != 'Object') {
                          out.push({ value: name + " {}", type: 'object' });
                      }
                      else {
                          out.push({ value: '{}', type: 'object' });
                      }
                  }
                  else {
                      out.push({ value: 'null', type: 'null' });
                  }
              }
              else if (specialIdentTypes[arg]) {
                  out.push({ value: String(arg), type: specialIdentTypes[arg] });
              }
              else {
                  out.push({ value: String(arg), type: typeof arg });
              }
          }
          if (idx < args.length - 1)
              out.push(',', ' ');
      });
      return out;
  }
  // Heuristic to determine if a property key is a valid identifier, or if we should use bracket notation
  // This is NOT spec-compliant: https://stackoverflow.com/a/9337047
  var identRegEx = /^[_$a-zA-Z][_$a-zA-Z0-9]*$/;
  /**
   * Render a given Echo's stack into an array of Tokens (strings which may also
   * carry type information).
   * @param stack
   * @param options
   */
  function renderTokens(stack) {
      var out = [];
      for (var i = 0; i < stack.length; i++) {
          var prevType = i > 0 ? stack[i - 1].type : '';
          var item = stack[i];
          switch (item.type) {
              case 'get': {
                  // determining types for property accesses is harder than argument lists since eeverything is stringified
                  if (!out.length) {
                      out = [{ value: item.identifier, type: 'variable' }];
                  }
                  else if (specialIdentTypes[item.identifier]) {
                      // it's a special identifier (like a keyword) with a hard-coded type
                      out = out.concat(['[', { value: item.identifier, type: specialIdentTypes[item.identifier] }, ']']);
                  }
                  else if (!Number.isNaN(Number(item.identifier))) {
                      // it's a number
                      out = out.concat(['[', { value: item.identifier, type: 'number' }, ']']);
                  }
                  else if (options.alwaysBracketNotation || !identRegEx.test(item.identifier)) {
                      // it's a string and is either not a valid identifier or alwaysBracketNotation is on
                      out = out.concat(['[', { value: escapeString(item.identifier), type: 'string' }, ']']);
                  }
                  else if (options.parensOptional && prevType === 'get') {
                      // it's a valid identifier and heuristics say we don't need parentheses for clarity
                      out = out.concat(['.', { value: item.identifier, type: 'property' }]);
                  }
                  else {
                      // it's a valid identifier and we're using parentheses for clarity (or parensOptional is off)
                      out = ['('].concat(out, [')', '.', { value: item.identifier, type: 'property' }]);
                  }
                  break;
              }
              case 'construct': {
                  // handle arguments list and whether parens are necessary at all
                  var args = [];
                  if (!options.constructorParensOptional || item.args.length) {
                      args = ['('].concat(handleArgs(item.args), [')']);
                  }
                  // decide whether to wrap the constructor in parentheses for clarity
                  if (options.parensOptional && prevType === 'get' && !out.includes('(')) {
                      out = ['new', ' '].concat(out, args);
                  }
                  else {
                      out = ['new', ' ', '('].concat(out, [')'], args);
                  }
                  break;
              }
              case 'apply': {
                  out = out.concat(['('], handleArgs(item.args), [')']);
                  break;
              }
          }
      }
      return out;
  }

  var ANSI = {
      reset: "\x1b[0m",
      red: "\x1b[31m",
      green: "\x1b[32m",
      yellow: "\x1b[33m",
      blue: "\x1b[34m",
      magenta: "\x1b[35m",
      cyan: "\x1b[36m",
  };
  var THEMES = {
      // https://github.com/ChromeDevTools/devtools-frontend/blob/master/front_end/ui/inspectorSyntaxHighlight.css
      chrome: {
          browser: {
              'keyword': 'color: hsl(310, 86%, 36%)',
              'number': 'color: hsl(248, 100%, 41%)',
              'string': 'color: hsl(1, 80%, 43%)',
              'boolean': 'color: hsl(310, 86%, 36%)',
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
              'boolean': ANSI.magenta,
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
      var ret = {
          tokens: tokens,
          plaintext: tokens.map(function (token) { return typeof token === 'string' ? token : token.value; }).join(''),
          formatted: null,
      };
      if (options.colorMode === 'off') {
          ret.formatted = [ret.plaintext];
      }
      else if (options.colorMode === 'browser') {
          var theme = THEMES[options.theme].browser;
          var formatString = '';
          var styles = [];
          for (var _i = 0, tokens_1 = tokens; _i < tokens_1.length; _i++) {
              var token = tokens_1[_i];
              if (typeof token === 'string') {
                  formatString += '%c' + token;
                  switch (token) {
                      case 'new': {
                          styles.push(theme.keyword);
                          break;
                      }
                      case '.':
                      case ',': {
                          styles.push(theme.operator);
                          break;
                      }
                      default: {
                          styles.push(theme.default);
                          break;
                      }
                  }
              }
              else {
                  formatString += '%c' + token.value;
                  styles.push(theme[token.type] || theme.default);
              }
          }
          ret.formatted = [formatString].concat(styles);
      }
      else {
          var theme = THEMES[options.theme].ansi;
          var out = '';
          for (var _a = 0, tokens_2 = tokens; _a < tokens_2.length; _a++) {
              var token = tokens_2[_a];
              if (typeof token === 'string') {
                  switch (token) {
                      case 'new': {
                          out += theme.keyword + token;
                          break;
                      }
                      case '.':
                      case ',': {
                          out += theme.operator + token;
                          break;
                      }
                      default: {
                          out += theme.default + token;
                          break;
                      }
                  }
              }
              else {
                  out += (theme[token.type] || theme.default) + token.value;
              }
          }
          out += '\x1b[0m'; // force reset
          ret.formatted = [out];
      }
      return ret;
  }

  var ignoreIdents = [
      // internal / public interface
      'options', '_self',
      // to avoid breaking the console, or JavaScript altogether
      'toString', 'valueOf', 'constructor', 'prototype', '__proto__'
  ];
  var isNode = typeof process !== undefined;
  var symbolInspect;
  if (isNode) {
      try {
          symbolInspect = require('util').inspect.custom;
      }
      catch (_a) { }
  }
  var handler = {
      get: function (target, identifier) {
          if (typeof identifier === 'symbol'
              || ignoreIdents.includes(identifier)
              || target.options.output === 'promise' && identifier === 'then') {
              if (identifier == 'options')
                  target.stack = [];
              return target[identifier];
          }
          target.stack.push({ type: 'get', identifier: String(identifier) });
          return target.proxy;
      },
      construct: function (target, args) {
          target.stack.push({ type: 'construct', args: args });
          return target.proxy;
      },
      apply: function (target, that, args) {
          target.stack.push({ type: 'apply', args: args });
          return target.proxy;
      },
  };
  function generateEcho() {
      var Echo = function Echo() { };
      Echo.stack = [];
      Echo._self = Echo;
      Echo.render = null;
      Echo.toString = function () {
          if (options.output === 'toString') {
              return Echo.render().plaintext;
          }
          else {
              return '';
          }
      };
      var toPrimitiveOriginal = Echo[Symbol.toPrimitive];
      Object.defineProperty(Echo, Symbol.toPrimitive, {
          get: function () {
              if (options.output === 'toString') {
                  return function () { return Echo.render().plaintext; };
              }
              else {
                  return toPrimitiveOriginal;
              }
          }
      });
      if (isNode) {
          var inspectOriginal_1 = Echo[symbolInspect];
          Object.defineProperty(Echo, symbolInspect, {
              get: function () {
                  if (options.output === 'toString') {
                      return function () { return Echo.render().formatted[0]; };
                  }
                  else {
                      return inspectOriginal_1;
                  }
              }
          });
      }
      Object.defineProperty(Echo, 'then', {
          get: function () {
              if (options.output === 'promise') {
                  var p = Promise.resolve(Echo.render());
                  return p.then.bind(p);
              }
              else {
                  return undefined;
              }
          }
      });
      Echo.options = options;
      Echo.proxy = new Proxy(Echo, handler);
      return Echo;
  }

  /**
   * Attach a getter to a given property of the global object
   * @param property Property to attach to global
   * @param getter Getter function when that property is accessed
   */
  function attachToGlobal(property, getter) {
      var global_ = typeof globalThis !== 'undefined' ? globalThis :
          typeof self !== 'undefined' ? self :
              typeof window !== 'undefined' ? window :
                  typeof global !== 'undefined' ? global : null;
      if (global_ === null)
          throw new Error('Unable to locate global object');
      Object.defineProperty(global_, property, { get: getter });
  }

  var echoCount = 0;
  var tokens = [];
  attachToGlobal('Echo', function () {
      var Echo = generateEcho();
      Echo.stack.push({ type: 'get', identifier: 'Echo' });
      if (options.output === 'log') {
          echoCount++;
          setTimeout(function () {
              // deal with race between the whole expression and each of its sub-
              // expressions, as well as arguments that are other Echoes: just wait a
              // tick 'till they've all evaluated and use whichever stringified 
              // version is longest
              var t = renderTokens(Echo.stack);
              if (t.length > tokens.length)
                  tokens = t;
              echoCount--;
              if (echoCount === 0 && tokens.length > 0) {
                  var formatted = prettyPrint(tokens).formatted;
                  console.log.apply(console, formatted);
                  tokens = [];
              }
          }, 0);
      }
      else {
          Echo.render = function () {
              var t = renderTokens(Echo.stack);
              return prettyPrint(t);
          };
      }
      return Echo.proxy;
  });

}());
