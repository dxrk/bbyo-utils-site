import { NextResponse } from "next/server";
import { awardsInfo } from "@/lib/awards";

export async function GET() {
  try {
    return NextResponse.json({
      types: Object.keys(awardsInfo),
    });
  } catch (error) {
    console.error("Error fetching award types:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
