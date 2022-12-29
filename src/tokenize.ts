import options from './options';
import { ECHO_SELF, ECHO_INTERNALS } from './symbols';

const specialIdentTypes = new Map<string, TokenType>(Object.entries({
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
function escapeString(string: string): string {
  const d = string.match('\n') ? '`' : options.stringDelimiter;
  const regexp = new RegExp(d, 'g');
  return d + string.replace(regexp, '\\' + d) + d;
}

/**
 * Determine whether the function was called as a template tag
 * @param {any[]} args Arguments list of the apply
 * @returns {args is [TemplateStringsArray, ...any[]]}
 */
function calledAsTemplateTag(args: any[]): args is [TemplateStringsArray, ...any[]] {
  return args[0] && Array.isArray(args[0]) && Array.isArray((args[0] as any).raw);
}

/**
 * Tokenize a template literal from arguments to template tag
 * @param {any[]} args Arguments list of the apply
 * @returns {Token[]} Reconstructed literal, including backticks
 */
function tokenizeTemplateLiteralFromTagArgs([{raw}, ...args]: [TemplateStringsArray, ...any[]]): Token[] {
  let prevToken: Token = { value: `\`${raw[0]}`, type: 'string' };
  const tokens: Token[] = [prevToken];
  for(let i = 0; i < args.length; i++) {
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
  operator([value]: TemplateStringsArray): Token {
    return { value, type: 'operator' };
  },
  string([value]: TemplateStringsArray): Token {
    return { value, type: 'string' };
  },
  keyword([value]: TemplateStringsArray): Token {
    return { value, type: 'keyword' };
  },
  default([value]: TemplateStringsArray): Token {
    return { value, type: 'default' };
  },
  space(): Token {
    return { value: ' ', type: 'default' };
  }
}

/**
 * Return the best-guess tokenized form of a JS value
 * @param value Value to tokenize
 * @returns {Token[]}
 */
function tokenizeValue(value: any): Token[] {
  if(value && value[ECHO_SELF]) {
    return tokenizeEcho(value[ECHO_SELF]);
  }
  const out: Token[] = [];
  switch(typeof value) {
    case 'string': {
      out.push({value: escapeString(value), type: 'string'});
      break;
    }
    case 'function': {
      if(value.name) {
        out.push({value: value.name, type: 'variable'});
      } else {
        out.push({value: String(value), type: 'default'});
      }
      break;
    }
    case 'object': {
      if(value) {
        const name = value.__proto__.name || value.constructor.name;
        if (Array.isArray(value)) {
          out.push(T.operator`[`, ...tokenizeArgumentsList(value), T.operator`]`)
        } else if(name && name != 'Object') {
          // in my experience this is almost always wrong, but closer than [object Object]
          out.push({value: `${name} {}`, type: 'object'});
        } else {
          out.push({value: '{}', type: 'object'});
        }
      } else {
        out.push({value: 'null', type: 'null'});
      }
      break;
    }
    case 'bigint': {
      out.push({value: String(value) + 'n', type: 'number'});
      break;
    }
    default: {
      if(specialIdentTypes.has(String(value))) {
        out.push({value: String(value), type: specialIdentTypes.get(String(value))});
      } else {
        out.push({value: String(value), type: typeof value as TokenType});
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
function tokenizeArgumentsList(args: any[]): Token[] {
  const out: Token[] = [];
  args.forEach((arg, idx) => {
    out.push(...tokenizeValue(arg));
    if(idx < args.length - 1) out.push(T.operator`,`, T.space());
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
export function tokenizeEcho(Echo: Echo): Token[] {
  const stack = Echo[ECHO_INTERNALS].stack;
  let out: Token[] = [];
  for(let i = 0; i < stack.length; i++) {
    const prevType = i > 0 ? stack[i - 1].type : '';
    const item = stack[i];
    switch(item.type) {
      case 'get': {
        // determining types for property accesses is harder than argument lists since everything is stringified
        if(!out.length) {
          out = [{value: String(item.identifier), type: 'variable'}];
        } else if (typeof item.identifier === 'symbol') {
          const description = item.identifier.description;
          const symbolTokens: Token[] = [{ value: 'Symbol', type: 'variable' }, T.operator`(`, { value: escapeString(description), type: 'string' }, T.operator`)`];
          out = [...out, T.operator`[`, ...symbolTokens, T.operator`]`];
        } else {
          let identToken: Token;
          if(specialIdentTypes.has(item.identifier)) {
            // it's a special identifier (like a keyword) with a hard-coded type
            identToken = {value: item.identifier, type: specialIdentTypes.get(item.identifier)};
          } else if (!item.identifier.trim()) {
            identToken = {value: escapeString(item.identifier), type: 'string'};
          } else if(!Number.isNaN(Number(item.identifier))) {
            identToken = {value: item.identifier, type: 'number'};
          } else if (stringifiedObjectRegex.test(item.identifier)) {
            const [, name] = item.identifier.match(stringifiedObjectRegex);
            if(name && name != 'Object') {
              // in my experience this is almost always wrong, but closer than [object Object]
              identToken = {value: `${name} {}`, type: 'object'};
            } else {
              identToken = {value: '{}', type: 'object'};
            }
          } else if(!options.bracketNotationOptional || !identRegEx.test(item.identifier)) {
            // it's a string and is either not a valid identifier or bracketNotationOptional is off
            identToken = {value: escapeString(item.identifier), type: 'string'};
          } else {
            identToken = {value: item.identifier, type: 'property'};
          }

          // If !parensOptional or heuristics say we need parens, wrap prior stuff in parens
          if (!options.parensOptional || prevType === 'construct') {
            out = [T.operator`(`, ...out, T.operator`)`];
          }

          if(identToken.type === 'property') {
            out = [...out, T.operator`.`, identToken];
          } else {
            out = [...out, T.operator`[`, identToken, T.operator`]`];
          }
        }
        break;
      }
      case 'construct': {
        // handle arguments list and whether parens are necessary at all
        let args: Token[] = [];
        if(!options.constructorParensOptional || item.args.length) {
          args = [T.operator`(`, ...tokenizeArgumentsList(item.args), T.operator`)`]
        }
        // decide whether to wrap the constructor in parentheses for clarity
        if(options.parensOptional && prevType !== 'apply') {
          out = [T.keyword`new`, T.space(), ...out, ...args];
        } else {
          out = [T.keyword`new`, T.space(), T.operator`(`, ...out, T.operator`)`, ...args];
        }
        break;
      }
      case 'apply': {
        if (calledAsTemplateTag(item.args)) {
          out = [...out, ...tokenizeTemplateLiteralFromTagArgs(item.args as any)]
        } else {
          if (!options.parensOptional || prevType === 'construct') {
            out = [T.operator`(`, ...out, T.operator`)`, T.operator`(`, ...tokenizeArgumentsList(item.args), T.operator`)`];
          } else {
            out = [...out, T.operator`(`, ...tokenizeArgumentsList(item.args), T.operator`)`];
          }
        }
        break;
      }
    }
  }
  return out;
}