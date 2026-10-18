"use client";
import { useCallback, useEffect, useState } from "react";
import { ArrowLeft, Bike, CarFront, Camera, MapPin, Send, UserRound, UsersRound, CreditCard, Banknote, CheckCircle2, Plus, LoaderCircle, Car, ShieldCheck } from "lucide-react";

type Vehicle = {
  _id: string; type: string; brand: string; model: string; year: number;
  registrationNumber: string; fuelType: string; color?: string;
};
type PaymentMethod = "ONLINE" | "CASH";
type BookingFor = "SELF" | "OTHER";
const vehicleName = (type: string) => ({ CAR:"Car", BIKE:"Bike", SCOOTER:"Scooter", TRUCK:"Truck", BUS:"Bus" }[type] || type);
const displayType = (type: string) => ["BIKE", "SCOOTER"].includes(type) ? "BIKE" : "CAR";

export default function CreateBooking() {
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [vehiclesLoading, setVehiclesLoading] = useState(true);
  const [vehiclesError, setVehiclesError] = useState("");
  const [bookingFor, setBookingFor] = useState<BookingFor>("SELF");
  const [selectedVehicleId, setSelectedVehicleId] = useState("");
  const [otherVehicleType, setOtherVehicleType] = useState("BIKE");
  const [otherPersonName, setOtherPersonName] = useState("");
  const [otherPersonPhone, setOtherPersonPhone] = useState("");
  const [otherVehicleBrand, setOtherVehicleBrand] = useState("");
  const [otherVehicleModel, setOtherVehicleModel] = useState("");
  const [otherRegistrationNumber, setOtherRegistrationNumber] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("CASH");
  const [issueDescription, setIssueDescription] = useState("");
  const [address, setAddress] = useState("");
  const [photo, setPhoto] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [warning, setWarning] = useState("");

  const loadVehicles = useCallback(async () => {
    setVehiclesLoading(true);
    setVehiclesError("");
    try {
      const response = await fetch("/api/vehicles", { cache: "no-store" });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Could not load saved vehicles.");
      const saved: Vehicle[] = Array.isArray(data.vehicles) ? data.vehicles : [];
      setVehicles(saved);
      setSelectedVehicleId(current => current && saved.some(v => v._id === current) ? current : "");
    } catch (e) {
      setVehiclesError(e instanceof Error ? e.message : "Could not load saved vehicles.");
    } finally {
      setVehiclesLoading(false);
    }
  }, []);

  useEffect(() => { void loadVehicles(); }, [loadVehicles]);

  const submit = async () => {
    setError(""); setSuccess(""); setWarning("");
    if (bookingFor === "SELF" && !selectedVehicleId) {
      setError(vehicles.length ? "Please select the vehicle you need help with, or choose Other person." : "Add a vehicle to your garage first, or choose Other person if you're booking for someone else.");
      return;
    }
    if (bookingFor === "OTHER") {
      if (otherPersonName.trim().length < 2) { setError("Please enter the person's name."); return; }
      if (!/^\+?[0-9]{10,15}$/.test(otherPersonPhone.replace(/[()\s.-]/g, ""))) { setError("Please enter a valid mobile number for the person needing help."); return; }
    }
    if (issueDescription.trim().length < 5) { setError("Please describe the vehicle problem in at least 5 characters."); return; }
    if (!address.trim()) { setError("Please enter the complete service address."); return; }
    setBusy(true);
    try {
      let issuePhotoFileId = "";
      if (photo) {
        const form = new FormData();
        form.append("file", photo);
        form.append("kind", "issuePhoto");
        const upload = await fetch("/api/telegram/upload", { method: "POST", body: form });
        const uploadData = await upload.json();
        if (!upload.ok) throw new Error(uploadData.error || "Photo upload failed.");
        issuePhotoFileId = uploadData.fileId;
      }
      const selectedVehicle = vehicles.find(v => v._id === selectedVehicleId);
      const vehicleType = bookingFor === "SELF" ? displayType(selectedVehicle?.type || "") : otherVehicleType;
      const response = await fetch("/api/bookings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          bookingFor, vehicleId: bookingFor === "SELF" ? selectedVehicleId : undefined,
          vehicleType, otherPersonName: otherPersonName.trim(), otherPersonPhone: otherPersonPhone.trim(),
          otherVehicleBrand, otherVehicleModel, otherRegistrationNumber,
          paymentMethod, issueDescription: issueDescription.trim(), issuePhotoFileId,
          location: { address: address.trim() }
        })
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Booking failed.");
      setSuccess("Booking created successfully. Booking ID: " + data.booking._id);
      if (data.telegramAlertSent === false) setWarning("Booking saved, but the Telegram dispatch alert could not be confirmed. Please contact support.");
      setIssueDescription(""); setAddress(""); setPhoto(null);
      setOtherPersonName(""); setOtherPersonPhone(""); setOtherVehicleBrand(""); setOtherVehicleModel(""); setOtherRegistrationNumber("");
      setSelectedVehicleId("");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not create booking.");
    } finally {
      setBusy(false);
    }
  };

  return <main className="appPage bookingPage">
    <header className="pageHeader"><a href="/home" aria-label="Back to home"><ArrowLeft /></a><h1>Book a mechanic</h1></header>
    <div className="bookingShell">
      <div className="bookingIntro">
        <div className="bookingEyebrow"><span /> ROAD-SIDE ASSISTANCE</div>
        <h2>Let’s get you moving.</h2>
        <p>Choose a vehicle, tell us what happened, and we’ll send your request to available mechanics.</p>
        <div className="bookingTrust"><ShieldCheck size={17} /> Secure booking <span>·</span> No booking fee</div>
      </div>

      <section className="bookingCard">
        <div className="bookingStep"><span>01</span><div><h3>Who needs help?</h3><p>Book for your own vehicle or someone else.</p></div></div>
        <div className="bookingRecipientGrid">
          <button type="button" className={"bookingRecipient" + (bookingFor === "SELF" ? " isSelected" : "")} onClick={() => { setBookingFor("SELF"); setError(""); }}>
            <span className="bookingRecipientIcon"><UserRound size={21}/></span><span><b>My vehicle</b><small>Choose from your garage</small></span>{bookingFor === "SELF" && <CheckCircle2 className="bookingCheck" size={20}/>}
          </button>
          <button type="button" className={"bookingRecipient" + (bookingFor === "OTHER" ? " isSelected" : "")} onClick={() => { setBookingFor("OTHER"); setError(""); }}>
            <span className="bookingRecipientIcon"><UsersRound size={21}/></span><span><b>Other person</b><small>Book for family or a friend</small></span>{bookingFor === "OTHER" && <CheckCircle2 className="bookingCheck" size={20}/>}
          </button>
        </div>

        {bookingFor === "SELF" ? <div className="bookingSubsection">
          <div className="bookingSubhead"><h4>Select your vehicle</h4><a href="/vehicles/add"><Plus size={16}/> Add vehicle</a></div>
          {vehiclesLoading ? <div className="bookingLoading"><LoaderCircle size={19} className="bookingSpin"/> Loading your garage…</div> :
            vehiclesError ? <div className="bookingInlineError">{vehiclesError}<button type="button" onClick={() => void loadVehicles()}>Retry</button></div> :
            vehicles.length === 0 ? <div className="bookingEmptyGarage"><span><Car size={24}/></span><div><b>Your garage is empty</b><p>Add your vehicle once to book faster next time, or choose “Other person” above.</p><a href="/vehicles/add">Add a vehicle <Plus size={15}/></a></div></div> :
            <div className="bookingVehicleList">{vehicles.map(vehicle => {
              const chosen = selectedVehicleId === vehicle._id;
              return <button type="button" key={vehicle._id} className={"bookingVehicle" + (chosen ? " isSelected" : "")} onClick={() => { setSelectedVehicleId(vehicle._id); setError(""); }}>
                <span className="bookingVehicleIcon">{["BIKE","SCOOTER"].includes(vehicle.type) ? <Bike size={22}/> : <CarFront size={22}/>}</span>
                <span className="bookingVehicleDetails"><b>{vehicle.brand} {vehicle.model}</b><small>{vehicleName(vehicle.type)} · {vehicle.year}</small><small className="bookingPlate">{vehicle.registrationNumber}</small></span>
                <span className={"bookingRadio" + (chosen ? " checked" : "")}>{chosen && <span/>}</span>
              </button>;
            })}</div>}
        </div> : <div className="bookingSubsection bookingOtherFields">
          <h4>Person and vehicle details</h4>
          <div className="bookingFieldGrid">
            <label className="bookingField"><span>Person’s full name <i>Required</i></span><input value={otherPersonName} onChange={e => setOtherPersonName(e.target.value)} maxLength={80} placeholder="Name of the person" autoComplete="name"/></label>
            <label className="bookingField"><span>Mobile number <i>Required</i></span><input type="tel" value={otherPersonPhone} onChange={e => setOtherPersonPhone(e.target.value)} maxLength={16} placeholder="10-digit mobile number" autoComplete="tel"/></label>
          </div>
          <div className="bookingTypeGrid">
            <button type="button" className={"bookingType" + (otherVehicleType === "BIKE" ? " isSelected" : "")} onClick={() => setOtherVehicleType("BIKE")}><Bike size={21}/> Bike / Scooter</button>
            <button type="button" className={"bookingType" + (otherVehicleType === "CAR" ? " isSelected" : "")} onClick={() => setOtherVehicleType("CAR")}><CarFront size={21}/> Car</button>
          </div>
          <div className="bookingFieldGrid">
            <label className="bookingField"><span>Brand <i>Optional</i></span><input value={otherVehicleBrand} onChange={e => setOtherVehicleBrand(e.target.value)} maxLength={60} placeholder="e.g. Honda"/></label>
            <label className="bookingField"><span>Model <i>Optional</i></span><input value={otherVehicleModel} onChange={e => setOtherVehicleModel(e.target.value)} maxLength={80} placeholder="e.g. Activa"/></label>
          </div>
          <label className="bookingField"><span>Vehicle number <i>Optional</i></span><input value={otherRegistrationNumber} onChange={e => setOtherRegistrationNumber(e.target.value.toUpperCase())} maxLength={20} placeholder="e.g. UP32AB1234"/></label>
        </div>}

        <div className="bookingDivider"/>
        <div className="bookingStep"><span>02</span><div><h3>What needs fixing?</h3><p>Describe the issue so the mechanic arrives prepared.</p></div></div>
        <label className="bookingField bookingFullField"><span>Vehicle problem <i>Required</i></span><textarea value={issueDescription} onChange={e => setIssueDescription(e.target.value)} rows={3} maxLength={2000} placeholder="e.g. Engine won’t start, flat tyre, battery issue…"/></label>
        <label className="bookingField bookingFullField"><span>Service address <i>Required</i></span><div className="bookingInputWithIcon"><MapPin size={19}/><input value={address} onChange={e => setAddress(e.target.value)} maxLength={500} placeholder="Where should the mechanic come?"/></div></label>
        <label className="bookingField bookingFullField"><span>Photo of the problem <i>Optional</i></span><div className="bookingInputWithIcon"><Camera size={19}/><input type="file" accept="image/jpeg,image/png,image/webp,application/pdf" onChange={e => setPhoto(e.target.files?.[0] || null)}/></div>{photo && <small className="bookingFileName">{photo.name}</small>}</label>

        <div className="bookingDivider"/>
        <div className="bookingStep"><span>03</span><div><h3>Payment preference</h3><p>Choose how you’d prefer to pay for the service.</p></div></div>
        <div className="bookingPaymentGrid">
          <button type="button" className={"bookingPayment" + (paymentMethod === "ONLINE" ? " isSelected" : "")} onClick={() => setPaymentMethod("ONLINE")}>
            <span className="bookingPaymentIcon"><CreditCard size={22}/></span><span><b>Online payment</b><small>Digital payment when payment is enabled</small></span>{paymentMethod === "ONLINE" && <CheckCircle2 className="bookingCheck" size={19}/>}
          </button>
          <button type="button" className={"bookingPayment" + (paymentMethod === "CASH" ? " isSelected" : "")} onClick={() => setPaymentMethod("CASH")}>
            <span className="bookingPaymentIcon"><Banknote size={22}/></span><span><b>Cash after service</b><small>Pay the mechanic when work is done</small></span>{paymentMethod === "CASH" && <CheckCircle2 className="bookingCheck" size={19}/>}
          </button>
        </div>
        {paymentMethod === "ONLINE" && <p className="bookingPaymentNote">Online is saved as your preference. A secure checkout will be available after a payment gateway is configured; no money is charged by submitting this booking.</p>}

        {error && <p className="bookingError" role="alert">{error}</p>}
        {success && <p className="bookingSuccess" role="status">{success} <a href="/bookings">View my bookings</a></p>}
        {warning && <p className="bookingError" role="alert">{warning}</p>}
        <button type="button" className="bookingSubmit" disabled={busy || vehiclesLoading} onClick={() => void submit()}>{busy ? <><LoaderCircle className="bookingSpin" size={19}/> Creating booking…</> : <>Find a mechanic <Send size={18}/></>}</button>
        <p className="bookingFooterNote"><ShieldCheck size={15}/> Your booking details are sent securely to help dispatch an available mechanic.</p>
      </section>
    </div>
    <style jsx global>{`
      .bookingPage{padding-bottom:40px;background:#f5f7fb;min-height:100vh}
      .bookingShell{width:min(760px,100%);margin:0 auto;padding:26px 18px 44px}
      .bookingIntro{padding:8px 4px 23px}
      .bookingEyebrow{display:flex;align-items:center;gap:9px;font-size:11px;font-weight:800;letter-spacing:2px;color:#2563eb}
      .bookingEyebrow span{width:7px;height:7px;border-radius:50%;background:#10b981}
      .bookingIntro h2{font:800 clamp(28px,5vw,38px)/1.15 Manrope,sans-serif;letter-spacing:-1px;margin:15px 0 9px;color:#101828}
      .bookingIntro p{font-size:15px;line-height:1.6;color:#667085;margin:0;max-width:580px}
      .bookingTrust{display:flex;align-items:center;gap:8px;margin-top:14px;color:#087b5d;font-size:12px;font-weight:700}
      .bookingCard{background:#fff;border:1px solid #e7ebf3;border-radius:24px;padding:clamp(18px,4vw,30px);box-shadow:0 12px 40px #10182808}
      .bookingStep{display:flex;align-items:flex-start;gap:13px;margin:0 0 17px}
      .bookingStep>span{display:grid;place-items:center;width:34px;height:34px;flex:0 0 34px;border-radius:11px;background:#eef4ff;color:#2563eb;font-size:12px;font-weight:800}
      .bookingStep h3{margin:0 0 4px;font:750 18px/1.3 Manrope,sans-serif;color:#101828}
      .bookingStep p{margin:0;color:#667085;font-size:13px;line-height:1.5}
      .bookingRecipientGrid,.bookingPaymentGrid{display:grid;grid-template-columns:1fr 1fr;gap:11px}
      .bookingRecipient,.bookingPayment{display:flex;align-items:center;gap:11px;text-align:left;min-width:0;padding:14px 12px;border:1px solid #e3e8f0;border-radius:16px;background:#fff;color:#344054;transition:border-color .15s,background .15s}
      .bookingRecipient.isSelected,.bookingPayment.isSelected,.bookingVehicle.isSelected,.bookingType.isSelected{border-color:#2563eb;background:#f0f6ff;box-shadow:inset 0 0 0 1px #2563eb}
      .bookingRecipientIcon,.bookingPaymentIcon{display:grid;place-items:center;flex:0 0 40px;width:40px;height:40px;border-radius:12px;background:#eef4ff;color:#2563eb}
      .bookingRecipient>span:nth-child(2),.bookingPayment>span:nth-child(2){display:flex;flex-direction:column;gap:4px;min-width:0;flex:1}
      .bookingRecipient b,.bookingPayment b{font-size:13px;color:#101828}
      .bookingRecipient small,.bookingPayment small{font-size:11px;line-height:1.4;color:#667085}
      .bookingCheck{color:#2563eb;flex:0 0 auto}
      .bookingSubsection{margin-top:25px}
      .bookingSubhead{display:flex;align-items:center;justify-content:space-between;gap:10px;margin-bottom:12px}
      .bookingSubhead h4,.bookingSubsection h4{margin:0;color:#344054;font-size:14px;font-weight:800}
      .bookingSubhead a,.bookingEmptyGarage a{display:inline-flex;align-items:center;gap:5px;color:#2563eb;font-size:12px;font-weight:800}
      .bookingVehicleList{display:grid;gap:9px}
      .bookingVehicle{width:100%;display:flex;align-items:center;gap:12px;padding:13px;text-align:left;border:1px solid #e3e8f0;border-radius:15px;background:#fff;color:#101828}
      .bookingVehicleIcon{display:grid;place-items:center;width:44px;height:44px;flex:0 0 44px;border-radius:13px;background:#f1f5f9;color:#2563eb}
      .bookingVehicleDetails{display:flex;flex-direction:column;gap:4px;min-width:0;flex:1}
      .bookingVehicleDetails b{font-size:14px;overflow-wrap:anywhere}
      .bookingVehicleDetails small{font-size:11px;color:#667085}
      .bookingVehicleDetails .bookingPlate{color:#344054;font-weight:800;letter-spacing:.5px}
      .bookingRadio{width:20px;height:20px;border:1.5px solid #cbd5e1;border-radius:50%;display:grid;place-items:center;flex:0 0 20px}
      .bookingRadio.checked{border:6px solid #2563eb}
      .bookingEmptyGarage{display:flex;gap:13px;padding:17px;border:1px dashed #cbd5e1;border-radius:16px;background:#f8fafc}
      .bookingEmptyGarage>span{width:42px;height:42px;flex:0 0 42px;border-radius:12px;background:#eef4ff;color:#2563eb;display:grid;place-items:center}
      .bookingEmptyGarage b{font-size:13px}
      .bookingEmptyGarage p{font-size:12px;color:#667085;line-height:1.5;margin:5px 0 10px}
      .bookingEmptyGarage a{display:inline-flex}
      .bookingLoading{display:flex;align-items:center;gap:10px;padding:16px;color:#667085;font-size:13px}
      .bookingInlineError{padding:14px;background:#fff1f0;color:#b42318;border-radius:12px;font-size:13px}
      .bookingInlineError button{margin-left:8px;color:#2563eb;background:transparent;font-weight:800}
      .bookingFieldGrid{display:grid;grid-template-columns:1fr 1fr;gap:12px}
      .bookingField{display:flex;flex-direction:column;gap:8px;margin-top:15px;color:#344054;font-size:13px;font-weight:750;min-width:0}
      .bookingField>span{display:flex;align-items:center;gap:8px;flex-wrap:wrap}
      .bookingField i{font-style:normal;font-size:10px;font-weight:600;color:#98a2b3}
      .bookingField input,.bookingField textarea,.bookingInputWithIcon{width:100%;min-width:0;border:1px solid #d8dee8;border-radius:13px;background:#fff;color:#101828;font:500 14px 'DM Sans',sans-serif;outline:none}
      .bookingField input,.bookingField textarea{padding:14px}
      .bookingField input:focus,.bookingField textarea:focus,.bookingInputWithIcon:focus-within{border-color:#2563eb;box-shadow:0 0 0 3px #2563eb17}
      .bookingField input::placeholder,.bookingField textarea::placeholder{color:#98a2b3}
      .bookingField textarea{resize:vertical;min-height:98px;line-height:1.5}
      .bookingFullField{margin-top:17px}
      .bookingInputWithIcon{display:flex;align-items:center;gap:10px;padding:0 13px;color:#98a2b3}
      .bookingInputWithIcon input{border:0;box-shadow:none!important;padding:14px 0;background:transparent}
      .bookingInputWithIcon input[type=file]{font-size:12px}
      .bookingFileName{color:#087b5d;font-size:11px;margin-top:-2px;overflow-wrap:anywhere}
      .bookingTypeGrid{display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-top:13px}
      .bookingType{display:flex;align-items:center;justify-content:center;gap:9px;padding:14px 10px;border:1px solid #e3e8f0;border-radius:13px;background:#fff;color:#475467;font-weight:750;font-size:13px}
      .bookingType.isSelected{color:#1d4ed8}
      .bookingDivider{height:1px;background:#edf0f5;margin:26px 0}
      .bookingPayment{padding:14px 11px}
      .bookingPaymentNote{font-size:11px;line-height:1.55;color:#854d0e;background:#fffbeb;border:1px solid #fde68a;padding:11px 13px;border-radius:12px;margin:11px 0 0}
      .bookingError,.bookingSuccess{padding:12px 14px;border-radius:12px;font-size:13px;line-height:1.5;margin:16px 0 0}
      .bookingError{background:#fff1f0;color:#b42318}
      .bookingSuccess{background:#e8fbf3;color:#047857}
      .bookingSuccess a{font-weight:800;text-decoration:underline}
      .bookingSubmit{width:100%;min-height:56px;margin-top:19px;padding:15px 20px;display:flex;align-items:center;justify-content:center;gap:10px;border-radius:15px;background:linear-gradient(135deg,#2563eb,#075be8);color:#fff;font-weight:800;font-size:15px;box-shadow:0 12px 24px #2563eb24}
      .bookingSubmit:disabled{opacity:.65;cursor:wait}
      .bookingFooterNote{display:flex;align-items:center;justify-content:center;gap:7px;text-align:center;color:#98a2b3;font-size:11px;line-height:1.5;margin:14px 0 0}
      .bookingFooterNote svg{flex:0 0 auto;color:#10b981}
      .bookingSpin{animation:booking-spin 1s linear infinite}
      @keyframes booking-spin{to{transform:rotate(360deg)}}
      @media(max-width:520px){.bookingShell{padding:18px 12px 30px}.bookingCard{border-radius:20px;padding:17px}.bookingRecipientGrid,.bookingPaymentGrid{grid-template-columns:1fr}.bookingRecipient,.bookingPayment{padding:12px}.bookingFieldGrid{grid-template-columns:1fr;gap:0}.bookingIntro h2{font-size:30px}.bookingStep h3{font-size:17px}.bookingType{font-size:12px}}
    `}</style>
  </main>;
}
