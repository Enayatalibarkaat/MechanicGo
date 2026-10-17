import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import { requireAdmin } from "@/lib/session";
import Booking from "@/models/Booking";
export const runtime = "nodejs";
export async function GET(request: NextRequest) {
  try {
    const admin = await requireAdmin(request);
    if ("error" in admin) return NextResponse.json({ error: admin.error }, { status: admin.status });
    await connectDB();
    const status = request.nextUrl.searchParams.get("status");
    const filter: Record<string, unknown> = {};
    if (status && ["SEARCHING", "ACCEPTED", "IN_PROGRESS", "COMPLETED", "CANCELLED"].includes(status)) filter.status = status;
    const bookings = await Booking.find(filter).populate("customerId", "name phone email").populate("mechanicId", "name phone email accountStatus").sort({ createdAt: -1 }).limit(300).lean();
    return NextResponse.json({ bookings });
  } catch (error) { console.error("Admin bookings error", error); return NextResponse.json({ error: "Could not load bookings." }, { status: 500 }); }
}
