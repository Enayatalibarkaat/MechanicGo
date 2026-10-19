import { NextRequest, NextResponse } from "next/server";
import { currentUser } from "@/lib/session";

export const runtime = "nodejs";

export async function PATCH(request: NextRequest) {
  try {
    const auth = await currentUser(request);
    if ("error" in auth) return NextResponse.json({ error: auth.error }, { status: auth.status });
    if (auth.user.role !== "MECHANIC" || auth.user.accountStatus !== "ACTIVE") {
      return NextResponse.json({ error: "Only approved mechanics can update their service area." }, { status: 403 });
    }
    const body = await request.json();
    const serviceArea = String(body.serviceArea || "").trim().replace(/\s+/g, " ").slice(0, 100);
    if (serviceArea.length < 2) return NextResponse.json({ error: "Enter your main service area, for example Bhira." }, { status: 400 });
    auth.user.serviceArea = serviceArea;
    await auth.user.save();
    return NextResponse.json({ ok: true, serviceArea: auth.user.serviceArea });
  } catch (error) {
    console.error("Update mechanic service area error", error);
    return NextResponse.json({ error: "Could not save your service area." }, { status: 500 });
  }
}
