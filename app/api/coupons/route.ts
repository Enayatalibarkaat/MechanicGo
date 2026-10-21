import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import { currentUser } from "@/lib/session";
import Coupon from "@/models/Coupon";

export const runtime = "nodejs";
const normalizeCode = (value: unknown) => String(value || "").trim().toUpperCase().replace(/\s+/g, "");

export async function GET(request: NextRequest) {
  try {
    const auth = await currentUser(request);
    if ("error" in auth) return NextResponse.json({ error: auth.error }, { status: auth.status });
    await connectDB();
    const coupons = await Coupon.find({ claimedBy: auth.user._id }).sort({ claimedAt: -1 }).limit(50).select("code amount active startsAt expiresAt claimedAt redeemedAt").lean();
    return NextResponse.json({ coupons: coupons.map((c: any) => ({
      code: c.code, amount: c.amount, active: Boolean(c.active),
      startsAt: c.startsAt || null, expiresAt: c.expiresAt || null,
      claimedAt: c.claimedAt || null, redeemedAt: c.redeemedAt || null,
      status: c.redeemedAt ? "USED" : !c.active || (c.startsAt && new Date(c.startsAt).getTime() > Date.now()) || (c.expiresAt && new Date(c.expiresAt).getTime() <= Date.now()) ? "INACTIVE" : "CLAIMED"
    })) }, { headers: { "Cache-Control": "private, no-store" } });
  } catch (error) {
    console.error("List claimed coupons error", error);
    return NextResponse.json({ error: "Could not load your coupons." }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const auth = await currentUser(request);
    if ("error" in auth) return NextResponse.json({ error: auth.error }, { status: auth.status });
    const body = await request.json();
    const code = normalizeCode(body.code);
    if (!/^[A-Z0-9]{12}$/.test(code)) return NextResponse.json({ error: "Enter the full 12-character coupon code." }, { status: 400 });
    await connectDB();
    const now = new Date();
    const coupon: any = await Coupon.findOne({ code }).lean();
    if (!coupon) return NextResponse.json({ error: "Coupon not found. Check the code and try again." }, { status: 404 });
    if (!coupon.active) return NextResponse.json({ error: "This coupon has been turned off by the issuer." }, { status: 410 });
    if (coupon.startsAt && new Date(coupon.startsAt).getTime() > now.getTime()) return NextResponse.json({ error: "This coupon is not active yet." }, { status: 410 });
    if (coupon.expiresAt && new Date(coupon.expiresAt).getTime() <= now.getTime()) return NextResponse.json({ error: "This coupon has expired." }, { status: 410 });
    if (coupon.redeemedAt) return NextResponse.json({ error: "This coupon has already been used." }, { status: 409 });
    if (coupon.claimedBy && String(coupon.claimedBy) !== String(auth.user._id)) return NextResponse.json({ error: "This coupon has already been claimed by another account." }, { status: 409 });
    if (String(coupon.claimedBy) === String(auth.user._id)) {
      return NextResponse.json({ ok: true, coupon: { code: coupon.code, amount: coupon.amount, status: "CLAIMED", claimedAt: coupon.claimedAt || null } });
    }
    const claimed = await Coupon.findOneAndUpdate(
      { _id: coupon._id, active: true, claimedBy: null, redeemedAt: null, $and: [
        { $or: [{ startsAt: null }, { startsAt: { $lte: now } }] },
        { $or: [{ expiresAt: null }, { expiresAt: { $gt: now } }] }
      ] },
      { $set: { claimedBy: auth.user._id, claimedAt: now } },
      { new: true }
    ).select("code amount claimedAt").lean() as any;
    if (!claimed) return NextResponse.json({ error: "This coupon was just claimed or is no longer available. Refresh and try another code." }, { status: 409 });
    return NextResponse.json({ ok: true, coupon: { code: claimed.code, amount: claimed.amount, status: "CLAIMED", claimedAt: claimed.claimedAt } });
  } catch (error) {
    console.error("Claim coupon error", error);
    return NextResponse.json({ error: "Could not claim this coupon right now." }, { status: 500 });
  }
}
