import React from 'react';
import { Input, Space } from 'antd';
import RequestMethod from './RequestMethod';

interface Props {
  method: RequestMethod;
  url: string;
  body?: string | object;
  type?: RequestContentType;
  mode?: RequestMode;
  cache?: RequestCache;
  credentials?: RequestCredentials;
  redirect?: RequestCredentials;
  referPolicy?: RequestReferrerPolicy;
}

const Request: React.FC<Props> = ({
  method, url, body, type, mode, cache, credentials, redirect, referPolicy
}) => {
  return (
    <Input
      addonBefore={<RequestMethod method={method} />}
      defaultValue={url} />
  );
};

export default Request;
