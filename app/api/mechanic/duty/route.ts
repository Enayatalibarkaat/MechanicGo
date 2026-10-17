import { NextRequest, NextResponse } from "next/server";
import { currentUser } from "@/lib/session";
export const runtime = "nodejs";
export async function PATCH(request: NextRequest) {
  try {
    const auth = await currentUser(request);
    if ("error" in auth) return NextResponse.json({ error: auth.error }, { status: auth.status });
    if (auth.user.role !== "MECHANIC" || auth.user.accountStatus !== "ACTIVE") return NextResponse.json({ error: "Only approved active mechanics can change duty status." }, { status: 403 });
    const body = await request.json();
    if (typeof body.isOnDuty !== "boolean") {
      return NextResponse.json({ error: "isOnDuty must be true or false." }, { status: 400 });
    }
    auth.user.isOnDuty = body.isOnDuty;
    await auth.user.save();
    return NextResponse.json({ ok: true, isOnDuty: auth.user.isOnDuty });
  } catch (error) { console.error("Duty update error", error); return NextResponse.json({ error: "Could not update duty status." }, { status: 500 }); }
}
