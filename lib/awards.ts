import sharp from "sharp";
import path from "path";
import fs from "fs";

// Define award info type
type AwardInfo = {
  order: string;
  type?: string;
  description: string;
};

// Import award information
export const awardsInfo: Record<string, AwardInfo> = {
  "The Bronze Shield of David Award": {
    order: "AZA",
    type: "lead",
    description:
      "One of the most historic and prestigious honors awarded to an Aleph, the Shield of David Award, recognizes Alephs who throughout their tenure in the Aleph Zadik Aleph have displayed outstanding leadership contributions, a consistent commitment to the fraternity that is AZA and consistently participated across all tiers of the Order – Chapter, Council, Regionally and Globally.",
  },
  "The Silver Shield of David Award": {
    order: "AZA",
    type: "lead",
    description:
      "One of the most historic and prestigious honors awarded to an Aleph, the Shield of David Award, recognizes Alephs who throughout their tenure in the Aleph Zadik Aleph have displayed outstanding leadership contributions, a consistent commitment to the fraternity that is AZA and consistently participated across all tiers of the Order – Chapter, Council, Regionally and Globally.",
  },
  "The Tree of Life Recruitment Award": {
    order: "AZA",
    type: "lead",
    description:
      "The Tree of Life Recruitment Award is an honor given to those Alephs who have played a significant and lasting part in growing the Aleph Zadik Aleph. As a result of their efforts, they have contributed to the strengthening of our Order's future. Open to all Alephs in good standing, these young men leave a legacy in their Chapters, Councils, Regions and Countries – embracing a new generation to love, cherish and preserve the traditions of the Aleph Zadik Aleph and BBYO.",
  },
  "The Silver Star of Deborah Award": {
    order: "BBG",
    type: "lead",
    description:
      "The Star of Deborah honors B'nai B'rith Girls who have made an outstanding commitment to BBG, have displayed a consistent commitment to the sisterhood that is BBG, and who best exemplify the ideals and principles set forth by BBYO. It is the highest honor a BBG can receive.",
  },
  "The Gold Star of Deborah Award": {
    order: "BBG",
    type: "lead",
    description:
      "The Star of Deborah honors B'nai B'rith Girls who have made an outstanding commitment to BBG, have displayed a consistent commitment to the sisterhood that is BBG, and who best exemplify the ideals and principles set forth by BBYO. It is the highest honor a BBG can receive.",
  },
  "The Eternal Light Recruitment Award": {
    order: "BBG",
    description:
      "The B'nai B'rith Girls' Eternal Light Recruitment Award is open to all B'nai B'rith Girls in good standing. It recognizes those BBGs who have played a significant and lasting part in growing the B'nai B'rith Girls. As a result of their efforts, they have contributed to the strengthening of our Order's future. These young women leave a legacy in their Chapters, Councils, Regions and Countries – embracing a new generation to love, cherish and preserve the traditions of the B'nai B'rith Girls and BBYO.",
  },
  "The Henry Monsky Chapter Excellence Award of AZA": {
    order: "AZA",
    type: "chapter",
    description:
      "The Henry Monsky Chapter Excellence Award is the most prestigious honor an AZA chapter can earn. It requires that the chapter represent top quality in all areas of chapter operations – a growing membership, diverse and rich programming, healthy chapter organization, and consistent contributions to, as well as participation in the initiatives and programs led by the International Order. The Chapters selected for this honor are leaders of the global community of Alephs and exemplify the ideals set forth in the Seven Cardinal Principles.",
  },
  "The Miriam Albert Chapter Excellence Award of BBG": {
    order: "BBG",
    type: "chapter",
    description:
      "The Miriam Albert Chapter Excellence Award is the most prestigious honor a BBG chapter can earn. It requires that the chapter represent top quality in all areas of chapter operations – a growing membership, diverse and rich programming, healthy chapter organization, and consistent contributions as well as participation in the initiatives and programs led by the International Order. The Chapters selected for this honor are leaders of the global community of BBGs and exemplify the ideals set forth in Menorah Pledge Principles.",
  },
  "The Maurice Bisgyer Chapter Excellence Award for BBYO Chapters": {
    order: "BBYO",
    type: "chapter",
    description:
      "The Maurice Bisgyer Chapter Excellence Award is the most prestigious honor a BBYO chapter can earn. It requires that the chapter represent top quality in all areas of chapter operations – a growing membership, diverse and rich programming, healthy chapter organization, and consistent contributions as well as participation in the initiatives and programs led by the International Order. The chapters selected for this honor are leaders of the global community of Alephs and BBGs and exemplify the ideals set forth in the Seven Cardinal Principles and the Menorah Pledge.",
  },
  "The BBYO Stand UP Gemilut Chasidim Award": {
    order: "BBYO",
    type: "chapter",
    description:
      "Gemilut Chasidim Chapter Award recognizes those AZA, BBG and BBYO chapters around the world that participate in direct and indirect service opportunities in their community. Chapters who complete between 15 and 24 hours of service as a chapter receive the Bronze Award.",
  },
  "The International Service Fund (ISF) Bronze Club": {
    order: "BBYO",
    type: "chapter",
    description:
      "The International Service Fund (ISF) Clubs recognize chapters who show an unwavering commitment to raising, prioritizing, and distributing much needed tzedakah around the globe. The International Service Fun is AZA & BBG's treasury, providing the Movement with the tools it needs to provide Jewish teens worldwide with need-based scholarship to participate in BBYO and Jewish life, give charity when it is needed proactively and at times of crisis, and to give as Stand UP Philanthropy on behalf of AZA & BBG. The club levels recognize chapters at varying levels who have made it a priority to fundraise for the ISF.",
  },
  "The International Service Fund (ISF) Silver Club": {
    order: "BBYO",
    type: "chapter",
    description:
      "The International Service Fund (ISF) Clubs recognize chapters who show an unwavering commitment to raising, prioritizing, and distributing much needed tzedakah around the globe. The International Service Fun is AZA & BBG's treasury, providing the Movement with the tools it needs to provide Jewish teens worldwide with need-based scholarship to participate in BBYO and Jewish life, give charity when it is needed proactively and at times of crisis, and to give as Stand UP Philanthropy on behalf of AZA & BBG. The club levels recognize chapters at varying levels who have made it a priority to fundraise for the ISF.",
  },
  "The International Service Fund (ISF) Gold Club": {
    order: "BBYO",
    type: "chapter",
    description:
      "The International Service Fund (ISF) Clubs recognize chapters who show an unwavering commitment to raising, prioritizing, and distributing much needed tzedakah around the globe. The International Service Fun is AZA & BBG's treasury, providing the Movement with the tools it needs to provide Jewish teens worldwide with need-based scholarship to participate in BBYO and Jewish life, give charity when it is needed proactively and at times of crisis, and to give as Stand UP Philanthropy on behalf of AZA & BBG. The club levels recognize chapters at varying levels who have made it a priority to fundraise for the ISF.",
  },
  "The International Service Fund (ISF) Platinum Club": {
    order: "BBYO",
    type: "chapter",
    description:
      "The International Service Fund (ISF) Clubs recognize chapters who show an unwavering commitment to raising, prioritizing, and distributing much needed tzedakah around the globe. The International Service Fun is AZA & BBG's treasury, providing the Movement with the tools it needs to provide Jewish teens worldwide with need-based scholarship to participate in BBYO and Jewish life, give charity when it is needed proactively and at times of crisis, and to give as Stand UP Philanthropy on behalf of AZA & BBG. The club levels recognize chapters at varying levels who have made it a priority to fundraise for the ISF.",
  },
  "The Menorah Pledge and Cardinal Principles Award": {
    order: "BBYO",
    type: "lead",
    description:
      "Awarded to Alephs and B'nai B'rith Girls who truly embody the Menorah Pledge and Seven Cardinal Principles, The Menorah Pledge & Cardinal Principles Award honors those teens that have dedicated their time and energy to promoting the values of our Order. The award also recognizes Alephs and B'nai B'rith Girls who have embraced the ideals of the Menorah Pledge and Cardinal Principles and regularly live by them in all aspects of their life.",
  },
  "The Anita Perlman Stand UP Award": {
    order: "BBYO",
    type: "lead",
    description:
      "Awarded to Alephs and B'nai B'rith Girls who have worked to Stand UP and better their community through consistent and quality community service. Members who receive this award actively participate in their chapter or community's service projects, excels in independent community service work, and is regularly immersed in direct or indirect service, philanthropy, and advocacy efforts.",
  },
  "The Arevut Explore Israel Award": {
    order: "BBYO",
    type: "lead",
    description:
      "Awarded to Alephs and B'nai B'rith Girls who have consistently sought out and built opportunities to learn about, educate others on, explore, and advocate for the State of Israel. Members who have inspired others to seek to educate themselves and continue to create meaningful Explore Israel experiences for their peers are given this honor.",
  },
  "The Rising Leader Award": {
    order: "BBYO",
    type: "lead",
    description:
      "The Rising Leader Award provides the BBYO Movement with a way to recognize and celebrate our youngest Rising Leaders across the Movement. Awarded to Grade 8, Grade 9 (Freshman) and Grade 10 (Sophomore) Alephs and B'nai B'rith Girls who truly embody and display the ideals and principles of our Movement, the Rising Leader Award honors those teens that have displayed extraordinary leadership for the benefit of their chapter, region, and the International Order. Recipients of the Rising Leaders Award show immense promise for current and continued leadership in their chapter, region, and the International Order.",
  },
};

