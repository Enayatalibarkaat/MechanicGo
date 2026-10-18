import { createHmac, randomBytes, scrypt as scryptCallback, timingSafeEqual } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import User from "@/models/User";

const COOKIE = "mechanicgo_session";
function secret() { const s = process.env.OTP_SECRET || process.env.SESSION_SECRET; if (!s) throw new Error("Missing OTP_SECRET or SESSION_SECRET"); return s; }
function signature(payload: string) { return createHmac("sha256", secret()).update(payload).digest("base64url"); }
export function createSession(email: string, tokenVersion = 1) {
  const payload = Buffer.from(JSON.stringify({ email: email.toLowerCase(), tokenVersion, exp: Date.now() + 30 * 24 * 60 * 60 * 1000 })).toString("base64url");
  return payload + "." + signature(payload);
}
export function setSessionCookie(response: NextResponse, email: string, tokenVersion = 1) {
  response.cookies.set(COOKIE, createSession(email, tokenVersion), { httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "lax", path: "/", maxAge: 60 * 60 * 24 * 30 });
}
export function readSession(request: NextRequest): { email: string; tokenVersion: number } | null {
  try {
    const token = request.cookies.get(COOKIE)?.value;
    if (!token) return null;
    const [payload, sig] = token.split(".");
    if (!payload || !sig) return null;
    const expected = Buffer.from(signature(payload)); const supplied = Buffer.from(sig);
    if (expected.length !== supplied.length || !timingSafeEqual(expected, supplied)) return null;
    const state = JSON.parse(Buffer.from(payload, "base64url").toString("utf8"));
    if (!state.email || !Number.isFinite(state.exp) || state.exp < Date.now()) return null;
    return { email: String(state.email).toLowerCase(), tokenVersion: Number(state.tokenVersion ?? 1) };
  } catch { return null; }
}
export async function currentUser(request: NextRequest, allowPending = false) {
  const session = readSession(request);
  if (!session) return { error: "Please sign in again.", status: 401 as const };
  await connectDB();
  const user = await User.findOne({ email: session.email });
  if (!user) return { error: "Complete your profile before continuing.", status: 401 as const };
  if (user.role === "ADMIN") return { error: "This account uses the separate owner portal.", status: 403 as const };
  if (["BLOCKED", "TERMINATED", "INACTIVE"].includes(user.accountStatus)) {
    const message = user.accountStatus === "TERMINATED"
      ? "Your partner account has been terminated by Admin. Please contact support."
      : user.accountStatus === "BLOCKED"
      ? "Your partner account has been suspended by Admin. Please contact support."
      : "Your account is inactive. Please contact support.";
    return { error: message, status: 403 as const };
  }
  if (Number(user.tokenVersion ?? 1) !== session.tokenVersion) return { error: "Your session has been invalidated. Please sign in again.", status: 401 as const };
  if (!allowPending && user.role === "MECHANIC" && user.accountStatus !== "ACTIVE") return { error: "Your mechanic account is awaiting admin approval.", status: 403 as const };
  return { user, session };
}

const PASSWORD_KEY_LENGTH = 64;

function derivePasswordKey(password: string, salt: string): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    scryptCallback(password, salt, PASSWORD_KEY_LENGTH, (error, key) => {
      if (error) reject(error);
      else resolve(key as Buffer);
    });
  });
}

export function normalizeUsername(value: string) {
  return value.trim().toLowerCase();
}

export function validUsername(value: string) {
  return /^[a-z0-9][a-z0-9_.]{4,19}$/.test(value);
}

export function validAccountPassword(value: string) {
  return value.length >= 8 && value.length <= 128 && /[A-Za-z]/.test(value) && /\d/.test(value);
}

export async function hashAccountPassword(password: string) {
  const salt = randomBytes(16).toString("hex");
  const key = await derivePasswordKey(password, salt);
  return "scrypt$" + salt + "$" + key.toString("hex");
}

export async function verifyAccountPassword(password: string, stored: string | undefined | null) {
  if (!stored) return false;
  const parts = stored.split("$");
  if (parts.length !== 3 || parts[0] !== "scrypt" ||
      !/^[a-f0-9]{32}$/.test(parts[1]) || !/^[a-f0-9]{128}$/.test(parts[2])) return false;
  try {
    const expected = Buffer.from(parts[2], "hex");
    const actual = await derivePasswordKey(password, parts[1]);
    return expected.length === actual.length && timingSafeEqual(expected, actual);
  } catch {
    return false;
  }
}

export function clearSession(response: NextResponse) {
  response.cookies.set(COOKIE, "", { httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "lax", path: "/", maxAge: 0 });
  response.cookies.set("mechanicgo_auth", "", { httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "lax", path: "/", maxAge: 0 });
  response.cookies.set("mechanicgo_verified_email", "", { httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "lax", path: "/", maxAge: 0 });
  response.cookies.set("mechanicgo_profile", "", { httpOnly: false, secure: process.env.NODE_ENV === "production", sameSite: "lax", path: "/", maxAge: 0 });
}
