import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import { currentUser } from "@/lib/session";
import Booking from "@/models/Booking";
import { sendTelegramAlert } from "@/lib/telegram";
export const runtime = "nodejs";

export async function PATCH(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const auth = await currentUser(request);
    if ("error" in auth) return NextResponse.json({ error: auth.error }, { status: auth.status });
    const { id } = await context.params;
    const body = await request.json();
    const target = String(body.status || "").toUpperCase();
    await connectDB();

    let booking = null;
    let previousStatus = "";
    if (auth.user.role === "MECHANIC") {
      if (auth.user.accountStatus !== "ACTIVE") {
        return NextResponse.json({ error: "Only approved mechanics can update bookings." }, { status: 403 });
      }
      const transitions: Record<string, string> = { ACCEPTED: "IN_PROGRESS", IN_PROGRESS: "COMPLETED" };
      if (!transitions[target]) {
        return NextResponse.json({ error: "Mechanics can start an accepted job or complete an in-progress job." }, { status: 400 });
      }
      previousStatus = target === "IN_PROGRESS" ? "ACCEPTED" : "IN_PROGRESS";
      booking = await Booking.findOneAndUpdate(
        { _id: id, mechanicId: auth.user._id, status: previousStatus },
        { $set: { status: target } },
        { new: true }
      );
    } else if (auth.user.role === "CUSTOMER" && target === "CANCELLED") {
      // Customers may cancel while dispatching or after a mechanic accepts, but not after work starts.
      previousStatus = "SEARCHING or ACCEPTED";
      booking = await Booking.findOneAndUpdate(
        { _id: id, customerId: auth.user._id, status: { $in: ["SEARCHING", "ACCEPTED"] } },
        { $set: { status: "CANCELLED" } },
        { new: true }
      );
    } else {
      return NextResponse.json({ error: "You cannot make that booking status change." }, { status: 403 });
    }
    if (!booking) {
      return NextResponse.json({ error: "Booking not found, or its status has already changed." }, { status: 409 });
    }
    try {
      await sendTelegramAlert(
        `<b>MechanicGo booking update</b>\nBooking: <code>${booking._id}</code>\nStatus: <b>${target}</b>\nUpdated by: ${auth.user.role === "MECHANIC" ? "Mechanic " + escapeHtml(auth.user.name) : "Customer " + escapeHtml(auth.user.name)}`
      );
    } catch (error) {
      console.error("Booking status Telegram alert failed", error);
    }
    return NextResponse.json({ ok: true, booking });
  } catch (error) {
    console.error("Update booking status error", error);
    return NextResponse.json({ error: "Could not update booking status." }, { status: 500 });
  }
}
function escapeHtml(value: string) {
  const entities: Record<string, string> = { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" };
  return value.replace(/[&<>"]/g, c => entities[c] || c);
}
