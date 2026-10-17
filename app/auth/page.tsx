"use client";
import { useRef, useState } from "react";
import { ArrowLeft, ArrowRight, CheckCircle2, LockKeyhole, Mail, UserRound, ShieldCheck } from "lucide-react";

export default function Auth() {
  const [register, setRegister] = useState(false);
  const [otp, setOtp] = useState(false);
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const inputs = useRef<Array<HTMLInputElement | null>>([]);

  const sendOtp = async () => {
    setError("");
    setNotice("");
    if (register && !name.trim()) {
      setError("Please enter your full name.");
      return;
    }
    const normalizedEmail = email.trim().toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) {
      setError("Please enter a valid email address.");
      return;
    }
    setBusy(true);
    try {
      const response = await fetch("/api/auth/send-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: normalizedEmail })
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Could not send the email OTP.");
      setEmail(normalizedEmail);
      setOtp(true);
      setCode("");
      setNotice("A 6-digit verification code has been sent to your email.");
      setTimeout(() => inputs.current[0]?.focus(), 50);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unable to send OTP. Please try again.");
    } finally {
      setBusy(false);
    }
  };

  const verifyOtp = async () => {
    setError("");
    setNotice("");
    if (!/^\d{6}$/.test(code)) {
      setError("Enter all 6 digits from the email.");
      return;
    }
    setBusy(true);
    try {
      const response = await fetch("/api/auth/verify-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim().toLowerCase(), code })
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "That code could not be verified.");
      localStorage.setItem("mechanicgo_auth", "1");
      localStorage.setItem("mechanicgo_email", email.trim().toLowerCase());
      localStorage.setItem("mechanicgo_email_verified", "1");
      if (name.trim()) localStorage.setItem("mechanicgo_pending_name", name.trim());
      if (data.existingAccount) {
        localStorage.setItem("mechanicgo_profile_complete", "1");
        if (data.user?.role) {
          localStorage.setItem("mechanicgo_profile", JSON.stringify({
            name: data.user.name || "",
            email: data.user.email || email.trim().toLowerCase(),
            phone: data.user.phone || "",
            role: data.user.role,
            dob: data.user.dob || "",
            gender: data.user.gender || "Prefer not to say",
            vehicleTypes: data.user.vehicleTypes || []
          }));
        }
      }
      location.replace(data.nextPath || (data.existingAccount ? "/home" : "/profile-setup"));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Verification failed. Please try again.");
    } finally {
      setBusy(false);
    }
  };

  const updateDigit = (index: number, value: string) => {
    const digit = value.replace(/\D/g, "").slice(-1);
    const next = code.split("");
    next[index] = digit;
    setCode(Array.from({ length: 6 }, (_, i) => next[i] || "").join(""));
    if (digit && index < 5) inputs.current[index + 1]?.focus();
  };

  if (otp) return (
    <main className="authPage">
      <div className="authTop">
        <button type="button" className="backLink" onClick={() => { setOtp(false); setCode(""); setError(""); setNotice(""); }}>
          <ArrowLeft size={18}/> Change email
        </button>
        <img src="/mechanicgo-mark.svg" alt="MechanicGo"/>
      </div>
      <section className="authCard">
        <div className="authLogo"><Mail size={30} color="#2563eb"/></div>
        <div className="authBrand">Verify<span> email</span></div>
        <p className="authTag">Enter the 6-digit code sent to <strong>{email}</strong>.</p>
        <div className="otpBoxes" aria-label="6-digit email verification code">
          {Array.from({ length: 6 }, (_, i) => (
            <input key={i} ref={el => { inputs.current[i] = el; }} value={code[i] || ""} maxLength={1} inputMode="numeric" autoComplete={i === 0 ? "one-time-code" : "off"} aria-label={`Digit ${i + 1}`} onChange={e => updateDigit(i, e.target.value)} onKeyDown={e => { if (e.key === "Backspace" && !code[i] && i > 0) inputs.current[i - 1]?.focus(); }} onPaste={e => { const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6); if (pasted) { e.preventDefault(); setCode(pasted); inputs.current[Math.min(pasted.length, 5)]?.focus(); } }} />
          ))}
        </div>
        {error && <p className="authError" role="alert">{error}</p>}
        {notice && !error && <p className="authNotice" role="status">{notice}</p>}
        <button className="authPrimary" disabled={busy || code.length !== 6} onClick={verifyOtp}>{busy ? "Verifying…" : "Verify & Continue"} <ArrowRight size={18}/></button>
        <div className="secureNote"><LockKeyhole size={15}/> Your code is private and expires in 5 minutes</div>
        <button className="resend" disabled={busy} onClick={sendOtp}>{busy ? "Sending…" : "Send a new code"}</button>
      </section>
    </main>
  );

  return (
    <main className="authPage">
      <div className="authTop">
        <a href="/" className="backLink"><ArrowLeft size={18}/> Back</a>
        <img src="/mechanicgo-mark.svg" alt="MechanicGo"/>
      </div>
      <section className="authCard">
        <div className="authLogo"><img src="/mechanicgo-mark.svg" alt="MechanicGo"/></div>
        <div className="authBrand">Mechanic<span>Go</span></div>
        <p className="authTag">Roadside help, on demand.</p>
        <div className="authTabs">
          <button className={!register ? "selected" : ""} onClick={() => { setRegister(false); setError(""); setNotice(""); }}>Login</button>
          <button className={register ? "selected" : ""} onClick={() => { setRegister(true); setError(""); setNotice(""); }}>Register</button>
        </div>
        {register && <label><span>Full name</span><div className="input"><UserRound size={18}/><input value={name} onChange={e => setName(e.target.value)} placeholder="Your full name" autoComplete="name" maxLength={80}/></div></label>}
        <label>
          <span>Email address</span>
          <div className="input"><Mail size={18}/><input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="you@example.com" autoComplete="email" inputMode="email" onKeyDown={e => { if (e.key === "Enter") void sendOtp(); }}/></div>
        </label>
        {error && <p className="authError" role="alert">{error}</p>}
        {notice && <p className="authNotice" role="status">{notice}</p>}
        <button className="authPrimary" disabled={busy} onClick={sendOtp}>{busy ? "Sending email…" : register ? "Create account with OTP" : "Continue with email OTP"} <ArrowRight size={18}/></button>
        <div className="secureNote"><ShieldCheck size={15}/> Real email verification — no demo OTPs</div>
        <p className="authTerms">By continuing, you agree to our Terms & Privacy Policy.</p>
        <div className="authTrust"><span><CheckCircle2 size={15}/> Verified mechanics</span><span><CheckCircle2 size={15}/> Secure account</span><span><CheckCircle2 size={15}/> 24/7 support</span></div>
      </section>
    </main>
  );
}
