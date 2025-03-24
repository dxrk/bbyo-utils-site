import { NextRequest, NextResponse } from "next/server";
import redis from "@/lib/redis";
import { generateAssignments } from "@/lib/assignments";

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const csvFile = formData.get("csv") as File;
    const excludeChars = parseInt(formData.get("excludeChars") as string) || 0;
    const overrideTotalSpots =
      JSON.parse(formData.get("overrideTotalSpots") as string) || {};
    const numSessions = parseInt(formData.get("numSessions") as string) || 1;
    const simulations = parseInt(formData.get("simulations") as string) || 1;

    // Process the data
    const buffer = Buffer.from(await csvFile.arrayBuffer());
    const result = await generateAssignments(
      buffer,
      excludeChars,
      overrideTotalSpots,
      numSessions,
      simulations
    );

    // Store in Redis with expiration (e.g., 24 hours)
    const resultId = Date.now().toString();
    await redis.set(
      `assignment:${resultId}`,
      JSON.stringify(result),
      "EX",
      86400
    );

    return NextResponse.json({ resultId, ...result });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { message: "Internal Server Error", error: (error as Error).message },
      { status: 500 }
    );
  }
}
