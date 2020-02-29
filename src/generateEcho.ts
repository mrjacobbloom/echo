import options from './options';

const ignoreIdents: any[] = [
  // public interface
  'options', 'then', 'toString',

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
  const Echo: Partial<Echo> = function Echo() {};
  Echo.stack = [];
  Echo._self = Echo as Echo;
  Echo.render = null;

  Echo.toString = () => Echo.render().plaintext;
  Echo[Symbol.toPrimitive] = () => Echo.render().plaintext;
  if(symbolInspect) {
    Echo[symbolInspect] = () => Echo.render().formatted[0];
  }
  Object.defineProperty(Echo, 'then', {
    get() {
      if(options.output === 'promise') {
        const p = Promise.resolve(Echo.render());
        return Promise.prototype.then.bind(p);
      } else {
        return handler.get(Echo, 'then', null);
      }
    }
  });

  Echo.options = options;
  Echo.proxy = new Proxy(Echo, handler);
  return Echo as Echo;
}