import options from './options';
import generateEcho from './generateEcho';
import attachToGlobal from './attachToGlobal';
import { ECHO_INTERNALS } from './symbols';

const autoLogDisabled = { value: false };
let echoCount = 0;
let maxTokensLength = 0;
let formatted: string[] = [];

attachToGlobal('Echo', () => {
  const Echo = generateEcho(autoLogDisabled);
  if (echoCount === 0) autoLogDisabled.value = false;
  if(options.autoLog) {
    echoCount++;
    setTimeout(() => {
      // deal with race between the whole expression and each of its sub-
      // expressions, as well as arguments that are other Echoes: just wait a
      // tick 'till they've all evaluated and use whichever stringified 
      // version is longest
      const prettyPrinted = Echo.render(false);
      if(prettyPrinted.tokens.length > maxTokensLength) {
        maxTokensLength = prettyPrinted.tokens.length;
        formatted = prettyPrinted.formatted
      }
      echoCount--;
      if(echoCount === 0) {
        if (maxTokensLength > 0 && !autoLogDisabled.value) console.log(...formatted);
        autoLogDisabled.value = false;
        maxTokensLength = 0;
        formatted = [];
      }
    }, 0);
  }
  
  return Echo[ECHO_INTERNALS].proxy;
});