// Define constants
const WIDTH = 3300;
const HEIGHT = 2550;

export function generateSvg(
  name: string,
  community: string,
  chapter: string,
  award: string
): string {
  let awardFont = 130;
  if (award.length > 45) awardFont = 110;
  if (award.length > 55) awardFont = 90;

  let svgText = `
  <svg width="${WIDTH}" height="${HEIGHT}" xmlns="http://www.w3.org/2000/svg">
  <style>
    .awardName { fill: black; font-weight: 500; font-family: 'Graphik'; font-size: ${awardFont}px;}
    .description { fill: black; font-weight: light; font-family: 'Graphik'; font-size: 50px; }
    .name { fill: black; font-weight: bold; font-family: 'Graphik'; font-size:110px; }
    .chapter { fill: black; font-weight: bold; font-family: 'Graphik'; font-size: 90px; }
    .date { fill: black; font-weight: light; font-family: 'Graphik'; font-size: 50px; }
  </style>`;

  const currentDate = new Date();
  const formattedDate = formatJewishDate(currentDate);

  const maxCharsPerLine = 100;
  const descriptionLines = breakTextIntoLines(
    awardsInfo[award]?.description || "Award description not found.",
    maxCharsPerLine
  );

  const startingDistances = {
    startingY: 35,
    awardAdj: 0,
  };

  if (descriptionLines.length === 3) {
    startingDistances.startingY = 39;
    startingDistances.awardAdj = 4;
  } else if (descriptionLines.length === 4) {
    startingDistances.startingY = 38;
    startingDistances.awardAdj = 3;
  } else if (descriptionLines.length === 5) {
    startingDistances.startingY = 37;
    startingDistances.awardAdj = 2;
  } else if (descriptionLines.length === 6) {
    startingDistances.startingY = 36;
  }

  svgText += `
  <text x="50%" y="${
    30 + startingDistances.awardAdj
  }%" dominant-baseline="middle" text-anchor="middle" class="awardName">${award}</text>`;

  descriptionLines.forEach((line, index) => {
    svgText += `
    <text x="50%" y="${
      startingDistances.startingY + index * 2.5
    }%" dominant-baseline="middle" text-anchor="middle" class="description">${line}</text>`;
  });

  let commName = "";
  if (awardsInfo[award]?.type === "chapter") {
    commName = `${community}`;
  } else {
    commName = `${chapter} • ${community}`;
  }

  svgText += `
  <text x="50%" y="${
    53.75 - startingDistances.awardAdj
  }%" dominant-baseline="middle" text-anchor="middle" class="description">Presented to</text>
  <text x="50%" y="${
    59 - startingDistances.awardAdj
  }%" dominant-baseline="middle" text-anchor="middle" class="name">${name}</text>
  <text x="50%" y="${
    64 - startingDistances.awardAdj
  }%" dominant-baseline="middle" text-anchor="middle" class="chapter">${commName}</text>
  <text x="50%" y="${
    68 - startingDistances.awardAdj
  }%" dominant-baseline="middle" text-anchor="middle" class="date">${formattedDate}</text>`;

  svgText += `</svg>`;

  // replace all instances of & with &amp;
  svgText = svgText.replace(/&/g, "&amp;");
  return svgText;
}

function breakTextIntoLines(text: string, maxCharsPerLine: number): string[] {
  const words = text.split(" ");
  let currentLine = "";
  const lines: string[] = [];

  for (const word of words) {
    if (currentLine.length + word.length <= maxCharsPerLine) {
      currentLine += (currentLine === "" ? "" : " ") + word;
    } else {
      lines.push(currentLine);
      currentLine = word;
    }
  }

  if (currentLine !== "") {
    lines.push(currentLine);
  }

  return lines;
}

export async function generateBuffer(
  svgText: string,
  award: string
): Promise<Buffer> {
  const buffer = Buffer.from(svgText);
  const orderType = awardsInfo[award]?.order || "BBYO";

  // Path to template files in public directory
  const templateFile = path.join(
    process.cwd(),
    "public",
    "award-templates",
    `${orderType} Award Certificate.jpeg`
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
    console.error("Error generating award:", error);
    throw error;
  }
}

function formatJewishDate(date: Date): string {
  const year = date.getFullYear();
  const jewishYear = date.toLocaleDateString("en-US-u-ca-hebrew", {
    year: "numeric",
  });

  return `during this programing year of ${
    year - 1
  }-${year}, in the Jewish year ${jewishYear}.`;
}
