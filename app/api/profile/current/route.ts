import { NextRequest, NextResponse } from "next/server";
import { currentUser } from "@/lib/session";
export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  try {
    const auth = await currentUser(request, true);
    if ("error" in auth) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }
    const user = auth.user;
    const profilePhotoFileId = user.documents?.profilePhotoFileId || "";
    return NextResponse.json({
      ok: true,
      user: {
        id: String(user._id),
        name: user.name || "",
        email: user.email || "",
        username: user.username || "",
        hasUsername: Boolean(user.username),
        phone: user.phone || "",
        dob: user.dob || "",
        gender: user.gender || "Prefer not to say",
        role: user.role,
        accountStatus: user.accountStatus,
        isOnDuty: Boolean(user.isOnDuty),
        vehicleTypes: user.vehicleTypes || [],
        emailVerified: Boolean(user.emailVerified),
        termsAcceptedAt: user.termsAcceptedAt || null,
        profileNotificationsConsent: Boolean(user.profileNotificationsConsent),
        profilePhotoFileId,
        profilePhotoUrl: profilePhotoFileId ? "/api/telegram/file?file_id=" + encodeURIComponent(profilePhotoFileId) : ""
      }
    }, { headers: { "Cache-Control": "private, no-store" } });
  } catch (error) {
    console.error("Get profile error", error);
    return NextResponse.json({ error: "Could not load your profile." }, { status: 500 });
  }
}
