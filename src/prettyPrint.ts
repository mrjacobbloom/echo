import options from './options';
import THEMES from './themes';

/**
 * Converts an array of Tokens to the format specified by options.colorMode and
 * prints it.
 * @param tokens
 * @param options
 */
export default function prettyPrint(tokens: Token[]): PrettyPrintOutput {
  const ret: PrettyPrintOutput = {
    tokens,
    plaintext: tokens.map(token => typeof token === 'string' ? token : token.value).join(''),
    formatted: null,
    theme: null,
  };
  if(options.colorMode === 'off') {
    ret.formatted = [ret.plaintext];
  } else if(options.colorMode === 'browser') {
    ret.theme = THEMES[options.theme].browser;
    let formatString = '';
    const styles = [];
    let prevStyle: string;
    for(const token of tokens) {
      const style = ret.theme[token.type] || ret.theme.default;
      if (style !== prevStyle) {
        formatString += '%c';
        styles.push(style);
      }
      formatString += token.value.replace(/%/g, '%%');
      prevStyle = style;
    }
    ret.formatted = [formatString, ...styles];
  } else {
    ret.theme = THEMES[options.theme].ansi;
    let out = '';
    let prevColorCode: string;
    for(const token of tokens) {
      const colorCode = ret.theme[token.type] || ret.theme.default
      if (colorCode !== prevColorCode) out += colorCode;
      out += token.value;
      prevColorCode = colorCode;
    }
    out += '\x1b[0m'; // force reset
    ret.formatted = [out]
  }
  return ret;
}