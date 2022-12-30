// Type definitions for Echo

declare namespace EchoProxy {
  type Echo =
    & PromiseLike<EchoProxy.RenderResult>
    & { [key: string | symbol | number]: EchoProxy.Echo }
    & {
      /**
       * Returns the data necessary to pretty-print the output.
       */
      render: () => EchoProxy.RenderResult;

      /**
       * Manually force the Echo to print, instead of relying on auto-logging.
       */
      print: () => void;

      /**
       * Get the Echo output as plaintext.
       */
      toString: () => string;

      /**
       * Really only exists to inject the RunKit value viewer.
       */
      __registerPublicGetter: (identifier: string | symbol, getter: (echo: Echo) => any) => void;

      /**
       * Options to configure Echo
       */
      options: EchoProxy.Options;
    
      // Echo-y behavior
      (): EchoProxy.Echo;
      new (): EchoProxy.Echo;
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
    type: EchoProxy.TokenType;
  }

  interface RenderResult {
    /**
     * The output broken up into typed "tokens," which is what Echo uses to do syntax highlighting.
     */
    tokens: EchoProxy.Token[];

    /**
     * The tokens strung together without any syntax highlighting.
     */
    plaintext: string;

    /**
     * The tokens with syntax highlighting, formatted as arguments to console.log.
     */
    formatted: string[];

    /**
     * The "theme" object that maps "token types" to either ANSI colors or hsl colors (or null if options.colorMode='off').
     */
    theme: null | { [tokenType in EchoProxy.TokenType]: string }
  }

  interface Options {
    /**
     * When true, use heuristics to decide when to use dot notation. Otherwise, always use square-bracket notation.
     * @default true
     */
    bracketNotationOptional: boolean;

    /**
     * When true, drop parentheses for constructors with no arguments.
     * @default true
     */
    constructorParensOptional: boolean;

    /**
     * When true, use heuristics to decide whether to wrap sub-expressions in parentheses. When false, always wrap them.
     * @default true
     */
    parensOptional: boolean;

    /**
     * Enable or disable syntax highlighting and the mode used to set colors.
     * @default [auto-detected]
     */
    colorMode: 'browser' | 'ansi' | 'off';

    /**
     * What character is used to delimit (bookend) strings, and is escaped from strings. If the string contains a newline, this is ignored and the string is rendered as a template string.
     * @default "'"
     */
    stringDelimiter: '\'' | '"' | '`';

    /**
     * Which DevTools' syntax highlighting theme to use.
     * @default "Chrome, unless you're using Firefox.""
     */
    theme: 'firefox' | 'chrome';

    /**
     * When true, automatically console.log the output. See README.
     * @default true
     */
    autoLog: boolean;

    /**
     * The minimum number of tokens required to log to console. You can use this to avoid printing in some autocomplete situations. See README
     * @default 1
     */
    autoLogMinLength: number;
  }
}

declare var Echo: EchoProxy.Echo;
