import { NextResponse } from "next/server";
import { clearSession } from "@/lib/session";
export async function POST() {
  const response = NextResponse.json({ ok: true });
  clearSession(response);
  response.cookies.set("mechanicgo_email_otp", "", { httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "strict", path: "/", maxAge: 0 });
  return response;
}
