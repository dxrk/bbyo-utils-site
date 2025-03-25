import fs from "fs";
import path from "path";

export function getFontFaceStyle(): string {
  const fontPath = path.join(process.cwd(), "public", "fonts");

  return `
    @font-face {
      font-family: 'Graphik';
      src: url('data:font/woff2;base64,${fs
        .readFileSync(path.join(fontPath, "Graphik-Regular.woff"))
        .toString("base64")}') format('woff2');
      font-weight: 400;
      font-style: normal;
      font-display: swap;
    }
    @font-face {
      font-family: 'Graphik';
      src: url('data:font/woff2;base64,${fs
        .readFileSync(path.join(fontPath, "Graphik-Light.woff"))
        .toString("base64")}') format('woff2');
      font-weight: 300;
      font-style: normal;
      font-display: swap;
    }
    @font-face {
      font-family: 'Graphik';
      src: url('data:font/woff2;base64,${fs
        .readFileSync(path.join(fontPath, "Graphik-Medium.woff"))
        .toString("base64")}') format('woff2');
      font-weight: 500;
      font-style: normal;
      font-display: swap;
    }
  `;
}
