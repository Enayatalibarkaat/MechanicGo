import { NextRequest, NextResponse } from "next/server";
import { currentUser } from "@/lib/session";
import { sendTelegramAlert } from "@/lib/telegram";
export const runtime = "nodejs";
export async function PATCH(request: NextRequest) {
  try {
    const auth = await currentUser(request);
    if ("error" in auth) return NextResponse.json({ error: auth.error }, { status: auth.status });
    if (auth.user.role !== "MECHANIC" || auth.user.accountStatus !== "ACTIVE") return NextResponse.json({ error: "Only approved active mechanics can change duty status." }, { status: 403 });
    const body = await request.json();
    if (typeof body.isOnDuty !== "boolean") {
      return NextResponse.json({ error: "isOnDuty must be true or false." }, { status: 400 });
    }
    if (body.isOnDuty && String(auth.user.serviceArea || "").trim().length < 2) {
      return NextResponse.json({ error: "Save your service area before going online so requests can be routed to your area." }, { status: 400 });
    }
    const previousDuty = Boolean(auth.user.isOnDuty);
    auth.user.isOnDuty = body.isOnDuty;
    await auth.user.save();
    let telegramSent = false;
    if (previousDuty !== body.isOnDuty && auth.user.profileNotificationsConsent) {
      try {
        const safe = (value: string) => value.replace(/[&<>"]/g, character => ({ "&":"&amp;", "<":"&lt;", ">":"&gt;", '"':"&quot;" }[character] || character));
        await sendTelegramAlert([
          "<b>MechanicGo — Mechanic duty updated</b>",
          "Name: " + safe(auth.user.name || ""),
          "Username: " + safe(auth.user.username || "not set"),
          "Email: " + safe(auth.user.email || ""),
          "Duty status: <b>" + (auth.user.isOnDuty ? "ON DUTY" : "OFF DUTY") + "</b>",
          "Timestamp (UTC): " + new Date().toISOString()
        ].join("\\n"));
        telegramSent = true;
      } catch (error) { console.error("Mechanic duty Telegram audit failed", error); }
    }
    return NextResponse.json({ ok: true, isOnDuty: auth.user.isOnDuty, telegramSent });
  } catch (error) { console.error("Duty update error", error); return NextResponse.json({ error: "Could not update duty status." }, { status: 500 }); }
}
