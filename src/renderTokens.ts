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
 * @returns {boolean}
 */
function calledAsTemplateTag(args: any[]): boolean {
  return args[0] && Array.isArray(args[0]) && Array.isArray((args[0] as any).raw);
}

/**
 * Reconstruct template literal from arguments to template tag
 * @param {any[]} args Arguments list of the apply
 * @returns {string} Reconstructed literal, including backticks
 */
function renderTemplateLiteralFromTagArgs([{raw}, ...args]: [TemplateStringsArray, ...any[]]): Token[] {
  let prevToken: Token = { value: `\`${raw[0]}`, type: 'string' };
  const tokens: Token[] = [prevToken];
  for(let i = 0; i < args.length; i++) {
    prevToken.value += '${';
    tokens.push(...handleArgs([args[i]])); // todo: break out handleArg(?) into its own function?
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
          if(arg) {
            const name = arg.__proto__.name || arg.constructor.name;
            if (Array.isArray(arg)) {
              out.push(T.operator`[`, ...handleArgs(arg), T.operator`]`)
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
          out.push({value: String(arg) + 'n', type: 'number'});
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
  let constructorAmbiguityRisk = false;
  for(let i = 0; i < stack.length; i++) {
    const prevType = i > 0 ? stack[i - 1].type : '';
    const item = stack[i];
    switch(item.type) {
      case 'get': {
        // determining types for property accesses is harder than argument lists since everything is stringified
        if(!out.length) {
          out = [{value: item.identifier, type: 'variable'}];
        } else {
          let identToken: Token;
          if(specialIdentTypes[item.identifier]) {
            // it's a special identifier (like a keyword) with a hard-coded type
            identToken = {value: item.identifier, type: specialIdentTypes[item.identifier]};
          } else if(!Number.isNaN(Number(item.identifier))) {
            identToken = {value: item.identifier, type: 'number'};
          } else if(!options.bracketNotationOptional || !identRegEx.test(item.identifier)) {
            // it's a string and is either not a valid identifier or bracketNotationOptional is off
            identToken = {value: escapeString(item.identifier), type: 'string'};
          } else {
            identToken = {value: item.identifier, type: 'property'};
          }

          let needsParens = prevType !== 'get';
          // do not wrap in parens if already wrapped in parens
          if (out[0].value === '(' && out[out.length - 1].value === ')') needsParens = false;

          // If !parensOptional or heuristics say we need parens, wrap prior stuff in parens
          if (!options.parensOptional || needsParens) {
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
          args = [T.operator`(`, ...handleArgs(item.args), T.operator`)`]
        }
        // decide whether to wrap the constructor in parentheses for clarity
        if(options.parensOptional && !constructorAmbiguityRisk) {
          out = [T.keyword`new`, T.space(), ...out, ...args];
          if (args.length) constructorAmbiguityRisk = true;
        } else {
          out = [T.keyword`new`, T.space(), T.operator`(`, ...out, T.operator`)`, ...args];
          constructorAmbiguityRisk = args.length > 1;
        }
        break;
      }
      case 'apply': {
        if (calledAsTemplateTag(item.args)) {
          out = [...out, ...renderTemplateLiteralFromTagArgs(item.args as any)]
        } else {
          if (prevType === 'construct') {
            out = [T.operator`(`, ...out, T.operator`(`, ...handleArgs(item.args), T.operator`)`, T.operator`)`];
          } else {
            out = [...out, T.operator`(`, ...handleArgs(item.args), T.operator`)`];
          }
          constructorAmbiguityRisk = true;
        }
        break;
      }
    }
  }
  return out;
}