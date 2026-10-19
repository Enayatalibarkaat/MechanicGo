import mongoose, { Schema, models, model } from "mongoose";

const DocumentsSchema = new Schema({
  aadhaarFileId: { type: String, default: "" },
  idProofFileId: { type: String, default: "" },
  shopPhotoFileId: { type: String, default: "" },
  profilePhotoFileId: { type: String, default: "" }
}, { _id: false });

const UserSchema = new Schema({
  name: { type: String, required: true, trim: true, maxlength: 80 },
  email: { type: String, trim: true, lowercase: true, sparse: true, unique: true, index: true },
  username: { type: String, trim: true, lowercase: true, sparse: true, unique: true, index: true },
  passwordHash: { type: String, default: "", select: false },
  phone: { type: String, trim: true, sparse: true, unique: true, index: true },
  dob: { type: String, default: "" },
  gender: { type: String, default: "Prefer not to say" },
  role: { type: String, enum: ["CUSTOMER", "MECHANIC", "ADMIN"], default: "CUSTOMER", index: true },
  accountStatus: { type: String, enum: ["PENDING_VERIFICATION", "ACTIVE", "INACTIVE", "BLOCKED", "TERMINATED"], default: "ACTIVE", index: true },
  isOnDuty: { type: Boolean, default: false, index: true },
  serviceArea: { type: String, trim: true, maxlength: 100, default: "", index: true },
  vehicleTypes: { type: [String], enum: ["BIKE", "CAR", "BOTH"], default: [] },
  documents: { type: DocumentsSchema, default: () => ({}) },
  tokenVersion: { type: Number, default: 1 },
  offboardingDetails: { terminatedAt: { type: Date, default: null }, reason: { type: String, default: "" } },
  termsAcceptedAt: { type: Date, default: null },
  profileNotificationsConsent: { type: Boolean, default: false },
  emailVerified: { type: Boolean, default: false }
}, { timestamps: true, strict: true });

export default (models.User || model("User", UserSchema)) as mongoose.Model<any>;
