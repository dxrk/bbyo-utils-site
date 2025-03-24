import { NextResponse } from "next/server";
import { getStorage } from "@/lib/airtable";

export async function POST() {
  try {
    const storage = await getStorage();

    if (!storage.finishedChecking) {
      return NextResponse.json({
        message: "Airtable checked successfully",
        totalRecords: storage.lastTotal,
        totalChecked: storage.totalChecked,
        finishedChecking: storage.finishedChecking,
      });
    } else {
      return NextResponse.json({
        message: "Airtable processed successfully",
        updatedRecords: storage.updatedRecords,
        newRecords: storage.newRecords,
        totalRecords: storage.lastTotal,
        totalChanges: storage.totalChanges,
        finishedChecking: storage.finishedChecking,
      });
    }
  } catch (error) {
    console.error("Error checking progress:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
