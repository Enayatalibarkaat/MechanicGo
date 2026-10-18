import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import { currentUser } from "@/lib/session";
import Vehicle from "@/models/Vehicle";
import { sendTelegramAlert } from "@/lib/telegram";
export const runtime = "nodejs";

const VEHICLE_TYPES = ["CAR", "BIKE", "SCOOTER", "TRUCK", "BUS"];
const FUEL_TYPES = ["PETROL", "DIESEL", "CNG", "ELECTRIC", "HYBRID", "LPG", "OTHER"];

export async function GET(request: NextRequest) {
  try {
    const auth = await currentUser(request);
    if ("error" in auth) return NextResponse.json({ error: auth.error }, { status: auth.status });
    if (auth.user.role !== "CUSTOMER") return NextResponse.json({ error: "Vehicles are available for customer accounts." }, { status: 403 });
    await connectDB();
    const vehicles = await Vehicle.find({ userId: auth.user._id }).sort({ createdAt: -1 }).limit(50).lean();
    return NextResponse.json({ vehicles });
  } catch (error) {
    console.error("Load vehicles error", error);
    return NextResponse.json({ error: "Could not load your vehicles." }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const auth = await currentUser(request);
    if ("error" in auth) return NextResponse.json({ error: auth.error }, { status: auth.status });
    if (auth.user.role !== "CUSTOMER") return NextResponse.json({ error: "Vehicles are available for customer accounts." }, { status: 403 });
    const body = await request.json();
    const type = String(body.type || "").toUpperCase();
    const brand = String(body.brand || "").trim().slice(0, 60);
    const model = String(body.model || "").trim().slice(0, 80);
    const registrationNumber = String(body.registrationNumber || "").trim().toUpperCase().replace(/\s+/g, "");
    const fuelType = String(body.fuelType || "").toUpperCase();
    const color = String(body.color || "").trim().slice(0, 40);
    const year = Number(body.year);
    const currentYear = new Date().getFullYear();
    if (!VEHICLE_TYPES.includes(type)) return NextResponse.json({ error: "Choose a vehicle type: car, bike, scooter, truck, or bus." }, { status: 400 });
    if (!brand || !model) return NextResponse.json({ error: "Brand and model are required." }, { status: 400 });
    if (!Number.isInteger(year) || year < 1950 || year > currentYear + 1) return NextResponse.json({ error: "Enter a valid vehicle year." }, { status: 400 });
    if (!/^[A-Z0-9-]{4,20}$/.test(registrationNumber)) return NextResponse.json({ error: "Enter a valid registration number without spaces." }, { status: 400 });
    if (!FUEL_TYPES.includes(fuelType)) return NextResponse.json({ error: "Choose a valid fuel type." }, { status: 400 });
    await connectDB();
    const vehicle = await Vehicle.create({ userId: auth.user._id, type, brand, model, year, registrationNumber, fuelType, color });
    let telegramSent = false;
    if (auth.user.profileNotificationsConsent) {
      try {
        const esc = (value: string) => value.replace(/[&<>"]/g, character => ({ "&":"&amp;", "<":"&lt;", ">":"&gt;", '"':"&quot;" }[character] || character));
        await sendTelegramAlert([
          "<b>MechanicGo — Vehicle added</b>",
          "Customer: " + esc(auth.user.name),
          "Username: " + esc(auth.user.username || "not set"),
          "Email: " + esc(auth.user.email || ""),
          "Vehicle: " + esc(brand + " " + model + " (" + type + ")"),
          "Registration: " + esc(registrationNumber),
          "Fuel: " + esc(fuelType),
          "Changed by: signed-in customer",
          "Timestamp (UTC): " + new Date().toISOString()
        ].join("\n"));
        telegramSent = true;
      } catch (error) { console.error("Vehicle-add Telegram audit failed", error); }
    }
    return NextResponse.json({ ok: true, vehicle, telegramSent }, { status: 201 });
  } catch (error) {
    const duplicate = error && typeof error === "object" && "code" in error && (error as { code?: number }).code === 11000;
    if (duplicate) return NextResponse.json({ error: "This registration number is already saved in your account." }, { status: 409 });
    console.error("Save vehicle error", error);
    return NextResponse.json({ error: "Could not save vehicle. Check the details and try again." }, { status: 500 });
  }
}
