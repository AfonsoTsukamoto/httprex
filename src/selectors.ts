import { Host } from './host';

export type QuerySelector = string;
export type FnSelector = (attrs?: Record<string, string>) => Nullable<NodeList>;

export type Selector = QuerySelector | FnSelector;

export const HOST_SELECTOR_MAP: Record<Host, Nullable<Selector>> = {
  [Host.GITHUB]: '.highlight.highlight-source-rexx,.highlight.highlight-source-httpspec',
  [Host.GITLAB]: '.code.highlight[lang=http],.code.highlight[canonical-lang=rex]',
  [Host.UNK]: null
};

export const findCodeBlocks = (host: Nullable<Host>, args?: Record<any, any>): Nullable<NodeListOf<Element>> => {
  if (host) {
    const selector = HOST_SELECTOR_MAP[host];
    console.log({selector});
    if (selector) {
      if (typeof selector === 'string') {
        return document.querySelectorAll(selector);
      } else if (typeof selector === 'function') {
        return selector(args) as NodeListOf<Element>;
      }
    }
  }
  return null;
}
