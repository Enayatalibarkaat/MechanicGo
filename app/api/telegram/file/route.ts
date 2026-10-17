import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import { currentUser, requireAdmin } from "@/lib/session";
import { getTelegramFile } from "@/lib/telegram";
import Booking from "@/models/Booking";
import User from "@/models/User";
export const runtime = "nodejs";
export async function GET(request: NextRequest) {
  try {
    const fileId = request.nextUrl.searchParams.get("file_id") || "";
    if (!fileId || fileId.length > 500) return NextResponse.json({ error: "Valid file_id is required." }, { status: 400 });
    const admin = await requireAdmin(request);
    let authorized = !("error" in admin);
    if (!authorized) {
      const auth = await currentUser(request, true);
      if ("error" in auth) return NextResponse.json({ error: auth.error }, { status: auth.status });
      await connectDB();
      const user: any = await User.findById(auth.user._id).lean();
      const userFileIds = [user?.documents?.aadhaarFileId, user?.documents?.idProofFileId, user?.documents?.shopPhotoFileId, user?.documents?.profilePhotoFileId];
      const ownsDocument = userFileIds.includes(fileId);
      const booking = await Booking.findOne({ issuePhotoFileId: fileId, $or: [{ customerId: auth.user._id }, { mechanicId: auth.user._id }] }).select("_id").lean();
      authorized = ownsDocument || Boolean(booking);
      if (!authorized) return NextResponse.json({ error: "You do not have access to this file." }, { status: 403 });
    }
    const { response, filePath } = await getTelegramFile(fileId);
    const contentType = filePath.endsWith(".pdf") ? "application/pdf" : filePath.endsWith(".png") ? "image/png" : filePath.endsWith(".webp") ? "image/webp" : "image/jpeg";
    return new NextResponse(response.body, { status: 200, headers: { "Content-Type": contentType, "Cache-Control": "private, no-store", "X-Content-Type-Options": "nosniff" } });
  } catch (error) { console.error("Telegram file proxy error", error); return NextResponse.json({ error: "Could not retrieve this file." }, { status: 500 }); }
}
