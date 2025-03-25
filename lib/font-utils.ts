export function getFontFaceStyle(baseUrl: string = ""): string {
  // If baseUrl is provided, it's server-side, otherwise it's client-side
  const fontPath = baseUrl ? `${baseUrl}/fonts` : "/fonts";

  return `
    @font-face {
      font-family: 'Graphik';
      src: url('${fontPath}/Graphik-Regular.woff2') format('woff2'),
           url('${fontPath}/Graphik-Regular.woff') format('woff'),
           url('${fontPath}/Graphik-Regular.ttf') format('truetype');
      font-weight: 400;
      font-style: normal;
      font-display: swap;
    }
    @font-face {
      font-family: 'Graphik';
      src: url('${fontPath}/Graphik-Light.woff2') format('woff2'),
           url('${fontPath}/Graphik-Light.woff') format('woff'),
           url('${fontPath}/Graphik-Light.ttf') format('truetype');
      font-weight: 300;
      font-style: normal;
      font-display: swap;
    }
    @font-face {
      font-family: 'Graphik';
      src: url('${fontPath}/Graphik-Medium.woff2') format('woff2'),
           url('${fontPath}/Graphik-Medium.woff') format('woff'),
           url('${fontPath}/Graphik-Medium.ttf') format('truetype');
      font-weight: 500;
      font-style: normal;
      font-display: swap;
    }
  `;
}
