import { getFontFaceStyle } from "./font-utils";
import sharp from "sharp";

export async function generateTestImage() {
  const testSvg = `
<svg width="500" height="200" xmlns="http://www.w3.org/2000/svg">
<defs>
      <style>
        ${getFontFaceStyle()}
      </style>
</defs>
<text x="50%" y="50%" text-anchor="middle" font-family="Graphik" font-weight="500">Test Text</text>
</svg>`;

  const testBuffer = Buffer.from(testSvg);
  await sharp({
    create: {
      width: 500,
      height: 200,
      channels: 4,
      background: { r: 255, g: 255, b: 255, alpha: 1 },
    },
  })
    .composite([{ input: testBuffer }])
    .png()
    .toFile("test-font.png");

  console.log("Test image generated successfully!");
  console.log("You can find the image at test-font.png");
}

generateTestImage();
