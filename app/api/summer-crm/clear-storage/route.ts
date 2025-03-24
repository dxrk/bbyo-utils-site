import { NextResponse } from "next/server";
import { clearStorage } from "@/lib/airtable";

export async function POST() {
  try {
    await clearStorage();
    return NextResponse.json({ message: "Storage cleared successfully!" });
  } catch (error) {
    console.error("Error clearing storage:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
