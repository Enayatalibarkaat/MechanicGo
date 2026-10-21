import { NextRequest, NextResponse } from "next/server";
import { timingSafeEqual } from "node:crypto";
import connectDB from "@/lib/mongodb";
import Coupon from "@/models/Coupon";

export const runtime = "nodejs";
function authorized(request: NextRequest) {
  const expected = process.env.COUPON_INTEGRATION_SECRET || "";
  const supplied = (request.headers.get("authorization") || "").replace(/^Bearer\s+/i, "").trim();
  if (!expected || !supplied) return false;
  const a = Buffer.from(expected); const b = Buffer.from(supplied);
  return a.length === b.length && timingSafeEqual(a, b);
}
const normalizeCode = (value: unknown) => String(value || "").trim().toUpperCase().replace(/\s+/g, "");

export async function POST(request: NextRequest) {
  if (!authorized(request)) return NextResponse.json({ error: "Unauthorized integration request." }, { status: 401 });
  try {
    const body = await request.json();
    const action = String(body.action || "").toLowerCase();
    const code = normalizeCode(body.code);
    if (!/^[A-Z0-9]{12}$/.test(code)) return NextResponse.json({ error: "Coupon code must contain exactly 12 letters and/or numbers." }, { status: 400 });
    await connectDB();
    if (action === "issue") {
      const amount = Number(body.amount);
      if (!Number.isFinite(amount) || amount < 1 || amount > 100000) return NextResponse.json({ error: "amount must be between ₹1 and ₹100000." }, { status: 400 });
      const startsAt = body.startsAt ? new Date(body.startsAt) : null;
      const expiresAt = body.expiresAt ? new Date(body.expiresAt) : null;
      if ((startsAt && !Number.isFinite(startsAt.getTime())) || (expiresAt && !Number.isFinite(expiresAt.getTime()))) return NextResponse.json({ error: "Invalid startsAt or expiresAt date." }, { status: 400 });
      if (startsAt && expiresAt && expiresAt <= startsAt) return NextResponse.json({ error: "expiresAt must be after startsAt." }, { status: 400 });
      const coupon = await Coupon.create({ code, amount, active: true, startsAt, expiresAt, externalReference: String(body.externalReference || "").slice(0, 160) });
      return NextResponse.json({ ok: true, coupon: { code: coupon.code, amount: coupon.amount, active: coupon.active, startsAt: coupon.startsAt, expiresAt: coupon.expiresAt } }, { status: 201 });
    }
    if (action === "deactivate" || action === "activate") {
      const coupon: any = await Coupon.findOneAndUpdate({ code }, { $set: { active: action === "activate" } }, { new: true }).select("code amount active claimedBy redeemedAt").lean();
      if (!coupon) return NextResponse.json({ error: "Coupon not found." }, { status: 404 });
      return NextResponse.json({ ok: true, coupon: { code: coupon.code, amount: coupon.amount, active: coupon.active, claimed: Boolean(coupon.claimedBy), redeemed: Boolean(coupon.redeemedAt) } });
    }
    if (action === "update") {
      const update: Record<string, unknown> = {};
      if (body.amount !== undefined) {
        const amount = Number(body.amount);
        if (!Number.isFinite(amount) || amount < 1 || amount > 100000) return NextResponse.json({ error: "amount must be between ₹1 and ₹100000." }, { status: 400 });
        update.amount = amount;
      }
      if (body.expiresAt !== undefined) {
        const expiresAt = body.expiresAt ? new Date(body.expiresAt) : null;
        if (expiresAt && !Number.isFinite(expiresAt.getTime())) return NextResponse.json({ error: "Invalid expiresAt date." }, { status: 400 });
        update.expiresAt = expiresAt;
      }
      if (!Object.keys(update).length) return NextResponse.json({ error: "Provide amount and/or expiresAt to update." }, { status: 400 });
      const coupon: any = await Coupon.findOneAndUpdate({ code }, { $set: update }, { new: true }).select("code amount active expiresAt").lean();
      if (!coupon) return NextResponse.json({ error: "Coupon not found." }, { status: 404 });
      return NextResponse.json({ ok: true, coupon });
    }
    return NextResponse.json({ error: "action must be issue, update, activate, or deactivate." }, { status: 400 });
  } catch (error: any) {
    if (error?.code === 11000) return NextResponse.json({ error: "A coupon with this code already exists." }, { status: 409 });
    console.error("Coupon integration error", error);
    return NextResponse.json({ error: "Could not process coupon integration request." }, { status: 500 });
  }
}
