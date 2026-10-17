import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import { requireAdmin } from "@/lib/session";
import User from "@/models/User";
export const runtime = "nodejs";
export async function GET(request: NextRequest) {
  try {
    const admin = await requireAdmin(request);
    if ("error" in admin) return NextResponse.json({ error: admin.error }, { status: admin.status });
    await connectDB();
    const role = request.nextUrl.searchParams.get("role");
    const status = request.nextUrl.searchParams.get("status");
    const filter: Record<string, unknown> = {};
    if (role && ["CUSTOMER", "MECHANIC", "ADMIN"].includes(role)) filter.role = role;
    if (status && ["PENDING_VERIFICATION", "ACTIVE", "INACTIVE", "BLOCKED", "TERMINATED"].includes(status)) filter.accountStatus = status;
    const users = await User.find(filter).select("-__v").sort({ createdAt: -1 }).limit(500).lean();
    return NextResponse.json({ users });
  } catch (error) { console.error("Admin users error", error); return NextResponse.json({ error: "Could not load users." }, { status: 500 }); }
}
