import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import { currentUser } from "@/lib/session";
import User from "@/models/User";
export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  try {
    const auth = await currentUser(request);
    if ("error" in auth) return NextResponse.json({ error: auth.error }, { status: auth.status });
    if (auth.user.role !== "CUSTOMER") return NextResponse.json({ error: "Only customers can browse available mechanics." }, { status: 403 });
    await connectDB();
    const mechanics = await User.find({ role: "MECHANIC", accountStatus: "ACTIVE", isOnDuty: true })
      .select("name vehicleTypes")
      .sort({ name: 1 })
      .limit(100)
      .lean();
    return NextResponse.json({
      mechanics: mechanics.map((mechanic: any) => ({
        id: String(mechanic._id),
        name: mechanic.name,
        vehicleTypes: mechanic.vehicleTypes || []
      }))
    }, { headers: { "Cache-Control": "private, no-store" } });
  } catch (error) {
    console.error("Available mechanics error", error);
    return NextResponse.json({ error: "Could not load available mechanics." }, { status: 500 });
  }
}
