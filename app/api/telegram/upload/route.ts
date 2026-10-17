import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import { currentUser } from "@/lib/session";
import { uploadTelegramFile } from "@/lib/telegram";
import User from "@/models/User";
export const runtime = "nodejs";
export async function POST(request: NextRequest) {
  try {
    const auth = await currentUser(request, true);
    if ("error" in auth) return NextResponse.json({ error: auth.error }, { status: auth.status });
    const form = await request.formData();
    const file = form.get("file");
    const kind = String(form.get("kind") || "issuePhoto");
    if (!(file instanceof File)) return NextResponse.json({ error: "Select a file to upload." }, { status: 400 });
    if (!["issuePhoto", "idProof", "shopPhoto", "profilePhoto"].includes(kind)) return NextResponse.json({ error: "Unsupported upload type." }, { status: 400 });
    if (["idProof", "shopPhoto"].includes(kind) && auth.user.role !== "MECHANIC") {
      return NextResponse.json({ error: "Only mechanic partners can upload verification documents." }, { status: 403 });
    }
    if (file.size < 1 || file.size > 10 * 1024 * 1024) return NextResponse.json({ error: "File must be smaller than 10 MB." }, { status: 413 });
    const allowedImageTypes = ["image/jpeg", "image/png", "image/webp"];
    const photo = allowedImageTypes.includes(file.type) && kind !== "idProof";
    if (!photo && ![...allowedImageTypes, "application/pdf"].includes(file.type)) {
      return NextResponse.json({ error: "Only JPG, PNG, WebP images or PDF documents are allowed." }, { status: 415 });
    }
    const uploaded = await uploadTelegramFile(file, photo);
    if (["idProof", "shopPhoto", "profilePhoto"].includes(kind)) {
      await connectDB();
      const field = kind === "idProof" ? "documents.idProofFileId" : kind === "shopPhoto" ? "documents.shopPhotoFileId" : "documents.profilePhotoFileId";
      await User.updateOne({ _id: auth.user._id }, { $set: { [field]: uploaded.fileId } });
    }
    return NextResponse.json({ ok: true, ...uploaded });
  } catch (error) {
    console.error("Telegram upload error", error);
    return NextResponse.json({ error: error instanceof Error ? error.message : "Upload failed." }, { status: 500 });
  }
}
