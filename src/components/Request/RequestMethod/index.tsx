import React from 'react'
import { Select } from 'antd';
import { RequestMethod } from '@src/constants';

const { Option } = Select;

interface Props {
  method: RequestMethod;
  readOnly?: boolean;
}

const RequestMethodComponent: React.FC<Props> = ({
  method,
  readOnly = false
}) => {
  const selected = method || RequestMethod.GET;
  return (
    <Select defaultValue={selected}>
      {!readOnly && (
        <>
          <Option value={RequestMethod.GET}>{RequestMethod.GET}</Option>
          <Option value={RequestMethod.PUT}>{RequestMethod.PUT}</Option>
          <Option value={RequestMethod.POST}>{RequestMethod.POST}</Option>
          <Option value={RequestMethod.HEAD}>{RequestMethod.HEAD}</Option>
          <Option value={RequestMethod.PATCH}>{RequestMethod.PATCH}</Option>
          <Option value={RequestMethod.DELETE}>{RequestMethod.DELETE}</Option>
          <Option value={RequestMethod.CONNECT}>{RequestMethod.CONNECT}</Option>
          <Option value={RequestMethod.OPTIONS}>{RequestMethod.OPTIONS}</Option>
          <Option value={RequestMethod.TRACE}>{RequestMethod.TRACE}</Option>
        </>)}
    </Select>
  );
};

export default RequestMethodComponent;
