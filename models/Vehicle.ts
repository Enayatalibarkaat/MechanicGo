import mongoose, { Schema, models, model } from "mongoose";

const VehicleSchema = new Schema({
  userId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
  type: { type: String, enum: ["CAR", "BIKE", "SCOOTER"], required: true },
  brand: { type: String, required: true, trim: true, maxlength: 60 },
  model: { type: String, required: true, trim: true, maxlength: 80 },
  year: { type: Number, required: true, min: 1950, max: 2100 },
  registrationNumber: { type: String, required: true, trim: true, uppercase: true, maxlength: 20 },
  fuelType: { type: String, enum: ["PETROL", "DIESEL", "CNG", "ELECTRIC", "HYBRID", "OTHER"], default: "PETROL" },
  color: { type: String, trim: true, maxlength: 40, default: "" }
}, { timestamps: true });

VehicleSchema.index({ userId: 1, registrationNumber: 1 }, { unique: true });
export default (models.Vehicle || model("Vehicle", VehicleSchema)) as mongoose.Model<any>;
