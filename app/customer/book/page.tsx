"use client";
import { useCallback, useEffect, useState } from "react";
import { ArrowLeft, Bike, CarFront, Camera, MapPin, Send, UserRound, UsersRound, CreditCard, Banknote, CheckCircle2, Plus, LoaderCircle, Car, ShieldCheck, LocateFixed, X, ImagePlus, Ticket, Tag } from "lucide-react";

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
  const [photos, setPhotos] = useState<File[]>([]);
  const [showPhotoManager, setShowPhotoManager] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [warning, setWarning] = useState("");
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [locationCoords, setLocationCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [locationLoading, setLocationLoading] = useState(false);
  const [locationError, setLocationError] = useState("");
  const [bookingId, setBookingId] = useState("");
  const [couponInput, setCouponInput] = useState("");
  const [appliedCoupon, setAppliedCoupon] = useState<{ code: string; amount: number } | null>(null);
  const [couponBusy, setCouponBusy] = useState(false);
  const [couponError, setCouponError] = useState("");

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
  useEffect(() => { const code = new URLSearchParams(window.location.search).get("coupon"); if (code) setCouponInput(code.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 12)); }, []);

  const applyCoupon = async () => {
    setCouponError("");
    const code = couponInput.trim().toUpperCase().replace(/\s+/g, "");
    if (!/^[A-Z0-9]{12}$/.test(code)) { setCouponError("Enter the complete 12-character code. Claim it in Coupons & Offers first."); return; }
    setCouponBusy(true);
    try {
      const response = await fetch("/api/coupons/apply", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ code }) });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "This coupon could not be applied.");
      setAppliedCoupon({ code: data.coupon.code, amount: Number(data.coupon.amount) });
      setCouponInput(data.coupon.code);
    } catch (e) { setAppliedCoupon(null); setCouponError(e instanceof Error ? e.message : "Could not verify coupon."); }
    finally { setCouponBusy(false); }
  };
  const removeCoupon = () => { setAppliedCoupon(null); setCouponInput(""); setCouponError(""); };

  const continueToIssue = () => {
    setError("");
    if (bookingFor === "SELF" && !selectedVehicleId) { setError(vehicles.length ? "Please select a vehicle before continuing." : "Add a vehicle to your garage first, or choose Other person."); return; }
    if (bookingFor === "OTHER") {
      if (otherPersonName.trim().length < 2) { setError("Please enter the person’s name."); return; }
      if (!/^\+?[0-9]{10,15}$/.test(otherPersonPhone.replace(/[()\s.-]/g, ""))) { setError("Please enter a valid mobile number."); return; }
    }
    navigateStep(2);
  };

  const requestLocation = useCallback(() => {
    setLocationError("");
    if (!navigator.geolocation) { setLocationError("This browser does not support location. Please enable location services or try another browser."); return; }
    setLocationLoading(true);
    navigator.geolocation.getCurrentPosition(
      position => {
        setLocationCoords({ lat: position.coords.latitude, lng: position.coords.longitude });
        setLocationError("");
        setLocationLoading(false);
      },
      error => {
        setLocationLoading(false);
        setLocationError(error.code === 1
          ? "Location permission was denied. Allow location access in your browser settings, then tap Try location again."
          : error.code === 2
            ? "Your current location is unavailable. Turn on your phone’s Location/GPS and try again."
            : "Location took too long. Please try again.");
      },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 60000 }
    );
  }, []);

  const continueToPayment = () => {
    setError("");
    if (issueDescription.trim().length < 10) { setError("Please describe the vehicle problem in at least 10 characters."); return; }
    if (!address.trim()) { setError("Please enter the complete service address."); return; }
    if (!locationCoords) {
      setError("Allow location access so we can send your request to mechanics near your current location.");
      requestLocation();
      return;
    }
    navigateStep(3);
  };
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
    if (issueDescription.trim().length < 10) { setError("Please describe the vehicle problem in at least 10 characters."); return; }
    if (!address.trim()) { setError("Please enter the complete service address."); return; }
    if (!locationCoords) { setError("Please allow location access before sending your request."); requestLocation(); return; }
    setBusy(true);
    try {
      const issuePhotoFileIds: string[] = [];
      for (const photo of photos) {
        const form = new FormData();
        form.append("file", photo);
        form.append("kind", "issuePhoto");
        const upload = await fetch("/api/telegram/upload", { method: "POST", body: form });
        const uploadData = await upload.json();
        if (!upload.ok) throw new Error(uploadData.error || "One of the problem photos failed to upload.");
        if (uploadData.fileId) issuePhotoFileIds.push(String(uploadData.fileId));
      }
      const issuePhotoFileId = issuePhotoFileIds[0] || "";
      const selectedVehicle = vehicles.find(v => v._id === selectedVehicleId);
      const vehicleType = bookingFor === "SELF" ? displayType(selectedVehicle?.type || "") : otherVehicleType;
      const response = await fetch("/api/bookings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          bookingFor, vehicleId: bookingFor === "SELF" ? selectedVehicleId : undefined,
          vehicleType, otherPersonName: otherPersonName.trim(), otherPersonPhone: otherPersonPhone.trim(),
          otherVehicleBrand, otherVehicleModel, otherRegistrationNumber,
          paymentMethod, couponCode: appliedCoupon?.code || "", issueDescription: issueDescription.trim(), issuePhotoFileId, issuePhotoFileIds,
          location: { address: address.trim(), lat: locationCoords.lat, lng: locationCoords.lng }
        })
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Booking failed.");
      setBookingId(String(data.booking._id));
      setSuccess("created");
      if (data.telegramAlertSent === false) setWarning("Booking saved, but the Telegram dispatch alert could not be confirmed. Please contact support.");
      setIssueDescription(""); setAddress(""); setPhotos([]); setShowPhotoManager(false); setLocationCoords(null); setLocationError(""); setAppliedCoupon(null); setCouponInput(""); setCouponError("");
      setOtherPersonName(""); setOtherPersonPhone(""); setOtherVehicleBrand(""); setOtherVehicleModel(""); setOtherRegistrationNumber("");
      setSelectedVehicleId("");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not create booking.");
    } finally {
      setBusy(false);
    }
  };

  const navigateStep = (next: 1 | 2 | 3) => {
    const panel = document.querySelector(".bookingStepPanel");
    if (panel && step !== next) {
      panel.classList.remove("bookingStepEnter");
      panel.classList.add("bookingStepExit");
      window.setTimeout(() => { setStep(next); window.scrollTo({ top: 0, behavior: "smooth" }); }, 180);
    } else {
      setStep(next);
      window.scrollTo({ top: 0, behavior: "smooth" });
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
        <div className="bookingProgress"><div className={"bookingProgressStep" + (step===1?" active":" complete")}><span>{step===1?"01":"✓"}</span><b>Vehicle</b></div><div className={"bookingProgressLine"+(step>=2?" complete":"")}/><div className={"bookingProgressStep"+(step===2?" active":step===3?" complete":"")}><span>{step===3?"✓":"02"}</span><b>Problem & location</b></div><div className={"bookingProgressLine"+(step===3?" complete":"")}/><div className={"bookingProgressStep"+(step===3?" active":"")}><span>03</span><b>Payment</b></div></div>
        {step === 1 && <div key={step} className="bookingStepPanel bookingStepEnter">
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

        </div>}
        {step === 2 && <div key={step} className="bookingStepPanel bookingStepEnter">
        <div className="bookingStep"><span>02</span><div><h3>What needs fixing?</h3><p>Describe the issue so the mechanic arrives prepared.</p></div></div>
        <label className="bookingField bookingFullField"><span>Vehicle problem <i>Required · 10–500 characters</i></span><textarea value={issueDescription} onChange={e => setIssueDescription(e.target.value.slice(0,500))} rows={4} minLength={10} maxLength={500} placeholder="Tell us what happened so the mechanic arrives prepared…"/><small className={"bookingCharCount"+(issueDescription.trim().length<10?" isLow":"")}>{issueDescription.trim().length}/500 characters · minimum 10</small></label>
        <label className="bookingField bookingFullField"><span>Service address <i>Required</i></span><div className="bookingInputWithIcon"><MapPin size={19}/><input value={address} onChange={e => setAddress(e.target.value)} onBlur={() => { if (address.trim() && !locationCoords && !locationLoading) requestLocation(); }} maxLength={500} placeholder="Enter house, street, village or landmark"/></div><button type="button" className="bookingLocateButton" onClick={requestLocation} disabled={locationLoading}>{locationLoading ? <><LoaderCircle size={16} className="bookingSpin"/> Getting your GPS location…</> : locationCoords ? <><CheckCircle2 size={16}/> Location permission granted</> : <><LocateFixed size={16}/> Allow location & use current GPS</>}</button>{locationCoords && <small className="bookingLocationSuccess"><CheckCircle2 size={14}/> GPS location captured. Your typed address will also be saved.</small>}{locationError && <small className="bookingLocationError" role="alert">{locationError}</small>}<small className="bookingLocationPrivacy">Your GPS coordinates are used to route this booking to nearby mechanics. Your address text is kept as entered.</small></label>
        <div className="bookingField bookingFullField"><div className="bookingPhotoHeader"><span>Photos of the problem <i>Optional · Up to 3 images</i></span><button type="button" className={"bookingPhotoCount"+(photos.length?" hasPhotos":"")} onClick={() => setShowPhotoManager(v => !v)} aria-expanded={showPhotoManager} aria-label={photos.length+" photos selected, click to manage"}><span>{photos.length}</span></button></div><label className="bookingPhotoPicker"><input type="file" accept="image/jpeg,image/png,image/webp,image/heic,image/heif" multiple hidden onChange={e => { const picked=Array.from(e.target.files||[]); const valid=picked.filter(file => file.type.startsWith("image/") && file.size<=8*1024*1024); setPhotos(current => [...current,...valid].slice(0,3)); setShowPhotoManager(true); e.currentTarget.value=""; if(picked.some(file => !file.type.startsWith("image/") || file.size>8*1024*1024)) setError("Only image files up to 8 MB each are allowed."); else if(photos.length+valid.length>3) setError("You can select up to 3 images."); }} /><span className="bookingPhotoCamera"><Camera size={22}/></span><span className="bookingPhotoCopy"><b>{photos.length===0?"Add photos of the issue":"Add another photo"}</b><small>{photos.length===3?"Maximum reached":"JPG, PNG or WebP · Max 8 MB each"}</small></span><span className="bookingPhotoAdd"><ImagePlus size={19}/></span></label>{showPhotoManager && photos.length>0 && <div className="bookingPhotoManager">{photos.map((file,index)=><div className="bookingPhotoItem" key={file.name+"-"+file.lastModified+"-"+index}><span className="bookingPhotoThumb"><Camera size={18}/></span><span className="bookingPhotoFile"><b>Photo {index+1}</b><small>{file.name}</small></span><button type="button" className="bookingPhotoRemove" onClick={() => setPhotos(current=>current.filter((_,i)=>i!==index))} aria-label={"Remove "+file.name}><X size={17}/></button></div>)}</div>}{photos.length===0 && <small className="bookingPhotoHint">Tap the green count circle to manage selected photos.</small>}</div>

        </div>}
        {step === 3 && <div key={step} className="bookingStepPanel bookingStepEnter">
        <div className="bookingPaymentIntro"><span className="bookingPaymentBadge"><CreditCard size={22}/></span><div><div className="bookingEyebrow">STEP 03 · PAYMENT</div><h2>How would you like to pay?</h2><p>Choose your preferred payment method before confirming your request.</p></div></div>
        <div className="bookingSummary"><b>Booking summary</b><span>{bookingFor === "SELF" ? (vehicles.find(v => v._id === selectedVehicleId)?.brand + " " + vehicles.find(v => v._id === selectedVehicleId)?.model) : (otherPersonName + " · " + vehicleName(otherVehicleType))}</span><span>{issueDescription}</span><span><MapPin size={14}/>{address}</span><small><CheckCircle2 size={14}/> GPS location captured for nearby dispatch</small></div>
        <section className="bookingCouponBox" aria-label="Apply coupon">
          <div className="bookingCouponHeading"><span className="bookingCouponIcon"><Ticket size={20}/></span><div><b>Have a coupon?</b><small>Apply a claimed code to this booking</small></div><a href="/coupons">My coupons</a></div>
          {appliedCoupon ? <div className="bookingCouponApplied"><span className="bookingCouponAppliedIcon"><CheckCircle2 size={18}/></span><div><b>{appliedCoupon.code}</b><small>Coupon discount saved: {new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(appliedCoupon.amount)}</small></div><button type="button" onClick={removeCoupon} aria-label="Remove coupon"><X size={17}/></button></div> : <><div className="bookingCouponInputRow"><input value={couponInput} onChange={e=>{setCouponInput(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g,"").slice(0,12));setCouponError("");}} maxLength={12} autoCapitalize="characters" autoComplete="off" placeholder="Enter 12-character code"/><button type="button" onClick={()=>void applyCoupon()} disabled={couponBusy || couponInput.length!==12}>{couponBusy ? <LoaderCircle className="bookingSpin" size={16}/> : <Tag size={16}/>} Apply</button></div>{couponError && <small className="bookingCouponError" role="alert">{couponError}</small>}</>}
          <p className="bookingCouponHint">The exact coupon value is recorded with your request. Your mechanic confirms the final service charge; no online payment is collected on this screen.</p>
        </section>
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

        </div>}
        {error && <p className="bookingError" role="alert">{error}</p>}
        {warning && <p className="bookingError" role="alert">{warning}</p>}
        {step===1 ? <button type="button" className="bookingSubmit" disabled={vehiclesLoading} onClick={continueToIssue}>Next: Problem details <ArrowLeft className="bookingNextArrow" size={19}/></button> : step===2 ? <div className="bookingActionRow"><button type="button" className="bookingBackButton" onClick={()=>{setError("");navigateStep(1);}}><ArrowLeft size={18}/> Back</button><button type="button" className="bookingSubmit bookingConfirmButton" onClick={continueToPayment}>Next: Payment <ArrowLeft className="bookingNextArrow" size={18}/></button></div> : <div className="bookingActionRow"><button type="button" className="bookingBackButton" disabled={busy} onClick={()=>{setError("");navigateStep(2);}}><ArrowLeft size={18}/> Back</button><button type="button" className="bookingSubmit bookingConfirmButton" disabled={busy} onClick={()=>void submit()}>{busy ? <><LoaderCircle className="bookingSpin" size={19}/> Sending request…</> : <>Confirm booking <Send size={18}/></>}</button></div>}
        <p className="bookingFooterNote"><ShieldCheck size={15}/> Your booking details are sent securely to help dispatch an available mechanic.</p>
      </section>
      {busy && <div className="bookingOverlay" role="status" aria-live="polite"><div className="bookingWaitCard"><div className="bookingMascot"><svg viewBox="0 0 160 130" role="img" aria-label="Cartoon mechanic in blue cap and uniform with a tool bag and wrench"><ellipse cx="80" cy="121" rx="48" ry="6" fill="#dbe7fb"/><path d="M44 54Q45 36 61 34H99Q116 38 117 55L126 103H34Z" fill="#2563eb"/><path d="M62 65L80 79L98 65L94 103H66Z" fill="#dbeafe"/><circle cx="80" cy="31" r="20" fill="#f2c6a5"/><path d="M59 28Q59 6 81 7Q102 7 102 28Z" fill="#1747a6"/><path d="M54 27Q80 17 107 27L105 33H56Z" fill="#2563eb"/><circle cx="73" cy="32" r="2" fill="#172033"/><circle cx="87" cy="32" r="2" fill="#172033"/><path d="M73 41Q80 47 88 41" fill="none" stroke="#a75b46" strokeWidth="2"/><path d="M46 58L28 81L37 88L58 69M114 58L133 77L125 86L105 69" fill="#f2c6a5"/><rect x="9" y="82" width="31" height="29" rx="6" fill="#1747a6"/><path d="M16 82Q16 73 25 73Q34 73 34 82" fill="none" stroke="#1747a6" strokeWidth="4"/><path d="M131 76L144 64L150 70L137 82M143 62L150 56L156 62L150 69" fill="none" stroke="#64748b" strokeWidth="4" strokeLinecap="round"/><path d="M62 103L60 119H76L78 103M84 103L87 119H103L98 103" fill="#172554"/></svg></div><div className="bookingWaitSpinner"><LoaderCircle className="bookingSpin" size={22}/></div><h3>Finding your mechanic</h3><p>Please wait while we securely send your request. Keep this page open.</p><div className="bookingWaitTrack"><span/></div></div></div>}
      {success && <div className="bookingOverlay" role="dialog" aria-modal="true" aria-labelledby="bookingSuccessTitle"><div className="bookingSuccessModal"><button type="button" className="bookingModalClose" aria-label="Close" onClick={()=>{setSuccess("");setStep(1);}}>&times;</button><div className="bookingSuccessIcon"><CheckCircle2 size={28}/></div><div className="bookingMascot"><svg viewBox="0 0 160 130" role="img" aria-label="Happy cartoon mechanic in blue cap holding a tool bag and wrench"><ellipse cx="80" cy="121" rx="48" ry="6" fill="#dbe7fb"/><path d="M44 54Q45 36 61 34H99Q116 38 117 55L126 103H34Z" fill="#2563eb"/><path d="M62 65L80 79L98 65L94 103H66Z" fill="#dbeafe"/><circle cx="80" cy="31" r="20" fill="#f2c6a5"/><path d="M59 28Q59 6 81 7Q102 7 102 28Z" fill="#1747a6"/><path d="M54 27Q80 17 107 27L105 33H56Z" fill="#2563eb"/><circle cx="73" cy="32" r="2" fill="#172033"/><circle cx="87" cy="32" r="2" fill="#172033"/><path d="M72 40Q80 48 89 40" fill="none" stroke="#a75b46" strokeWidth="2"/><path d="M46 58L28 81L37 88L58 69M114 58L133 77L125 86L105 69" fill="#f2c6a5"/><rect x="9" y="82" width="31" height="29" rx="6" fill="#1747a6"/><path d="M16 82Q16 73 25 73Q34 73 34 82" fill="none" stroke="#1747a6" strokeWidth="4"/><path d="M131 76L144 64L150 70L137 82M143 62L150 56L156 62L150 69" fill="none" stroke="#64748b" strokeWidth="4" strokeLinecap="round"/><path d="M62 103L60 119H76L78 103M84 103L87 119H103L98 103" fill="#172554"/></svg></div><div className="bookingSuccessEyebrow">BOOKING CONFIRMED</div><h2 id="bookingSuccessTitle">Your request is in!</h2><p>Your booking request has been submitted successfully. We’ll now work on finding an available mechanic.</p><div className="bookingIdBox"><span>BOOKING ID</span><b>{bookingId||"Confirmed"}</b></div><div className="bookingSuccessActions"><a href="/bookings" className="bookingSubmit">View my bookings</a><button type="button" className="bookingBackButton" onClick={()=>{setSuccess("");setStep(1);}}>Done</button></div></div></div>}
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
      .bookingStepPanel{min-width:0;will-change:transform,opacity}.bookingStepEnter{animation:bookingSlideIn .42s cubic-bezier(.2,.75,.25,1) both}.bookingStepExit{animation:bookingSlideOut .18s ease-in forwards;pointer-events:none}
      @keyframes bookingSlideIn{from{opacity:0;transform:translateX(36px)}to{opacity:1;transform:translateX(0)}}@keyframes bookingSlideOut{to{opacity:0;transform:translateX(-40px)}}
      @media(prefers-reduced-motion:reduce){.bookingStepEnter{animation:none}}
      .bookingCharCount{display:block;margin-top:7px;text-align:right;color:#07815f;font-size:11px;font-weight:800}.bookingCharCount.isLow{color:#9a6700}
      .bookingPhotoHeader{display:flex;align-items:center;justify-content:space-between;gap:12px;margin-bottom:11px;color:#344054;font-size:13px;font-weight:800}.bookingPhotoHeader i{display:block;margin-top:4px;color:#8490a0;font-size:11px;font-style:normal;font-weight:600}
      .bookingPhotoCount{display:flex;align-items:center;justify-content:center;width:43px;height:43px;flex:0 0 43px;border:2px solid #d8e2e8;border-radius:50%;background:#f8fafc;color:#94a3b8;font-size:17px;font-weight:900}
      .bookingPhotoCount.hasPhotos{border-color:#059669;background:#e9fbf2;color:#047857;box-shadow:0 0 0 4px #d1fae5;animation:bookingCountPop .35s cubic-bezier(.2,.8,.2,1) both}.bookingPhotoCount.hasPhotos span{animation:bookingCountRise .28s ease-out both}
      @keyframes bookingCountRise{from{opacity:0;transform:translateY(9px)}to{opacity:1;transform:translateY(0)}}@keyframes bookingCountPop{from{transform:scale(.78)}to{transform:scale(1)}}
      .bookingPhotoPicker{display:flex;align-items:center;gap:12px;min-height:88px;padding:15px;border:1.5px dashed #b8cbed;border-radius:17px;background:linear-gradient(115deg,#f5f8ff,#fff);cursor:pointer}
      .bookingPhotoCamera{display:flex;align-items:center;justify-content:center;width:46px;height:46px;flex:0 0 46px;border-radius:14px;background:#e7efff;color:#2563eb}.bookingPhotoCopy{display:flex;flex:1;min-width:0;flex-direction:column;gap:5px}.bookingPhotoCopy b{color:#172033;font-size:13px;font-weight:850}.bookingPhotoCopy small{color:#7b8798;font-size:11px;line-height:1.4}
      .bookingPhotoAdd{display:flex;align-items:center;justify-content:center;width:35px;height:35px;flex:0 0 35px;border-radius:50%;background:#2563eb;color:white}.bookingPhotoManager{display:flex;flex-direction:column;gap:8px;margin-top:12px;padding:10px;border:1px solid #e4eaf2;border-radius:15px;background:#fbfcff;animation:bookingSlideIn .25s ease-out both}
      .bookingPhotoItem{display:flex;align-items:center;gap:10px;min-width:0;padding:8px;border-radius:12px;background:#fff;border:1px solid #e9edf4}.bookingPhotoThumb{display:flex;align-items:center;justify-content:center;width:38px;height:38px;flex:0 0 38px;border-radius:11px;background:#eaf2ff;color:#2563eb}
      .bookingPhotoFile{display:flex;flex:1;min-width:0;flex-direction:column;gap:4px}.bookingPhotoFile b{font-size:12px;color:#243247}.bookingPhotoFile small{overflow:hidden;color:#7b8798;font-size:10px;text-overflow:ellipsis;white-space:nowrap}
      .bookingPhotoRemove{display:flex;align-items:center;justify-content:center;width:34px;height:34px;flex:0 0 34px;border:1px solid #fecaca;border-radius:50%;background:#fff1f2;color:#dc2626}.bookingPhotoHint{display:block;margin-top:8px;color:#8490a0;font-size:11px;line-height:1.5}

      .bookingLocateButton{display:flex;align-items:center;justify-content:center;gap:8px;min-height:43px;margin-top:10px;padding:10px 13px;border:1px solid #c8d9fb;border-radius:12px;background:#f3f7ff;color:#1d5fcb;font-size:12px;font-weight:800}
      .bookingLocateButton:disabled{opacity:.7}
      .bookingLocationSuccess,.bookingLocationError,.bookingLocationPrivacy{display:flex;align-items:flex-start;gap:6px;margin-top:8px;font-size:11px;line-height:1.5}
      .bookingLocationSuccess{color:#07815f}.bookingLocationError{color:#b42318}.bookingLocationPrivacy{color:#718096}
      .bookingSummary{display:flex;flex-direction:column;gap:9px;margin:2px 0 23px;padding:16px;border:1px solid #e3eaf5;border-radius:16px;background:#f8faff;color:#344054}
      .bookingSummary>b{font:800 14px Manrope,sans-serif;color:#101828}
      .bookingSummary>span{font-size:12px;line-height:1.5;overflow-wrap:anywhere}
      .bookingSummary>span svg,.bookingSummary small svg{display:inline-block;vertical-align:middle;margin-right:5px}
      .bookingSummary small{display:flex;align-items:center;gap:5px;color:#07815f;font-size:11px;font-weight:800}
      .bookingProgress{gap:7px}.bookingProgressStep{gap:6px;font-size:10px}.bookingProgressStep>span{width:29px;height:29px;flex:0 0 29px}.bookingProgressStep b{white-space:normal;line-height:1.25}

      .bookingSpin{animation:booking-spin 1s linear infinite}
      @keyframes booking-spin{to{transform:rotate(360deg)}}

      .bookingProgress{display:flex;align-items:center;gap:10px;margin:0 0 27px;padding-bottom:22px;border-bottom:1px solid #edf0f5}.bookingProgressStep{display:flex;align-items:center;gap:8px;color:#98a2b3;font-size:12px;font-weight:800;white-space:nowrap}.bookingProgressStep>span{display:grid;place-items:center;width:31px;height:31px;border-radius:11px;background:#f1f5f9;color:#64748b;font-size:11px}.bookingProgressStep.active{color:#1747a6}.bookingProgressStep.active>span,.bookingProgressStep.complete>span{background:#eaf1ff;color:#2563eb}.bookingProgressLine{height:2px;flex:1;background:#e6eaf1}.bookingProgressLine.complete{background:#2563eb}.bookingPaymentIntro{display:flex;align-items:flex-start;gap:14px;margin:5px 0 26px}.bookingPaymentBadge{width:52px;height:52px;flex:0 0 52px;display:grid;place-items:center;background:#eaf1ff;color:#2563eb;border-radius:16px}.bookingPaymentIntro h2{font:800 25px/1.2 Manrope,sans-serif;letter-spacing:-.7px;margin:7px 0;color:#101828}.bookingPaymentIntro p{font-size:13px;line-height:1.6;color:#667085;margin:0}.bookingActionRow{display:flex;gap:12px;align-items:stretch;margin-top:19px}.bookingActionRow .bookingSubmit{margin-top:0;flex:1}.bookingBackButton{min-height:56px;padding:13px 18px;display:flex;align-items:center;justify-content:center;gap:8px;border:1px solid #dce3ed;border-radius:15px;background:#fff;color:#344054;font-weight:800}.bookingNextArrow{transform:rotate(180deg)}.bookingOverlay{position:fixed;inset:0;z-index:1000;display:grid;place-items:center;padding:20px;background:rgba(13,26,48,.55);backdrop-filter:blur(8px)}.bookingWaitCard,.bookingSuccessModal{position:relative;width:min(100%,420px);padding:26px 22px;border:1px solid #ffffffd9;border-radius:28px;background:#fff;box-shadow:0 28px 100px #08152c3d;text-align:center;animation:booking-modal-in .24s ease-out}.bookingMascot{width:155px;height:125px;margin:0 auto 8px;display:grid;place-items:center}.bookingMascot svg{width:100%;height:100%;overflow:visible}.bookingWaitSpinner{display:inline-grid;place-items:center;width:42px;height:42px;border-radius:50%;background:#eef4ff;color:#2563eb;margin:3px auto 7px}.bookingWaitCard h3{font:800 22px Manrope,sans-serif;margin:8px 0;color:#101828}.bookingWaitCard p,.bookingSuccessModal>p{font-size:14px;line-height:1.65;color:#667085;margin:0 auto;max-width:320px}.bookingWaitTrack{height:5px;overflow:hidden;background:#eaf0fb;border-radius:99px;margin:23px 0 0}.bookingWaitTrack span{display:block;height:100%;width:38%;border-radius:99px;background:linear-gradient(90deg,#2563eb,#60a5fa);animation:booking-progress 1.5s ease-in-out infinite alternate}.bookingModalClose{position:absolute;right:14px;top:12px;width:34px;height:34px;border-radius:50%;background:#f3f6fb;color:#64748b;font-size:25px;line-height:1}.bookingSuccessIcon{width:52px;height:52px;display:grid;place-items:center;margin:0 auto 5px;background:#e8fbf3;color:#079669;border-radius:50%}.bookingSuccessEyebrow{font-size:10px;letter-spacing:1.7px;color:#079669;font-weight:900;margin:4px 0 9px}.bookingSuccessModal h2{font:800 27px/1.2 Manrope,sans-serif;letter-spacing:-.7px;margin:0 0 10px;color:#101828}.bookingIdBox{display:flex;flex-direction:column;gap:6px;margin:19px 0;padding:13px;border:1px dashed #c8d7f4;border-radius:14px;background:#f7faff}.bookingIdBox span{font-size:9px;letter-spacing:1.5px;color:#667085;font-weight:800}.bookingIdBox b{font-size:13px;color:#1747a6;overflow-wrap:anywhere}.bookingSuccessActions{display:grid;grid-template-columns:1fr auto;gap:10px}.bookingSuccessActions .bookingSubmit{margin:0;min-height:48px;padding:12px 15px;font-size:13px}.bookingSuccessActions .bookingBackButton{min-height:48px}@keyframes booking-modal-in{from{opacity:0;transform:translateY(8px) scale(.98)}to{opacity:1;transform:translateY(0) scale(1)}}@keyframes booking-progress{from{transform:translateX(-20%)}to{transform:translateX(180%)}}
      @media(max-width:520px){.bookingShell{padding:18px 12px 30px}.bookingCard{border-radius:20px;padding:17px}.bookingRecipientGrid,.bookingPaymentGrid{grid-template-columns:1fr}.bookingRecipient,.bookingPayment{padding:12px}.bookingFieldGrid{grid-template-columns:1fr;gap:0}.bookingIntro h2{font-size:30px}.bookingStep h3{font-size:17px}.bookingType{font-size:12px}.bookingProgressStep{font-size:10px;gap:5px}.bookingProgressStep b{white-space:normal}.bookingPaymentIntro h2{font-size:21px}.bookingWaitCard,.bookingSuccessModal{padding:24px 18px}.bookingActionRow{gap:8px}.bookingBackButton{padding:12px}.bookingSuccessActions{grid-template-columns:1fr}.bookingSuccessActions .bookingBackButton{width:100%}}
    `}</style>
  </main>;
}
