import { NextRequest, NextResponse } from "next/server";
import mongoose from "mongoose";
import connectDB from "@/lib/mongodb";
import { currentUser } from "@/lib/session";
import Booking from "@/models/Booking";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function validCoordinates(lat: unknown, lng: unknown) {
  return typeof lat === "number" && Number.isFinite(lat) && lat >= -90 && lat <= 90 &&
    typeof lng === "number" && Number.isFinite(lng) && lng >= -180 && lng <= 180;
}
function privateLocation(value: any) {
  if (!value || !validCoordinates(value.lat, value.lng)) return null;
  return { lat: value.lat, lng: value.lng, heading: Number.isFinite(value.heading) ? value.heading : null,
    speed: Number.isFinite(value.speed) ? value.speed : null, updatedAt: value.updatedAt || null };
}
async function authorizedBooking(request: NextRequest, id: string) {
  const auth = await currentUser(request);
  if ("error" in auth) return { response: NextResponse.json({ error: auth.error }, { status: auth.status }) } as const;
  if (!mongoose.isValidObjectId(id)) return { response: NextResponse.json({ error: "Invalid booking ID." }, { status: 400 }) } as const;
  await connectDB();
  const booking = await Booking.findById(id);
  if (!booking) return { response: NextResponse.json({ error: "Booking not found." }, { status: 404 }) } as const;
  const isCustomer = auth.user.role === "CUSTOMER" && String(booking.customerId) === String(auth.user._id);
  const isAssignedMechanic = auth.user.role === "MECHANIC" && String(booking.mechanicId || "") === String(auth.user._id);
  if (!isCustomer && !isAssignedMechanic) return { response: NextResponse.json({ error: "You are not allowed to access this booking's location." }, { status: 403 }) } as const;
  if (booking.status !== "ACCEPTED") return { response: NextResponse.json({ error: "Live location sharing is available only while the assigned mechanic is on the way.", status: booking.status }, { status: 409 }) } as const;
  return { auth, booking } as const;
}

export async function GET(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await context.params;
    const result = await authorizedBooking(request, id);
    if ("response" in result) return result.response;
    const { booking } = result;
    return NextResponse.json({
      ok: true,
      status: booking.status,
      vehicleType: booking.vehicleType,
      issueDescription: booking.issueDescription,
      address: booking.location?.address || "",
      customerLocation: privateLocation(booking.customerLiveLocation) || privateLocation(booking.location),
      mechanicLocation: privateLocation(booking.mechanicLiveLocation),
      mechanicName: booking.mechanicId ? undefined : undefined,
      updatedAt: booking.updatedAt
    }, { headers: { "Cache-Control": "no-store, private" } });
  } catch (error) {
    console.error("Read live booking location error", error);
    return NextResponse.json({ error: "Could not load live location." }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const auth = await currentUser(request);
    if ("error" in auth) return NextResponse.json({ error: auth.error }, { status: auth.status });
    if (auth.user.role !== "CUSTOMER" && auth.user.role !== "MECHANIC") return NextResponse.json({ error: "Only booking participants can share location." }, { status: 403 });
    const { id } = await context.params;
    if (!mongoose.isValidObjectId(id)) return NextResponse.json({ error: "Invalid booking ID." }, { status: 400 });
    const body = await request.json();
    const lat = typeof body.lat === "number" ? body.lat : Number.NaN;
    const lng = typeof body.lng === "number" ? body.lng : Number.NaN;
    if (!validCoordinates(lat, lng)) return NextResponse.json({ error: "GPS coordinates are invalid." }, { status: 400 });
    const heading = body.heading == null ? undefined : Number(body.heading);
    const speed = body.speed == null ? undefined : Number(body.speed);
    if (heading !== undefined && (!Number.isFinite(heading) || heading < 0 || heading > 360)) return NextResponse.json({ error: "GPS heading is invalid." }, { status: 400 });
    if (speed !== undefined && (!Number.isFinite(speed) || speed < 0 || speed > 150)) return NextResponse.json({ error: "GPS speed is invalid." }, { status: 400 });

    await connectDB();
    const filter: Record<string, unknown> = { _id: id, status: "ACCEPTED" };
    const field = auth.user.role === "MECHANIC" ? "mechanicLiveLocation" : "customerLiveLocation";
    if (auth.user.role === "MECHANIC") {
      if (auth.user.accountStatus !== "ACTIVE") return NextResponse.json({ error: "Only approved mechanics can share location." }, { status: 403 });
      filter.mechanicId = auth.user._id;
    } else {
      filter.customerId = auth.user._id;
    }
    const now = new Date();
    const update: Record<string, unknown> = { [field + ".lat"]: lat, [field + ".lng"]: lng, [field + ".updatedAt"]: now };
    if (heading !== undefined) update[field + ".heading"] = heading;
    if (speed !== undefined) update[field + ".speed"] = speed;
    const booking = await Booking.findOneAndUpdate(filter, { $set: update }, { new: true });
    if (!booking) return NextResponse.json({ error: "Location sharing is closed, or this booking is not assigned to your account." }, { status: 409 });
    return NextResponse.json({ ok: true, updatedAt: now.toISOString() }, { headers: { "Cache-Control": "no-store, private" } });
  } catch (error) {
    console.error("Update live booking location error", error);
    return NextResponse.json({ error: "Could not update live location." }, { status: 500 });
  }
}
