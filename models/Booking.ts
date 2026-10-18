import mongoose, { Schema, models, model } from "mongoose";

const BookingSchema = new Schema({
  customerId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
  mechanicId: { type: Schema.Types.ObjectId, ref: "User", default: null, index: true },
  vehicleId: { type: Schema.Types.ObjectId, ref: "Vehicle", default: null, index: true },
  vehicleType: { type: String, enum: ["BIKE", "CAR"], required: true },
  vehicleDetails: {
    type: { type: String, default: "" },
    brand: { type: String, default: "" },
    model: { type: String, default: "" },
    year: { type: Number, default: null },
    registrationNumber: { type: String, default: "" },
    fuelType: { type: String, default: "" },
    color: { type: String, default: "" }
  },
  bookingFor: { type: String, enum: ["SELF", "OTHER"], default: "SELF", index: true },
  otherPersonName: { type: String, trim: true, maxlength: 80, default: "" },
  otherPersonPhone: { type: String, trim: true, maxlength: 20, default: "" },
  issueDescription: { type: String, required: true, trim: true, maxlength: 2000 },
  issuePhotoFileId: { type: String, default: "" },
  paymentMethod: { type: String, enum: ["ONLINE", "CASH"], default: "CASH", index: true },
  paymentStatus: { type: String, enum: ["PENDING", "CASH_DUE", "PAID", "FAILED"], default: "CASH_DUE" },
  location: {
    lat: { type: Number, min: -90, max: 90 },
    lng: { type: Number, min: -180, max: 180 },
    address: { type: String, trim: true, maxlength: 500 }
  },
  status: { type: String, enum: ["SEARCHING", "ACCEPTED", "IN_PROGRESS", "COMPLETED", "CANCELLED"], default: "SEARCHING", index: true }
}, { timestamps: true });

BookingSchema.index({ status: 1, vehicleType: 1, createdAt: -1 });
export default (models.Booking || model("Booking", BookingSchema)) as mongoose.Model<any>;
