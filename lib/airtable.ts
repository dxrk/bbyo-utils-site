import redis from "@/lib/redis";
import { parse } from "csv-parse/sync";

// Define types for better TypeScript support
type AirtableRecord = {
  id: string;
  fields: Record<string, string | number | string[]>;
};

type Program = {
  programName: string;
  airtableId: string;
};

// type Field = {
//   csvValue: string;
//   airtableValue: string;
//   checkforComparison: boolean;
//   isNum: boolean;
//   isList: boolean;
// };

interface StorageData {
  updatedRecords: AirtableRecord[];
  newRecords: AirtableRecord[];
  totalChanges: number;
  totalChecked: number;
  lastTotal: number;
  finishedChecking: boolean;
}

// Cache keys
const STORAGE_KEY = "airtable:storage";
const PROGRAMS_KEY = "airtable:programs";
const FIELDS_KEY = "airtable:fields";

// Helper functions
const formatForComp = (value: string | number | null | undefined): string => {
  return String(value || "")
    .replace(/\s/g, "")
    .toLowerCase();
};

export const removeEmptyFields = (
  fields: Record<string, string | number | string[]>
): Record<string, string | number | string[]> => {
  Object.keys(fields).forEach((key) => {
    if (key !== "Program Registered For" && key !== "Canceled Programs") {
      if (
        fields[key] === null ||
        fields[key] === "" ||
        fields[key] === undefined
      ) {
        delete fields[key];
      }
    }
    // if it's an array, remove duplicates
    if (Array.isArray(fields[key])) {
      fields[key] = Array.from(new Set(fields[key]));
    }
  });

  return fields;
};

export const getCurrentDateFormatted = (): string => {
  const options: Intl.DateTimeFormatOptions = {
    month: "numeric",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "numeric",
    hour12: true,
    timeZoneName: "short",
  };

  const date = new Date();
  const formattedDate = date.toLocaleString("en-US", options);

  return formattedDate;
};

// Initialize storage in Redis
export const initStorage = async (): Promise<void> => {
  const storageExists = await redis.exists(STORAGE_KEY);
  if (!storageExists) {
    await redis.set(
      STORAGE_KEY,
      JSON.stringify({
        updatedRecords: [],
        newRecords: [],
        totalChanges: 0,
        totalChecked: 0,
        lastTotal: 0,
        finishedChecking: false,
      })
    );
  }
};

// Get storage from Redis
export const getStorage = async (): Promise<StorageData> => {
  await initStorage();
  const storage = await redis.get(STORAGE_KEY);
  return JSON.parse(storage || "{}") as StorageData;
};

// Update storage in Redis
export const updateStorage = async (data: StorageData): Promise<void> => {
  await redis.set(STORAGE_KEY, JSON.stringify(data));
};

// Clear storage in Redis
export const clearStorage = async (): Promise<void> => {
  await redis.set(
    STORAGE_KEY,
    JSON.stringify({
      updatedRecords: [],
      newRecords: [],
      totalChanges: 0,
      totalChecked: 0,
      lastTotal: 0,
      finishedChecking: false,
    })
  );
};

// Convert CSV buffer to array of records
export const parseCSVBuffer = (buffer: Buffer): Record<string, string>[] => {
  return parse(buffer, {
    columns: true,
    skip_empty_lines: true,
  });
};

