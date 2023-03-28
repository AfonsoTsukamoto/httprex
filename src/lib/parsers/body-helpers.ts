import { RequestContentType } from '@src/constants';

export const convertBody = (contentType: Nullable<RequestContentType>, content: string) => {
  switch(contentType) {
    case RequestContentType.XML: {
      return convertXML(content);
    }
    case RequestContentType.JSON: {
      return convertJSON(content);
    }
    case RequestContentType.X_WWW_FORM_URL_ENCODED: {
      return convertFormURLEncoded(content);
    }
  }
  return null;
};

export const convertXML = (content: string) => {};

export const convertJSON = (content: string) => {
  const clean = content.replace(/\n|\r/g, "")
  console.log({content, clean});
  return JSON.parse(clean);
}

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


