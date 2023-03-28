import React from 'react'
import { Dropdown } from 'antd';
import { RequestMethod } from '@src/constants';

interface Props {
  method: RequestMethod;
  readOnly: boolean;
}

const getItems = (selected: RequestMethod) => [
  {
    label: RequestMethod.GET,
    key: RequestMethod.GET
  },
  {
    label: RequestMethod.PUT,
    key: RequestMethod.PUT
  },
  {
    label: RequestMethod.POST,
    key: RequestMethod.POST
  },
  {
    label: RequestMethod.HEAD,
    key: RequestMethod.HEAD
  },
  {
    label: RequestMethod.PATCH,
    key: RequestMethod.PATCH
  },
  {
    label: RequestMethod.DELETE,
    key: RequestMethod.DELETE
  },
  {
    label: RequestMethod.CONNECT,
    key: RequestMethod.CONNECT
  },
  {
    label: RequestMethod.OPTIONS,
    key: RequestMethod.OPTIONS
  },
  {
    label: RequestMethod.TRACE,
    key: RequestMethod.TRACE
  },
  {
    label: RequestMethod.PATCH,
    key: RequestMethod.PATCH
  }
].filter(({ key }) => key !== selected)

const RequestMethodComponent: React.FC<Props> = ({
  method,
  readOnly = true
}) => {
  const items = getItems(method);
  return (
    <Dropdown menu={{ items }} trigger={['click']}>
      <b>{method}</b>
    </Dropdown>
  );
};

export default RequestMethodComponent;
