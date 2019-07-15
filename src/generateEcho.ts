import options from './options';

const ignoreIdents: any[] = [
  // internal / public interface
  'options', '_self',

  // to avoid breaking the console, or JavaScript altogether
  'toString', 'valueOf', 'constructor', 'prototype', '__proto__'
];

const isNode = typeof process !== undefined;
let symbolInspect;
if(isNode) {
  try {
    symbolInspect = require('util').inspect.custom;
  } catch {}
}

const handler = {
  get(target, identifier) {
    if(typeof identifier === 'symbol'
    || ignoreIdents.includes(identifier)
    || target.options.output === 'promise' && identifier === 'then') {
      if(identifier == 'options') target.stack = [];
      return target[identifier];
    }
    target.stack.push({type: 'get', identifier: String(identifier)});
    return target.proxy;
  },
  construct(target, args) {
    target.stack.push({type: 'construct', args});
    return target.proxy;
  },
  apply(target, that, args) {
    target.stack.push({type: 'apply', args});
    return target.proxy;
  },
};

export default function generateEcho(): Echo {
  const Echo = function Echo() {};
  Echo.stack = [];
  Echo._self = Echo;
  Echo.render = null;

  Echo.toString = () => {
    if(options.output === 'toString') {
      return Echo.render().plaintext;
    } else {
      return '';
    }
  };
  const toPrimitiveOriginal = Echo[Symbol.toPrimitive];
  Object.defineProperty(Echo, Symbol.toPrimitive, {
    get() {
      if(options.output === 'toString') {
        return () => Echo.render().plaintext;
      } else {
        return toPrimitiveOriginal;
      }
    }
  });
  if(isNode) {
    const inspectOriginal = Echo[symbolInspect];
    Object.defineProperty(Echo, symbolInspect, {
      get() {
        if(options.output === 'toString') {
          return () => Echo.render().formatted[0];
        } else {
          return inspectOriginal;
        }
      }
    })
  }
  Object.defineProperty(Echo, 'then', {
    get() {
      if(options.output === 'promise') {
        const p = Promise.resolve(Echo.render());
        return p.then.bind(p);
      } else {
        return undefined;
      }
    }
  });

  Echo.options = options;
  Echo.proxy = new Proxy(Echo, handler);
  return Echo as Echo;
}