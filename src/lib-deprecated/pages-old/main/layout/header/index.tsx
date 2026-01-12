import React from 'react';
import { Layout, theme } from 'antd';
import './index.scss';
const { Header } = Layout;

interface Props {
  children: React.ReactNode;
}

const HeaderComponent: React.FC<Props> = ({ children }) => {
  const {
    token: { colorBgContainer },
  } = theme.useToken();

  return (
      <Header
        className='layout-header'
        style={{ background: colorBgContainer }}
      >
        {children}
      </Header>
  );
}

export default HeaderComponent;
