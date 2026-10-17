import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import { requireAdmin } from "@/lib/session";
import { sendTelegramAlert } from "@/lib/telegram";
import User from "@/models/User";
import Booking from "@/models/Booking";
export const runtime = "nodejs";
export async function GET(request: NextRequest) {
  try {
    const admin = await requireAdmin(request);
    if ("error" in admin) return NextResponse.json({ error: admin.error }, { status: admin.status });
    await connectDB();
    const status = request.nextUrl.searchParams.get("status");
    const filter: Record<string, unknown> = { role: "MECHANIC" };
    if (status && ["PENDING_VERIFICATION", "ACTIVE", "INACTIVE", "BLOCKED", "TERMINATED"].includes(status)) filter.accountStatus = status;
    const mechanics = await User.find(filter).select("-__v").sort({ createdAt: -1 }).limit(300).lean();
    return NextResponse.json({ mechanics });
  } catch (error) { console.error("Admin list staff error", error); return NextResponse.json({ error: "Could not load mechanics." }, { status: 500 }); }
}
export async function PATCH(request: NextRequest) {
  try {
    const admin = await requireAdmin(request);
    if ("error" in admin) return NextResponse.json({ error: admin.error }, { status: admin.status });
    const body = await request.json();
    const id = String(body.userId || "");
    const action = String(body.action || "").toUpperCase();
    const reason = String(body.reason || "").trim().slice(0, 500);
    const mapping: Record<string, string> = { APPROVE: "ACTIVE", REACTIVATE: "ACTIVE", BLOCK: "BLOCKED", TERMINATE: "TERMINATED" };
    const nextStatus = mapping[action];
    if (!id || !nextStatus) return NextResponse.json({ error: "Provide userId and action APPROVE, REACTIVATE, BLOCK or TERMINATE." }, { status: 400 });
    await connectDB();
    const mechanic = await User.findOne({ _id: id, role: "MECHANIC" });
    if (!mechanic) return NextResponse.json({ error: "Mechanic not found." }, { status: 404 });
    const wasBlocked = ["BLOCKED", "TERMINATED"].includes(mechanic.accountStatus);
    mechanic.accountStatus = nextStatus;
    if (["BLOCKED", "TERMINATED"].includes(nextStatus)) {
      mechanic.isOnDuty = false;
      mechanic.tokenVersion = Number(mechanic.tokenVersion || 1) + 1;
      mechanic.offboardingDetails = { terminatedAt: nextStatus === "TERMINATED" ? new Date() : null, reason };
      await Booking.updateMany({ mechanicId: mechanic._id, status: "ACCEPTED" }, { $set: { mechanicId: null, status: "SEARCHING" } });
    } else {
      mechanic.offboardingDetails = { terminatedAt: null, reason: "" };
      if (wasBlocked) mechanic.tokenVersion = Number(mechanic.tokenVersion || 1) + 1;
    }
    await mechanic.save();
    let telegramAlertSent = true;
    if (["BLOCKED", "TERMINATED"].includes(nextStatus)) {
      try { await sendTelegramAlert(`<b>MechanicGo staff action</b>\nAction: ${nextStatus}\nName: ${escapeHtml(mechanic.name)}\nPhone: ${escapeHtml(mechanic.phone || "Not provided")}\nReason: ${escapeHtml(reason || "Not provided")}\nBy admin: ${escapeHtml(admin.email)}`); }
      catch (error) { telegramAlertSent = false; console.error("Staff Telegram alert failed", error); }
    }
    return NextResponse.json({ ok: true, mechanic: { id: String(mechanic._id), name: mechanic.name, accountStatus: mechanic.accountStatus, isOnDuty: mechanic.isOnDuty, tokenVersion: mechanic.tokenVersion }, telegramAlertSent });
  } catch (error) { console.error("Manage staff error", error); return NextResponse.json({ error: "Could not update mechanic status." }, { status: 500 }); }
}
function escapeHtml(value: string) { return value.replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c] || c)); }
