import { NextRequest, NextResponse } from "next/server";
import { currentUser, clearSession } from "@/lib/session";
export const runtime = "nodejs";
export async function GET(request: NextRequest) {
  try {
    const result = await currentUser(request, true);
    if ("error" in result) {
      const response = NextResponse.json({ authenticated: false, error: result.error }, { status: result.status });
      clearSession(response);
      return response;
    }
    const { user } = result;
    if (["BLOCKED", "TERMINATED", "INACTIVE"].includes(user.accountStatus) || (user.role === "MECHANIC" && user.accountStatus !== "ACTIVE")) {
      const response = NextResponse.json({ authenticated: false, forceLogout: true, error: user.accountStatus === "TERMINATED" ? "Your partner account has been terminated by Admin. Please contact support." : "Your partner account has been suspended or is awaiting approval. Please contact support." }, { status: 403 });
      clearSession(response);
      return response;
    }
    return NextResponse.json({ authenticated: true, user: { id: String(user._id), name: user.name, email: user.email, phone: user.phone, role: user.role, accountStatus: user.accountStatus, isOnDuty: user.isOnDuty, vehicleTypes: user.vehicleTypes, tokenVersion: user.tokenVersion } });
  } catch (error) {
    console.error("Auth status error", error);
    return NextResponse.json({ error: "Unable to verify account status." }, { status: 500 });
  }
}
