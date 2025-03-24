import { NextResponse } from "next/server";
import { awardsInfo } from "@/lib/awards";

export async function POST(req: Request) {
  try {
    const body = await req.json();

    if (!body.award) {
      return NextResponse.json(
        { valid: false, message: "Award type is required" },
        { status: 400 }
      );
    }

    // Check if award type exists in awardsInfo
    const isValid = Object.keys(awardsInfo).some(
      (type) => type.toLowerCase() === body.award.toLowerCase()
    );

    if (isValid) {
      return NextResponse.json({ valid: true });
    } else {
      return NextResponse.json(
        { valid: false, message: "Unknown award type" },
        { status: 200 }
      );
    }
  } catch (error) {
    console.error("Error validating award:", error);
    return NextResponse.json(
      { valid: false, message: "Internal server error" },
      { status: 500 }
    );
  }
}
