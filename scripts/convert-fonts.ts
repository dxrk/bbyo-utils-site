import fs from "fs";
import path from "path";

const fontsDir = path.join(__dirname, "..", "public", "fonts");
const outputFile = path.join(__dirname, "..", "lib", "font-data.ts");

// Font files to convert
const fonts = [
  { name: "regular", file: "Graphik-Regular.woff" },
  { name: "light", file: "Graphik-Light.woff" },
  { name: "medium", file: "Graphik-Medium.woff" },
];

// Convert each font file to base64
const fontData: Record<string, string> = {};

fonts.forEach(({ name, file }) => {
  const filePath = path.join(fontsDir, file);
  const buffer = fs.readFileSync(filePath);
  const base64 = buffer.toString("base64");
  fontData[name] = base64;
});

// Generate the TypeScript file content
const fileContent = `// This file is auto-generated. Do not edit manually.
export const fontData = ${JSON.stringify(fontData, null, 2)};
`;

// Write the output file
fs.writeFileSync(outputFile, fileContent);

console.log(
  "Font data has been successfully converted and saved to font-data.ts"
);
