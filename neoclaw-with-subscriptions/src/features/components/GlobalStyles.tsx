import { createGlobalStyle } from 'styled-components';
import { theme } from '@/features/theme';

export const GlobalStyles = createGlobalStyle`
  *, *::before, *::after {
    margin: 0;
    padding: 0;
    box-sizing: border-box;
  }

  html, body {
    width: 380px;
    overflow: hidden;
  }

  body {
    font-family: ${theme.fontFamily};
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
    background-color: ${theme.colors.background};
    color: ${theme.colors.textPrimary};
    line-height: 1.5;
  }

  #root {
    width: 380px;
    max-height: 580px;
    overflow-y: auto;
  }

  button {
    font-family: inherit;
  }
`;
