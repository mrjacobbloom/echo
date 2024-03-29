/**
 * Options object. See README.md
 */
type Options = {
  bracketNotationOptional: boolean;
  constructorParensOptional: boolean;
  parensOptional: boolean;
  colorMode: 'browser' | 'ansi' | 'off';
  stringDelimiter: '\'' | '"' | '`';
  theme: 'firefox' | 'chrome' | Theme;
  autoLog: boolean;
  autoLogMinLength: number;
};

declare const ECHO_INTERNALS: unique symbol;
type T_ECHO_INTERNALS = typeof ECHO_INTERNALS;
declare const ECHO_SELF: unique symbol;
type T_ECHO_SELF = typeof ECHO_SELF;

// Don't worry about actual Echo-ing behavior, this is all for internal use which doesn't depend on that
type EchoProxy = {
  [ECHO_SELF]: Echo;
  options: Options;
  render: (disableAutoLog?: boolean) => PrettyPrintOutput;
  then: typeof Promise.prototype.then;
  __registerPublicGetter: (identifier: string | symbol, getter: (echo: Echo) => any) => void;
};

type Echo = {
  // must be both callable and constructible for the Proxy to work
  (): void;
  new(): Echo;

  options: Options;

  [ECHO_INTERNALS]: {
    stack: TrappedOperation[];
    proxy: EchoProxy;
    autoLogDisabled: { value: boolean };
    id: number;
  };
  render: (disableAutoLog?: boolean) => PrettyPrintOutput;
  print: () => void;
  then: typeof Promise.prototype.then;
  __registerPublicGetter: (identifier: string | symbol, getter: (echo: Echo) => any) => void;
};

/**
 * An operation trapped by the Echo's proxy, which will later be turned into a
 * Token.
 */
type TrappedOperation = {
  type: 'construct' | 'apply';
  args: any[];
} | {
  type: 'get';
  identifier: string | symbol;
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

/**
 * Token, which is used for syntax highlighting in prettyPrint
 */
type Token = {
  value: string;
  type: TokenType;
};

type Theme = { [tokenType in TokenType]?: string };

type PrettyPrintOutput = {
  tokens: Token[];
  plaintext: string;
  formatted: string[];
  theme: Theme;
};

interface ThemeMap {
  [theme: string]: {
    browser: Theme;
    ansi: Theme;
  };
}