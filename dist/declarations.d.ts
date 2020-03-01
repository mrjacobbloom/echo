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

interface EchoRenderResult {
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

interface Echo extends PromiseLike<EchoRenderResult> {
  // Actual public interface
  render: () => EchoRenderResult;
  toString: () => string;
  options: EchoOptions;

  // Echo-y behavior
  (): Echo;
  new(): Echo;
  [key: string]: Echo;
};

declare var Echo: Echo;
