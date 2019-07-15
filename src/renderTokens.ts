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
 * Tokenize an arguments list
 * @param args 
 * @param options 
 */
function handleArgs(args: any[]): Token[] {
  const out = [];
  args.forEach((arg, idx) => {
    if(arg && arg._self) {
      out.push(...renderTokens(arg._self.stack));
    } else {
      if(typeof arg === 'string') {
        out.push({value: escapeString(arg), type: 'string'});
      } else if(typeof arg === 'function') {
        if(arg.name) {
          out.push({value: arg.name, type: 'variable'});
        } else {
          out.push({value: String(arg), type: 'function'});
        }
      } else if(typeof arg === 'object') {
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
      } else if(specialIdentTypes[arg]) {
        out.push({value: String(arg), type: specialIdentTypes[arg]});
      } else {
        out.push({value: String(arg), type: typeof arg});
      }
    }
    if(idx < args.length - 1) out.push(',', ' ');
  });
  return out;
}

// Heuristic to determine if a property key is a valid identifier, or if we should use bracket notation
// This is NOT spec-compliant: https://stackoverflow.com/a/9337047
const identRegEx = /^[_$a-zA-Z][_$a-zA-Z0-9]*$/;

/**
 * Render a given Echo's stack into an array of Tokens (strings which may also
 * carry type information).
 * @param stack 
 * @param options 
 */
export default function renderTokens(stack): Token[] {
  let out = [];
  for(let i = 0; i < stack.length; i++) {
    const prevType = i > 0 ? stack[i - 1].type : '';
    const item = stack[i];
    switch(item.type) {
      case 'get': {
        // determining types for property accesses is harder than argument lists since eeverything is stringified
        if(!out.length) {
          out = [{value: item.identifier, type: 'variable'}];
        } else if(specialIdentTypes[item.identifier]) {
          // it's a special identifier (like a keyword) with a hard-coded type
          out = [...out, '[', {value: item.identifier, type: specialIdentTypes[item.identifier]}, ']'];
        } else if(!Number.isNaN(Number(item.identifier))) {
          // it's a number
          out = [...out, '[', {value: item.identifier, type: 'number'}, ']'];
        } else if(options.alwaysBracketNotation || !identRegEx.test(item.identifier)) {
          // it's a string and is either not a valid identifier or alwaysBracketNotation is on
          out = [...out, '[', {value: escapeString(item.identifier), type: 'string'}, ']'];
        } else if(options.parensOptional && prevType === 'get') {
          // it's a valid identifier and heuristics say we don't need parentheses for clarity
          out = [...out, '.', {value: item.identifier, type: 'property'}];
        } else {
          // it's a valid identifier and we're using parentheses for clarity (or parensOptional is off)
          out = ['(', ...out, ')', '.', {value: item.identifier, type: 'property'}];
        }
        break;
      }
      case 'construct': {
        // handle arguments list and whether parens are necessary at all
        let args = [];
        if(!options.constructorParensOptional || item.args.length) {
          args = ['(', ...handleArgs(item.args), ')']
        }
        // decide whether to wrap the constructor in parentheses for clarity
        if(options.parensOptional && prevType === 'get' && !out.includes('(')) {
          out = ['new', ' ', ...out, ...args];
        } else {
          out = ['new', ' ', '(', ...out, ')', ...args];
        }
        break;
      }
      case 'apply': {
        out = [...out, '(', ...handleArgs(item.args), ')'];
        break;
      }
    }
  }
  return out;
}