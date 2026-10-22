import { NextRequest, NextResponse } from "next/server";
import { currentUser } from "@/lib/session";
export const runtime = "nodejs";
const TYPES = ["BIKE","CAR","SCOOTER","SCOOTER_EV","EV","TRUCK","BUS","BOTH"];
export async function PATCH(request: NextRequest) {
  try {
    const auth = await currentUser(request);
    if ("error" in auth) return NextResponse.json({ error: auth.error }, { status: auth.status });
    if (auth.user.role !== "MECHANIC") return NextResponse.json({ error: "Only mechanic partners can update service capabilities." }, { status: 403 });
    const body = await request.json();
    const vehicleTypes = Array.isArray(body.vehicleTypes) ? [...new Set(body.vehicleTypes.map((v: unknown) => String(v).toUpperCase()).filter((v: string) => TYPES.includes(v)))] : [];
    if (!vehicleTypes.length) return NextResponse.json({ error: "Select at least one vehicle or EV capability." }, { status: 400 });
    auth.user.vehicleTypes = vehicleTypes;
    await auth.user.save();
    return NextResponse.json({ ok: true, vehicleTypes: auth.user.vehicleTypes });
  } catch (error) {
    console.error("Mechanic specialization update failed", error);
    return NextResponse.json({ error: "Could not save your service capabilities." }, { status: 500 });
  }
}
