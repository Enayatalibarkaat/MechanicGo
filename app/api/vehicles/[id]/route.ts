import { NextRequest, NextResponse } from "next/server";
import mongoose from "mongoose";
import { currentUser } from "@/lib/session";
import connectDB from "@/lib/mongodb";
import Vehicle from "@/models/Vehicle";
export const runtime = "nodejs";

export async function DELETE(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const auth = await currentUser(request);
    if ("error" in auth) return NextResponse.json({ error: auth.error }, { status: auth.status });
    if (auth.user.role !== "CUSTOMER") return NextResponse.json({ error: "Vehicles are available for customer accounts." }, { status: 403 });
    const { id } = await context.params;
    if (!mongoose.Types.ObjectId.isValid(id)) return NextResponse.json({ error: "Invalid vehicle ID." }, { status: 400 });
    await connectDB();
    const vehicle = await Vehicle.findOneAndDelete({ _id: id, userId: auth.user._id });
    if (!vehicle) return NextResponse.json({ error: "Vehicle not found." }, { status: 404 });
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Delete vehicle error", error);
    return NextResponse.json({ error: "Could not delete this vehicle." }, { status: 500 });
  }
}
