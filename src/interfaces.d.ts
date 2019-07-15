/**
 * Options object. See README.md
 */
type Options = {
  alwaysBracketNotation: boolean;
  constructorParensOptional: boolean;
  parensOptional: boolean;
  colorMode: 'browser' | 'ansi' | 'off';
  stringDelimiter: '\'' | '"' | '`';
  theme: 'firefox' | 'chrome';
  output: 'log' | 'toString' | 'promise';
};

interface Echo {
  // must be both callable and constructible for the Proxy to work
  (): void;
  new(): Echo;

  options: Options;
  _self: Echo;
  stack: TrappedOperation[];
  proxy: any;
  render?: () => PrettyPrintOutput;
}

/**
 * An operation trapped by the Echo's proxy, which will later be turned into a
 * Token.
 */
type TrappedOperation = {
  type: 'get' | 'construct' | 'apply';
  identifier?: string;
  args?: any[];
};

/**
 * String which may optionally contain type information, which is used for
 * syntax highlighting in prettyPrint
 */
type Token = string|{value: string, type: string};

type PrettyPrintOutput = {
  tokens: Token[];
  plaintext: string;
  formatted: string[];
};