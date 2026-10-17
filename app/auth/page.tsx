"use client";
import { useRef, useState } from "react";
import { ArrowLeft, ArrowRight, CheckCircle2, LockKeyhole, Mail, UserRound, ShieldCheck, KeyRound } from "lucide-react";

export default function Auth() {
  const [mode, setMode] = useState<"password" | "email">("password");
  const [register, setRegister] = useState(false);
  const [otp, setOtp] = useState(false);
  const [username, setUsername] = useState("Enayat78");
  const [password, setPassword] = useState("");
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const inputs = useRef<Array<HTMLInputElement | null>>([]);

  const passwordLogin = async () => {
    setError(""); setNotice("");
    if (!username.trim() || !password) { setError("Enter your username and password."); return; }
    setBusy(true);
    try {
      const response = await fetch("/api/auth/password-login", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: username.trim(), password })
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Login failed. Check your details.");
      localStorage.setItem("mechanicgo_auth", "1");
      localStorage.setItem("mechanicgo_username", data.username);
      localStorage.setItem("mechanicgo_profile_name", data.name || data.username);
      if (data.email) {
        localStorage.setItem("mechanicgo_email", data.email);
        localStorage.setItem("mechanicgo_email_verified", "1");
      }
      if (data.needsProfile) {
        localStorage.removeItem("mechanicgo_profile_complete");
        localStorage.setItem("mechanicgo_pending_name", data.name || data.username);
        location.href = "/profile-setup";
      } else {
        localStorage.setItem("mechanicgo_profile_complete", "1");
        location.href = "/admin";
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unable to log in. Please try again.");
    } finally { setBusy(false); }
  };

  const sendOtp = async () => {
    setError(""); setNotice("");
    if (register && !name.trim()) { setError("Please enter your full name."); return; }
    const normalizedEmail = email.trim().toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) { setError("Please enter a valid email address."); return; }
    setBusy(true);
    try {
      const response = await fetch("/api/auth/send-otp", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: normalizedEmail })
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Could not send the email OTP.");
      setEmail(normalizedEmail); setOtp(true); setCode("");
      setNotice("A 6-digit verification code has been sent to your email.");
      setTimeout(() => inputs.current[0]?.focus(), 50);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unable to send OTP. Please try again.");
    } finally { setBusy(false); }
  };

  const verifyOtp = async () => {
    setError("");
    if (code.length !== 6) { setError("Enter all 6 digits from the email."); return; }
    setBusy(true);
    try {
      const response = await fetch("/api/auth/verify-otp", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim().toLowerCase(), code })
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "That code could not be verified.");
      localStorage.setItem("mechanicgo_auth", "1");
      localStorage.setItem("mechanicgo_email", email.trim().toLowerCase());
      localStorage.setItem("mechanicgo_email_verified", "1");
      if (name.trim()) localStorage.setItem("mechanicgo_pending_name", name.trim());
      location.href = "/profile-setup";
    } catch (e) {
      setError(e instanceof Error ? e.message : "Verification failed. Please try again.");
    } finally { setBusy(false); }
  };

  const updateDigit = (index: number, value: string) => {
    const digit = value.replace(/\D/g, "").slice(-1);
    const next = code.split(""); next[index] = digit;
    setCode(Array.from({ length: 6 }, (_, i) => next[i] || "").join(""));
    if (digit && index < 5) inputs.current[index + 1]?.focus();
  };

  if (otp) return (
    <main className="authPage">
      <div className="authTop"><button type="button" className="backLink" onClick={() => { setOtp(false); setCode(""); setError(""); setNotice(""); }}><ArrowLeft size={18}/> Change email</button><img src="/mechanicgo-mark.svg" alt="MechanicGo"/></div>
      <section className="authCard">
        <div className="authLogo"><Mail size={30} color="#2563eb"/></div>
        <div className="authBrand">Verify<span> email</span></div>
        <p className="authTag">Enter the 6-digit code sent to <strong>{email}</strong>.</p>
        <div className="otpBoxes" aria-label="6-digit email verification code">
          {Array.from({ length: 6 }, (_, i) => <input key={i} ref={el => { inputs.current[i] = el; }} value={code[i] || ""} maxLength={1} inputMode="numeric" autoComplete={i === 0 ? "one-time-code" : "off"} aria-label={`Digit ${i + 1}`} onChange={e => updateDigit(i, e.target.value)} onKeyDown={e => { if (e.key === "Backspace" && !code[i] && i > 0) inputs.current[i - 1]?.focus(); }} onPaste={e => { const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6); if (pasted) { e.preventDefault(); setCode(pasted); inputs.current[Math.min(pasted.length, 5)]?.focus(); } }} />)}
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
      <div className="authTop"><a href="/" className="backLink"><ArrowLeft size={18}/> Back</a><img src="/mechanicgo-mark.svg" alt="MechanicGo"/></div>
      <section className="authCard">
        <div className="authLogo"><img src="/mechanicgo-mark.svg" alt="MechanicGo"/></div>
        <div className="authBrand">Mechanic<span>Go</span></div>
        <p className="authTag">Roadside help, on demand.</p>
        <div className="authTabs">
          <button className={!register ? "selected" : ""} onClick={() => { setRegister(false); setError(""); }}>Login</button>
          <button className={register ? "selected" : ""} onClick={() => { setRegister(true); setError(""); setMode("email"); }}>Register</button>
        </div>
        {!register && <div className="authTabs" aria-label="Login method">
          <button className={mode === "password" ? "selected" : ""} onClick={() => { setMode("password"); setError(""); }}>Username & password</button>
          <button className={mode === "email" ? "selected" : ""} onClick={() => { setMode("email"); setError(""); }}>Email OTP</button>
        </div>}
        {register && <label><span>Full name</span><div className="input"><UserRound size={18}/><input value={name} onChange={e => setName(e.target.value)} placeholder="Your full name" autoComplete="name"/></div></label>}
        {(!register && mode === "password") ? <>
          <label><span>Username</span><div className="input"><UserRound size={18}/><input value={username} onChange={e => setUsername(e.target.value)} placeholder="Username" autoComplete="username" onKeyDown={e => { if (e.key === "Enter") passwordLogin(); }}/></div></label>
          <label><span>Password</span><div className="input"><KeyRound size={18}/><input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="Enter password" autoComplete="current-password" onKeyDown={e => { if (e.key === "Enter") passwordLogin(); }}/></div></label>
        </> : <>
          <label><span>Email address</span><div className="input"><Mail size={18}/><input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="you@example.com" autoComplete="email" inputMode="email" onKeyDown={e => { if (e.key === "Enter") sendOtp(); }}/></div></label>
        </>}
        {error && <p className="authError" role="alert">{error}</p>}
        {(!register && mode === "password") ? <button className="authPrimary" disabled={busy} onClick={passwordLogin}>{busy ? "Signing in…" : "Login securely"} <ArrowRight size={18}/></button> : <button className="authPrimary" disabled={busy} onClick={sendOtp}>{busy ? "Sending email…" : "Send email OTP"} <ArrowRight size={18}/></button>}
        <div className="secureNote"><ShieldCheck size={15}/>{(!register && mode === "password") ? "Sign in without requesting an OTP each time" : "Real email verification — no fake OTPs"}</div>
        <p className="authTerms">By continuing, you agree to our Terms & Privacy Policy.</p>
        <div className="authTrust"><span><CheckCircle2 size={15}/> Verified mechanics</span><span><CheckCircle2 size={15}/> Secure account</span><span><CheckCircle2 size={15}/> 24/7 support</span></div>
      </section>
    </main>
  );
}
