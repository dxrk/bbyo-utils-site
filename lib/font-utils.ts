import { fontData } from "./font-data";

export function getFontFaceStyle(): string {
  return `
    @font-face {
      font-family: 'Graphik';
      src: url(data:font/woff;base64,${fontData.regular}) format('woff');
      font-weight: 400;
      font-style: normal;
      font-display: swap;
    }
    @font-face {
      font-family: 'Graphik';
      src: url(data:font/woff;base64,${fontData.light}) format('woff');
      font-weight: 300;
      font-style: normal;
      font-display: swap;
    }
    @font-face {
      font-family: 'Graphik';
      src: url(data:font/woff;base64,${fontData.medium}) format('woff');
      font-weight: 500;
      font-style: normal;
      font-display: swap;
    }
  `;
}
