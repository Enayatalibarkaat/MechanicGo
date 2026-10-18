"use client";

import { useMemo, useState } from "react";
import { ArrowLeft, Bike, BusFront, CarFront, CheckCircle2, Search, Truck, Fuel, Hash, ChevronDown, LoaderCircle, PlusCircle } from "lucide-react";

type VehicleType = "CAR" | "BIKE" | "SCOOTER" | "TRUCK" | "BUS";
type FuelType = "PETROL" | "DIESEL" | "CNG" | "ELECTRIC" | "HYBRID" | "LPG" | "OTHER";

const catalog: Record<VehicleType, Record<string, string[]>> = {
  BIKE: {
    Hero: ["Splendor Plus", "HF Deluxe", "Glamour", "Xtreme 125R", "Passion Plus", "Karizma XMR"],
    Honda: ["Shine", "SP 125", "Unicorn", "Hornet 2.0", "CB350", "CB350 H'ness"],
    TVS: ["Apache RTR 160", "Apache RTR 200 4V", "Raider 125", "Sport", "Radeon", "Ronin"],
    Bajaj: ["Pulsar 125", "Pulsar NS125", "Pulsar N160", "Pulsar NS200", "Platina", "Avenger"],
    Royal_Enfield: ["Classic 350", "Bullet 350", "Hunter 350", "Meteor 350", "Himalayan", "Interceptor 650"],
    Suzuki: ["Gixxer", "Gixxer SF", "V-Strom SX", "Access 125"],
    Yamaha: ["FZ-S", "MT-15", "R15", "Fascino 125"],
    KTM: ["Duke 200", "Duke 250", "RC 200", "Adventure 390"],
    Jawa: ["Jawa 42", "Perak", "42 Bobber"],
    Yezdi: ["Roadster", "Adventure", "Scrambler"],
    Triumph: ["Speed 400", "Scrambler 400 X", "Thruxton 400"],
    BMW: ["G 310 R", "G 310 GS", "F 900 GS"],
    "Revolt Motors": ["RV1", "RV400"],
    Ola: ["Roadster X", "Roadster Pro"],
    Other: []
  },
  SCOOTER: {
    Honda: ["Activa 6G", "Activa 125", "Dio", "Dio 125"],
    TVS: ["Jupiter 110", "Jupiter 125", "NTorq 125", "Zest 110", "iQube"],
    Suzuki: ["Access 125", "Burgman Street", "Avenis"],
    Hero: ["Destini 125", "Xoom 110", "Pleasure Plus"],
    Yamaha: ["Fascino 125", "RayZR 125", "Aerox 155"],
    Bajaj: ["Chetak"],
    Ather: ["450X", "Rizta"],
    Ola: ["S1 X", "S1 Pro", "S1 Air"],
    "Ampere": ["Nexus", "Magnus"],
    "River": ["Indie"],
    Other: []
  },
  CAR: {
    Maruti_Suzuki: ["Alto K10", "S-Presso", "Wagon R", "Celerio", "Swift", "Dzire", "Baleno", "Fronx", "Brezza", "Ertiga", "Grand Vitara", "XL6", "Jimny", "Invicto"],
    Hyundai: ["Grand i10 Nios", "i20", "Aura", "Exter", "Venue", "Creta", "Verna", "Alcazar", "Tucson", "Ioniq 5"],
    Tata: ["Tiago", "Tigor", "Altroz", "Punch", "Nexon", "Curvv", "Harrier", "Safari", "Tiago EV", "Nexon EV"],
    Mahindra: ["Bolero", "Bolero Neo", "Thar", "Thar Roxx", "Scorpio Classic", "Scorpio-N", "XUV 3XO", "XUV 700", "BE 6", "XEV 9e"],
    Toyota: ["Glanza", "Taisor", "Urban Cruiser Hyryder", "Rumion", "Innova Crysta", "Innova Hycross", "Fortuner", "Camry", "Hilux"],
    Kia: ["Sonet", "Seltos", "Carens", "Carnival", "EV6", "EV9"],
    Honda: ["Amaze", "City", "Elevate"],
    Renault: ["Kwid", "Triber", "Kiger"],
    Nissan: ["Magnite", "X-Trail"],
    Skoda: ["Kylaq", "Slavia", "Kushaq", "Kodiaq", "Superb"],
    Volkswagen: ["Virtus", "Taigun", "Tiguan"],
    MG: ["Comet EV", "Windsor EV", "Astor", "Hector", "Gloster", "ZS EV"],
    Citroen: ["C3", "C3 Aircross", "Basalt", "eC3"],
    Jeep: ["Compass", "Meridian", "Wrangler"],
    BYD: ["Atto 3", "Seal", "eMax 7"],
    BMW: ["2 Series", "3 Series", "5 Series", "X1", "X3", "X5"],
    Mercedes_Benz: ["A-Class", "C-Class", "E-Class", "GLA", "GLC", "GLE"],
    Audi: ["A4", "A6", "Q3", "Q5", "Q7"],
    Volvo: ["XC40", "XC60", "XC90", "EX40"],
    Other: []
  },
  TRUCK: {
    Tata: ["Ace", "Intra", "407", "709", "LPT 1109", "Signa", "Prima"],
    Ashok_Leyland: ["Dost", "Bada Dost", "Partner", "Ecomet", "Boss", "AVTR"],
    Mahindra: ["Bolero Pik-Up", "Furio", "Blazo X", "Jayo"],
    Eicher: ["Pro 2049", "Pro 3015", "Pro 6028"],
    BharatBenz: ["1917R", "2823R", "3528C"],
    Force: ["Traveller", "Kargo King"],
    Other: []
  },
  BUS: {
    Tata: ["Starbus", "Starbus Ultra", "Magna", "Cityride"],
    Ashok_Leyland: ["Viking", "Cheetah", "Oyster", "JanBus"],
    Eicher: ["Skyline Pro", "Starline"],
    Force: ["Traveller", "Urbania"],
    Volvo: ["9400", "9600", "B8R"],
    BharatBenz: ["1624", "1824"],
    Other: []
  }
};

