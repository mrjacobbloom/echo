export default {
  alwaysBracketNotation: false,
  constructorParensOptional: true,
  parensOptional: true,
  colorMode: typeof process === 'undefined' ? 'browser' : 'ansi', // todo: take advantage of getColorDepth or whatever
  stringDelimiter: "'",
  theme: (typeof navigator !== 'undefined' && navigator.userAgent.includes('Firefox')) ? 'firefox' : 'chrome',
  output: 'log',
} as Options;