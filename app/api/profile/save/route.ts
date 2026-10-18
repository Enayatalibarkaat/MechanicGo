import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import { readSession, setSessionCookie, normalizeUsername, validUsername, validAccountPassword, hashAccountPassword, verifyAccountPassword } from "@/lib/session";
import { sendTelegramAlert, uploadTelegramFile } from "@/lib/telegram";
import User from "@/models/User";
export const runtime = "nodejs";

function ageAtLeast18(dob: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dob)) return false;
  const birth = new Date(dob + "T00:00:00.000Z");
  if (Number.isNaN(birth.getTime()) || birth.toISOString().slice(0, 10) !== dob) return false;
  const now = new Date();
  let age = now.getUTCFullYear() - birth.getUTCFullYear();
  if (now.getUTCMonth() < birth.getUTCMonth() || (now.getUTCMonth() === birth.getUTCMonth() && now.getUTCDate() < birth.getUTCDate())) age--;
  return age >= 18 && dob <= now.toISOString().slice(0, 10);
}
function escapeHtml(value: string) { const entities: Record<string, string> = { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"' : "&quot;" }; return value.replace(/[&<>"]/g, c => entities[c] || c); }

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const session = readSession(request);
    const name = String(body.name || "").trim().slice(0, 80);
    const dob = String(body.dob || "");
    const email = String(body.email || "").trim().toLowerCase();
    const gender = String(body.gender || "Prefer not to say").slice(0, 40);
    const phone = String(body.phone || "").trim().slice(0, 30);
    const termsAccepted = body.termsAccepted === true;
    const consent = body.profileNotificationsConsent === true;
    const requestedRole = String(body.role || "CUSTOMER").toUpperCase();
    const vehicleTypes = Array.isArray(body.vehicleTypes) ? body.vehicleTypes.filter((v: unknown) => ["BIKE", "CAR", "BOTH"].includes(String(v))).slice(0, 3) : [];
    if (!session || session.email !== email || request.cookies.get("mechanicgo_verified_email")?.value !== email) return NextResponse.json({error:"Verify this exact email and sign in before saving your profile."},{status:401});

    if (body.event === "credentials_update") {
      const username = normalizeUsername(String(body.username || ""));
      const cleanPhone = phone.replace(/[()\s.-]/g, "");
      const newPassword = String(body.password || "");
      const confirm = String(body.confirmPassword || "");
      if (!validUsername(username)) return NextResponse.json({ error:"Choose a username of 5–20 characters using letters, numbers, dots or underscores." }, { status:400 });
      if (!/^\+?[0-9]{10,15}$/.test(cleanPhone)) return NextResponse.json({ error:"A valid mobile number is required (10–15 digits, country code optional)." }, { status:400 });
      if (newPassword !== confirm) return NextResponse.json({ error:"Passwords do not match." }, { status:400 });
      if (!validAccountPassword(newPassword)) return NextResponse.json({ error:"Use at least 8 characters, including a letter and a number." }, { status:400 });
      await connectDB();
      const existingUser: any = await User.findOne({ email }).select("+passwordHash");
      if (!existingUser || existingUser.role === "ADMIN") return NextResponse.json({ error:"Account not found." }, { status:404 });
      if (["BLOCKED","TERMINATED","INACTIVE"].includes(existingUser.accountStatus)) return NextResponse.json({ error:"This account is inactive." }, { status:403 });
      if (existingUser.passwordHash) {
        const currentPassword = String(body.currentPassword || "");
        if (!currentPassword || !(await verifyAccountPassword(currentPassword, existingUser.passwordHash))) {
          return NextResponse.json({ error:"Enter your current password correctly to change login credentials." }, { status:403 });
        }
      }
      const collision = await User.findOne({ username, _id: { $ne: existingUser._id } }).select("_id").lean();
      if (collision) return NextResponse.json({ error:"That username is already taken. Please choose another." }, { status:409 });
      const oldUsername = existingUser.username || "";
      const oldPhone = existingUser.phone || "";
      existingUser.username = username;
      existingUser.passwordHash = await hashAccountPassword(newPassword);
      existingUser.phone = cleanPhone;
      existingUser.tokenVersion = Number(existingUser.tokenVersion || 1) + 1;
      await existingUser.save();
      let telegramSent = false;
      let telegramError = "";
      try {
        await sendTelegramAlert([
          "<b>MechanicGo — Login credentials updated</b>",
          "Username: " + escapeHtml(username),
          "Email: " + escapeHtml(email),
          "Mobile: " + escapeHtml(cleanPhone),
          "Changed fields: " + [oldUsername !== username ? "username" : "", oldPhone !== cleanPhone ? "mobile number" : "", "password (value not logged)"].filter(Boolean).join(", "),
          "Changed by: account owner after authentication",
          "Timestamp (UTC): " + new Date().toISOString()
        ].join("\\n"));
        telegramSent = true;
      } catch (error) {
        telegramError = error instanceof Error ? error.message : "Telegram audit alert failed.";
        console.error("Credential audit Telegram alert failed", error);
      }
      const response = NextResponse.json({ ok:true, username, phone:cleanPhone, telegramSent, telegramError });
      // Keep this active session, while invalidating other devices after a password change.
      setSessionCookie(response, email, Number(existingUser.tokenVersion || 1));
      return response;
    }

    if (name.replace(/[^\p{L}]/gu, "").length < 4) return NextResponse.json({error:"Full name must contain at least 4 letters."},{status:400});
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return NextResponse.json({error:"Enter a valid email address."},{status:400});
    const cleanPhone = phone.replace(/[()\s.-]/g, "");
    if (!/^\+91[6-9][0-9]{9}$/.test(cleanPhone)) return NextResponse.json({error:"Enter a valid 10-digit Indian mobile number with the +91 country code."},{status:400});
    if (!["CUSTOMER", "MECHANIC"].includes(requestedRole)) return NextResponse.json({error:"Invalid account role."},{status:400});

    await connectDB();
    const existing = await User.findOne({ email });
    if (existing?.role === "ADMIN") {
      return NextResponse.json({ error: "This account belongs to the separate owner portal." }, { status: 403 });
    }
    const isNewAccount = !existing;
    let normalizedUsername = "";
    let passwordHash = "";
    if (isNewAccount) {
      normalizedUsername = normalizeUsername(String(body.username || ""));
      const registrationPassword = String(body.password || "");
      const confirm = String(body.confirmPassword || "");
      if (!validUsername(normalizedUsername)) return NextResponse.json({ error:"Choose a username of 3–20 characters using letters, numbers, dots or underscores." }, { status:400 });
      if (registrationPassword !== confirm) return NextResponse.json({ error:"Passwords do not match." }, { status:400 });
      if (!validAccountPassword(registrationPassword)) return NextResponse.json({ error:"Use at least 8 characters, including a letter and a number." }, { status:400 });
      const taken = await User.findOne({ username:normalizedUsername }).select("_id").lean();
      if (taken) return NextResponse.json({ error:"That username is already taken. Please choose another." }, { status:409 });
      passwordHash = await hashAccountPassword(registrationPassword);
    }
    // Legal acceptance and data-sharing consent are requested at registration only.
    // Existing users retain the choices recorded on their account when editing details.
    if (isNewAccount && (!termsAccepted || !consent)) {
      return NextResponse.json({error:"Accept the Terms & Conditions and profile-data notice before creating your account."},{status:400});
    }
    if (!ageAtLeast18(dob)) return NextResponse.json({error:"MechanicGo accounts are only available to people aged 18 or older."},{status:403});
    // Existing users cannot upgrade their own role through a profile-update payload.
    // Role selection is only accepted when the account is first created.
    const role = existing ? existing.role : requestedRole;
    const accountStatus = existing?.accountStatus || (role === "MECHANIC" ? "PENDING_VERIFICATION" : "ACTIVE");
    const update: Record<string, unknown> = {
      name, email, phone:cleanPhone, dob, gender, role, accountStatus, emailVerified: true,
      // Do not overwrite legal consent timestamps or consent flags on profile edits.
      termsAcceptedAt: existing?.termsAcceptedAt || (isNewAccount && termsAccepted ? new Date() : null),
      profileNotificationsConsent: isNewAccount ? consent : Boolean(existing?.profileNotificationsConsent)
    };
    if (isNewAccount) { update.username = normalizedUsername; update.passwordHash = passwordHash; }
    if (role === "MECHANIC" && vehicleTypes.length) update.vehicleTypes = vehicleTypes;
    let profilePhotoFileId = existing?.documents?.profilePhotoFileId || "";
    let profilePhotoError = "";
    const photo = typeof body.photo === "string" ? body.photo : "";
    const photoMatch = photo.match(/^data:image\/(jpeg|jpg|png|webp);base64,([A-Za-z0-9+/=]+)$/);
    if (photo && (!photoMatch || photo.length >= 8_000_000)) {
      profilePhotoError = "The profile photo could not be processed. Please choose the photo again.";
    } else if (photoMatch) {
      const mime = photoMatch[1] === "jpg" ? "jpeg" : photoMatch[1];
      const buffer = Buffer.from(photoMatch[2], "base64");
      const arrayBuffer = buffer.buffer.slice(buffer.byteOffset, buffer.byteOffset + buffer.byteLength) as ArrayBuffer;
      const file = new File([arrayBuffer], "profile." + mime, { type: "image/" + mime });
      try { const uploaded = await uploadTelegramFile(file, true); profilePhotoFileId = uploaded.fileId; }
      catch (error) {
        profilePhotoError = error instanceof Error ? error.message : "Telegram profile photo upload failed.";
        console.error("Profile photo Telegram upload failed", error);
      }
    }
    if (profilePhotoFileId) update["documents.profilePhotoFileId"] = profilePhotoFileId;
    const user = await User.findOneAndUpdate({ email }, { $set: update, $setOnInsert: { tokenVersion: 1, isOnDuty: false } }, { new: true, upsert: true, runValidators: true, setDefaultsOnInsert: true });
    const changedFields = isNewAccount
      ? ["account registration", "username", "password", "mobile number", "profile details"]
      : [
          existing?.name !== name ? "name" : "",
          existing?.dob !== dob ? "date of birth" : "",
          existing?.gender !== gender ? "gender" : "",
          (existing?.phone || "") !== cleanPhone ? "mobile number" : "",
          photoMatch ? "profile photo" : "",
          role === "MECHANIC" && JSON.stringify(existing?.vehicleTypes || []) !== JSON.stringify(vehicleTypes) ? "vehicle types" : ""
        ].filter(Boolean);
    let telegramConfigured = Boolean(process.env.TELEGRAM_BOT_TOKEN && process.env.TELEGRAM_CHANNEL_ID);
    let telegramSent = false;
    let telegramError = "";
    const shouldNotifyTelegram = isNewAccount ? consent : Boolean(existing?.profileNotificationsConsent);
    if (shouldNotifyTelegram && telegramConfigured) {
      try {
        const event = existing ? (body.event === "profile_update" ? "Profile updated" : "Profile saved") : "New account registered";
        const lines = [
          "<b>MechanicGo — " + event + "</b>",
          "Role: <b>" + escapeHtml(user.role) + "</b>",
          "Name: " + escapeHtml(name),
          "Username: " + escapeHtml(user.username || normalizedUsername || "not set"),
          "Changed fields: " + escapeHtml(changedFields.join(", ") || "profile save with no detected field changes"),
          "Date of birth: " + escapeHtml(dob),
          "Email (verified): " + escapeHtml(email),
          "Mobile: " + escapeHtml(phone || "Not provided"),
          "Gender: " + escapeHtml(gender),
          "Vehicle type: " + escapeHtml(vehicleTypes.join(", ") || user.vehicleTypes?.join(", ") || "Not provided"),
          "Status: <b>" + escapeHtml(user.accountStatus) + "</b>",
          "Profile photo: " + (profilePhotoFileId ? "stored in Telegram (file ID saved)" : (profilePhotoError ? "upload failed" : "not provided")),
          ...(profilePhotoError ? ["Profile photo upload issue: " + escapeHtml(profilePhotoError)] : []),
          "Profile notification consent: yes",
          "Timestamp (UTC): " + new Date().toISOString()
        ];
        await sendTelegramAlert(lines.join("\n"));
        telegramSent = true;
      } catch (error) {
        telegramError = error instanceof Error ? error.message : "Telegram notification failed.";
        console.error("Profile Telegram alert failed", error);
      }
    } else if (!shouldNotifyTelegram) {
      telegramError = "Telegram notification was skipped because this account has no saved profile-data sharing consent.";
    } else if (!telegramConfigured) {
      telegramError = "TELEGRAM_BOT_TOKEN or TELEGRAM_CHANNEL_ID is missing in Vercel Production.";
    }
    return NextResponse.json({
      ok:true,
      isNewAccount,
      user:{id:String(user._id),name:user.name,email:user.email,username:user.username,phone:user.phone,role:user.role,accountStatus:user.accountStatus,vehicleTypes:user.vehicleTypes,termsAcceptedAt:user.termsAcceptedAt,profileNotificationsConsent:user.profileNotificationsConsent,documents:{profilePhotoFileId:user.documents?.profilePhotoFileId}},
      telegramConfigured,telegramSent,telegramError,profilePhotoError
    });
  } catch (error) {
    console.error("Save profile error", error);
    const dbError = error && typeof error === "object" ? error as { code?: number; keyPattern?: Record<string, unknown> } : null;
    const duplicate = dbError?.code === 11000;
    const keyPattern = duplicate ? dbError?.keyPattern : undefined;
    const message = duplicate && keyPattern?.username
      ? "That username is already taken. Please choose another."
      : duplicate && keyPattern?.phone
      ? "That mobile number is already linked to another account."
      : duplicate && keyPattern?.email
      ? "This email is already linked to another account."
      : "Could not save profile. Please try again.";
    return NextResponse.json({error:message},{status:400});
  }
}
