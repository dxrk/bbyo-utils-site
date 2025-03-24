import { NextRequest, NextResponse } from "next/server";
import { processCSVInBackground } from "@/lib/airtable";

// Max content length 10MB
export const config = {
  api: {
    bodyParser: {
      sizeLimit: "10mb",
    },
  },
};

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get("csv") as File;

    if (!file) {
      return NextResponse.json(
        { error: "No CSV file provided" },
        { status: 400 }
      );
    }

    // Convert file to buffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Start processing in background
    await processCSVInBackground(buffer);

    return NextResponse.json({ message: "Processing started..." });
  } catch (error) {
    console.error("Error processing CSV:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
