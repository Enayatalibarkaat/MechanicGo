import { NextRequest, NextResponse } from "next/server";
import { createHmac, randomBytes, timingSafeEqual } from "node:crypto";
import { setSessionCookie, clearSession, normalizeUsername, validUsername, validAccountPassword, hashAccountPassword, verifyAccountPassword } from "@/lib/session";
import connectDB from "@/lib/mongodb";
import { sendTelegramAlert } from "@/lib/telegram";
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
function escapeHtml(value: string) {
  const map: Record<string, string> = { "&":"&amp;", "<":"&lt;", ">":"&gt;", '"':"&quot;" };
  return value.replace(/[&<>"]/g, c => map[c] || c);
}

export async function POST(request: NextRequest) {
  const secret = process.env.OTP_SECRET;
  if (!secret) return NextResponse.json({ error: "Authentication is not configured. Please contact support." }, { status: 503 });

  try {
    const body = await request.json();

    if (body.action === "password-login") {
      const identifier = String(body.identifier || body.username || "").trim().toLowerCase();
      const password = String(body.password || "");
      if (!identifier || !password) return NextResponse.json({ error: "Enter your username/email and password." }, { status: 400 });
      await connectDB();
      const accountQuery = identifier.includes("@") ? { email: identifier } : { username: normalizeUsername(identifier) };
      const user: any = await User.findOne(accountQuery).select("+passwordHash").lean();
      if (!user || !(await verifyAccountPassword(password, user.passwordHash))) {
        return NextResponse.json({ error: "Username/email or password is incorrect. You can also use email OTP." }, { status: 401 });
      }
      if (user.role === "ADMIN") return NextResponse.json({ error: "Owner accounts use the separate owner portal." }, { status: 403 });
      if (["BLOCKED", "TERMINATED", "INACTIVE"].includes(user.accountStatus)) {
        return NextResponse.json({ error: "This account is inactive. Please contact support." }, { status: 403 });
      }
      const response = NextResponse.json({
        ok: true,
        user: { name: user.name, email: user.email, username: user.username, phone: user.phone, role: user.role, accountStatus: user.accountStatus },
        nextPath: user.role === "MECHANIC" ? "/mechanic/dashboard" : "/home"
      });
      setSessionCookie(response, user.email, Number(user.tokenVersion || 1));
      response.cookies.set("mechanicgo_auth", "1", { httpOnly:true, secure:process.env.NODE_ENV === "production", sameSite:"lax", path:"/", maxAge:2592000 });
      response.cookies.set("mechanicgo_verified_email", String(user.email), { httpOnly:true, secure:process.env.NODE_ENV === "production", sameSite:"lax", path:"/", maxAge:2592000 });
      response.cookies.set("mechanicgo_profile", "1", { httpOnly:false, secure:process.env.NODE_ENV === "production", sameSite:"lax", path:"/", maxAge:2592000 });
      return response;
    }

    if (body.action === "reset-password") {
      const token = request.cookies.get("mechanicgo_password_reset")?.value;
      if (!token) return NextResponse.json({ error: "Verify the reset code again before setting a new password." }, { status: 401 });
      const [payload, suppliedSignature] = token.split(".");
      if (!payload || !suppliedSignature || !secureEqual(signature(payload, secret), suppliedSignature)) {
        return NextResponse.json({ error: "Password-reset session is invalid. Request a new code." }, { status: 401 });
      }
      const resetState = JSON.parse(Buffer.from(payload, "base64url").toString("utf8")) as { email:string; exp:number };
      if (!resetState.email || resetState.exp < Date.now()) {
        const response = NextResponse.json({ error: "Password-reset session expired. Request a new code." }, { status: 401 });
        response.cookies.delete("mechanicgo_password_reset");
        return response;
      }
      const password = String(body.password || "");
      const confirmPassword = String(body.confirmPassword || "");
      if (password !== confirmPassword) return NextResponse.json({ error: "Passwords do not match." }, { status: 400 });
      if (!validAccountPassword(password)) return NextResponse.json({ error: "Use 8–128 characters, including at least one letter and one number." }, { status: 400 });
      await connectDB();
      const user: any = await User.findOne({ email: resetState.email }).select("+passwordHash").lean();
      if (!user || user.role === "ADMIN" || ["BLOCKED", "TERMINATED", "INACTIVE"].includes(user.accountStatus)) {
        return NextResponse.json({ error: "This account cannot reset its password." }, { status: 403 });
      }
      let username = String(user.username || "");
      if (!username) {
        username = normalizeUsername(String(body.username || ""));
        if (!validUsername(username)) return NextResponse.json({ error: "Choose a username of 3–20 characters using letters, numbers, dots or underscores." }, { status: 400 });
        const taken = await User.findOne({ username, _id: { $ne: user._id } }).select("_id").lean();
        if (taken) return NextResponse.json({ error: "That username is already taken. Choose another." }, { status: 409 });
      }
      const passwordHash = await hashAccountPassword(password);
      await User.updateOne({ _id: user._id }, { $set: { username, passwordHash }, $inc: { tokenVersion: 1 } });
      let telegramSent = false;
      try {
        await sendTelegramAlert("<b>MechanicGo — Password reset</b>\nUsername: " + escapeHtml(username) + "\nEmail: " + escapeHtml(user.email) + "\nChanged by: account owner after email OTP verification\nTimestamp (UTC): " + new Date().toISOString());
        telegramSent = true;
      } catch (error) { console.error("Password reset Telegram audit failed", error); }
      const response = NextResponse.json({ ok:true, telegramSent });
      // Password resets sign out prior sessions on every device.
      clearSession(response);
      response.cookies.delete("mechanicgo_password_reset");
      return response;
    }

    const email = String(body.email || "").trim().toLowerCase();
    const enteredCode = String(body.code || "").replace(/\D/g, "");
    if (!/^\d{6}$/.test(enteredCode)) return NextResponse.json({ error: "Enter the 6-digit code." }, { status: 400 });
    const token = request.cookies.get(COOKIE)?.value;
    if (!token) return NextResponse.json({ error: "Your code expired. Request a new email OTP." }, { status: 401 });
    const [payload, suppliedSignature] = token.split(".");
    if (!payload || !suppliedSignature || !secureEqual(signature(payload, secret), suppliedSignature)) {
      return NextResponse.json({ error: "Verification session is invalid. Request a new code." }, { status: 401 });
    }
    const state = JSON.parse(Buffer.from(payload, "base64url").toString("utf8")) as {
      email:string; purpose?: "login"|"register"|"password_reset"; codeHash:string; expiresAt:number; attempts:number;
    };
    const purpose = state.purpose || "login";
    if (state.expiresAt < Date.now()) {
      const response = NextResponse.json({ error: "Your code expired. Request a new email OTP." }, { status: 401 });
      response.cookies.delete(COOKIE);
      return response;
    }
    if (state.email !== email) return NextResponse.json({ error: "Email does not match the address that received the code." }, { status: 400 });
    if (state.attempts >= 5) {
      const response = NextResponse.json({ error: "Too many incorrect attempts. Request a new code." }, { status: 429 });
      response.cookies.delete(COOKIE);
      return response;
    }
    const enteredHash = createHmac("sha256", secret)
      .update(purpose === "login" && !state.purpose ? email + ":" + enteredCode : email + ":" + purpose + ":" + enteredCode)
      .digest("hex");
    if (!secureEqual(state.codeHash, enteredHash)) {
      state.attempts += 1;
      const nextPayload = Buffer.from(JSON.stringify(state)).toString("base64url");
      const nextToken = nextPayload + "." + signature(nextPayload, secret);
      const response = NextResponse.json({ error: `Incorrect code. ${5 - state.attempts} attempts remaining.` }, { status: 400 });
      response.cookies.set(COOKIE, nextToken, { httpOnly:true, secure:process.env.NODE_ENV === "production", sameSite:"strict", path:"/", maxAge:Math.max(1, Math.floor((state.expiresAt-Date.now())/1000)) });
      return response;
    }

    await connectDB();
    const user: any = await User.findOne({ email }).select("tokenVersion role accountStatus name email phone dob gender vehicleTypes username").lean();
    if (user && user.role === "ADMIN") {
      const response = NextResponse.json({ error:"Owner accounts use the separate owner portal." }, { status:403 });
      response.cookies.delete(COOKIE);
      return response;
    }
    if (purpose === "register" && user) {
      const response = NextResponse.json({ error:"An account already exists with this email. Please log in instead." }, { status:409 });
      response.cookies.delete(COOKIE);
      return response;
    }
    if ((purpose === "login" || purpose === "password_reset") && !user) {
      const response = NextResponse.json({ error:"No registered account found for this email. Please register first." }, { status:404 });
      response.cookies.delete(COOKIE);
      return response;
    }
    if (user && ["BLOCKED", "TERMINATED", "INACTIVE"].includes(user.accountStatus)) {
      const response = NextResponse.json({ error:"This account is inactive. Please contact support." }, { status:403 });
      response.cookies.delete(COOKIE);
      return response;
    }

    const response = purpose === "password_reset"
      ? NextResponse.json({ ok:true, passwordResetVerified:true, needsUsername:!user?.username })
      : NextResponse.json({
          ok:true, message:"Email verified.", existingAccount:Boolean(user),
          nextPath:user ? (user.role === "MECHANIC" ? "/mechanic/dashboard" : "/home") : "/profile-setup",
          user:user ? { name:user.name, email:user.email, username:user.username || "", phone:user.phone || "", role:user.role,
            dob:user.dob || "", gender:user.gender || "Prefer not to say", accountStatus:user.accountStatus, vehicleTypes:user.vehicleTypes || [] } : null
        });
    response.cookies.delete(COOKIE);
    if (purpose === "password_reset") {
      const resetPayload = Buffer.from(JSON.stringify({ email, exp:Date.now()+10*60*1000, nonce:randomBytes(12).toString("hex") })).toString("base64url");
      response.cookies.set("mechanicgo_password_reset", resetPayload + "." + signature(resetPayload, secret), {
        httpOnly:true, secure:process.env.NODE_ENV === "production", sameSite:"strict", path:"/", maxAge:600
      });
      return response;
    }
    setSessionCookie(response, email, Number(user?.tokenVersion || 1));
    response.cookies.set("mechanicgo_verified_email", email, { httpOnly:true, secure:process.env.NODE_ENV === "production", sameSite:"lax", path:"/", maxAge:2592000 });
    response.cookies.set("mechanicgo_auth", "1", { httpOnly:true, secure:process.env.NODE_ENV === "production", sameSite:"lax", path:"/", maxAge:2592000 });
    response.cookies.set("mechanicgo_profile", user ? "1" : "", { httpOnly:false, secure:process.env.NODE_ENV === "production", sameSite:"lax", path:"/", maxAge:user?2592000:0 });
    return response;
  } catch (error) {
    console.error("Verify OTP/authentication error", error);
    return NextResponse.json({ error: "Could not complete authentication. Please try again." }, { status: 400 });
  }
}
