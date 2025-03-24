import { Readable } from "stream";
import csv from "csv-parser";

type ProgramAssignment = Record<number, Record<string, string[]>>;
type TotalSpots = Record<string, number>;
type Assignment = {
  name: string;
  program: string;
  preference: number;
};

let programsAssignment: ProgramAssignment = {};

async function createProgramsList(csvFile: Buffer, excludeChars: number) {
  const programsList: string[] = [];
  let totalPeople = 0;

  await new Promise<void>((resolve, reject) => {
    const bufferStream = new Readable();
    bufferStream.push(csvFile);
    bufferStream.push(null);

    bufferStream
      .pipe(csv())
      .on("data", (row) => {
        totalPeople++;
        for (const key in row) {
          if (Object.keys(row).indexOf(key) !== 0) {
            const program = row[key].replace(/[\n\r]/g, "").trim();
            const programUpdated = program.substring(excludeChars);
            if (programUpdated && !programsList.includes(programUpdated)) {
              programsList.push(programUpdated);
            }
          }
        }
      })
      .on("end", () => resolve())
      .on("error", reject);
  });

  return { programsList, totalPeople };
}

function extractPreferences(row: Record<string, string>, excludeChars: number) {
  const preferences: string[] = [];
  for (const key in row) {
    if (Object.keys(row).indexOf(key) !== 0) {
      const program = row[key].replace(/[\n\r]/g, "").trim();
      const programUpdated = program.substring(excludeChars);
      if (programUpdated) {
        preferences.push(programUpdated);
      }
    }
  }
  return preferences.length > 0 ? preferences : null;
}

function assignUser(
  name: string,
  preferences: string[] | null,
  totalSpots: TotalSpots,
  session: number
) {
  if (!programsAssignment[session]._noPreferences) {
    programsAssignment[session]._noPreferences = [];
  }

  if (!preferences) {
    programsAssignment[session]._noPreferences.push(name);
    return;
  }

  const assignedPrograms: string[] = [];
  for (let i = 0; i <= session; i++) {
    for (const program in programsAssignment[i]) {
      if (programsAssignment[i][program].includes(name)) {
        assignedPrograms.push(program);
      }
    }
  }

  for (const program of preferences) {
    if (
      programsAssignment[session][program].length < totalSpots[program] &&
      !assignedPrograms.includes(program)
    ) {
      programsAssignment[session][program].push(name);
      return;
    }
  }

  programsAssignment[session]._noPreferences.push(name);
}

function seededRandom(seed: number) {
  const x = Math.sin(seed++) * 10000;
  return x - Math.floor(x);
}

function shuffleArray(array: string[], seed: number = Math.random()) {
  let currentIndex = array.length,
    randomIndex;

  // While there remain elements to shuffle
  while (currentIndex !== 0) {
    // Pick a remaining element
    randomIndex = Math.floor(seededRandom(seed) * currentIndex);
    currentIndex--;
    seed++; // Change seed for next random number

    // And swap it with the current element
    [array[currentIndex], array[randomIndex]] = [
      array[randomIndex],
      array[currentIndex],
    ];
  }

  return array;
}

function assignRandomUser(
  name: string,
  totalSpots: TotalSpots,
  session: number
) {
  const availablePrograms = Object.keys(programsAssignment[session]).filter(
    (program) => program !== "_noPreferences"
  );

  const shuffledPrograms = shuffleArray(availablePrograms);

  const alreadyAssigned: string[] = [];
  for (let i = 0; i <= session; i++) {
    for (const program in programsAssignment[i]) {
      if (programsAssignment[i][program].includes(name)) {
        alreadyAssigned.push(program);
      }
    }
  }

  for (const randomProgram of shuffledPrograms) {
    if (
      programsAssignment[session][randomProgram].length <
        totalSpots[randomProgram] &&
      !alreadyAssigned.includes(randomProgram)
    ) {
      programsAssignment[session][randomProgram].push(name);
      return;
    }
  }

  const noPreferenceIndex = Math.floor(
    Math.random() * programsAssignment[session]._noPreferences.length
  );
  const noPreferenceUser =
    programsAssignment[session]._noPreferences[noPreferenceIndex];

  programsAssignment[session]._noPreferences.splice(noPreferenceIndex, 1);

  const randomProgramIndex = Math.floor(
    Math.random() * availablePrograms.length
  );
  const randomProgram = availablePrograms[randomProgramIndex];

  programsAssignment[session][randomProgram].push(noPreferenceUser);
}

function assignUsersWithoutPreferences(
  totalSpots: TotalSpots,
  session: number
) {
  const withoutPref = programsAssignment[session]._noPreferences;

  withoutPref.forEach((user) => {
    assignRandomUser(user, totalSpots, session);
  });
}

