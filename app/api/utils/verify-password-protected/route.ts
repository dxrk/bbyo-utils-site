import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const { password } = await request.json();
    const correctPassword = process.env.DEPRECATED_TOOLS_PASSWORD;

    if (!correctPassword) {
      return NextResponse.json(
        { message: "Server configuration error" },
        { status: 500 }
      );
    }

    if (password === correctPassword) {
      // Set the password in a cookie that expires in 24 hours
      const response = NextResponse.json({ success: true });
      response.cookies.set("deprecated_tools_password", password, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        maxAge: 60 * 60 * 24, // 24 hours
      });
      return response;
    }

    return NextResponse.json({ message: "Invalid password" }, { status: 401 });
  } catch (error) {
    console.error("Error verifying password:", error);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  }
}
