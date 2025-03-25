export function getFontFaceStyle(): string {
  return `
    @font-face {
      font-family: 'Graphik';
      src: url('/fonts/Graphik-Regular.woff') format('woff');
      font-weight: 400;
      font-style: normal;
      font-display: swap;
    }
    @font-face {
      font-family: 'Graphik';
      src: url('/fonts/Graphik-Light.woff') format('woff');
      font-weight: 300;
      font-style: normal;
      font-display: swap;
    }
    @font-face {
      font-family: 'Graphik';
      src: url('/fonts/Graphik-Medium.woff') format('woff');
      font-weight: 500;
      font-style: normal;
      font-display: swap;
    }
  `;
}
