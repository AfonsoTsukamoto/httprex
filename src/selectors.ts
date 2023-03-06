import {Host} from './host';

export type QuerySelector = string;
export type FnSelector = (attrs?: Record<string, string>) => Nullable<NodeList>;

export type Selector = QuerySelector | FnSelector;

export const HOST_SELECTOR_MAP: Record<Host, Selector> = {
  [Host.GITHUB]: '.highlight.highlight-source-rexx,.highlight.highlight-source-httpspec',
  [Host.GITLAB]: '.code.highlight[lang=http],.code.highlight[lang=rex]',
  [Host.UNK]: () => null // COMING SOON
};

export const findCode = (host: Host, args?: Record<any, any>): Nullable<NodeList> => {
  const selector = HOST_SELECTOR_MAP[host];

  if (selector) {
    if (typeof selector === 'string') {
      return document.querySelectorAll(selector);
    } else if (typeof selector === 'function') {
      return selector(args);
    }
  }
  return null;
}
