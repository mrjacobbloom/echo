// Type definitions for Echo

type EchoTokenType =
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

interface EchoToken {
  value: string;
  type: TokenType;
};

interface EchoPromiseResult {
  tokens: EchoToken[];
  plaintext: string;
  formatted: string[];
}

interface EchoOptions {
  bracketNotationOptional: boolean;
  constructorParensOptional: boolean;
  parensOptional: boolean;
  colorMode: 'browser' | 'ansi' | 'off';
  stringDelimiter: '\'' | '"' | '`';
  theme: 'firefox' | 'chrome';
  output: 'log' | 'toString' | 'promise';
};

interface Echo extends Partial<PromiseLike<EchoPromiseResult>> {
  (): Echo;
  new(): Echo;
  toString: () => string;
  options: EchoOptions;
  [key: string]: Echo;
};

declare var Echo: Echo;
