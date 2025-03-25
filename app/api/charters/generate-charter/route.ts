import { NextRequest, NextResponse } from "next/server";
import redis from "@/lib/redis";
import { generateSvg, generateBuffer } from "@/lib/charters";

export async function POST(request: NextRequest) {
  try {
    const data = await request.json();
    const { memberList, charter, chapter, community, date, override } = data;

    if (
      (memberList === "" && !charter.includes("Temporary")) ||
      charter === "" ||
      chapter === "" ||
      community === ""
    ) {
      return NextResponse.json(
        { message: "Please fill out all fields." },
        { status: 400 }
      );
    }

    // Get the base URL from the request headers
    const baseUrl = request.headers.get("origin") || "";

    // Generate the SVG
    const svg = await generateSvg(
      memberList,
      chapter,
      community,
      charter,
      date || new Date().toISOString(),
      override,
      baseUrl
    );

    // Convert SVG to PNG buffer
    const buffer = await generateBuffer(svg, charter);

    // Generate random number for filename
    const randomNumber = Math.floor(1000 + Math.random() * 9000);
    const outputFile = `${chapter.split(" ")[0]}-${randomNumber}.png`;

    // Store the generated image in Redis with a 24-hour expiration
    const imageId = Date.now().toString();
    await redis.set(`charter:${imageId}`, buffer, "EX", 86400);

    return NextResponse.json({
      success: true,
      message: "Charter certificate generated successfully",
      imageId,
      filename: outputFile,
    });
  } catch (error) {
    console.error("Error generating charter:", error);
    return NextResponse.json(
      { message: "Internal Server Error", error: (error as Error).message },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const imageId = request.nextUrl.searchParams.get("id");

    if (!imageId) {
      return NextResponse.json(
        { message: "Image ID is required" },
        { status: 400 }
      );
    }

    // Retrieve the image from Redis
    const buffer = await redis.getBuffer(`charter:${imageId}`);

    if (!buffer) {
      return NextResponse.json(
        { message: "Image not found or expired" },
        { status: 404 }
      );
    }

    // Set appropriate headers for image download
    const filename =
      request.nextUrl.searchParams.get("filename") || "charter.png";
    const headers = new Headers();
    headers.set("Content-Type", "image/png");
    headers.set("Content-Disposition", `attachment; filename=${filename}`);

    return new NextResponse(buffer, {
      headers,
      status: 200,
    });
  } catch (error) {
    console.error("Error retrieving charter image:", error);
    return NextResponse.json(
      { message: "Internal Server Error", error: (error as Error).message },
      { status: 500 }
    );
  }
}
