import React from 'react'
import { createRoot } from 'react-dom/client'
import { getURLHost } from '@src/host';
import { findCodeBlocks } from '@src/selectors';
import { HTTPParser } from '@src/lib/parsers/http';
import RequestMethod from '@components/Request/RequestMethod';
import 'antd/dist/reset.css';

const MAX_ATTEMPTS = 6;
let attempts = 0;

interface Props {
  content: HTMLElement;
}

const Foo: React.FC<Props> = ({ content }) => {
  const parser = new HTTPParser();
  const parsed = parser.parse(content.textContent ?? "");

  return (
    <div>
      <>
        {parsed &&
          (<>
            <RequestMethod readOnly={false} method={parsed.method as RequestMethod} />
            {"  "}
            {parsed.url}
          </>)}
        <div dangerouslySetInnerHTML={{__html: content ? content?.outerHTML : ""}} />
      </>
    </div>
  );
}

const host = getURLHost(location.href)
if (host) {
  window.addEventListener ("load", () => {
    let jsInitChecker = setInterval(() => {
      const codeBlocks = findCodeBlocks(host);
      if (codeBlocks?.length) {
        clearInterval(jsInitChecker);

        if (codeBlocks?.length) {
          for (let block of codeBlocks) {
            const blockRoot = createRoot(block);
            blockRoot.render(
              <Foo content={block as HTMLElement} />
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
