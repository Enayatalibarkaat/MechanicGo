import { NextRequest, NextResponse } from "next/server";
import { createHmac, randomInt, timingSafeEqual } from "node:crypto";
import nodemailer from "nodemailer";
import connectDB from "@/lib/mongodb";
import User from "@/models/User";

export const runtime = "nodejs";
const COOKIE = "mechanicgo_email_otp";
type OtpPurpose = "login" | "register" | "password_reset";

function sign(payload: string, secret: string) {
  return createHmac("sha256", secret).update(payload).digest("base64url");
}
function isValidOtpCookie(token: string | undefined, secret: string) {
  if (!token) return null;
  const [payload, supplied] = token.split(".");
  if (!payload || !supplied) return null;
  try {
    const expected = Buffer.from(sign(payload, secret));
    const actual = Buffer.from(supplied);
    if (expected.length !== actual.length || !timingSafeEqual(expected, actual)) return null;
    return JSON.parse(Buffer.from(payload, "base64url").toString("utf8")) as {
      email?: string; purpose?: OtpPurpose; sentAt?: number; expiresAt?: number;
    };
  } catch { return null; }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const email = String(body.email || "").trim().toLowerCase();
    const purpose = (["login", "register", "password_reset"].includes(body.purpose) ? body.purpose : "login") as OtpPurpose;
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json({ error: "Enter a valid email address." }, { status: 400 });
    }
    const sender = process.env.GMAIL_USER;
    const appPassword = process.env.GMAIL_APP_PASSWORD?.replace(/\s/g, "");
    const secret = process.env.OTP_SECRET;
    if (!sender || !appPassword || !secret) {
      return NextResponse.json({ error: "Email OTP is not configured. Check GMAIL_USER, GMAIL_APP_PASSWORD and OTP_SECRET in Vercel." }, { status: 503 });
    }

    await connectDB();
    const existing: any = await User.findOne({ email }).select("_id username role accountStatus").lean();
    if (purpose === "register" && existing) {
      return NextResponse.json({ error: "An account already exists with this email. Please log in instead." }, { status: 409 });
    }
    if ((purpose === "login" || purpose === "password_reset") && !existing) {
      return NextResponse.json({ error: "No registered account found for this email. Please register first." }, { status: 404 });
    }
    if (existing && existing.role === "ADMIN") {
      return NextResponse.json({ error: "Owner accounts use the separate owner portal." }, { status: 403 });
    }
    if (existing && ["BLOCKED", "TERMINATED", "INACTIVE"].includes(existing.accountStatus)) {
      return NextResponse.json({ error: "This account is inactive. Please contact support." }, { status: 403 });
    }

    const now = Date.now();
    const prior = isValidOtpCookie(request.cookies.get(COOKIE)?.value, secret);
    if (prior?.email === email && prior?.purpose === purpose && prior.expiresAt && prior.expiresAt > now && prior.sentAt && now - prior.sentAt < 30_000) {
      const wait = Math.ceil((30_000 - (now - prior.sentAt)) / 1000);
      return NextResponse.json({ error: `Please wait ${wait} seconds before requesting another code.` }, { status: 429, headers: { "Retry-After": String(wait) } });
    }

    const code = String(randomInt(0, 1_000_000)).padStart(6, "0");
    const expiresAt = now + 5 * 60 * 1000;
    const codeHash = createHmac("sha256", secret).update(email + ":" + purpose + ":" + code).digest("hex");
    const payload = Buffer.from(JSON.stringify({ email, purpose, codeHash, expiresAt, sentAt: now, attempts: 0 })).toString("base64url");
    const token = payload + "." + sign(payload, secret);

    const transporter = nodemailer.createTransport({ host: "smtp.gmail.com", port: 465, secure: true, auth: { user: sender, pass: appPassword } });
    await transporter.sendMail({
      from: { name: "MechanicGo", address: sender },
      to: email,
      subject: purpose === "password_reset" ? "Reset your MechanicGo password" : "Your MechanicGo verification code",
      text: purpose === "password_reset"
        ? `Your MechanicGo password reset code is ${code}. It expires in 5 minutes. If you did not request this, ignore this email.`
        : `Your MechanicGo verification code is ${code}. It expires in 5 minutes. If you did not request this, ignore this email.`,
      html: `<div style="font-family:Arial,sans-serif;max-width:520px;margin:auto;padding:28px;color:#101828"><div style="font-size:24px;font-weight:800;color:#2563eb">MechanicGo</div><h2>${purpose === "password_reset" ? "Reset your password" : "Verify your email"}</h2><p>Use this one-time code to continue:</p><div style="font-size:34px;letter-spacing:9px;font-weight:800;background:#f1f5ff;padding:18px;border-radius:14px;text-align:center;color:#1d4ed8">${code}</div><p>This code expires in 5 minutes. Never share it with anyone.</p></div>`
    });

    const response = NextResponse.json({ ok: true, message: purpose === "password_reset" ? "If an account exists, a reset code has been sent." : "Verification code sent." });
    response.cookies.set(COOKIE, token, { httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "strict", path: "/", maxAge: 300 });
    return response;
  } catch (error) {
    console.error("Send OTP error", error);
    return NextResponse.json({ error: "We couldn't send the email. Check Gmail SMTP settings and try again." }, { status: 500 });
  }
}
