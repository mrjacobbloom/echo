import options from './options';
import renderTokens from './renderTokens';
import prettyPrint from './prettyPrint';
import generateEcho from './generateEcho';
import attachToGlobal from './attachToGlobal';

let echoCount = 0;
let tokens: Token[] = [];

attachToGlobal('Echo', () => {
  const Echo = generateEcho();
  Echo.stack.push({type: 'get', identifier: 'Echo'});
  Echo.render = () => {
    const t = renderTokens(Echo.stack);
    return prettyPrint(t);
  }
  if(options.output === 'log') {
    echoCount++;
    setTimeout(() => {
      // deal with race between the whole expression and each of its sub-
      // expressions, as well as arguments that are other Echoes: just wait a
      // tick 'till they've all evaluated and use whichever stringified 
      // version is longest
      const t = renderTokens(Echo.stack);
      if(t.length > tokens.length) tokens = t;
      echoCount--;
      if(echoCount === 0 && tokens.length > 0) {
        const {formatted} = prettyPrint(tokens);
        console.log(...formatted);
        tokens = [];
      }
    }, 0);
  }
  
  return Echo.proxy;
})