import React, { useContext } from 'react';
import classnames from 'classnames';
import './index.scss';
import { Layout } from 'antd';
import Theme, { ThemeType } from '@src/pages/main/theme';
const { Sider } = Layout;

interface Props {
  children: React.ReactNode;
}

const SiderComponent: React.FC<Props> = ({ children }) => {
  const theme = useContext(Theme.Context);
  return (
    <Sider
      className={classnames (
        'layout-sidebar',
        {
          dark: theme === ThemeType.DARK,
          light: theme === ThemeType.LIGHT
        }
      )}
      >
        {children}
      </Sider>
  );
}
export default SiderComponent;
