import options from './options';
import generateEcho from './generateEcho';
import attachToGlobal from './attachToGlobal';

let echoCount = 0;
let maxTokensLength = 0;
let formatted: string[] = [];

attachToGlobal('Echo', () => {
  const Echo = generateEcho();
  if(options.autoLog) {
    echoCount++;
    setTimeout(() => {
      // deal with race between the whole expression and each of its sub-
      // expressions, as well as arguments that are other Echoes: just wait a
      // tick 'till they've all evaluated and use whichever stringified 
      // version is longest
      const prettyPrinted = Echo.render();
      if(prettyPrinted.tokens.length > maxTokensLength) {
        maxTokensLength = prettyPrinted.tokens.length;
        formatted = prettyPrinted.formatted
      }
      echoCount--;
      if(echoCount === 0 && maxTokensLength > 0) {
        console.log(...formatted);
        maxTokensLength = 0;
        formatted = [];
      }
    }, 0);
  }
  
  return Echo.proxy;
})