import React from 'react'
import { createRoot } from 'react-dom/client'
import { getURLHost } from '@src/host';
import { findCodeBlocks } from '@src/selectors';

const MAX_ATTEMPTS = 6;
let attempts = 0;

const Foo: React.FC = () => (<div>Kore ha React desu</div>);

const host = getURLHost(location.href)
if (host) {
  window.addEventListener ("load", () => {
    let jsInitChecker = setInterval(() => {
      const codeBlocks = findCodeBlocks(host);
      if (codeBlocks?.length) {
        clearInterval(jsInitChecker);

        console.log({host, codeBlocks });

        if (codeBlocks?.length) {
          for (let block of codeBlocks) {
            const blockRoot = createRoot(block);
            blockRoot.render(
              <Foo/>
              );
          };
        }
      } else if (attempts > MAX_ATTEMPTS) {
        clearInterval(jsInitChecker);
      } else {
        attempts += 1;
      }
    }, 101);
  }, false);
}
