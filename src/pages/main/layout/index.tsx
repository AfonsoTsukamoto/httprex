import React from 'react';
import { Layout } from 'antd';
import Sider from './sider';
import Header from './header';
import Content from './content';
import './index.scss';

interface Props {
  header: React.ReactNode;
  content: React.ReactNode;
  sider: React.ReactNode;
}

const App: React.FC<Props> = ({ header, content, sider }) => {
  return (
    <Layout hasSider>
      <Sider>{sider}</Sider>
      <Layout className="site-layout">
        <Header>
          {header}
        </Header>
        <Content>
          {content}
        </Content>
      </Layout>
    </Layout>
  );
};

export default App;
