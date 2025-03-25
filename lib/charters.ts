import sharp from "sharp";
import path from "path";
import fs from "fs";
import { getFontFaceStyle } from "./font-utils";

// Define template info type
type TemplateAlignment = {
  memberList?: number;
  community: number;
  chapter: number;
  date?: number;
};

type TemplateInfo = {
  maxColumns: number;
  alignment: TemplateAlignment;
};

// Import templates info
const templatesInfo: Record<string, TemplateInfo> = {
  "AZA Permanent Charter Template": {
    maxColumns: 10,
    alignment: {
      memberList: 32.5,
      community: 61.5,
      chapter: 59.75,
      date: 69.75,
    },
  },
  "BBG Permanent Charter Template": {
    maxColumns: 9,
    alignment: {
      memberList: 32.5,
      community: 61.5,
      chapter: 59.75,
      date: 69.75,
    },
  },
  "BBYO Permanent Charter Template": {
    maxColumns: 6,
    alignment: {
      memberList: 36.5,
      community: 61.5,
      chapter: 59.75,
      date: 69.75,
    },
  },
  "AZA Temporary Charter Template": {
    maxColumns: 10,
    alignment: {
      community: 53.75,
      chapter: 51.5,
      date: 64.25,
    },
  },
  "BBG Temporary Charter Template": {
    maxColumns: 9,
    alignment: {
      community: 53.75,
      chapter: 51.5,
      date: 64.25,
    },
  },
  "BBYO Temporary Charter Template": {
    maxColumns: 9,
    alignment: {
      community: 58.25,
      chapter: 56,
      date: 66.25,
    },
  },
  "AZA Celebratory Charter Template": {
    maxColumns: 9,
    alignment: {
      memberList: 32.5,
      community: 62.5,
      chapter: 60.75,
    },
  },
  "BBG Celebratory Charter Template": {
    maxColumns: 9,
    alignment: {
      memberList: 32.5,
      community: 62.25,
      chapter: 60.5,
    },
  },
  "BBYO Celebratory Charter Template": {
    maxColumns: 6,
    alignment: {
      memberList: 39,
      community: 63.5,
      chapter: 61.75,
    },
  },
};

// Types for override options
interface OverrideOptions {
  columns?: number;
  fontSize?: number;
  yPosition?: number;
}

function splitIntoColumns(
  memberList: string,
  charter: string,
  override?: { columns?: number; yPosition?: number; fontSize?: number }
): { sortedColumns: string[][]; fontSize: number } {
  const lines = memberList.split("\n");

  // Alphabetize memberList
  lines.sort((a, b) => {
    const aName = a.split(" ")[0];
    const bName = b.split(" ")[0];
    return aName.localeCompare(bName);
  });

  // Determine fontSize and maxColumns based on the length of lines
  let fontSize;
  let maxColumns;

  if (lines.length < 40) {
    fontSize = 65;
    maxColumns = templatesInfo[charter].maxColumns;
  } else {
    fontSize = 40;
    maxColumns = templatesInfo[charter].maxColumns + 4;
  }

  // Use provided font size if valid
  if (override?.fontSize && !isNaN(override.fontSize)) {
    fontSize = override.fontSize;
  }

  // Check if override is provided and use it for columns
  const numColumns =
    override?.columns && !isNaN(override.columns)
      ? override.columns
      : Math.ceil(lines.length / maxColumns);

  // Ensure we have a valid number of columns (at least 1)
  const validNumColumns = Math.max(1, numColumns);

  // Create an array of empty arrays, one for each column
  const columns: string[][] = [];
  for (let i = 0; i < validNumColumns; i++) {
    columns.push([]);
  }

  lines.forEach((line, index) => {
    const columnIndex = index % validNumColumns;
    columns[columnIndex].push(line);
  });

  columns.sort((a, b) => b.length - a.length);

  const sortedColumns: string[][] = [];
  while (columns.length) {
    sortedColumns.push(columns.shift()!);
    if (columns.length) {
      sortedColumns.unshift(columns.shift()!);
    }
  }

  sortedColumns.reverse();

  if (
    sortedColumns[0].length < sortedColumns[sortedColumns.length - 1].length
  ) {
    sortedColumns.reverse();
  }

  return { sortedColumns, fontSize };
}

function calculateCoordinates(
  numColumns: number,
  columnIndex: number,
  columns: string[][],
  charter: string
): { x: number; y: number } {
  let x, y;

  // Calculate x position
  if (numColumns === 2) {
    const maxColumnWidth = 50 / columns.length;
    x = columnIndex * maxColumnWidth + maxColumnWidth / 2 + 25;
  } else if (numColumns === 3) {
    const maxColumnWidth = 60 / columns.length;
    x = columnIndex * maxColumnWidth + maxColumnWidth / 2 + 20;
  } else if (numColumns === 4 || numColumns === 5) {
    const maxColumnWidth = 80 / columns.length;
    x = columnIndex * maxColumnWidth + maxColumnWidth / 2 + 10;
  } else {
    const maxColumnWidth = 90 / columns.length;
    x = columnIndex * maxColumnWidth + maxColumnWidth / 2 + 5;
  }

  // Calculate y position
  const longestColumnLength = columns[Math.floor(numColumns / 2)].length;
  const base = templatesInfo[charter].alignment.memberList || 0;

  if (longestColumnLength < 7) {
    y = base + 6;
  } else if (longestColumnLength === 8 || longestColumnLength === 9) {
    y = base + 4.5;
  } else if (longestColumnLength <= 10) {
    y = base + 3;
  } else if (longestColumnLength <= 14) {
    y = base + 0.75;
  } else {
    y = base + 0.5;
  }

  return { x, y };
}

