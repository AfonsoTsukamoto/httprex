import { ConfigProvider, theme as antTheme } from 'antd';
import React from 'react';

const ThemeContext = React.createContext('light');

export enum ThemeType {
  LIGHT = 'light',
  DARK = 'dark'
}

interface Props {
  children: React.ReactNode;
  theme?: ThemeType;
}

const Theme: React.FC<Props> & { Context: React.Context<string> } = ({ theme = ThemeType.DARK, children }) => (
  <ThemeContext.Provider value={theme}>
    <ConfigProvider
      theme={{
        algorithm: theme === ThemeType.LIGHT ? antTheme.defaultAlgorithm : antTheme.darkAlgorithm,
      }}
    >
      {children}
    </ConfigProvider>
  </ThemeContext.Provider>
);

Theme.Context = ThemeContext;

export default Theme;
