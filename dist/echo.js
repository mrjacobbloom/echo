/** 
 * echo.js by Jacob Bloom
 * This software is provided as-is, yadda yadda yadda
 */
(function () {
  'use strict';

  var colorMode = 'browser';
  if (typeof process !== undefined) {
      try {
          if (process.stdout.isTTY && process.stdout.getColorDepth() >= 4) {
              colorMode = 'ansi';
          }
          else {
              colorMode = 'off';
          }
      }
      catch (_a) { }
  }
  var options = {
      colorMode: colorMode,
      bracketNotationOptional: true,
      constructorParensOptional: true,
      parensOptional: true,
      stringDelimiter: "'",
      theme: (typeof navigator !== 'undefined' && navigator.userAgent.includes('Firefox')) ? 'firefox' : 'chrome',
      autoLog: true,
      autoLogMinLength: 1,
  };

  /*! *****************************************************************************
  Copyright (c) Microsoft Corporation. All rights reserved.
  Licensed under the Apache License, Version 2.0 (the "License"); you may not use
  this file except in compliance with the License. You may obtain a copy of the
  License at http://www.apache.org/licenses/LICENSE-2.0

  THIS CODE IS PROVIDED ON AN *AS IS* BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
  KIND, EITHER EXPRESS OR IMPLIED, INCLUDING WITHOUT LIMITATION ANY IMPLIED
  WARRANTIES OR CONDITIONS OF TITLE, FITNESS FOR A PARTICULAR PURPOSE,
  MERCHANTABLITY OR NON-INFRINGEMENT.

  See the Apache Version 2.0 License for specific language governing permissions
  and limitations under the License.
  ***************************************************************************** */

  function __makeTemplateObject(cooked, raw) {
      if (Object.defineProperty) { Object.defineProperty(cooked, "raw", { value: raw }); } else { cooked.raw = raw; }
      return cooked;
  }

  var ECHO_INTERNALS = Symbol('ECHO_INTERNALS');
  var ECHO_SELF = Symbol('ECHO_SELF');

  var specialIdentTypes = new Map(Object.entries({
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
      var d = string.match('\n') ? '`' : options.stringDelimiter;
      var regexp = new RegExp(d, 'g');
      return d + string.replace(regexp, '\\' + d) + d;
  }
  /**
   * Determine whether the function was called as a template tag
   * @param {any[]} args Arguments list of the apply
   * @returns {boolean}
   */
  function calledAsTemplateTag(args) {
      return args[0] && Array.isArray(args[0]) && Array.isArray(args[0].raw);
  }
  /**
   * Tokenize a template literal from arguments to template tag
   * @param {any[]} args Arguments list of the apply
   * @returns {Token[]} Reconstructed literal, including backticks
   */
  function tokenizeTemplateLiteralFromTagArgs(_a) {
      var raw = _a[0].raw, args = _a.slice(1);
      var prevToken = { value: "`" + raw[0], type: 'string' };
      var tokens = [prevToken];
      for (var i = 0; i < args.length; i++) {
          prevToken.value += '${';
          tokens.push.apply(tokens, tokenizeValue(args[i]));
          prevToken = { value: "}" + raw[i + 1], type: 'string' };
          tokens.push(prevToken);
      }
      prevToken.value += '`';
      return tokens;
  }
  /**
   * Tags to generate tokens from template strings, and whitespace getter.
   */
  var T = {
      operator: function (_a) {
          var value = _a[0];
          return { value: value, type: 'operator' };
      },
      string: function (_a) {
          var value = _a[0];
          return { value: value, type: 'string' };
      },
      keyword: function (_a) {
          var value = _a[0];
          return { value: value, type: 'keyword' };
      },
      default: function (_a) {
          var value = _a[0];
          return { value: value, type: 'default' };
      },
      space: function () {
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
      var out = [];
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
                  var name = value.__proto__.name || value.constructor.name;
                  if (Array.isArray(value)) {
                      out.push.apply(out, [T.operator(templateObject_1 || (templateObject_1 = __makeTemplateObject(["["], ["["])))].concat(tokenizeArgumentsList(value), [T.operator(templateObject_2 || (templateObject_2 = __makeTemplateObject(["]"], ["]"])))]));
                  }
                  else if (name && name != 'Object') {
                      // in my experience this is almost always wrong, but closer than [object Object]
                      out.push({ value: name + " {}", type: 'object' });
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
      var out = [];
      args.forEach(function (arg, idx) {
          out.push.apply(out, tokenizeValue(arg));
          if (idx < args.length - 1)
              out.push(T.operator(templateObject_3 || (templateObject_3 = __makeTemplateObject([","], [","]))), T.space());
      });
      return out;
  }
  // Heuristic to determine if a property key is a valid identifier, or if we should use bracket notation
  // This is NOT spec-compliant: https://stackoverflow.com/a/9337047
  var identRegEx = /^[_$a-zA-Z][_$a-zA-Z0-9]*$/;
  /**
   * Render a given Echo into an array of Tokens (strings bundled with type info).
   * @param {Echo} Echo Echo to tokenize
   * @returns {Token[]} Token list.
   */
  function tokenizeEcho(Echo) {
      var stack = Echo[ECHO_INTERNALS].stack;
      var out = [];
      for (var i = 0; i < stack.length; i++) {
          var prevType = i > 0 ? stack[i - 1].type : '';
          var item = stack[i];
          switch (item.type) {
              case 'get': {
                  // determining types for property accesses is harder than argument lists since everything is stringified
                  if (!out.length) {
                      out = [{ value: item.identifier, type: 'variable' }];
                  }
                  else {
                      var identToken = void 0;
                      if (specialIdentTypes.has(item.identifier)) {
                          // it's a special identifier (like a keyword) with a hard-coded type
                          identToken = { value: item.identifier, type: specialIdentTypes.get(item.identifier) };
                      }
                      else if (!Number.isNaN(Number(item.identifier))) {
                          identToken = { value: item.identifier, type: 'number' };
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
                          out = [T.operator(templateObject_4 || (templateObject_4 = __makeTemplateObject(["("], ["("])))].concat(out, [T.operator(templateObject_5 || (templateObject_5 = __makeTemplateObject([")"], [")"])))]);
                      }
                      if (identToken.type === 'property') {
                          out = out.concat([T.operator(templateObject_6 || (templateObject_6 = __makeTemplateObject(["."], ["."]))), identToken]);
                      }
                      else {
                          out = out.concat([T.operator(templateObject_7 || (templateObject_7 = __makeTemplateObject(["["], ["["]))), identToken, T.operator(templateObject_8 || (templateObject_8 = __makeTemplateObject(["]"], ["]"])))]);
                      }
                  }
                  break;
              }
              case 'construct': {
                  // handle arguments list and whether parens are necessary at all
                  var args = [];
                  if (!options.constructorParensOptional || item.args.length) {
                      args = [T.operator(templateObject_9 || (templateObject_9 = __makeTemplateObject(["("], ["("])))].concat(tokenizeArgumentsList(item.args), [T.operator(templateObject_10 || (templateObject_10 = __makeTemplateObject([")"], [")"])))]);
                  }
                  // decide whether to wrap the constructor in parentheses for clarity
                  if (options.parensOptional && prevType !== 'apply') {
                      out = [T.keyword(templateObject_11 || (templateObject_11 = __makeTemplateObject(["new"], ["new"]))), T.space()].concat(out, args);
                  }
                  else {
                      out = [T.keyword(templateObject_12 || (templateObject_12 = __makeTemplateObject(["new"], ["new"]))), T.space(), T.operator(templateObject_13 || (templateObject_13 = __makeTemplateObject(["("], ["("])))].concat(out, [T.operator(templateObject_14 || (templateObject_14 = __makeTemplateObject([")"], [")"])))], args);
                  }
                  break;
              }
              case 'apply': {
                  if (calledAsTemplateTag(item.args)) {
                      out = out.concat(tokenizeTemplateLiteralFromTagArgs(item.args));
                  }
                  else {
                      if (!options.parensOptional || prevType === 'construct') {
                          out = [T.operator(templateObject_15 || (templateObject_15 = __makeTemplateObject(["("], ["("])))].concat(out, [T.operator(templateObject_16 || (templateObject_16 = __makeTemplateObject([")"], [")"]))), T.operator(templateObject_17 || (templateObject_17 = __makeTemplateObject(["("], ["("])))], tokenizeArgumentsList(item.args), [T.operator(templateObject_18 || (templateObject_18 = __makeTemplateObject([")"], [")"])))]);
                      }
                      else {
                          out = out.concat([T.operator(templateObject_19 || (templateObject_19 = __makeTemplateObject(["("], ["("])))], tokenizeArgumentsList(item.args), [T.operator(templateObject_20 || (templateObject_20 = __makeTemplateObject([")"], [")"])))]);
                      }
                  }
                  break;
              }
          }
      }
      return out;
  }
  var templateObject_1, templateObject_2, templateObject_3, templateObject_4, templateObject_5, templateObject_6, templateObject_7, templateObject_8, templateObject_9, templateObject_10, templateObject_11, templateObject_12, templateObject_13, templateObject_14, templateObject_15, templateObject_16, templateObject_17, templateObject_18, templateObject_19, templateObject_20;

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
          var prevStyle = void 0;
          for (var _i = 0, tokens_1 = tokens; _i < tokens_1.length; _i++) {
              var token = tokens_1[_i];
              var style = theme[token.type] || theme.default;
              if (style !== prevStyle) {
                  formatString += '%c';
                  styles.push(style);
              }
              formatString += token.value.replace(/%/g, '%%');
              prevStyle = style;
          }
          ret.formatted = [formatString].concat(styles);
      }
      else {
          var theme = THEMES[options.theme].ansi;
          var out = '';
          var prevColorCode = void 0;
          for (var _a = 0, tokens_2 = tokens; _a < tokens_2.length; _a++) {
              var token = tokens_2[_a];
              var colorCode = theme[token.type] || theme.default;
              if (colorCode !== prevColorCode)
                  out += colorCode;
              out += token.value;
              prevColorCode = colorCode;
          }
          out += '\x1b[0m'; // force reset
          ret.formatted = [out];
      }
      return ret;
  }

  var ignoreIdents = [
      // public interface
      'render', 'options', 'then', 'toString',
      // avoid breaking the console, or JavaScript altogether
      'valueOf', 'constructor', 'prototype', '__proto__'
  ];
  var symbolInspect = typeof process !== 'undefined' ? Symbol.for('nodejs.util.inspect.custom') : null;
  var handler = {
      get: function (target, identifier) {
          if (identifier === ECHO_SELF)
              return target;
          if (typeof identifier === 'symbol'
              || ignoreIdents.includes(identifier)) {
              if (identifier == 'options')
                  target[ECHO_INTERNALS].autoLogDisabled.value = true;
              return target[identifier];
          }
          target[ECHO_INTERNALS].stack.push({ type: 'get', identifier: String(identifier) });
          return target[ECHO_INTERNALS].proxy;
      },
      construct: function (target, args) {
          target[ECHO_INTERNALS].stack.push({ type: 'construct', args: args });
          return target[ECHO_INTERNALS].proxy;
      },
      apply: function (target, that, args) {
          target[ECHO_INTERNALS].stack.push({ type: 'apply', args: args });
          return target[ECHO_INTERNALS].proxy;
      },
  };
  function generateEcho(autoLogDisabled) {
      var Echo = function Echo() { }; // eslint-disable-line
      Echo[ECHO_INTERNALS] = {
          autoLogDisabled: autoLogDisabled,
          stack: [{ type: 'get', identifier: 'Echo' }],
          proxy: new Proxy(Echo, handler),
      };
      Echo.render = function (disableAutoLog) {
          if (disableAutoLog === void 0) { disableAutoLog = true; }
          if (disableAutoLog)
              autoLogDisabled.value = true;
          var t = tokenizeEcho(Echo);
          return prettyPrint(t);
      };
      //eslint-disable-next-line @typescript-eslint/explicit-function-return-type
      Echo.then = function () {
          var args = [];
          for (var _i = 0; _i < arguments.length; _i++) {
              args[_i] = arguments[_i];
          }
          return Promise.prototype.then.apply(Promise.resolve(Echo.render()), args);
      };
      Echo.toString = function () { return Echo.render().plaintext; };
      Echo[Symbol.toPrimitive] = function () { return Echo.render().plaintext; };
      if (symbolInspect) {
          Echo[symbolInspect] = function () { return Echo.render(false).formatted[0]; };
      }
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
      var global_ = typeof globalThis !== 'undefined' ? globalThis :
          typeof self !== 'undefined' ? self :
              typeof window !== 'undefined' ? window :
                  typeof global !== 'undefined' ? global : null;
      if (global_ === null)
          throw new Error('Unable to locate global object');
      Object.defineProperty(global_, property, { get: getter });
  }

  var autoLogDisabled = { value: false };
  var echoCount = 0;
  var maxTokensLength = 0;
  var formatted = [];
  attachToGlobal('Echo', function () {
      var Echo = generateEcho(autoLogDisabled);
      if (echoCount === 0)
          autoLogDisabled.value = false;
      if (options.autoLog) {
          echoCount++;
          setTimeout(function () {
              // deal with race between the whole expression and each of its sub-
              // expressions, as well as arguments that are other Echoes: just wait a
              // tick 'till they've all evaluated and use whichever stringified 
              // version is longest
              var prettyPrinted = Echo.render(false);
              if (prettyPrinted.tokens.length > maxTokensLength) {
                  maxTokensLength = prettyPrinted.tokens.length;
                  formatted = prettyPrinted.formatted;
              }
              echoCount--;
              if (echoCount === 0) {
                  if (maxTokensLength >= options.autoLogMinLength && !autoLogDisabled.value)
                      console.log.apply(console, formatted);
                  autoLogDisabled.value = false;
                  maxTokensLength = 0;
                  formatted = [];
              }
          }, 0);
      }
      return Echo[ECHO_INTERNALS].proxy;
  });

}());
