import React from 'react';
import { Layout } from 'antd';
import './index.scss';

const { Content } = Layout;

interface Props {
  children: React.ReactNode;
}

const ContentComponent: React.FC<Props> = ({ children }) => {
  return (
    <Content className='layout-content'>
      {children}
    </Content>
  );
};

export default ContentComponent;
