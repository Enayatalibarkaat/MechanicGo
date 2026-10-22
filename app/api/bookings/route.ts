import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import { currentUser } from "@/lib/session";
import { sendTelegramAlert } from "@/lib/telegram";
import Booking from "@/models/Booking";
import Vehicle from "@/models/Vehicle";
import Coupon from "@/models/Coupon";
export const runtime = "nodejs";

const escapeHtml = (value: string) => value.replace(/[&<>"]/g, c => ({ "&":"&amp;", "<":"&lt;", ">":"&gt;", '"':"&quot;" }[c] || c));

export async function POST(request: NextRequest) {
  try {
    const auth = await currentUser(request);
    if ("error" in auth) return NextResponse.json({ error: auth.error }, { status: auth.status });
    if (auth.user.role !== "CUSTOMER") return NextResponse.json({ error: "Only customer accounts can create bookings." }, { status: 403 });

    const body = await request.json();
    const bookingFor = String(body.bookingFor || "SELF").toUpperCase();
    const paymentMethod = String(body.paymentMethod || "CASH").toUpperCase();
    const issueDescription = String(body.issueDescription || "").trim().slice(0, 500);
    const serviceType = String(body.serviceType || "REPAIR").toUpperCase();
    const allowedServices = ["REPAIR", "BIKE", "SCOOTER", "SCOOTER_EV", "CAR", "EV", "TRUCK", "BUS", "ROAD_SIDE", "BATTERY"];
    if (!allowedServices.includes(serviceType)) return NextResponse.json({ error: "Choose a valid service category." }, { status: 400 });
    const issuePhotoFileId = String(body.issuePhotoFileId || "").slice(0, 300);
    const issuePhotoFileIds = Array.isArray(body.issuePhotoFileIds) ? body.issuePhotoFileIds.slice(0, 3).map((id: unknown) => String(id).slice(0, 300)).filter(Boolean) : (issuePhotoFileId ? [issuePhotoFileId] : []);
    const location = body.location || {};
    const address = String(location.address || "").trim().slice(0, 500);
    if (!["SELF", "OTHER"].includes(bookingFor)) return NextResponse.json({ error: "Choose who this booking is for." }, { status: 400 });
    if (!["ONLINE", "CASH"].includes(paymentMethod)) return NextResponse.json({ error: "Choose online payment or cash after service." }, { status: 400 });
    if (issueDescription.length < 10) return NextResponse.json({ error: "Describe the vehicle problem in at least 10 characters." }, { status: 400 });
    if (!address) return NextResponse.json({ error: "Please enter the complete service address so the mechanic can find you." }, { status: 400 });

    const lat = location.lat === undefined ? undefined : Number(location.lat);
    const lng = location.lng === undefined ? undefined : Number(location.lng);
    if (lat === undefined || lng === undefined) return NextResponse.json({ error: "Allow location access so we can dispatch this request to mechanics near you." }, { status: 400 });
    if (!Number.isFinite(lat) || lat < -90 || lat > 90 || !Number.isFinite(lng) || lng < -180 || lng > 180) return NextResponse.json({ error: "Location coordinates are invalid." }, { status: 400 });

    await connectDB();
    let vehicleId: string | undefined;
    let vehicleDetails: Record<string, unknown> = {};
    let vehicleType = String(body.vehicleType || "").toUpperCase();
    let otherPersonName = "";
    let otherPersonPhone = "";

    if (bookingFor === "SELF") {
      vehicleId = String(body.vehicleId || "");
      if (!vehicleId || !/^[a-f\d]{24}$/i.test(vehicleId)) return NextResponse.json({ error: "Select one of your saved vehicles, or choose Other person." }, { status: 400 });
      const vehicle = await Vehicle.findOne({ _id: vehicleId, userId: auth.user._id }).lean() as any;
      if (!vehicle) return NextResponse.json({ error: "That saved vehicle does not belong to your account. Refresh and select again." }, { status: 403 });
      vehicleType = String(vehicle.type || "").toUpperCase();
      const fuelType = String(vehicle.fuelType || "").toUpperCase();
      const expectedType: Record<string,string> = { BIKE:"BIKE", SCOOTER:"SCOOTER", SCOOTER_EV:"SCOOTER", CAR:"CAR", EV:"CAR", TRUCK:"TRUCK", BUS:"BUS" };
      if (expectedType[serviceType] && expectedType[serviceType] !== vehicleType) return NextResponse.json({ error: "The selected service does not match your saved vehicle. Select a matching vehicle or change the service." }, { status: 400 });
      if ((serviceType === "EV" || serviceType === "SCOOTER_EV") && fuelType !== "ELECTRIC") return NextResponse.json({ error: "This service is only available for an electric vehicle. Select a vehicle marked Electric." }, { status: 400 });
      if (["CAR","SCOOTER"].includes(serviceType) && fuelType === "ELECTRIC") return NextResponse.json({ error: "Your selected vehicle is electric. Choose EV service for the correct specialist." }, { status: 400 });
      vehicleDetails = {
        type: String(vehicle.type || ""),
        brand: String(vehicle.brand || ""),
        model: String(vehicle.model || ""),
        year: Number(vehicle.year || 0),
        registrationNumber: String(vehicle.registrationNumber || ""),
        fuelType: String(vehicle.fuelType || ""),
        color: String(vehicle.color || "")
      };
    } else {
      vehicleType = String(body.vehicleType || "").toUpperCase();
      if (!["BIKE", "SCOOTER", "CAR", "TRUCK", "BUS"].includes(vehicleType)) return NextResponse.json({ error: "Choose a supported vehicle type." }, { status: 400 });
      const expectedType: Record<string,string> = { BIKE:"BIKE", SCOOTER:"SCOOTER", SCOOTER_EV:"SCOOTER", CAR:"CAR", EV:"CAR", TRUCK:"TRUCK", BUS:"BUS" };
      if (expectedType[serviceType] && expectedType[serviceType] !== vehicleType) return NextResponse.json({ error: "Select the matching vehicle type for this service." }, { status: 400 });
      const otherVehicleFuelType = String(body.otherVehicleFuelType || "").toUpperCase();
      if ((serviceType === "EV" || serviceType === "SCOOTER_EV") && otherVehicleFuelType !== "ELECTRIC") return NextResponse.json({ error: "Select Electric fuel for an EV service." }, { status: 400 });
      if (["CAR","SCOOTER"].includes(serviceType) && otherVehicleFuelType === "ELECTRIC") return NextResponse.json({ error: "For electric vehicles, select EV service." }, { status: 400 });
      otherPersonName = String(body.otherPersonName || "").trim().slice(0, 80);
      otherPersonPhone = String(body.otherPersonPhone || "").replace(/[()\s.-]/g, "").slice(0, 20);
      if (otherPersonName.length < 2) return NextResponse.json({ error: "Enter the other person's name." }, { status: 400 });
      if (!/^\+?[0-9]{10,15}$/.test(otherPersonPhone)) return NextResponse.json({ error: "Enter a valid 10–15 digit mobile number for the person needing help." }, { status: 400 });
      vehicleDetails = {
        type: vehicleType,
        brand: String(body.otherVehicleBrand || "").trim().slice(0, 60),
        model: String(body.otherVehicleModel || "").trim().slice(0, 80),
        year: null,
        registrationNumber: String(body.otherRegistrationNumber || "").trim().toUpperCase().replace(/\s+/g, "").slice(0, 20),
        fuelType: ["EV","SCOOTER_EV"].includes(serviceType) ? "ELECTRIC" : String(body.otherVehicleFuelType || "").toUpperCase(),
        color: ""
      };
    }

    const requestedCouponCode = String(body.couponCode || "").trim().toUpperCase().replace(/\s+/g, "");
    if (requestedCouponCode && !/^[A-Z0-9]{12}$/.test(requestedCouponCode)) {
      return NextResponse.json({ error: "Coupon code must contain exactly 12 letters and/or numbers." }, { status: 400 });
    }
    let redeemedCoupon: any = null;
    if (requestedCouponCode) {
      const now = new Date();
      redeemedCoupon = await Coupon.findOneAndUpdate({
        code: requestedCouponCode, claimedBy: auth.user._id, active: true, redeemedAt: null,
        $and: [
          { $or: [{ startsAt: null }, { startsAt: { $lte: now } }] },
          { $or: [{ expiresAt: null }, { expiresAt: { $gt: now } }] }
        ]
      }, { $set: { redeemedBy: auth.user._id, redeemedAt: now } }, { new: true }).lean() as any;
      if (!redeemedCoupon) {
        return NextResponse.json({ error: "Your coupon is no longer available. It may have expired, been disabled, or already been used. Please remove it and try again." }, { status: 409 });
      }
    }

    let booking: any;
    try {
      booking = await Booking.create({
        customerId: auth.user._id, vehicleId, vehicleType, serviceType, vehicleDetails, bookingFor,
        otherPersonName, otherPersonPhone, paymentMethod,
        paymentStatus: paymentMethod === "ONLINE" ? "PENDING" : "CASH_DUE",
        couponId: redeemedCoupon?._id || null, couponCode: redeemedCoupon?.code || "",
        couponDiscountAmount: Number(redeemedCoupon?.amount || 0),
        issueDescription, issuePhotoFileId: issuePhotoFileIds[0] || issuePhotoFileId, issuePhotoFileIds, location: { lat, lng, address }, status: "SEARCHING"
      });
    } catch (createError) {
      if (redeemedCoupon?._id) {
        await Coupon.updateOne({ _id: redeemedCoupon._id, redeemedBy: auth.user._id }, { $set: { redeemedBy: null, redeemedAt: null } }).catch(() => {});
      }
      throw createError;
    }

    let telegramAlertSent = true;
    try {
      const vehicleLabel = [vehicleDetails.brand, vehicleDetails.model, vehicleDetails.registrationNumber].filter(Boolean).join(" ") || String(vehicleDetails.type || vehicleType);
      await sendTelegramAlert([
        "<b>New MechanicGo booking</b>",
        "Booking: <code>" + booking._id + "</code>",
        "Booked by: " + escapeHtml(auth.user.name || "Customer") + " (" + escapeHtml(auth.user.phone || "no mobile") + ")",
        "For: " + escapeHtml(bookingFor === "OTHER" ? otherPersonName + " · " + otherPersonPhone : "Customer"),
        "Vehicle: " + escapeHtml(vehicleLabel + " [" + vehicleType + "]"),
        "Requested service: " + escapeHtml(serviceType.replace(/_/g, " ")),
        "Issue: " + escapeHtml(issueDescription),
        "Service address: " + escapeHtml(address),
        "Customer GPS: " + lat + ", " + lng,
        "Payment preference: " + escapeHtml(paymentMethod === "ONLINE" ? "ONLINE (payment pending)" : "CASH AFTER SERVICE"),
        ...(redeemedCoupon ? ["Coupon: " + escapeHtml(redeemedCoupon.code) + " · discount ₹" + Number(redeemedCoupon.amount)] : []),
        "Status: SEARCHING"
      ].join("\n"));
    } catch (error) { telegramAlertSent = false; console.error("Booking Telegram alert failed", error); }
    return NextResponse.json({ ok: true, booking, telegramAlertSent }, { status: 201 });
  } catch (error) {
    console.error("Create booking error", error);
    return NextResponse.json({ error: "Could not create booking." }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    const auth = await currentUser(request);
    if ("error" in auth) return NextResponse.json({ error: auth.error }, { status: auth.status });
    await connectDB();
    const capabilities: string[] = Array.isArray(auth.user.vehicleTypes) ? auth.user.vehicleTypes : [];
    const allowedTypes = new Set<string>();
    if (capabilities.includes("BOTH")) ["BIKE","SCOOTER","CAR"].forEach(type => allowedTypes.add(type));
    if (capabilities.includes("BIKE")) ["BIKE","SCOOTER"].forEach(type => allowedTypes.add(type));
    if (capabilities.includes("SCOOTER")) allowedTypes.add("SCOOTER");
    if (capabilities.includes("SCOOTER_EV")) allowedTypes.add("SCOOTER");
    if (capabilities.includes("CAR") || capabilities.includes("EV")) allowedTypes.add("CAR");
    if (capabilities.includes("TRUCK")) allowedTypes.add("TRUCK");
    if (capabilities.includes("BUS")) allowedTypes.add("BUS");
    const specialistEligibility = { $or: [
      { serviceType: { $nin: ["EV", "SCOOTER_EV"] } },
      ...(capabilities.includes("EV") ? [{ serviceType: "EV" }] : []),
      ...(capabilities.includes("SCOOTER_EV") ? [{ serviceType: "SCOOTER_EV" }] : [])
    ] };
    const filter = auth.user.role === "MECHANIC"
      ? { $or: [
          { mechanicId: auth.user._id },
          ...(auth.user.accountStatus === "ACTIVE" && auth.user.isOnDuty
            ? [{ status: "SEARCHING", vehicleType: { $in: [...allowedTypes] }, ...specialistEligibility }]
            : [])
        ] }
      : { customerId: auth.user._id };
    const bookingQuery = Booking.find(filter).sort({ createdAt: -1 }).limit(100);
    if (auth.user.role === "CUSTOMER") bookingQuery.populate("mechanicId", "name phone");
    const bookings = await bookingQuery.lean();
    const visibleBookings = auth.user.role === "MECHANIC"
      ? bookings.filter((booking: any) => booking.status !== "SEARCHING" || String(auth.user.serviceArea || "").trim().length > 0 && String(booking.location?.address || "").toLowerCase().includes(String(auth.user.serviceArea || "").trim().toLowerCase()))
      : bookings;
    return NextResponse.json({ bookings: visibleBookings });
  } catch (error) { console.error("List bookings error", error); return NextResponse.json({ error: "Could not load bookings." }, { status: 500 }); }
}
