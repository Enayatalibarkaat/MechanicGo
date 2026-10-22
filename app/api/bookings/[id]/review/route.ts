import { NextRequest, NextResponse } from "next/server";
import mongoose from "mongoose";
import connectDB from "@/lib/mongodb";
import { currentUser } from "@/lib/session";
import Booking from "@/models/Booking";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const auth = await currentUser(request);
    if ("error" in auth) return NextResponse.json({ error: auth.error }, { status: auth.status });
    if (auth.user.role !== "CUSTOMER") return NextResponse.json({ error: "Only customers can review a service." }, { status: 403 });
    const { id } = await context.params;
    if (!mongoose.isValidObjectId(id)) return NextResponse.json({ error: "Invalid booking ID." }, { status: 400 });
    const body = await request.json();
    const rating = Number(body.rating);
    const comment = String(body.comment || "").trim().slice(0, 500);
    if (!Number.isInteger(rating) || rating < 1 || rating > 5) return NextResponse.json({ error: "Choose a rating from 1 to 5 stars." }, { status: 400 });
    await connectDB();
    const booking = await Booking.findOneAndUpdate(
      { _id: id, customerId: auth.user._id, status: "COMPLETED", mechanicId: { $ne: null }, "review.rating": null },
      { $set: { "review.rating": rating, "review.comment": comment, "review.reviewedAt": new Date() } },
      { new: true }
    ).select("_id review status").lean();
    if (!booking) {
      const existing = await Booking.findOne({ _id: id, customerId: auth.user._id }).select("status review.rating").lean() as any;
      if (!existing) return NextResponse.json({ error: "Booking not found in your account." }, { status: 404 });
      if (existing.status !== "COMPLETED") return NextResponse.json({ error: "You can review a service after it is completed." }, { status: 409 });
      if (existing.review?.rating) return NextResponse.json({ error: "You have already reviewed this service." }, { status: 409 });
      return NextResponse.json({ error: "This booking has no assigned mechanic to review." }, { status: 409 });
    }
    return NextResponse.json({ ok: true, booking });
  } catch (error) {
    console.error("Submit booking review error", error);
    return NextResponse.json({ error: "Could not save your review. Please try again." }, { status: 500 });
  }
}
