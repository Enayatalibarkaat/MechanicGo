import { createHmac, timingSafeEqual } from "node:crypto";
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
export async function requireAdmin(request: NextRequest) {
  const session = readSession(request);
  const configuredAdmin = process.env.ADMIN_EMAIL?.trim().toLowerCase();
  if (!session || !configuredAdmin || session.email !== configuredAdmin) return { error: "Admin access required. Configure ADMIN_EMAIL and sign in with that verified email.", status: 403 as const };
  await connectDB();
  const user = await User.findOne({ email: session.email });
  if (user && Number(user.tokenVersion ?? 1) !== session.tokenVersion) return { error: "Admin session expired. Sign in again.", status: 401 as const };
  return { email: session.email, user };
}
export function clearSession(response: NextResponse) {
  response.cookies.set(COOKIE, "", { httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "lax", path: "/", maxAge: 0 });
  response.cookies.set("mechanicgo_auth", "", { httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "lax", path: "/", maxAge: 0 });
  response.cookies.set("mechanicgo_verified_email", "", { httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "lax", path: "/", maxAge: 0 });
}
