import options from './options';
import { tokenizeEcho } from './tokenize';
import prettyPrint from './prettyPrint';
import { ECHO_INTERNALS, ECHO_SELF } from './symbols';

const ignoreIdents: any[] = [
  // public interface
  'render', 'options', 'then', 'toString',

  // avoid breaking the console, or JavaScript altogether
  'valueOf', 'constructor', 'prototype', '__proto__'
];

const symbolInspect = typeof process !== 'undefined' ? Symbol.for('nodejs.util.inspect.custom') : null;

const handler: ProxyHandler<Echo> = {
  get(target, identifier) {
    if (identifier === ECHO_SELF) return target;
    if(typeof identifier === 'symbol'
    || ignoreIdents.includes(identifier)) {
      if(identifier == 'options') target[ECHO_INTERNALS].autoLogDisabled.value = true;
      return target[identifier];
    }
    target[ECHO_INTERNALS].stack.push({type: 'get', identifier: String(identifier)});
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
};

export default function generateEcho(autoLogDisabled: { value: boolean }): Echo {
  const Echo = function Echo() {} as Echo; // eslint-disable-line
  Echo[ECHO_INTERNALS] = {
    autoLogDisabled,
    stack: [{type: 'get', identifier: 'Echo'}],
    proxy: new Proxy(Echo, handler) as unknown as EchoProxy,
  };
  Echo.render = (disableAutoLog = true): PrettyPrintOutput => {
    if (disableAutoLog) autoLogDisabled.value = true;
    const t = tokenizeEcho(Echo);
    return prettyPrint(t);
  }
  //eslint-disable-next-line @typescript-eslint/explicit-function-return-type
  Echo.then = (...args) => Promise.prototype.then.apply(Promise.resolve(Echo.render()), args);

  Echo.toString = (): string => Echo.render().plaintext;
  Echo[Symbol.toPrimitive] = (): string => Echo.render().plaintext;
  if(symbolInspect) {
    Echo[symbolInspect] = (): string => Echo.render(false).formatted[0];
  }

  Echo.options = options;

  delete (Echo as any).__proto__;
  delete (Echo as any).name;
  delete (Echo as any).length;
  return Echo as Echo;
}