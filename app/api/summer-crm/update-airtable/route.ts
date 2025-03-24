import { NextRequest, NextResponse } from "next/server";
import { getStorage, updateAirtableRecords } from "@/lib/airtable";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { records, new: isNew } = body;

    if (!records || !Array.isArray(records)) {
      return NextResponse.json(
        { error: "Invalid records format" },
        { status: 400 }
      );
    }

    const storage = await getStorage();

    // Update Airtable with the records
    await updateAirtableRecords(records, isNew);

    return NextResponse.json({
      message: `Airtable updated successfully for ${records.length} records`,
      records,
      totalRecords: storage.lastTotal,
    });
  } catch (error) {
    console.error("Error updating Airtable:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
