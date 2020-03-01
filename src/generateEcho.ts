import options from './options';
import renderTokens from './renderTokens';
import prettyPrint from './prettyPrint';

const ignoreIdents: any[] = [
  // public interface
  'render', 'options', 'then', 'toString',

  // internals
  '_self',

  // avoid breaking the console, or JavaScript altogether
  'valueOf', 'constructor', 'prototype', '__proto__'
];

const symbolInspect = typeof process !== undefined ? Symbol.for('nodejs.util.inspect.custom') : null;

const handler: ProxyHandler<any> = {
  get(target, identifier) {
    if(typeof identifier === 'symbol'
    || ignoreIdents.includes(identifier)) {
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
  const Echo: Partial<Echo> = function Echo() {}; // eslint-disable-line
  Echo.stack = [{type: 'get', identifier: 'Echo'}];
  Echo._self = Echo as Echo;
  Echo.render = (): PrettyPrintOutput => {
    const t = renderTokens(Echo.stack);
    return prettyPrint(t);
  }

  Echo.toString = (): string => Echo.render().plaintext;
  Echo[Symbol.toPrimitive] = (): string => Echo.render().plaintext;
  if(symbolInspect) {
    Echo[symbolInspect] = (): string => Echo.render().formatted[0];
  }
  Object.defineProperty(Echo, 'then', {
    get() {
      const p = Promise.resolve(Echo.render());
      return Promise.prototype.then.bind(p);
    }
  });

  Echo.options = options;
  Echo.proxy = new Proxy(Echo, handler);
  return Echo as Echo;
}