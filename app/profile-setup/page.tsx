"use client";
import { useEffect, useState } from "react";
import { ArrowRight, Camera, CalendarDays, UserRound, CheckCircle2, ShieldCheck } from "lucide-react";

export default function ProfileSetup() {
  const [name, setName] = useState("");
  const [dob, setDob] = useState("");
  const [gender, setGender] = useState("Prefer not to say");
  const [photo, setPhoto] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setName(localStorage.getItem("mechanicgo_pending_name") || "");
    try {
      const saved = JSON.parse(localStorage.getItem("mechanicgo_profile") || "{}");
      if (saved.dob) setDob(saved.dob);
      if (saved.gender) setGender(saved.gender);
      if (saved.photo) setPhoto(saved.photo);
      if (saved.name) setName(saved.name);
    } catch { /* Ignore an incomplete local profile and let the user continue. */ }
  }, []);

  const pickPhoto = (file?: File) => {
    setError("");
    if (!file) return;
    if (!file.type.startsWith("image/")) { setError("Please choose an image file."); return; }
    if (file.size > 8 * 1024 * 1024) { setError("Please choose a photo smaller than 8 MB."); return; }
    const reader = new FileReader();
    reader.onerror = () => setError("That photo could not be opened. Please choose another.");
    reader.onload = () => {
      const image = new Image();
      image.onerror = () => setError("That photo could not be opened. Please choose another.");
      image.onload = () => {
        const maxSide = 480;
        const scale = Math.min(1, maxSide / Math.max(image.width, image.height));
        const canvas = document.createElement("canvas");
        canvas.width = Math.max(1, Math.round(image.width * scale));
        canvas.height = Math.max(1, Math.round(image.height * scale));
        const context = canvas.getContext("2d");
        if (!context) { setError("Photo processing failed. You can continue without a photo."); return; }
        context.drawImage(image, 0, 0, canvas.width, canvas.height);
        setPhoto(canvas.toDataURL("image/jpeg", 0.72));
      };
      image.src = String(reader.result);
    };
    reader.readAsDataURL(file);
  };

  const save = () => {
    setError("");
    if (!name.trim()) { setError("Please enter your full name."); return; }
    if (!dob) { setError("Please select your date of birth."); return; }
    if (dob > new Date().toISOString().slice(0, 10)) { setError("Date of birth cannot be in the future."); return; }
    setSaving(true);
    const profile = { name: name.trim(), dob, gender: gender || "Prefer not to say", photo };
    try {
      localStorage.setItem("mechanicgo_profile", JSON.stringify(profile));
    } catch {
      try {
        // A large/older photo must never block profile completion.
        localStorage.setItem("mechanicgo_profile", JSON.stringify({ ...profile, photo: "" }));
      } catch {
        setSaving(false);
        setError("Your browser storage is full. Clear some browser data and try again.");
        return;
      }
    }
    localStorage.setItem("mechanicgo_profile_complete", "1");
    localStorage.setItem("mechanicgo_profile_name", profile.name);
    document.cookie = "mechanicgo_profile=1; path=/; max-age=2592000; samesite=lax";
    localStorage.removeItem("mechanicgo_pending_name");
    location.href = "/home";
  };

  return (
    <main className="setupPage">
      <div className="setupTop">
        <img src="/mechanicgo-mark.svg" alt="MechanicGo"/>
        <span><CheckCircle2 size={15}/> STEP 2 OF 2</span>
      </div>
      <section className="setupCard">
        <div className="setupIcon"><UserRound size={30}/></div>
        <div className="setupEyebrow">YOUR ACCOUNT, YOUR WAY</div>
        <h1>Complete your profile</h1>
        <p className="setupIntro">Just a few details so we can personalise your MechanicGo experience.</p>
        <label className="setupLabel">Profile photo <span className="setupOptional">Optional</span>
          <div className="photoPicker">
            <div className="setupAvatar">{photo ? <img src={photo} alt="Profile preview"/> : <UserRound size={28}/>}</div>
            <label className="cameraBtn" aria-label="Choose profile photo">
              <Camera size={18}/>
              <input type="file" accept="image/*" onChange={e => pickPhoto(e.target.files?.[0])}/>
            </label>
            <small><b>Add a profile photo</b><span>Helps mechanics recognise you</span></small>
          </div>
        </label>
        <label className="setupLabel">Full name
          <div className="setupInput"><UserRound size={21}/><input autoComplete="name" value={name} onChange={e => setName(e.target.value)} placeholder="Enter your full name" maxLength={80} required/></div>
        </label>
        <label className="setupLabel">Date of birth
          <div className="setupInput"><CalendarDays size={21}/><input type="date" value={dob} max={new Date().toISOString().slice(0, 10)} onChange={e => setDob(e.target.value)} required/></div>
        </label>
        <label className="setupLabel">Gender <span className="setupOptional">Optional</span>
          <div className="genderGrid">
            {["Male", "Female", "Other", "Prefer not to say"].map(g =>
              <button type="button" key={g} className={gender === g ? "gender active" : "gender"} onClick={() => setGender(g)}>
                {g}{gender === g && <CheckCircle2 size={17}/>}
              </button>
            )}
          </div>
        </label>
        {error && <p className="setupError" role="alert">{error}</p>}
        <button className="setupContinue" disabled={saving} onClick={save}>{saving ? "Saving profile…" : "Continue to MechanicGo"} <ArrowRight size={21}/></button>
        <div className="privacyHint"><ShieldCheck size={15}/> Your details stay private and help personalise your service.</div>
      </section>
    </main>
  );
}
