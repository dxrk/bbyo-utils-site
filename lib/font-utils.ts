import { fontData } from "./font-data";

export function getFontFaceStyle(): string {
  return `
    @font-face {
      font-family: 'Graphik';
      src: url(data:font/woff2;base64,${fontData.regular}) format('woff2');
      font-weight: 400;
      font-style: normal;
      font-display: block;
    }
    @font-face {
      font-family: 'Graphik';
      src: url(data:font/woff2;base64,${fontData.light}) format('woff2');
      font-weight: 300;
      font-style: normal;
      font-display: block;
    }
    @font-face {
      font-family: 'Graphik';
      src: url(data:font/woff2;base64,${fontData.medium}) format('woff2');
      font-weight: 500;
      font-style: normal;
      font-display: block;
    }

    * {
      font-family: 'Graphik', sans-serif !important;
    }
  `;
}
