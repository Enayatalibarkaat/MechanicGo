import { NextRequest, NextResponse } from "next/server";
import { createHmac, timingSafeEqual } from "node:crypto";
import { setSessionCookie } from "@/lib/session";
import connectDB from "@/lib/mongodb";
import User from "@/models/User";

export const runtime = "nodejs";
const COOKIE = "mechanicgo_email_otp";

function signature(payload: string, secret: string) {
  return createHmac("sha256", secret).update(payload).digest("base64url");
}

function secureEqual(a: string, b: string) {
  const left = Buffer.from(a);
  const right = Buffer.from(b);
  return left.length === right.length && timingSafeEqual(left, right);
}

export async function POST(request: NextRequest) {
  const secret = process.env.OTP_SECRET;
  if (!secret) return NextResponse.json({ error: "Email OTP is not configured. Please contact support." }, { status: 503 });

  try {
    const { email, code } = await request.json();
    const normalizedEmail = String(email || "").trim().toLowerCase();
    const enteredCode = String(code || "").replace(/\D/g, "");
    if (!/^\d{6}$/.test(enteredCode)) return NextResponse.json({ error: "Enter the 6-digit code." }, { status: 400 });

    const token = request.cookies.get(COOKIE)?.value;
    if (!token) return NextResponse.json({ error: "Your code expired. Request a new email OTP." }, { status: 401 });
    const [payload, suppliedSignature] = token.split(".");
    if (!payload || !suppliedSignature || !secureEqual(signature(payload, secret), suppliedSignature)) {
      return NextResponse.json({ error: "Verification session is invalid. Request a new code." }, { status: 401 });
    }

    const state = JSON.parse(Buffer.from(payload, "base64url").toString("utf8")) as {
      email: string; codeHash: string; expiresAt: number; attempts: number;
    };
    if (state.expiresAt < Date.now()) {
      const response = NextResponse.json({ error: "Your code expired. Request a new email OTP." }, { status: 401 });
      response.cookies.delete(COOKIE);
      return response;
    }
    if (state.email !== normalizedEmail) return NextResponse.json({ error: "Email does not match the address that received the code." }, { status: 400 });
    if (state.attempts >= 5) {
      const response = NextResponse.json({ error: "Too many incorrect attempts. Request a new code." }, { status: 429 });
      response.cookies.delete(COOKIE);
      return response;
    }

    const enteredHash = createHmac("sha256", secret).update(normalizedEmail + ":" + enteredCode).digest("hex");
    if (!secureEqual(state.codeHash, enteredHash)) {
      state.attempts += 1;
      const nextPayload = Buffer.from(JSON.stringify(state)).toString("base64url");
      const nextToken = nextPayload + "." + signature(nextPayload, secret);
      const response = NextResponse.json({ error: `Incorrect code. ${5 - state.attempts} attempts remaining.` }, { status: 400 });
      response.cookies.set(COOKIE, nextToken, {
        httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "strict",
        path: "/", maxAge: Math.max(1, Math.floor((state.expiresAt - Date.now()) / 1000))
      });
      return response;
    }

    let tokenVersion = 1;
    try {
      await connectDB();
      const existingUser = await User.findOne({ email: normalizedEmail }).select("tokenVersion").lean();
      if (existingUser) tokenVersion = Number(existingUser.tokenVersion || 1);
    } catch (error) {
      console.error("Could not read account session version", error);
      return NextResponse.json({ error: "Account service is temporarily unavailable. Please try again." }, { status: 503 });
    }
    const response = NextResponse.json({ ok: true, message: "Email verified." });
    response.cookies.delete(COOKIE);
    setSessionCookie(response, normalizedEmail, tokenVersion);
    response.cookies.set("mechanicgo_verified_email", normalizedEmail, {
      httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "lax",
      path: "/", maxAge: 60 * 60 * 24 * 30
    });
    response.cookies.set("mechanicgo_auth", "1", {
      httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "lax",
      path: "/", maxAge: 60 * 60 * 24 * 30
    });
    return response;
  } catch {
    return NextResponse.json({ error: "Could not verify this code. Please request a new one." }, { status: 400 });
  }
}
