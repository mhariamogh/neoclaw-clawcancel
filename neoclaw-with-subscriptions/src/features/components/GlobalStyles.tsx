import { createGlobalStyle } from 'styled-components';
import { theme } from '@/features/theme';

export const GlobalStyles = createGlobalStyle`
  * {
    margin: 0;
    padding: 0;
    box-sizing: border-box;
  }

  body {
    font-family: ${theme.fontFamily};
    font-feature-settings: normal;
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
    background-color: ${theme.colors.background};
    color: ${theme.colors.textPrimary};
    line-height: 1.65;
  }

  #root {
    min-height: 100vh;
  }
`;
