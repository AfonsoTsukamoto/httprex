import { RequestContentType } from '@src/constants';

const HeaderContentTypeMap: Record<string, string> = {
  'application/xml': RequestContentType.XML,
  'application/json': RequestContentType.JSON,
  'application/x-www-form-urlencoded': RequestContentType.X_WWW_FORM_URL_ENCODED
}

export const isContentTypeHeader = (headerName: string) => headerName.toLowerCase() === "content-type";
export const findContentTypeHeader = (headers: Record<string, string>): Nullable<string> => {
  for (let key in headers) {
    if (isContentTypeHeader(key)) {
      return headers[key];
    }
  }
  return null;
}

export const getHeaderContentType = (contentTypeHeader: Nullable<string>): Nullable<RequestContentType> => {
  if (!contentTypeHeader) return null;

  const [first, ..._rest] = contentTypeHeader.trim().split(/\s+/)
  const trimmedHeader = first.trim();

  const foundType = Object
    .keys(HeaderContentTypeMap)
    .find((header: string) => trimmedHeader.startsWith(header));

  return foundType ? HeaderContentTypeMap[foundType] as RequestContentType : null;
}
