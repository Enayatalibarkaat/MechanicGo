"use client";
import { useEffect, useRef, useState } from "react";
import { ArrowRight, Camera, CalendarDays, UserRound, CheckCircle2, ShieldCheck, Mail, LockKeyhole, ExternalLink } from "lucide-react";

const today = () => new Date().toISOString().slice(0, 10);
const isAdult = (dob: string) => {
  if (!dob || dob > today()) return false;
  const birth = new Date(dob + "T00:00:00");
  const now = new Date();
  let age = now.getFullYear() - birth.getFullYear();
  if (now.getMonth() < birth.getMonth() || (now.getMonth() === birth.getMonth() && now.getDate() < birth.getDate())) age--;
  return age >= 18;
};

export default function ProfileSetup() {
  const [name, setName] = useState("");
  const [dob, setDob] = useState("");
  const [gender, setGender] = useState("Prefer not to say");
  const [photo, setPhoto] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [photoProcessing, setPhotoProcessing] = useState(false);
  const [role, setRole] = useState("CUSTOMER");
  const [vehicleTypes, setVehicleTypes] = useState<string[]>(["BIKE"]);
  const [emailVerified, setEmailVerified] = useState(false);
  const [otp, setOtp] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [terms, setTerms] = useState(false);
  const [telegramConsent, setTelegramConsent] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [savedRole, setSavedRole] = useState("CUSTOMER");
  const otpInputs = useRef<Array<HTMLInputElement | null>>([]);

  useEffect(() => {
    setName(localStorage.getItem("mechanicgo_pending_name") || "");
    setPhone(localStorage.getItem("mechanicgo_pending_phone") || "");
    const verifiedEmail = localStorage.getItem("mechanicgo_email") || "";
    setEmail(verifiedEmail);
    setEmailVerified(Boolean(verifiedEmail && localStorage.getItem("mechanicgo_email_verified") === "1"));
    try {
      const saved = JSON.parse(localStorage.getItem("mechanicgo_profile") || "{}");
      if (saved.dob) setDob(saved.dob);
      if (saved.gender) setGender(saved.gender);
      if (saved.photo) setPhoto(saved.photo);
      if (saved.name) setName(saved.name);
      if (saved.phone) setPhone(saved.phone);
    } catch {}
  }, []);

  const pickPhoto = (file?: File) => {
    setError(""); if (!file) return;
    if (!file.type.startsWith("image/")) { setError("Please choose an image file."); return; }
    if (file.size > 8 * 1024 * 1024) { setError("Please choose a photo smaller than 8 MB."); return; }
    setPhotoProcessing(true);
    const reader = new FileReader();
    reader.onerror = () => { setError("That photo could not be opened. Please choose another."); setPhotoProcessing(false); };
    reader.onload = () => {
      setPhoto(String(reader.result || ""));
      const image = new Image();
      image.onerror = () => { setError("That photo could not be opened. Please choose another."); setPhotoProcessing(false); };
      image.onload = () => {
        const scale = Math.min(1, 480 / Math.max(image.width, image.height));
        const canvas = document.createElement("canvas");
        canvas.width = Math.max(1, Math.round(image.width * scale));
        canvas.height = Math.max(1, Math.round(image.height * scale));
        const context = canvas.getContext("2d");
        if (!context) { setError("Photo processing failed. You can continue without a photo."); setPhotoProcessing(false); return; }
        context.drawImage(image, 0, 0, canvas.width, canvas.height);
        setPhoto(canvas.toDataURL("image/jpeg", 0.7));
        setPhotoProcessing(false);
      };
      image.src = String(reader.result);
    };
    reader.readAsDataURL(file);
  };

  const sendOtp = async () => {
    setError(""); setNotice("");
    const normalized = email.trim().toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalized)) { setError("Enter a valid email address."); return; }
    setSaving(true);
    try {
      const response = await fetch("/api/auth/send-otp", { method:"POST", headers:{"Content-Type":"application/json"}, body:JSON.stringify({email:normalized,purpose:"register"}) });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Could not send email OTP.");
      setEmail(normalized); setOtpSent(true); setOtp(""); setEmailVerified(false);
      localStorage.removeItem("mechanicgo_email");
      setNotice("Code sent. Check your inbox and spam folder.");
      setTimeout(() => otpInputs.current[0]?.focus(), 60);
    } catch (e) { setError(e instanceof Error ? e.message : "Could not send email OTP."); }
    finally { setSaving(false); }
  };

  const verifyOtp = async () => {
    setError(""); setNotice("");
    if (!/^\d{6}$/.test(otp)) { setError("Enter all 6 digits from your email."); return; }
    setSaving(true);
    try {
      const response = await fetch("/api/auth/verify-otp", { method:"POST", headers:{"Content-Type":"application/json"}, body:JSON.stringify({email:email.trim().toLowerCase(),code:otp}) });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Email verification failed.");
      setEmailVerified(true); setOtpSent(false); localStorage.setItem("mechanicgo_email", email.trim().toLowerCase());
      localStorage.setItem("mechanicgo_email_verified", "1");
      setNotice("Email verified successfully.");
    } catch (e) { setError(e instanceof Error ? e.message : "Email verification failed."); }
    finally { setSaving(false); }
  };

  const save = async () => {
    setError(""); setNotice("");
    if (!name.trim()) { setError("Please enter your full name."); return; }
    const normalizedUsername = username.trim().toLowerCase();
    if (!/^[a-z0-9][a-z0-9_.]{2,19}$/.test(normalizedUsername)) { setError("Choose a username of 3–20 characters using letters, numbers, dots or underscores."); return; }
    if (password.length < 8 || password.length > 128 || !/[A-Za-z]/.test(password) || !/\d/.test(password)) { setError("Use a password of at least 8 characters with a letter and a number."); return; }
    if (password !== confirmPassword) { setError("Passwords do not match."); return; }
    const cleanPhone = phone.replace(/[()\s.-]/g, "");
    if (!/^\+?[0-9]{10,15}$/.test(cleanPhone)) { setError("A valid mobile number is required (10–15 digits, country code optional)."); return; }
    if (photoProcessing) { setError("Please wait while the profile photo is prepared."); return; }
    if (!isAdult(dob)) { setError("MechanicGo accounts are only available to people aged 18 or older."); return; }
    if (!emailVerified || !email.trim()) { setError("Verify your email address before creating your account."); return; }
    if (!terms) { setError("Please read and accept the Terms & Conditions to continue."); return; }
    if (!telegramConsent) { setError("Please confirm the profile-data notice so we can process profile changes transparently."); return; }
    if (role === "MECHANIC" && vehicleTypes.length === 0) { setError("Select at least one vehicle type."); return; }
    setSaving(true);
    const profile = { name:name.trim(), dob, gender, photo, email:email.trim().toLowerCase(), phone:cleanPhone, username:normalizedUsername, password, confirmPassword, role, vehicleTypes: role === "MECHANIC" ? vehicleTypes : [], event:"new_profile", termsAccepted:true, profileNotificationsConsent:true, termsAcceptedAt:new Date().toISOString() };
    try {
      const response = await fetch("/api/profile/save", {method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(profile)});
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Could not save your profile.");
      setSavedRole(data.user?.role || role);
      const savedProfile = { name:profile.name, dob:profile.dob, gender:profile.gender, photo:profile.photo, email:profile.email, phone:profile.phone, username:profile.username, role:data.user?.role || role, accountStatus:data.user?.accountStatus || "", vehicleTypes:profile.vehicleTypes, termsAccepted:true, profileNotificationsConsent:true };
      try { localStorage.setItem("mechanicgo_profile", JSON.stringify(savedProfile)); }
      catch {
        const smaller = {...savedProfile, photo:""};
        try { localStorage.setItem("mechanicgo_profile", JSON.stringify(smaller)); }
        catch { throw new Error("Browser storage is full. Please clear some site data and try again."); }
      }
      localStorage.setItem("mechanicgo_profile_complete","1");
      localStorage.setItem("mechanicgo_profile_name",profile.name);
      localStorage.setItem("mechanicgo_telegram_consent","1");
      document.cookie = "mechanicgo_profile=1; path=/; max-age=2592000; samesite=lax";
      localStorage.removeItem("mechanicgo_pending_name");
      localStorage.removeItem("mechanicgo_pending_phone");
      localStorage.setItem("mechanicgo_username", normalizedUsername);
      setPassword(""); setConfirmPassword("");
      if (!data.telegramConfigured || !data.telegramSent) {
        setSaved(true);
        setNotice(!data.telegramConfigured
          ? "Profile saved to your account, but Telegram is not configured."
          : "Profile saved to your account, but Telegram delivery failed: " + (data.telegramError || "No delivery confirmation.") + (data.profilePhotoError ? " Profile photo: " + data.profilePhotoError : ""));
        return;
      }
      location.href = data.user?.role === "MECHANIC" ? "/mechanic/dashboard" : "/home";
    } catch (e) { setError(e instanceof Error ? e.message : "Could not save your profile."); }
    finally { setSaving(false); }
  };

  return <main className="setupPage">
    <div className="setupTop"><img src="/mechanicgo-mark.svg" alt="MechanicGo"/><span><CheckCircle2 size={15}/> ACCOUNT SETUP</span></div>
    <section className="setupCard">
      <div className="setupIcon"><UserRound size={30}/></div>
      <div className="setupEyebrow">YOUR ACCOUNT, YOUR WAY</div>
      <h1>Complete your profile</h1>
      <p className="setupIntro">Add accurate details to secure your account and personalise your MechanicGo experience.</p>
      <label className="setupLabel">Profile photo <span className="setupOptional">Optional</span>
        <div className="photoPicker"><div className="setupAvatar">{photo?<img src={photo} alt="Profile preview"/>:<UserRound size={28}/>}</div><label className="cameraBtn" aria-label="Choose profile photo"><Camera size={18}/><input type="file" accept="image/*" onChange={e=>pickPhoto(e.target.files?.[0])}/></label><small><b>Add a clear photo</b><span>Helps mechanics recognise you</span></small></div>
      </label>
      <label className="setupLabel">Full name<div className="setupInput"><UserRound size={20}/><input autoComplete="name" value={name} onChange={e=>setName(e.target.value)} placeholder="Enter your full name" maxLength={80} required/></div></label>
      <label className="setupLabel">Date of birth <span className="setupOptional">18+ only</span><div className="setupInput"><CalendarDays size={20}/><input type="date" value={dob} max={today()} onChange={e=>setDob(e.target.value)} required/></div></label>
      {dob && <p className={isAdult(dob)?"authNotice":"setupError"}>{isAdult(dob)?"Age requirement met (18+).":"You must be at least 18 years old to register."}</p>}
      <label className="setupLabel">Account type
        <div className="genderGrid"><button type="button" className={role==="CUSTOMER"?"gender active":"gender"} onClick={()=>setRole("CUSTOMER")}>Customer</button><button type="button" className={role==="MECHANIC"?"gender active":"gender"} onClick={()=>setRole("MECHANIC")}>Mechanic partner</button></div>
      </label>
      {role==="MECHANIC" && <label className="setupLabel">Vehicle types
        <div className="genderGrid">{["BIKE","CAR","BOTH"].map(v=><button type="button" key={v} className={vehicleTypes.includes(v)?"gender active":"gender"} onClick={()=>setVehicleTypes(old=>old.includes(v)?old.filter(x=>x!==v):[...old,v])}>{v}</button>)}</div><small>Mechanic accounts require admin approval before going online.</small>
      </label>}
      <label className="setupLabel">Gender <span className="setupOptional">Optional</span><div className="genderGrid">{["Male","Female","Other","Prefer not to say"].map(g=><button type="button" key={g} className={gender===g?"gender active":"gender"} onClick={()=>setGender(g)}>{g}{gender===g&&<CheckCircle2 size={17}/>}</button>)}</div></label>
      <label className="setupLabel">Unique username<div className="setupInput"><UserRound size={20}/><input autoComplete="username" autoCapitalize="none" value={username} onChange={e=>setUsername(e.target.value.toLowerCase())} placeholder="e.g. enayat_ali" maxLength={20} required/></div><small>3–20 characters. Letters, numbers, dots and underscores only.</small></label>
      <label className="setupLabel">Password<div className="setupInput"><LockKeyhole size={20}/><input type="password" autoComplete="new-password" value={password} onChange={e=>setPassword(e.target.value)} placeholder="At least 8 characters, with a letter and number" maxLength={128} required/></div></label>
      <label className="setupLabel">Confirm password<div className="setupInput"><LockKeyhole size={20}/><input type="password" autoComplete="new-password" value={confirmPassword} onChange={e=>setConfirmPassword(e.target.value)} placeholder="Enter the same password again" maxLength={128} required/></div></label>
      <label className="setupLabel">Mobile number <span className="setupRequired">Required</span><div className="setupInput"><UserRound size={20}/><input type="tel" autoComplete="tel" inputMode="tel" value={phone} onChange={e=>setPhone(e.target.value)} placeholder="10-digit mobile number" maxLength={20} required/></div></label>
      <label className="setupLabel">Email address <span className="setupOptional">{emailVerified?"Verified ✓":"Required"}</span><div className="setupInput"><Mail size={20}/><input type="email" autoComplete="email" value={email} onChange={e=>{setEmail(e.target.value);setEmailVerified(false);setNotice("");}} placeholder="you@example.com" required/></div></label>
      {!emailVerified && <button type="button" className="secondaryWide" onClick={sendOtp} disabled={saving}>{saving?"Sending…":"Send verification code to email"}</button>}
      {otpSent && <><div className="otpBoxes">{Array.from({length:6},(_,i)=><input key={i} ref={el=>{otpInputs.current[i]=el}} value={otp[i]||""} maxLength={1} inputMode="numeric" aria-label={"OTP digit "+(i+1)} onChange={e=>{const d=e.target.value.replace(/\D/g,"").slice(-1);const a=otp.split("");a[i]=d;setOtp(Array.from({length:6},(_,j)=>a[j]||"").join(""));if(d&&i<5)otpInputs.current[i+1]?.focus();}} />)}</div><button type="button" className="secondaryWide" onClick={verifyOtp} disabled={saving||otp.length!==6}>{saving?"Verifying…":"Verify email"}</button></>}
      <div className="termsCheck"><input id="mg-terms" type="checkbox" checked={terms} onChange={e=>setTerms(e.target.checked)}/><label htmlFor="mg-terms">I confirm that I am at least 18 years old, the information I provided is accurate, and I agree to the <a href="/terms" target="_blank" rel="noreferrer">Terms & Conditions</a> and <a href="/terms" target="_blank" rel="noreferrer">Privacy Notice <ExternalLink size={12}/></a>.</label></div>
      <div className="termsCheck"><input id="mg-telegram-consent" type="checkbox" checked={telegramConsent} onChange={e=>setTelegramConsent(e.target.checked)}/><label htmlFor="mg-telegram-consent">I understand that the profile details I submit (including name, date of birth, email, gender and profile photo status) may be sent to the MechanicGo administrator’s Telegram channel for account support and security. Access to that channel is controlled by the administrator.</label></div>
      {error&&<p className="setupError" role="alert">{error}</p>}{notice&&<p className="authNotice" role="status">{notice}</p>}
      {saved ? <button className="setupContinue" onClick={()=>location.href=savedRole==="MECHANIC"?"/mechanic/dashboard":"/home"}>Continue to MechanicGo <ArrowRight size={21}/></button> : <button className="setupContinue" disabled={saving||photoProcessing||!emailVerified||!terms||!telegramConsent||!isAdult(dob)} onClick={save}>{saving?"Saving profile…":photoProcessing?"Preparing photo…":"Create my account"} <ArrowRight size={21}/></button>}
      <div className="privacyHint"><ShieldCheck size={15}/> Email verification and age checks are required before account creation.</div>
    </section>
  </main>;
}
