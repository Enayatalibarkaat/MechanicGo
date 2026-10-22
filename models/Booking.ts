import mongoose, { Schema, models, model } from "mongoose";

const BookingSchema = new Schema({
  customerId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
  mechanicId: { type: Schema.Types.ObjectId, ref: "User", default: null, index: true },
  vehicleId: { type: Schema.Types.ObjectId, ref: "Vehicle", default: null, index: true },
  vehicleType: { type: String, enum: ["BIKE", "SCOOTER", "CAR", "TRUCK", "BUS"], required: true },
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
  serviceType: { type: String, enum: ["REPAIR", "BIKE", "SCOOTER", "SCOOTER_EV", "CAR", "EV", "TRUCK", "BUS", "ROAD_SIDE", "BATTERY"], default: "REPAIR", index: true },
  issueDescription: { type: String, required: true, trim: true, maxlength: 2000 },
  issuePhotoFileId: { type: String, default: "" },
  issuePhotoFileIds: { type: [String], default: [] },
  couponId: { type: Schema.Types.ObjectId, ref: "Coupon", default: null },
  couponCode: { type: String, trim: true, uppercase: true, default: "" },
  couponDiscountAmount: { type: Number, min: 0, default: 0 },
  paymentMethod: { type: String, enum: ["ONLINE", "CASH"], default: "CASH", index: true },
  paymentStatus: { type: String, enum: ["PENDING", "CASH_DUE", "PAID", "FAILED"], default: "CASH_DUE" },
  location: {
    lat: { type: Number, min: -90, max: 90 },
    lng: { type: Number, min: -180, max: 180 },
    address: { type: String, trim: true, maxlength: 500 }
  },
  customerLiveLocation: { lat: { type: Number, min: -90, max: 90 }, lng: { type: Number, min: -180, max: 180 }, heading: { type: Number, min: 0, max: 360 }, speed: { type: Number, min: 0 }, updatedAt: { type: Date } },
  mechanicLiveLocation: { lat: { type: Number, min: -90, max: 90 }, lng: { type: Number, min: -180, max: 180 }, heading: { type: Number, min: 0, max: 360 }, speed: { type: Number, min: 0 }, updatedAt: { type: Date } },
  review: { rating: { type: Number, min: 1, max: 5, default: null }, comment: { type: String, trim: true, maxlength: 500, default: "" }, reviewedAt: { type: Date, default: null } },
  status: { type: String, enum: ["SEARCHING", "ACCEPTED", "IN_PROGRESS", "COMPLETED", "CANCELLED"], default: "SEARCHING", index: true }
}, { timestamps: true });

BookingSchema.index({ status: 1, vehicleType: 1, createdAt: -1 });
export default (models.Booking || model("Booking", BookingSchema)) as mongoose.Model<any>;