export async function generateSvg(
  memberList: string | null,
  chapter: string,
  community: string,
  charter: string,
  date: string,
  override?: OverrideOptions
): Promise<string> {
  const imageDimensions = await getImageDimensions(charter);
  let svgText: string;

  if (memberList) {
    const { sortedColumns, fontSize } = splitIntoColumns(
      memberList,
      charter,
      override
    );

    const columns = sortedColumns;
    const numColumns = columns.length;
    const finalFontSize = override?.fontSize || fontSize;

    svgText = `
    <svg width="${imageDimensions.width}" height="${
      imageDimensions.height
    }" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <style>
        ${getFontFaceStyle()}
        .memberList { fill: black; font-weight: 300; font-family: 'Graphik', sans-serif; font-size: ${finalFontSize}px; }
        .chapter { fill: black; font-weight: 500; font-family: 'Graphik', sans-serif; font-size: 115px; }
        .community { fill: black; font-weight: 300; font-family: 'Graphik', sans-serif; font-size: 80px; }
        .date { fill: black; font-weight: 300; font-family: 'Graphik', sans-serif; font-size: 50px; }
      </style>
    </defs>`;

    let spacing;
    if (finalFontSize === 40) {
      spacing = 1.2;
    } else {
      spacing = 1.7;
    }

    columns.forEach((column, columnIndex) => {
      // eslint-disable-next-line prefer-const
      let { x, y } = calculateCoordinates(
        numColumns,
        columnIndex,
        columns,
        charter
      );

      // Apply y-position override if specified
      if (override?.yPosition && !isNaN(override.yPosition)) {
        y += override.yPosition;
      }

      column.forEach((line, lineIndex) => {
        svgText += `<text x="${x}%" y="${
          y + lineIndex * spacing
        }%" class="memberList" text-anchor="middle">${line.trim()}</text>`;
      });
    });
  } else {
    svgText = `
    <svg width="${imageDimensions.width}" height="${imageDimensions.height}" xmlns="http://www.w3.org/2000/svg">
    <style>
      .chapter { fill: black; font-weight: bold; font-family: 'Graphik'; font-size: 115px; }
      .community { fill: black; font-weight: light; font-family: 'Graphik'; font-size:80px; }
      .date { fill: black; font-weight: light; font-family: 'Graphik'; font-size: 50px; }
    </style>`;
  }

  const formattedDate = formatJewishDate(date);

  svgText += `
  <text x="50%" y="${templatesInfo[charter].alignment.chapter}%" dominant-baseline="middle" text-anchor="middle" class="chapter">${chapter}</text>
  <text x="50%" y="${templatesInfo[charter].alignment.community}%" dominant-baseline="middle" text-anchor="middle" class="community">${community}</text>`;

  if (templatesInfo[charter].alignment.date) {
    svgText += `<text x="50%" y="${templatesInfo[charter].alignment.date}%" dominant-baseline="middle" text-anchor="middle" class="date">${formattedDate}</text>`;
  }

  svgText += `</svg>`;
  return svgText;
}

export async function generateBuffer(
  svgText: string,
  charter: string
): Promise<Buffer> {
  const buffer = Buffer.from(svgText);

  // Path to template files in public directory
  const templateFile = path.join(
    process.cwd(),
    "public",
    "charter-templates",
    `${charter}.jpg`
  );

  // Check if template file exists
  if (!fs.existsSync(templateFile)) {
    throw new Error(`Template file not found: ${templateFile}`);
  }

  try {
    // Process image
    const result = await sharp(templateFile)
      .composite([{ input: buffer, left: 0, top: 0 }])
      .toBuffer();

    return result;
  } catch (error) {
    console.error("Error generating charter:", error);
    throw error;
  }
}

function formatJewishDate(dateStr: string): string {
  const date = new Date(dateStr);
  const day = date.getDate();
  const month = date.toLocaleString("en-US", { month: "long" });
  const year = date.getFullYear();
  const jewishYear = date.toLocaleDateString("en-US-u-ca-hebrew", {
    year: "numeric",
  });

  const dayWithSuffix = day + getOrdinalSuffix(day);

  return `${dayWithSuffix} day of ${month} ${year} in the Jewish Year ${jewishYear}.`;
}

async function getImageDimensions(
  charter: string
): Promise<{ width: number; height: number }> {
  try {
    const templateFile = path.join(
      process.cwd(),
      "public",
      "charter-templates",
      `${charter}.jpg`
    );

    if (!fs.existsSync(templateFile)) {
      // Return default dimensions if file doesn't exist
      return { width: 3300, height: 2550 };
    }

    const metadata = await sharp(templateFile).metadata();
    return {
      width: metadata.width || 3300,
      height: metadata.height || 2550,
    };
  } catch (error) {
    console.error("Error getting image dimensions:", error);
    // Return default dimensions if there's an error
    return { width: 3300, height: 2550 };
  }
}

function getOrdinalSuffix(day: number): string {
  if (day >= 11 && day <= 13) {
    return "th";
  }

  switch (day % 10) {
    case 1:
      return "st";
    case 2:
      return "nd";
    case 3:
      return "rd";
    default:
      return "th";
  }
}
