let colorMode = 'browser';
if (typeof process !== undefined) {
  try {
    if (process.stdout.isTTY && (process.stdout as any).getColorDepth() >= 4) {
      colorMode = 'ansi';
    } else {
      colorMode = 'off';
    }
  } catch {}
}
export default {
  colorMode,
  bracketNotationOptional: true,
  constructorParensOptional: true,
  parensOptional: true,
  stringDelimiter: "'",
  theme: (typeof navigator !== 'undefined' && navigator.userAgent.includes('Firefox')) ? 'firefox' : 'chrome',
  autoLog: true,
} as Options;