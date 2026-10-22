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
    const serviceArea = String(auth.user.serviceArea || "").trim().toLowerCase();
    if (serviceArea.length < 2) return NextResponse.json({ error: "Save your service area before accepting requests." }, { status: 400 });
    const capabilities: string[] = Array.isArray(auth.user.vehicleTypes) ? auth.user.vehicleTypes : [];
    const allowedTypes = new Set<string>();
    if (capabilities.includes("BOTH")) ["BIKE","SCOOTER","CAR"].forEach(type => allowedTypes.add(type));
    if (capabilities.includes("BIKE")) ["BIKE","SCOOTER"].forEach(type => allowedTypes.add(type));
    if (capabilities.includes("SCOOTER") || capabilities.includes("SCOOTER_EV")) allowedTypes.add("SCOOTER");
    if (capabilities.includes("CAR") || capabilities.includes("EV")) allowedTypes.add("CAR");
    if (capabilities.includes("TRUCK")) allowedTypes.add("TRUCK");
    if (capabilities.includes("BUS")) allowedTypes.add("BUS");
    const specialistEligibility = { $or: [
      { serviceType: { $nin: ["EV", "SCOOTER_EV"] } },
      ...(capabilities.includes("EV") ? [{ serviceType: "EV" }] : []),
      ...(capabilities.includes("SCOOTER_EV") ? [{ serviceType: "SCOOTER_EV" }] : [])
    ] };
    const eligible = { _id: id, status: "SEARCHING", vehicleType: { $in: [...allowedTypes] }, ...specialistEligibility };
    const candidate = await Booking.findOne(eligible).select("location.address").lean() as any;
    if (!candidate || !String(candidate.location?.address || "").toLowerCase().includes(serviceArea)) {
      return NextResponse.json({ error: "This request is no longer available in your service area." }, { status: 409 });
    }
    const booking = await Booking.findOneAndUpdate(eligible, { $set: { mechanicId: auth.user._id, status: "ACCEPTED" } }, { new: true });
    if (!booking) return NextResponse.json({ error: "This booking is no longer available." }, { status: 409 });
    return NextResponse.json({ ok: true, booking });
  } catch (error) { console.error("Accept booking error", error); return NextResponse.json({ error: "Could not accept booking." }, { status: 500 }); }
}
