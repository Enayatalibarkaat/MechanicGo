import { NextRequest, NextResponse } from "next/server";
import { createHash, timingSafeEqual } from "node:crypto";

export const runtime = "nodejs";

function safeEqual(a: string, b: string) {
  const left = Buffer.from(a);
  const right = Buffer.from(b);
  return left.length === right.length && timingSafeEqual(left, right);
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const username = String(body.username || "").trim();
    const password = String(body.password || "");
    const expectedUsername = process.env.DEFAULT_LOGIN_USERNAME;
    const expectedPassword = process.env.DEFAULT_LOGIN_PASSWORD;

    if (!expectedUsername || !expectedPassword) {
      return NextResponse.json({ error: "Username/password login is not configured yet." }, { status: 503 });
    }

    const usernameMatches = safeEqual(username.toLowerCase(), expectedUsername.trim().toLowerCase());
    const passwordMatches = safeEqual(createHash("sha256").update(password).digest("hex"), createHash("sha256").update(expectedPassword).digest("hex"));

    if (!usernameMatches || !passwordMatches) {
      return NextResponse.json({ error: "Incorrect username or password." }, { status: 401 });
    }

    const response = NextResponse.json({ ok: true, username: expectedUsername, name: expectedUsername });
    response.cookies.set("mechanicgo_auth", "1", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 30
    });
    response.cookies.set("mechanicgo_username", expectedUsername, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 30
    });
    return response;
  } catch {
    return NextResponse.json({ error: "Could not sign in. Please try again." }, { status: 400 });
  }
}
