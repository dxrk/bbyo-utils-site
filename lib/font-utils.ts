export function getFontFaceStyle(): string {
  return `
    @font-face {
      font-family: 'Graphik';
      src: url('/fonts/Graphik-Regular.woff2') format('woff2'),
           url('/fonts/Graphik-Regular.woff') format('woff'),
           url('/fonts/Graphik-Regular.ttf') format('truetype');
      font-weight: 400;
      font-style: normal;
      font-display: swap;
    }
    @font-face {
      font-family: 'Graphik';
      src: url('/fonts/Graphik-Light.woff2') format('woff2'),
           url('/fonts/Graphik-Light.woff') format('woff'),
           url('/fonts/Graphik-Light.ttf') format('truetype');
      font-weight: 300;
      font-style: normal;
      font-display: swap;
    }
    @font-face {
      font-family: 'Graphik';
      src: url('/fonts/Graphik-Medium.woff2') format('woff2'),
           url('/fonts/Graphik-Medium.woff') format('woff'),
           url('/fonts/Graphik-Medium.ttf') format('truetype');
      font-weight: 500;
      font-style: normal;
      font-display: swap;
    }
  `;
}
