import { NextRequest, NextResponse } from "next/server";
import { createHmac, randomInt, timingSafeEqual } from "node:crypto";
import nodemailer from "nodemailer";

export const runtime = "nodejs";
const COOKIE = "mechanicgo_email_otp";

function sign(payload: string, secret: string) {
  return createHmac("sha256", secret).update(payload).digest("base64url");
}

function isValidOtpCookie(token: string | undefined, secret: string) {
  if (!token) return null;
  const [payload, supplied] = token.split(".");
  if (!payload || !supplied) return null;
  try {
    const expectedBuffer = Buffer.from(sign(payload, secret));
    const suppliedBuffer = Buffer.from(supplied);
    if (expectedBuffer.length !== suppliedBuffer.length || !timingSafeEqual(expectedBuffer, suppliedBuffer)) return null;
    return JSON.parse(Buffer.from(payload, "base64url").toString("utf8")) as { sentAt?: number; expiresAt?: number };
  } catch {
    return null;
  }
}

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json();
    const normalizedEmail = String(email || "").trim().toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) {
      return NextResponse.json({ error: "Enter a valid email address." }, { status: 400 });
    }

    const user = process.env.GMAIL_USER;
    const password = process.env.GMAIL_APP_PASSWORD?.replace(/\s/g, "");
    const secret = process.env.OTP_SECRET;
    if (!user || !password || !secret) {
      return NextResponse.json({
        error: "Email OTP is not configured yet. Add GMAIL_USER, GMAIL_APP_PASSWORD and OTP_SECRET in Vercel → Project Settings → Environment Variables."
      }, { status: 503 });
    }

    const now = Date.now();
    const priorOtp = isValidOtpCookie(request.cookies.get(COOKIE)?.value, secret);
    if (priorOtp?.expiresAt && priorOtp.expiresAt > now && priorOtp.sentAt && now - priorOtp.sentAt < 30_000) {
      const retryAfter = Math.ceil((30_000 - (now - priorOtp.sentAt)) / 1000);
      return NextResponse.json({ error: `Please wait ${retryAfter} seconds before requesting another code.` }, {
        status: 429,
        headers: { "Retry-After": String(retryAfter) }
      });
    }

    const code = String(randomInt(0, 1_000_000)).padStart(6, "0");
    const expiresAt = now + 5 * 60 * 1000;
    const codeHash = createHmac("sha256", secret).update(normalizedEmail + ":" + code).digest("hex");
    const payload = Buffer.from(JSON.stringify({ email: normalizedEmail, codeHash, expiresAt, sentAt: now, attempts: 0 })).toString("base64url");
    const token = payload + "." + sign(payload, secret);

    const transporter = nodemailer.createTransport({
      host: "smtp.gmail.com",
      port: 465,
      secure: true,
      auth: { user, pass: password }
    });
    await transporter.sendMail({
      from: { name: "MechanicGo", address: user },
      to: normalizedEmail,
      subject: "Your MechanicGo verification code",
      text: `Your MechanicGo verification code is ${code}. It expires in 5 minutes. If you did not request this, you can ignore this email.`,
      html: `<div style="font-family:Arial,sans-serif;max-width:520px;margin:auto;padding:28px;color:#101828"><div style="font-size:24px;font-weight:800;color:#2563eb">MechanicGo</div><h2>Verify your email</h2><p>Use this one-time code to continue:</p><div style="font-size:34px;letter-spacing:9px;font-weight:800;background:#f1f5ff;padding:18px;border-radius:14px;text-align:center;color:#1d4ed8">${code}</div><p>This code expires in 5 minutes. Never share it with anyone.</p><p style="font-size:12px;color:#667085">If you did not request this code, you can safely ignore this message.</p></div>`
    });

    const response = NextResponse.json({ ok: true, message: "Verification code sent." });
    response.cookies.set(COOKIE, token, {
      httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "strict",
      path: "/", maxAge: 300
    });
    return response;
  } catch {
    return NextResponse.json({ error: "We couldn't send the email. Check Gmail SMTP settings and try again." }, { status: 500 });
  }
}
