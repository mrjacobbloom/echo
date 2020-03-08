// Type definitions for Echo

namespace EchoPromise {
  interface Echo extends PromiseLike<EchoPromise.RenderResult> {
    // Actual public interface
    render: () => EchoPromise.RenderResult;
    toString: () => string;
    options: EchoPromise.Options;
  
    // Echo-y behavior
    (): EchoPromise.Echo;
    new(): EchoPromise.Echo;
    [key: string]: EchoPromise.Echo;
  };

  type TokenType =
    | 'keyword'
    | 'number'
    | 'string'
    | 'boolean'
    | 'object'
    | 'null'
    | 'undefined'
    | 'operator'
    | 'variable'
    | 'property'
    | 'default';

  interface Token {
    value: string;
    type: EchoPromise.TokenType;
  };

  interface RenderResult {
    tokens: EchoPromise.Token[];
    plaintext: string;
    formatted: string[];
  }

  interface Options {
    bracketNotationOptional: boolean;
    constructorParensOptional: boolean;
    parensOptional: boolean;
    colorMode: 'browser' | 'ansi' | 'off';
    stringDelimiter: '\'' | '"' | '`';
    theme: 'firefox' | 'chrome';
    output: 'log' | 'toString' | 'promise';
  };
}

declare var Echo: EchoPromise.Echo;
