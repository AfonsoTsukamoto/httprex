import { ContentType } from '../parser';

export const convertBody = (contentType: Nullable<ContentType>, content: string) => {
  switch(contentType) {
    case ContentType.XML: {
      return convertXML(content);
    }
    case ContentType.JSON: {
      return convertJSON(content);
    }
    case ContentType.X_WWW_FORM_URL_ENCODED: {
      return convertFormURLEncoded(content);
    }
  }
  return null;
};

export const convertXML = (content: string) => {};

export const convertJSON = (content: string) => JSON.parse(content);

export const convertFormURLEncoded = (content: string) => {
  const lines = content.split('\n');
  const kvs = lines.reduce(
    (acc: Array<[string, string]> , line: string) => {
      const [k, v] = line.split('=');
      acc.push([encodeURIComponent(k), encodeURIComponent(v)]);
      return acc;
    },
    []
  );
  return new URLSearchParams(kvs).toString();
};


