import { NextRequest, NextResponse } from "next/server";
import { createHash, timingSafeEqual } from "node:crypto";
import connectDB from "@/lib/mongodb";
import { setSessionCookie } from "@/lib/session";
import User from "@/models/User";

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
    const adminEmail = process.env.ADMIN_EMAIL?.trim().toLowerCase();

    if (!expectedUsername || !expectedPassword) {
      return NextResponse.json({ error: "Username/password login is not configured yet." }, { status: 503 });
    }
    if (!adminEmail) {
      return NextResponse.json({ error: "Set ADMIN_EMAIL in Vercel Environment Variables, or use Email OTP login." }, { status: 503 });
    }

    const usernameMatches = safeEqual(username.toLowerCase(), expectedUsername.trim().toLowerCase());
    const passwordMatches = safeEqual(
      createHash("sha256").update(password).digest("hex"),
      createHash("sha256").update(expectedPassword).digest("hex")
    );
    if (!usernameMatches || !passwordMatches) {
      return NextResponse.json({ error: "Incorrect username or password." }, { status: 401 });
    }

    await connectDB();
    const user: any = await User.findOne({ email: adminEmail }).select("tokenVersion name accountStatus").lean();
    if (user && ["BLOCKED", "TERMINATED", "INACTIVE"].includes(user.accountStatus)) {
      return NextResponse.json({ error: "This admin account is inactive. Please contact support." }, { status: 403 });
    }

    const response = NextResponse.json({
      ok: true,
      username: expectedUsername,
      name: user?.name || expectedUsername,
      email: adminEmail,
      needsProfile: !user
    });
    setSessionCookie(response, adminEmail, Number(user?.tokenVersion || 1));
    response.cookies.set("mechanicgo_auth", "1", {
      httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "lax",
      path: "/", maxAge: 60 * 60 * 24 * 30
    });
    response.cookies.set("mechanicgo_verified_email", adminEmail, {
      httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "lax",
      path: "/", maxAge: 60 * 60 * 24 * 30
    });
    return response;
  } catch (error) {
    console.error("Password login error", error);
    return NextResponse.json({ error: "Could not sign in. Please check the database connection and try again." }, { status: 503 });
  }
}
