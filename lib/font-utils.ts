import fs from "fs";
import path from "path";

export function getFontFaceStyle(): string {
  // Read fonts directly from filesystem
  const fontsDir = path.join(process.cwd(), "lib", "fonts");
  const regularFont = fs.readFileSync(
    path.join(fontsDir, "Graphik-Regular.woff"),
    "base64"
  );
  const lightFont = fs.readFileSync(
    path.join(fontsDir, "Graphik-Light.woff"),
    "base64"
  );
  const mediumFont = fs.readFileSync(
    path.join(fontsDir, "Graphik-Medium.woff"),
    "base64"
  );

  return `
    @font-face {
      font-family: 'Graphik';
      src: url(data:font/woff;base64,${regularFont}) format('woff');
      font-weight: 400;
      font-style: normal;
      font-display: swap;
    }
    @font-face {
      font-family: 'Graphik';
      src: url(data:font/woff;base64,${lightFont}) format('woff');
      font-weight: 300;
      font-style: normal;
      font-display: swap;
    }
    @font-face {
      font-family: 'Graphik';
      src: url(data:font/woff;base64,${mediumFont}) format('woff');
      font-weight: 500;
      font-style: normal;
      font-display: swap;
    }
  `;
}
