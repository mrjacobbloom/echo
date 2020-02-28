import options from './options';

const specialIdentTypes = {
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
function escapeString(string: string): string {
  const d = options.stringDelimiter;
  const regexp = new RegExp(d, 'g');
  return d + string.replace(regexp, '\\' + d) + d;
}


/**
 * Tags to generate tokens from template strings, and whitespace getter.
 */
const T = {
  operator([value]: TemplateStringsArray): Token {
    return { value, type: 'operator' };
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
 * Tokenize an arguments list (i.e. Echo was applied or constructed)
 * @param args arguments list
 * @returns {Token[]}
 */
function handleArgs(args: any[]): Token[] {
  const out: Token[] = [];
  args.forEach((arg, idx) => {
    if(arg && arg._self) {
      out.push(...renderTokens(arg._self.stack));
    } else {
      switch(typeof arg) {
        case 'string': {
          out.push({value: escapeString(arg), type: 'string'});
          break;
        }
        case 'function': {
          if(arg.name) {
            out.push({value: arg.name, type: 'variable'});
          } else {
            out.push({value: String(arg), type: 'default'});
          }
          break;
        }
        case 'object': {
          // in my experience this is almost always wrong, but closer than [object Object]
          if(arg) {
            const name = arg.__proto__.name || arg.constructor.name;
            if(name && name != 'Object') {
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
          out.push({value: String(arg), type: 'number'});
          break;
        }
        default: {
          if(specialIdentTypes[arg]) {
            out.push({value: String(arg), type: specialIdentTypes[arg]});
          } else {
            out.push({value: String(arg), type: typeof arg as TokenType});
          }
          break;
        }
      }
    }
    if(idx < args.length - 1) out.push(T.operator`,`, T.space());
  });
  return out;
}

// Heuristic to determine if a property key is a valid identifier, or if we should use bracket notation
// This is NOT spec-compliant: https://stackoverflow.com/a/9337047
const identRegEx = /^[_$a-zA-Z][_$a-zA-Z0-9]*$/;

/**
 * Render a given Echo's stack into an array of Tokens (strings which may also
 * carry type information).
 * @param {TrappedOperation[]} stack Echo's operation stack.
 * @returns {Token[]} Token list.
 */
export default function renderTokens(stack: TrappedOperation[]): Token[] {
  let out: Token[] = [];
  for(let i = 0; i < stack.length; i++) {
    const prevType = i > 0 ? stack[i - 1].type : '';
    const item = stack[i];
    switch(item.type) {
      case 'get': {
        // determining types for property accesses is harder than argument lists since everything is stringified
        if(!out.length) {
          out = [{value: item.identifier, type: 'variable'}];
        } else if(specialIdentTypes[item.identifier]) {
          // it's a special identifier (like a keyword) with a hard-coded type
          out = [...out, T.operator`[`, {value: item.identifier, type: specialIdentTypes[item.identifier]}, T.operator`]`];
        } else if(!Number.isNaN(Number(item.identifier))) {
          // it's a number
          out = [...out, T.operator`[`, {value: item.identifier, type: 'number'}, T.operator`]`];
        } else if(!options.bracketNotationOptional || !identRegEx.test(item.identifier)) {
          // it's a string and is either not a valid identifier or bracketNotationOptional is off
          out = [...out, T.operator`[`, {value: escapeString(item.identifier), type: 'string'}, T.operator`]`];
        } else if(options.parensOptional && prevType === 'get') {
          // it's a valid identifier and heuristics say we don't need parentheses for clarity
          out = [...out, T.operator`.`, {value: item.identifier, type: 'property'}];
        } else {
          // it's a valid identifier and we're using parentheses for clarity (or parensOptional is off)
          out = [T.operator`(`, ...out, T.operator`)`, T.operator`.`, {value: item.identifier, type: 'property'}];
        }
        break;
      }
      case 'construct': {
        // handle arguments list and whether parens are necessary at all
        let args: Token[] = [];
        if(!options.constructorParensOptional || item.args.length) {
          args = [T.operator`(`, ...handleArgs(item.args), T.operator`)`]
        }
        // decide whether to wrap the constructor in parentheses for clarity
        if(options.parensOptional && prevType === 'get' && !out.filter(t => t.value === ')').length) {
          out = [T.keyword`new`, T.space(), ...out, ...args];
        } else {
          out = [T.keyword`new`, T.space(), T.operator`(`, ...out, T.operator`)`, ...args];
        }
        break;
      }
      case 'apply': {
        out = [...out, T.operator`(`, ...handleArgs(item.args), T.operator`)`];
        break;
      }
    }
  }
  return out;
}