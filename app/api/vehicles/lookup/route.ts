import { NextRequest, NextResponse } from "next/server";
import { currentUser } from "@/lib/session";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const VEHICLE_TYPES = new Set(["CAR", "BIKE", "SCOOTER", "TRUCK", "BUS"]);
const FUEL_TYPES = new Set(["PETROL", "DIESEL", "CNG", "ELECTRIC", "HYBRID", "LPG", "OTHER"]);
const firstString = (...values: unknown[]) => {
  for (const value of values) if (typeof value === "string" && value.trim()) return value.trim();
  return "";
};

export async function POST(request: NextRequest) {
  try {
    const auth = await currentUser(request);
    if ("error" in auth) return NextResponse.json({ error: auth.error }, { status: auth.status });
    if (auth.user.role !== "CUSTOMER") return NextResponse.json({ error: "Vehicle lookup is available for customer accounts." }, { status: 403 });

    const body = await request.json();
    const registrationNumber = String(body.registrationNumber || "").trim().toUpperCase().replace(/\s+/g, "");
    if (!/^[A-Z0-9-]{4,20}$/.test(registrationNumber)) {
      return NextResponse.json({ error: "Enter a valid registration number, for example UP32AB1234." }, { status: 400 });
    }

    const endpoint = process.env.VEHICLE_LOOKUP_API_URL;
    const apiKey = process.env.VEHICLE_LOOKUP_API_KEY;
    if (!endpoint || !apiKey) {
      return NextResponse.json({
        error: "Automatic number-plate lookup abhi configure nahi hai. Authorised vehicle-data API connect karni hogi. Aap neeche manually details bhar sakte hain."
      }, { status: 503 });
    }

    const upstream = await fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json", "Authorization": "Bearer " + apiKey },
      body: JSON.stringify({ registrationNumber, vehicleNumber: registrationNumber }),
      cache: "no-store",
      signal: AbortSignal.timeout(10000)
    });
    if (!upstream.ok) {
      console.error("Vehicle lookup provider returned status", upstream.status);
      return NextResponse.json({ error: "Vehicle-data provider could not return details right now. Please enter them manually." }, { status: 502 });
    }

    const result: any = await upstream.json();
    const source = result?.vehicle || result?.data?.vehicle || result?.data || result?.result || result;
    if (result?.success === false || result?.status === "failed" || result?.status === "error" || !source || typeof source !== "object") {
      return NextResponse.json({ error: "No verified vehicle details were returned for this registration number. Please check it or enter details manually." }, { status: 404 });
    }

    const rawType = firstString(source.type, source.vehicleType, source.vehicle_type, source.class, source.vehicleClass).toUpperCase();
    const type = rawType.includes("BUS") ? "BUS" : rawType.includes("TRUCK") || rawType.includes("GOODS") || rawType.includes("LGV") || rawType.includes("HGV") ? "TRUCK" : rawType.includes("SCOOTER") || rawType.includes("M-CYCLE") || rawType.includes("MOTORCYCLE") || rawType.includes("BIKE") ? "BIKE" : rawType.includes("CAR") || rawType.includes("LMV") ? "CAR" : "";
    const rawFuel = firstString(source.fuelType, source.fuel_type, source.fuel, source.fuelDesc).toUpperCase();
    const fuelType = rawFuel.includes("ELECTRIC") || rawFuel === "EV" ? "ELECTRIC" : rawFuel.includes("DIESEL") ? "DIESEL" : rawFuel.includes("CNG") ? "CNG" : rawFuel.includes("HYBRID") ? "HYBRID" : rawFuel.includes("LPG") ? "LPG" : rawFuel.includes("PETROL") || rawFuel.includes("GASOLINE") ? "PETROL" : "";
    const vehicle = {
      type: VEHICLE_TYPES.has(type) ? type : "",
      brand: firstString(source.brand, source.make, source.manufacturer, source.maker, source.company),
      model: firstString(source.model, source.modelName, source.model_name, source.vehicleModel),
      year: Number(firstString(source.year, source.manufacturingYear, source.manufacturing_year, source.mfgYear)) || "",
      fuelType: FUEL_TYPES.has(fuelType) ? fuelType : "",
      color: firstString(source.color, source.colour),
      registrationNumber
    };
    const hasDetails = Boolean(vehicle.type || vehicle.brand || vehicle.model || vehicle.year || vehicle.fuelType);
    if (!hasDetails) return NextResponse.json({ error: "Provider did not return usable vehicle details. Please enter them manually." }, { status: 404 });
    return NextResponse.json({ ok: true, vehicle, message: "Provider se mili details ko check kar lein, phir Save Vehicle dabayein." });
  } catch (error) {
    console.error("Vehicle lookup error", error);
    return NextResponse.json({ error: "Vehicle lookup service temporarily unavailable. You can still enter details manually." }, { status: 502 });
  }
}