// Convert program names to Airtable IDs
export const convertPrograms = async (
  airtablePrograms: string
): Promise<string> => {
  const programs: Program[] = JSON.parse(
    (await redis.get(PROGRAMS_KEY)) || "[]"
  );

  const listOfPrograms = airtablePrograms.split(",");

  listOfPrograms.forEach((program, index) => {
    const checkProgram = formatForComp(program);

    programs.forEach((program) => {
      if (checkProgram === formatForComp(program.programName)) {
        listOfPrograms[index] = program.airtableId;
      }
    });
  });

  // If both Kallah and ILTC are selected,
  // remove them and add Full Perlman
  if (
    listOfPrograms.includes("recUKSHNQiTkcKO4D") &&
    listOfPrograms.includes("rec4imJ35LMVZiHyI")
  ) {
    listOfPrograms.splice(listOfPrograms.indexOf("recUKSHNQiTkcKO4D"), 1);
    listOfPrograms.splice(listOfPrograms.indexOf("rec4imJ35LMVZiHyI"), 1);
    listOfPrograms.push("recUKSHNQiTkcKO4D");
  }

  // Remove duplicates
  const uniquePrograms = Array.from(new Set(listOfPrograms));

  return uniquePrograms.join(",");
};

// Process CSV in background and find changed records
export const processCSVInBackground = async (buffer: Buffer): Promise<void> => {
  try {
    const storage = await getStorage();
    storage.finishedChecking = false;
    storage.totalChecked = 0;
    await updateStorage(storage);

    const csvRecords = parseCSVBuffer(buffer);

    // Convert all programs to their ID's
    for (const csvRecord of csvRecords) {
      if (csvRecord["Summer Registration Info"]) {
        csvRecord["Summer Registration Info"] = await convertPrograms(
          csvRecord["Summer Registration Info"]
        );
      }
    }

    // Use Airtable API through client-side fetch instead of direct Airtable.js SDK
    // This would be integrated with your Next.js API handler

    // The rest of the implementation would happen in your API endpoint
    // This includes finding changed records, handling updates, etc.

    // For now, just store the processed CSV records for the API to use
    await redis.set("airtable:csvRecords", JSON.stringify(csvRecords));
    await redis.set("airtable:processing", "true");
    await redis.expire("airtable:processing", 3600); // Expire after 1 hour
  } catch (error) {
    console.error("Error processing CSV:", error);
    throw error;
  }
};

interface AirtableResponse {
  message: string;
  records: AirtableRecord[];
}

// Update Airtable records through API
export const updateAirtableRecords = async (
  records: AirtableRecord[],
  isNew: boolean
): Promise<AirtableResponse> => {
  // This would be implemented in your API endpoint using the Airtable API
  // Here we're just stubbing the interface
  return {
    message: `Airtable would be updated with ${records.length} records (${
      isNew ? "new" : "updated"
    })`,
    records,
  };
};

// Import the necessary programs and fields data from the server to Redis
export const importAirtableData = async (): Promise<void> => {
  try {
    // In a real implementation, you'd load these from files or an API
    // For now, we'll just use placeholders

    const programs = [
      { programName: "ILSI", airtableId: "reci1Tcq1MbNWnjcT" },
      { programName: "ILTC", airtableId: "rec4imJ35LMVZiHyI" },
      { programName: "CLTC", airtableId: "recJVIjWdz2aHp3Uf" },
      { programName: "Kallah", airtableId: "recUKSHNQiTkcKO4D" },
      // Add more programs as needed
    ];

    const fields = [
      {
        csvValue: "myBBYO ID",
        airtableValue: "myBBYO ID",
        checkforComparison: true,
        isNum: true,
        isList: false,
      },
      {
        csvValue: "First Name",
        airtableValue: "First Name",
        checkforComparison: true,
        isNum: false,
        isList: false,
      },
      {
        csvValue: "Last Name",
        airtableValue: "Last Name",
        checkforComparison: true,
        isNum: false,
        isList: false,
      },
      {
        csvValue: "Summer Registration Info",
        airtableValue: "Program Registered For",
        checkforComparison: true,
        isNum: false,
        isList: true,
      },
      // Add more fields as needed
    ];

    await redis.set(PROGRAMS_KEY, JSON.stringify(programs));
    await redis.set(FIELDS_KEY, JSON.stringify(fields));
  } catch (error) {
    console.error("Error importing Airtable data:", error);
    throw error;
  }
};
