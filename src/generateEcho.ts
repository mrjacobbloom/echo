import options from './options';
import { tokenizeEcho } from './tokenize';
import prettyPrint from './prettyPrint';
import { ECHO_INTERNALS, ECHO_SELF } from './symbols';

const ignoreIdents: string[] = [
  // public interface
  'render', 'options', 'then', 'print', 'toString', '__registerPublicGetter',

  // avoid breaking the console, or JavaScript altogether
  'valueOf', 'constructor', 'prototype', '__proto__', 'name',
  // symbols
  'Symbol(nodejs.util.inspect.custom)', 'Symbol(Symbol.toPrimitive)'
];

const customPublicGetters= new Map<string | symbol, (echo: Echo) => any>();

const symbolInspect = typeof process !== 'undefined' ? Symbol.for('nodejs.util.inspect.custom') : null;

const handler: ProxyHandler<Echo> = {
  get(target, identifier) {
    if (identifier === ECHO_SELF) return target;
    if (customPublicGetters.has(identifier)) {
      return customPublicGetters.get(identifier)(target);
    }
    if(ignoreIdents.includes(String(identifier))) {
      if(identifier == 'options') target[ECHO_INTERNALS].autoLogDisabled.value = true;
      return target[identifier];
    }
    target[ECHO_INTERNALS].stack.push({type: 'get', identifier });
    return target[ECHO_INTERNALS].proxy;
  },
  construct(target, args) {
    target[ECHO_INTERNALS].stack.push({type: 'construct', args});
    return target[ECHO_INTERNALS].proxy;
  },
  apply(target, that, args) {
    target[ECHO_INTERNALS].stack.push({type: 'apply', args});
    return target[ECHO_INTERNALS].proxy;
  },
  has(target, identifier) {
    return ignoreIdents.includes(String(identifier)) || customPublicGetters.has(identifier);
  },
  getOwnPropertyDescriptor(target, identifier) {
    if (identifier === 'name') {
      return { value: 'Echo', configurable: true };
    } else if (ignoreIdents.includes(String(identifier))) {
      return Object.getOwnPropertyDescriptor(target, identifier);
    } else if (customPublicGetters.has(identifier)) {
      return { value: customPublicGetters.get(identifier)(target), configurable: true };
    }
    return { value: null, configurable: true };
  },
  ownKeys(target) {
    return [...Reflect.ownKeys(target).filter((i) => i !== ECHO_INTERNALS), 'name'];
  }
};

export default function generateEcho(autoLogDisabled: { value: boolean }, id: number): Echo {
  const Echo = function Echo() {} as Echo; // eslint-disable-line

  Echo[ECHO_INTERNALS] = {
    autoLogDisabled,
    stack: [{type: 'get', identifier: 'Echo'}],
    proxy: new Proxy(Echo, handler) as unknown as EchoProxy,
    id
  };

  Echo.render = (disableAutoLog = true): PrettyPrintOutput => {
    if (disableAutoLog) autoLogDisabled.value = true;
    const t = tokenizeEcho(Echo);
    return prettyPrint(t);
  }

  Echo.print = (): void => console.log(...Echo.render().formatted);

  //eslint-disable-next-line @typescript-eslint/explicit-function-return-type
  Echo.then = (...args) => Promise.prototype.then.apply(Promise.resolve(Echo.render()), args);

  Echo.toString = (): string => Echo.render(id === 0).plaintext; // don't disable autoLog when being stringified in another Echo's get-brackets
  Echo[Symbol.toPrimitive] = Echo.toString;

  if(symbolInspect) {
    Echo[symbolInspect] = (): string => Echo.render(false).formatted[0];
  }

  Echo.__registerPublicGetter = (identifier: string | symbol, getter: (echo: Echo) => any): void => { customPublicGetters.set(identifier, getter) };

  Echo.options = options;

  delete (Echo as any).__proto__;
  delete (Echo as any).name;
  delete (Echo as any).length;
  return Echo as Echo;
}