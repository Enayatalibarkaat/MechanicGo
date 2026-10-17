import { NextRequest, NextResponse } from "next/server";

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

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const name = String(body.name || "").trim().slice(0, 80);
    const dob = String(body.dob || "");
    const email = String(body.email || "").trim().toLowerCase();
    const gender = String(body.gender || "Prefer not to say").slice(0, 40);
    const phone = String(body.phone || "").trim().slice(0, 30);
    const termsAccepted = body.termsAccepted === true;
    const consent = body.profileNotificationsConsent === true;
    if (!request.cookies.get("mechanicgo_auth")?.value) return NextResponse.json({error:"Please sign in again before saving your profile."},{status:401});
    if (!name) return NextResponse.json({error:"Full name is required."},{status:400});
    if (!ageAtLeast18(dob)) return NextResponse.json({error:"MechanicGo accounts are only available to people aged 18 or older."},{status:403});
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return NextResponse.json({error:"Enter a valid email address."},{status:400});
    if (request.cookies.get("mechanicgo_verified_email")?.value !== email) return NextResponse.json({error:"Verify this exact email address before saving."},{status:403});
    if (!termsAccepted || !consent) return NextResponse.json({error:"Accept the terms and profile-data notice before saving."},{status:400});

    const token = process.env.TELEGRAM_BOT_TOKEN;
    const chatId = process.env.TELEGRAM_CHAT_ID;
    const telegramConfigured = Boolean(token && chatId);
    let telegramSent = false;
    if (telegramConfigured) {
      const lines = [
        "MechanicGo profile update",
        "Event: " + (body.event === "profile_update" ? "Profile updated" : "New profile / profile saved"),
        "Name: " + name,
        "Date of birth: " + dob,
        "Age requirement: 18+ confirmed",
        "Email (verified): " + email,
        "Mobile: " + (phone || "Not provided"),
        "Gender: " + gender,
        "Profile photo: " + (typeof body.photo === "string" && body.photo ? "Uploaded (image not included in this text alert)" : "Not provided"),
        "Terms accepted: yes",
        "Profile notification consent: yes",
        "Timestamp (UTC): " + new Date().toISOString()
      ];
      const tg = await fetch("https://api.telegram.org/bot" + token + "/sendMessage", {
        method:"POST", headers:{"Content-Type":"application/json"},
        body:JSON.stringify({chat_id:chatId,text:lines.join("\n"),disable_web_page_preview:true})
      });
      const result = await tg.json().catch(()=>({}));
      telegramSent = tg.ok && result.ok === true;
      if (!telegramSent) console.error("MechanicGo Telegram notification failed:", result.description || tg.status);
    }
    return NextResponse.json({ok:true,telegramConfigured,telegramSent,warning:telegramConfigured&&!telegramSent?"Telegram notification could not be delivered.":undefined});
  } catch {
    return NextResponse.json({error:"Could not save profile. Please try again."},{status:400});
  }
}
