import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import { currentUser } from "@/lib/session";
import Coupon from "@/models/Coupon";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  try {
    const auth = await currentUser(request);
    if ("error" in auth) return NextResponse.json({ error: auth.error }, { status: auth.status });
    const body = await request.json();
    const code = String(body.code || "").trim().toUpperCase().replace(/\s+/g, "");
    if (!/^[A-Z0-9]{12}$/.test(code)) return NextResponse.json({ error: "Enter a valid 12-character coupon code." }, { status: 400 });
    await connectDB();
    const now = new Date();
    const coupon: any = await Coupon.findOne({
      code, claimedBy: auth.user._id, active: true, redeemedAt: null,
      $and: [
        { $or: [{ startsAt: null }, { startsAt: { $lte: now } }] },
        { $or: [{ expiresAt: null }, { expiresAt: { $gt: now } }] }
      ]
    }).select("code amount expiresAt").lean();
    if (!coupon) return NextResponse.json({ error: "Coupon is unavailable. Claim it first, or it may have expired, been disabled, or already been used." }, { status: 409 });
    return NextResponse.json({ ok: true, coupon: { code: coupon.code, amount: coupon.amount, expiresAt: coupon.expiresAt || null } }, { headers: { "Cache-Control": "private, no-store" } });
  } catch (error) {
    console.error("Apply coupon error", error);
    return NextResponse.json({ error: "Could not verify this coupon right now." }, { status: 500 });
  }
}
