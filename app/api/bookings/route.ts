import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import { currentUser } from "@/lib/session";
import { sendTelegramAlert } from "@/lib/telegram";
import Booking from "@/models/Booking";
import User from "@/models/User";
export const runtime = "nodejs";
export async function POST(request: NextRequest) {
  try {
    const auth = await currentUser(request);
    if ("error" in auth) return NextResponse.json({ error: auth.error }, { status: auth.status });
    if (auth.user.role !== "CUSTOMER") return NextResponse.json({ error: "Only customer accounts can create bookings." }, { status: 403 });
    const body = await request.json();
    const vehicleType = String(body.vehicleType || "").toUpperCase();
    const issueDescription = String(body.issueDescription || "").trim().slice(0, 2000);
    const issuePhotoFileId = String(body.issuePhotoFileId || "").slice(0, 300);
    const location = body.location || {};
    if (!["BIKE", "CAR"].includes(vehicleType) || issueDescription.length < 5) return NextResponse.json({ error: "Choose a vehicle and describe the issue in at least 5 characters." }, { status: 400 });
    const lat = location.lat === undefined ? undefined : Number(location.lat);
    const lng = location.lng === undefined ? undefined : Number(location.lng);
    const address = String(location.address || "").trim().slice(0, 500);
    if (!address) return NextResponse.json({ error: "Please enter the service address so the mechanic can find you." }, { status: 400 });
    if ((lat !== undefined && (!Number.isFinite(lat) || lat < -90 || lat > 90)) || (lng !== undefined && (!Number.isFinite(lng) || lng < -180 || lng > 180))) return NextResponse.json({ error: "Location coordinates are invalid." }, { status: 400 });
    await connectDB();
    const booking = await Booking.create({ customerId: auth.user._id, vehicleType, issueDescription, issuePhotoFileId, location: { lat, lng, address }, status: "SEARCHING" });
    let telegramAlertSent = true;
    try {
      await sendTelegramAlert(`<b>New MechanicGo booking</b>\nBooking: <code>${booking._id}</code>\nCustomer: ${escapeHtml(auth.user.name)}\nPhone: ${escapeHtml(auth.user.phone || "Not provided")}\nVehicle: ${vehicleType}\nIssue: ${escapeHtml(issueDescription)}\nStatus: SEARCHING`);
    } catch (error) { telegramAlertSent = false; console.error("Booking Telegram alert failed", error); }
    return NextResponse.json({ ok: true, booking, telegramAlertSent }, { status: 201 });
  } catch (error) { console.error("Create booking error", error); return NextResponse.json({ error: "Could not create booking." }, { status: 500 }); }
}
export async function GET(request: NextRequest) {
  try {
    const auth = await currentUser(request);
    if ("error" in auth) return NextResponse.json({ error: auth.error }, { status: auth.status });
    await connectDB();
    const filter = auth.user.role === "MECHANIC" ? { $or: [{ mechanicId: auth.user._id }, { status: "SEARCHING", vehicleType: { $in: auth.user.vehicleTypes.includes("BOTH") ? ["BIKE", "CAR"] : auth.user.vehicleTypes } }] } : { customerId: auth.user._id };
    const bookingQuery = Booking.find(filter).sort({ createdAt: -1 }).limit(100);
    if (auth.user.role === "CUSTOMER") bookingQuery.populate("mechanicId", "name phone");
    const bookings = await bookingQuery.lean();
    return NextResponse.json({ bookings });
  } catch (error) { console.error("List bookings error", error); return NextResponse.json({ error: "Could not load bookings." }, { status: 500 }); }
}
function escapeHtml(value: string) { const entities: Record<string, string> = { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"' : "&quot;" }; return value.replace(/[&<>"]/g, c => entities[c] || c); }
