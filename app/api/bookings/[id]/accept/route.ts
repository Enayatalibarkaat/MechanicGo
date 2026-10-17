import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import { currentUser } from "@/lib/session";
import Booking from "@/models/Booking";
export const runtime = "nodejs";
export async function PATCH(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const auth = await currentUser(request);
    if ("error" in auth) return NextResponse.json({ error: auth.error }, { status: auth.status });
    if (auth.user.role !== "MECHANIC" || auth.user.accountStatus !== "ACTIVE" || !auth.user.isOnDuty) return NextResponse.json({ error: "You must be an approved active mechanic and ON DUTY." }, { status: 403 });
    await connectDB();
    const { id } = await context.params;
    const booking = await Booking.findOneAndUpdate({ _id: id, status: "SEARCHING", vehicleType: { $in: auth.user.vehicleTypes.includes("BOTH") ? ["BIKE", "CAR"] : auth.user.vehicleTypes } }, { $set: { mechanicId: auth.user._id, status: "ACCEPTED" } }, { new: true });
    if (!booking) return NextResponse.json({ error: "This booking is no longer available." }, { status: 409 });
    return NextResponse.json({ ok: true, booking });
  } catch (error) { console.error("Accept booking error", error); return NextResponse.json({ error: "Could not accept booking." }, { status: 500 }); }
}
