import options from './options';
import THEMES from './themes';

/**
 * Converts an array of Tokens to the format specified by options.colorMode and
 * prints it.
 * @param tokens
 * @param options
 */
export default function prettyPrint(tokens: Token[]): PrettyPrintOutput {
  const ret = {
    tokens,
    plaintext: tokens.map(token => typeof token === 'string' ? token : token.value).join(''),
    formatted: null,
  };
  if(options.colorMode === 'off') {
    ret.formatted = [ret.plaintext];
  } else if(options.colorMode === 'browser') {
    const theme = THEMES[options.theme].browser;
    let formatString = '';
    const styles = [];
    for(const token of tokens) {
      formatString += '%c' + token.value.replace(/%/g, '%%');
      styles.push(theme[token.type] || theme.default);
    }
    ret.formatted = [formatString, ...styles];
  } else {
    const theme = THEMES[options.theme].ansi;
    let out = '';
    for(const token of tokens) {
      out += (theme[token.type] || theme.default) + token.value;
    }
    out += '\x1b[0m'; // force reset
    ret.formatted = [out]
  }
  return ret;
}