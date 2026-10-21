import mongoose, { Schema, models, model } from "mongoose";

const CouponSchema = new Schema({
  code: { type: String, required: true, trim: true, uppercase: true, minlength: 12, maxlength: 12, unique: true, index: true },
  amount: { type: Number, required: true, min: 1, max: 100000 },
  currency: { type: String, enum: ["INR"], default: "INR" },
  active: { type: Boolean, default: true, index: true },
  externalReference: { type: String, trim: true, maxlength: 160, default: "" },
  startsAt: { type: Date, default: null },
  expiresAt: { type: Date, default: null, index: true },
  claimedBy: { type: Schema.Types.ObjectId, ref: "User", default: null, index: true },
  claimedAt: { type: Date, default: null },
  redeemedBy: { type: Schema.Types.ObjectId, ref: "User", default: null },
  redeemedAt: { type: Date, default: null, index: true }
}, { timestamps: true, strict: true });

CouponSchema.index({ active: 1, claimedBy: 1, redeemedAt: 1, expiresAt: 1 });
export default (models.Coupon || model("Coupon", CouponSchema)) as mongoose.Model<any>;