function formatJsonResponse(
  programsAssign: Record<string, string[]>,
  originalOrder: string[],
  userPreferences: Record<string, string[]>
): Assignment[] {
  const json: Assignment[] = [];

  for (const name of originalOrder) {
    for (const program in programsAssign) {
      if (programsAssign[program].includes(name)) {
        const preference = userPreferences[name]?.indexOf(program) + 1 || 0;
        json.push({
          name,
          program,
          preference,
        });
      }
    }
  }

  return json;
}

type AssignmentResult = {
  response?: Record<number, Assignment[]>;
  programsList?: string[];
  error?: string;
  totalSpots?: TotalSpots;
};

async function createAssignments(
  csvFile: Buffer,
  excludeChars: number,
  overrideTotalSpots: TotalSpots,
  numSessions: number
): Promise<AssignmentResult> {
  programsAssignment = {};

  const { programsList, totalPeople } = await createProgramsList(
    csvFile,
    excludeChars
  );

  const totalSpots: TotalSpots = {};
  programsList.forEach((program) => {
    totalSpots[program] = Math.ceil(totalPeople / programsList.length);
  });

  for (const program in overrideTotalSpots) {
    if (programsList.includes(program)) {
      totalSpots[program] = overrideTotalSpots[program];
    }
  }

  const totalSpotsSum = Object.values(totalSpots).reduce(
    (acc, curr) => acc + curr,
    0
  );

  if (totalSpotsSum < totalPeople) {
    return {
      error: "Total spots are less than the total number of people.",
      totalSpots: totalSpots,
    };
  }

  const response: Record<number, Assignment[]> = {};

  for (let session = 1; session <= numSessions; session++) {
    programsAssignment[session] = {};
    response[session] = [];

    programsList.forEach((program) => {
      programsAssignment[session][program] = [];
    });

    const usersList: string[] = [];
    const originalOrder: string[] = [];
    const userPreferences: Record<string, string[]> = {};

    await new Promise<void>((resolve, reject) => {
      const bufferStream = new Readable();
      bufferStream.push(csvFile);
      bufferStream.push(null);

      bufferStream
        .pipe(csv())
        .on("data", (row: Record<string, string>) => {
          const name = row[Object.keys(row)[0]].replace(/[\n\r]/g, "");
          originalOrder.push(name);

          const preferences = extractPreferences(row, excludeChars);
          if (preferences) {
            userPreferences[name] = preferences;
            usersList.push(name);
            assignUser(name, preferences, totalSpots, session);
          } else {
            usersList.push(name);
            assignUser(name, null, totalSpots, session);
          }
        })
        .on("end", () => {
          assignUsersWithoutPreferences(totalSpots, session);
          response[session] = formatJsonResponse(
            programsAssignment[session],
            originalOrder,
            userPreferences
          );
          resolve();
        })
        .on("error", reject);
    });
  }

  return { response, programsList };
}

function evaluateAssignments(
  assignments: Record<number, Assignment[]>,
  numSessions: number
): number {
  let score = 0;

  // Determine the highest priority to set dynamic scoring criteria
  let maxPriority = 0;
  for (let session = 1; session <= numSessions; session++) {
    if (assignments[session]) {
      assignments[session].forEach((assignment) => {
        if (assignment.preference > maxPriority) {
          maxPriority = assignment.preference;
        }
      });
    }
  }

  // Generate scoring criteria based on the highest priority
  const scoringCriteria: Record<number, number> = {};
  for (let i = 1; i <= maxPriority; i++) {
    scoringCriteria[i] = maxPriority - i + 1;
  }

  // Calculate score based on the dynamic scoring criteria
  for (let session = 1; session <= numSessions; session++) {
    if (assignments[session]) {
      assignments[session].forEach((assignment) => {
        const preferenceScore = scoringCriteria[assignment.preference] || 0;
        score += preferenceScore;
      });
    }
  }

  return score;
}

export async function generateAssignments(
  csvFile: Buffer,
  excludeChars: number,
  overrideTotalSpots: TotalSpots,
  numSessions: number,
  numSimulations: number
): Promise<AssignmentResult | null> {
  let bestAssignment: AssignmentResult | null = null;
  let bestScore = -Infinity;

  for (let i = 0; i < numSimulations; i++) {
    const assignment = await createAssignments(
      csvFile,
      excludeChars,
      overrideTotalSpots,
      numSessions
    );

    if (assignment.error) {
      return assignment;
    }

    if (assignment.response) {
      const score = evaluateAssignments(assignment.response, numSessions);
      if (score > bestScore) {
        bestScore = score;
        bestAssignment = assignment;
      }
    }
  }

  return bestAssignment;
}