const typeOptions: { value: VehicleType; label: string; Icon: typeof CarFront }[] = [
  { value: "CAR", label: "Car", Icon: CarFront },
  { value: "BIKE", label: "Bike", Icon: Bike },
  { value: "SCOOTER", label: "Scooter", Icon: Bike },
  { value: "TRUCK", label: "Truck", Icon: Truck },
  { value: "BUS", label: "Bus", Icon: BusFront }
];
const fuelOptions: { value: FuelType; label: string; note: string }[] = [
  { value: "PETROL", label: "Petrol", note: "Petrol engine" },
  { value: "DIESEL", label: "Diesel", note: "Diesel engine" },
  { value: "CNG", label: "CNG", note: "Gas" },
  { value: "ELECTRIC", label: "Electric", note: "EV" },
  { value: "HYBRID", label: "Hybrid", note: "Fuel + electric" },
  { value: "LPG", label: "LPG", note: "Gas" },
  { value: "OTHER", label: "Other", note: "Other fuel" }
];
const labelFor = (value: string) => value.replaceAll("_", " ");

export default function AddVehicle() {
  const [type, setType] = useState<VehicleType | "">("");
  const [brand, setBrand] = useState("");
  const [model, setModel] = useState("");
  const [year, setYear] = useState("");
  const [registrationNumber, setRegistrationNumber] = useState("");
  const [fuelType, setFuelType] = useState<FuelType | "">("");
  const [color, setColor] = useState("");
  const [lookupOpen, setLookupOpen] = useState(false);
  const [lookupBusy, setLookupBusy] = useState(false);
  const [lookupMessage, setLookupMessage] = useState("");
  const [lookupError, setLookupError] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [brandSearch, setBrandSearch] = useState("");
  const [modelSearch, setModelSearch] = useState("");

  const brands = useMemo(() => type ? Object.keys(catalog[type]).map(labelFor) : [], [type]);
  const modelSuggestions = useMemo(() => {
    if (!type || !brand.trim()) return [];
    const key = Object.keys(catalog[type]).find(item => item.toLowerCase().replaceAll("_", " ") === brand.trim().toLowerCase());
    return key ? catalog[type][key] : [];
  }, [type, brand]);

  const changeType = (value: VehicleType) => {
    setType(value);
    setBrand("");
    setModel("");
    setBrandSearch("");
    setModelSearch("");
  };

  const lookupVehicle = async () => {
    const plate = registrationNumber.trim().toUpperCase().replace(/\s+/g, "");
    if (!plate) { setLookupError(true); setLookupMessage("Pehle vehicle registration number enter karein."); return; }
    setRegistrationNumber(plate);
    setLookupBusy(true); setLookupError(false); setLookupMessage("");
    try {
      const response = await fetch("/api/vehicles/lookup", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ registrationNumber: plate }) });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Vehicle details could not be fetched.");
      const found = data.vehicle || {};
      if (found.type && typeOptions.some(option => option.value === found.type)) setType(found.type);
      if (found.brand) setBrand(found.brand);
      if (found.model) setModel(found.model);
      if (found.year) setYear(String(found.year));
      if (found.fuelType && fuelOptions.some(option => option.value === found.fuelType)) setFuelType(found.fuelType);
      if (found.color) setColor(found.color);
      setLookupError(false);
      setLookupMessage(data.message || "Vehicle details mil gayi hain. Save karne se pehle check kar lein.");
    } catch (e) {
      setLookupError(true);
      setLookupMessage(e instanceof Error ? e.message : "Vehicle lookup abhi available nahi hai. Aap manually details bhar sakte hain.");
    } finally { setLookupBusy(false); }
  };

  const save = async () => {
    setError("");
    if (!type) { setError("Vehicle type select karein."); return; }
    if (!brand.trim() || !model.trim()) { setError("Brand aur model enter karein ya suggestions mein se select karein."); return; }
    if (!year || !Number.isInteger(Number(year))) { setError("Vehicle ka year enter karein."); return; }
    if (!registrationNumber.trim()) { setError("Registration number enter karein."); return; }
    if (!fuelType) { setError("Fuel type select karein."); return; }
    setBusy(true);
    try {
      const response = await fetch("/api/vehicles", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ type, brand: brand.trim(), model: model.trim(), year: Number(year), registrationNumber, fuelType, color }) });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Could not save vehicle.");
      location.replace("/vehicles");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not save vehicle.");
    } finally { setBusy(false); }
  };

  return <main className="appPage vehicleAddPage">
    <header className="pageHeader"><a href="/vehicles" aria-label="Back to vehicles"><ArrowLeft /></a><h1>Add Vehicle</h1><span className="vehicleHeaderSpacer" /></header>
    <section className="vehicleLookupHero">
      <div className="vehicleLookupIcon"><Hash size={24} /></div>
      <div className="vehicleLookupCopy"><span className="vehicleEyebrow">QUICK ADD</span><h2>Add using vehicle number</h2><p>Registration number enter karke available vehicle details automatically fill karne ki koshish karein.</p></div>
      <button type="button" className="vehicleLookupToggle" onClick={() => setLookupOpen(open => !open)} aria-expanded={lookupOpen}>{lookupOpen ? "Close" : "Add by number"} <ChevronDown className={lookupOpen ? "rotateChevron" : ""} size={18} /></button>
      {lookupOpen && <div className="vehicleLookupForm"><label htmlFor="quick-registration">Vehicle registration number</label><div className="vehicleLookupInput"><input id="quick-registration" value={registrationNumber} onChange={event => setRegistrationNumber(event.target.value.toUpperCase())} placeholder="e.g. UP32AB1234" autoCapitalize="characters" maxLength={20} /><button type="button" onClick={() => void lookupVehicle()} disabled={lookupBusy}>{lookupBusy ? <LoaderCircle className="spinIcon" size={18} /> : <Search size={18} />} {lookupBusy ? "Checking…" : "Find details"}</button></div>{lookupMessage && <p className={lookupError ? "lookupMessage lookupError" : "lookupMessage lookupSuccess"} role="status">{lookupMessage}</p>}</div>}
    </section>

    <section className="formCard vehicleFormCard">
      <div className="vehicleFormIntro"><span className="vehicleEyebrow">VEHICLE DETAILS</span><h2>Tell us about your vehicle</h2><p>Suggestions help you fill details faster. You can also type a name that is not listed.</p></div>
      <fieldset className="vehicleTypeField"><legend>Vehicle type <span>Required</span></legend><div className="vehicleTypeGrid">{typeOptions.map(({ value, label, Icon }) => <button key={value} type="button" className={type === value ? "vehicleTypeOption selected" : "vehicleTypeOption"} onClick={() => changeType(value)} aria-pressed={type === value}><Icon size={24} /><span>{label}</span>{type === value && <CheckCircle2 className="typeCheck" size={17} />}</button>)}</div></fieldset>

      <label className="vehicleField" htmlFor="vehicle-brand"><span>Brand <i>Required</i></span><input id="vehicle-brand" list="vehicle-brand-options" value={brand} onChange={event => { setBrand(event.target.value); setBrandSearch(event.target.value); setModel(""); }} placeholder={type ? "Search or type a brand" : "Choose vehicle type first"} disabled={!type} autoComplete="off" /><datalist id="vehicle-brand-options">{brands.filter(item => item.toLowerCase().includes(brandSearch.toLowerCase())).map(item => <option key={item} value={item} />)}</datalist><small>Search suggestions or enter any brand name.</small></label>
      <label className="vehicleField" htmlFor="vehicle-model"><span>Model <i>Required</i></span><input id="vehicle-model" list="vehicle-model-options" value={model} onChange={event => { setModel(event.target.value); setModelSearch(event.target.value); }} placeholder={brand.trim() ? "Search or type a model" : "Enter a brand first"} disabled={!brand.trim()} autoComplete="off" /><datalist id="vehicle-model-options">{modelSuggestions.filter(item => item.toLowerCase().includes(modelSearch.toLowerCase())).map(item => <option key={item} value={item} />)}</datalist><small>{modelSuggestions.length ? "Suggestions are filtered by the selected brand." : "You can type the exact model if it is not listed."}</small></label>

      <div className="vehicleTwoCols"><label className="vehicleField" htmlFor="vehicle-year"><span>Manufacturing year <i>Required</i></span><input id="vehicle-year" type="number" inputMode="numeric" value={year} onChange={event => setYear(event.target.value)} min="1950" max={new Date().getFullYear() + 1} placeholder="e.g. 2022" /></label><label className="vehicleField" htmlFor="vehicle-registration"><span>Registration number <i>Required</i></span><input id="vehicle-registration" value={registrationNumber} onChange={event => setRegistrationNumber(event.target.value.toUpperCase())} maxLength={20} placeholder="e.g. UP32AB1234" autoCapitalize="characters" /></label></div>

      <fieldset className="fuelField"><legend><Fuel size={17} /> Fuel type <span>Required</span></legend><div className="fuelOptionGrid">{fuelOptions.map(option => <button type="button" key={option.value} className={fuelType === option.value ? "fuelOption selected" : "fuelOption"} onClick={() => setFuelType(option.value)} aria-pressed={fuelType === option.value}><span className="fuelRadio">{fuelType === option.value && <span />}</span><span className="fuelWords"><b>{option.label}</b><small>{option.note}</small></span></button>)}</div></fieldset>
      <label className="vehicleField" htmlFor="vehicle-colour"><span>Colour <em>Optional</em></span><input id="vehicle-colour" value={color} onChange={event => setColor(event.target.value)} maxLength={40} placeholder="e.g. Black" /></label>
      {error && <p className="setupError" role="alert">{error}</p>}
      <button className="primaryWide vehicleSaveButton" onClick={() => void save()} disabled={busy}>{busy ? <LoaderCircle className="spinIcon" size={19} /> : <PlusCircle size={19} />}{busy ? "Saving vehicle…" : "Save Vehicle"}{!busy && <CheckCircle2 size={18} />}</button>
      <p className="privacyHint">Your vehicle is saved securely to your account and is available only when you are signed in.</p>
    </section>
  </main>;
}
