"use client";
import { useEffect, useRef, useState } from "react";
import { ArrowLeft, ArrowRight, CheckCircle2, LockKeyhole, Mail, UserRound, ShieldCheck, KeyRound, Phone } from "lucide-react";

type View = "login" | "register" | "otp-login" | "forgot";
type OtpPurpose = "login" | "register" | "password_reset";

export default function Auth() {
  const [view, setView] = useState<View>("login");
  const [otpStep, setOtpStep] = useState(false);
  const [resetStep, setResetStep] = useState(false);
  const [otpPurpose, setOtpPurpose] = useState<OtpPurpose>("login");
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [newUsername, setNewUsername] = useState("");
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("forgot") === "1") setView("forgot");
    if (params.get("reset") === "success") setNotice("Password changed successfully. You can now log in.");
  }, []);
  const [needsUsername, setNeedsUsername] = useState(false);
  const inputs = useRef<Array<HTMLInputElement | null>>([]);

  const changeView = (next: View) => {
    setView(next); setOtpStep(false); setResetStep(false); setCode(""); setError(""); setNotice("");
    setPassword(""); setConfirmPassword("");
  };

  const sendOtp = async (purpose: OtpPurpose) => {
    setError(""); setNotice("");
    const normalizedEmail = email.trim().toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) { setError("Enter a valid email address."); return; }
    if (purpose === "register") {
      if (!name.trim()) { setError("Enter your full name."); return; }
      const cleanPhone = phone.replace(/[()\s.-]/g, "");
      if (!/^\+?[0-9]{10,15}$/.test(cleanPhone)) { setError("Enter a valid mobile number (10–15 digits, country code optional)."); return; }
    }
    setBusy(true);
    try {
      const response = await fetch("/api/auth/send-otp", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: normalizedEmail, purpose })
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Could not send email OTP.");
      setEmail(normalizedEmail); setOtpPurpose(purpose); setOtpStep(true); setResetStep(false); setCode("");
      setNotice(purpose === "password_reset" ? "If the email belongs to a registered account, a reset code will be sent." : "A 6-digit verification code has been sent to your email.");
      setTimeout(() => inputs.current[0]?.focus(), 50);
    } catch (e) { setError(e instanceof Error ? e.message : "Unable to send OTP. Please try again."); }
    finally { setBusy(false); }
  };

  const verifyOtp = async () => {
    setError(""); setNotice("");
    if (!/^\d{6}$/.test(code)) { setError("Enter all 6 digits from the email."); return; }
    setBusy(true);
    try {
      const response = await fetch("/api/auth/verify-otp", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim().toLowerCase(), code })
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "That code could not be verified.");
      if (data.passwordResetVerified) {
        setOtpStep(false); setResetStep(true); setNeedsUsername(Boolean(data.needsUsername)); setNewUsername("");
        setNotice("Email verified. Choose your new password.");
        return;
      }
      localStorage.setItem("mechanicgo_auth", "1");
      localStorage.setItem("mechanicgo_email", email.trim().toLowerCase());
      localStorage.setItem("mechanicgo_email_verified", "1");
      if (name.trim()) localStorage.setItem("mechanicgo_pending_name", name.trim());
      if (view === "register") {
        const cleanPhone = phone.replace(/[()\s.-]/g, "");
        localStorage.setItem("mechanicgo_pending_phone", cleanPhone);
        location.replace("/profile-setup");
        return;
      }
      if (data.existingAccount) {
        localStorage.setItem("mechanicgo_profile_complete", "1");
        if (data.user?.role) {
          localStorage.setItem("mechanicgo_profile", JSON.stringify({
            name: data.user.name || "", email: data.user.email || email.trim().toLowerCase(),
            username: data.user.username || "", phone: data.user.phone || "", role: data.user.role,
            dob: data.user.dob || "", gender: data.user.gender || "Prefer not to say",
            vehicleTypes: data.user.vehicleTypes || []
          }));
        }
      }
      location.replace(data.nextPath || (data.existingAccount ? "/home" : "/profile-setup"));
    } catch (e) { setError(e instanceof Error ? e.message : "Verification failed. Please try again."); }
    finally { setBusy(false); }
  };

  const loginWithPassword = async () => {
    setError(""); setNotice("");
    if (!username.trim() || !password) { setError("Enter your username and password."); return; }
    setBusy(true);
    try {
      const response = await fetch("/api/auth/verify-otp", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "password-login", username: username.trim(), password })
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Could not sign in.");
      localStorage.setItem("mechanicgo_auth", "1");
      localStorage.setItem("mechanicgo_username", data.user.username || username.trim().toLowerCase());
      localStorage.setItem("mechanicgo_profile_name", data.user.name || "");
      localStorage.setItem("mechanicgo_email", data.user.email || "");
      localStorage.setItem("mechanicgo_email_verified", "1");
      localStorage.setItem("mechanicgo_profile_complete", "1");
      localStorage.setItem("mechanicgo_profile", JSON.stringify({...data.user}));
      location.replace(data.nextPath || "/home");
    } catch (e) { setError(e instanceof Error ? e.message : "Could not sign in. Please try again."); }
    finally { setBusy(false); }
  };

  const resetPassword = async () => {
    setError(""); setNotice("");
    if (password !== confirmPassword) { setError("Passwords do not match."); return; }
    if (password.length < 8 || password.length > 128 || !/[A-Za-z]/.test(password) || !/\d/.test(password)) {
      setError("Use at least 8 characters, including a letter and a number."); return;
    }
    if (needsUsername && !/^[a-z0-9][a-z0-9_.]{2,19}$/i.test(newUsername.trim())) {
      setError("Choose a username of 3–20 letters, numbers, dots or underscores."); return;
    }
    setBusy(true);
    try {
      const response = await fetch("/api/auth/verify-otp", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "reset-password", password, confirmPassword, username: newUsername.trim() })
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Could not reset password.");
      location.replace("/auth?reset=success");
    } catch (e) { setError(e instanceof Error ? e.message : "Could not reset password."); }
    finally { setBusy(false); }
  };

  const updateDigit = (index: number, value: string) => {
    const digit = value.replace(/\D/g, "").slice(-1);
    const next = code.split(""); next[index] = digit;
    setCode(Array.from({ length: 6 }, (_, i) => next[i] || "").join(""));
    if (digit && index < 5) inputs.current[index + 1]?.focus();
  };

  if (resetStep) return (
    <main className="authPage"><div className="authTop"><button type="button" className="backLink" onClick={() => changeView("login")}><ArrowLeft size={18}/> Back to login</button><img src="/mechanicgo-mark.svg" alt="MechanicGo"/></div>
      <section className="authCard"><div className="authLogo"><KeyRound size={30} color="#2563eb"/></div><div className="authBrand">Set new<span> password</span></div><p className="authTag">Email verified for {email}.</p>
        {needsUsername && <label><span>Choose username</span><div className="input"><UserRound size={18}/><input value={newUsername} onChange={e=>setNewUsername(e.target.value)} autoCapitalize="none" maxLength={20} placeholder="e.g. enayat_ali"/></div><small>3–20 characters: letters, numbers, dot or underscore.</small></label>}
        <label><span>New password</span><div className="input"><LockKeyhole size={18}/><input type="password" value={password} onChange={e=>setPassword(e.target.value)} autoComplete="new-password" maxLength={128} placeholder="At least 8 characters"/></div></label>
        <label><span>Confirm new password</span><div className="input"><LockKeyhole size={18}/><input type="password" value={confirmPassword} onChange={e=>setConfirmPassword(e.target.value)} autoComplete="new-password" maxLength={128} placeholder="Enter password again"/></div></label>
        {error&&<p className="authError" role="alert">{error}</p>}<button className="authPrimary" disabled={busy} onClick={()=>void resetPassword()}>{busy?"Saving…":"Reset password"} <ArrowRight size={18}/></button>
      </section></main>
  );

  if (otpStep) return (
    <main className="authPage"><div className="authTop"><button type="button" className="backLink" onClick={() => { setOtpStep(false); setCode(""); setError(""); setNotice(""); }}><ArrowLeft size={18}/> Change email</button><img src="/mechanicgo-mark.svg" alt="MechanicGo"/></div>
      <section className="authCard"><div className="authLogo"><Mail size={30} color="#2563eb"/></div><div className="authBrand">Verify<span> email</span></div><p className="authTag">Enter the 6-digit code sent to <strong>{email}</strong>.</p>
        <div className="otpBoxes" aria-label="6-digit email verification code">{Array.from({length:6},(_,i)=><input key={i} ref={el=>{inputs.current[i]=el;}} value={code[i]||""} maxLength={1} inputMode="numeric" autoComplete={i===0?"one-time-code":"off"} aria-label={`Digit ${i+1}`} onChange={e=>updateDigit(i,e.target.value)} onKeyDown={e=>{if(e.key==="Backspace"&&!code[i]&&i>0)inputs.current[i-1]?.focus();}} onPaste={e=>{const pasted=e.clipboardData.getData("text").replace(/\D/g,"").slice(0,6);if(pasted){e.preventDefault();setCode(pasted);inputs.current[Math.min(pasted.length,5)]?.focus();}}}/>)}</div>
        {error&&<p className="authError" role="alert">{error}</p>}{notice&&!error&&<p className="authNotice" role="status">{notice}</p>}
        <button className="authPrimary" disabled={busy||code.length!==6} onClick={()=>void verifyOtp()}>{busy?"Verifying…":"Verify & Continue"} <ArrowRight size={18}/></button><div className="secureNote"><LockKeyhole size={15}/> Code expires in 5 minutes</div><button className="resend" disabled={busy} onClick={()=>void sendOtp(otpPurpose)}>{busy?"Sending…":"Send a new code"}</button>
      </section></main>
  );

  return (
    <main className="authPage"><div className="authTop"><a href="/" className="backLink"><ArrowLeft size={18}/> Back</a><img src="/mechanicgo-mark.svg" alt="MechanicGo"/></div>
      <section className="authCard"><div className="authLogo"><img src="/mechanicgo-mark.svg" alt="MechanicGo"/></div><div className="authBrand">Mechanic<span>Go</span></div><p className="authTag">Roadside help, on demand.</p>
        {view!=="forgot"&&<div className="authTabs"><button className={view==="login"||view==="otp-login"?"selected":""} onClick={()=>changeView("login")}>Login</button><button className={view==="register"?"selected":""} onClick={()=>changeView("register")}>Register</button></div>}
        {view==="register"&&<>
          <label><span>Full name</span><div className="input"><UserRound size={18}/><input value={name} onChange={e=>setName(e.target.value)} autoComplete="name" maxLength={80} placeholder="Your full name"/></div></label>
          <label><span>Mobile number</span><div className="input"><Phone size={18}/><input value={phone} onChange={e=>setPhone(e.target.value)} type="tel" inputMode="tel" autoComplete="tel" maxLength={20} placeholder="10-digit mobile number"/></div></label>
        </>}
        {(view==="register"||view==="otp-login"||view==="forgot")&&<label><span>Email address</span><div className="input"><Mail size={18}/><input type="email" value={email} onChange={e=>setEmail(e.target.value)} placeholder="you@example.com" autoComplete="email" inputMode="email"/></div></label>}
        {view==="login"&&<>
          <label><span>Username</span><div className="input"><UserRound size={18}/><input value={username} onChange={e=>setUsername(e.target.value)} autoCapitalize="none" autoComplete="username" maxLength={20} placeholder="Your unique username"/></div></label>
          <label><span>Password</span><div className="input"><LockKeyhole size={18}/><input type="password" value={password} onChange={e=>setPassword(e.target.value)} autoComplete="current-password" maxLength={128} placeholder="Your password"/></div></label>
        </>}
        {error&&<p className="authError" role="alert">{error}</p>}{notice&&!error&&<p className="authNotice" role="status">{notice}</p>}
        {view==="login"&&<><button className="authPrimary" disabled={busy} onClick={()=>void loginWithPassword()}>{busy?"Signing in…":"Login with username"} <ArrowRight size={18}/></button><button type="button" className="resend" onClick={()=>changeView("forgot")}>Forgot password?</button><button type="button" className="secondaryWide" onClick={()=>changeView("otp-login")}>Login with email OTP</button></>}
        {view==="register"&&<><button className="authPrimary" disabled={busy} onClick={()=>void sendOtp("register")}>{busy?"Sending email…":"Continue registration with OTP"} <ArrowRight size={18}/></button><div className="secureNote"><ShieldCheck size={15}/> Next step: username, password and profile details</div></>}
        {view==="otp-login"&&<><button className="authPrimary" disabled={busy} onClick={()=>void sendOtp("login")}>{busy?"Sending email…":"Send login OTP"} <ArrowRight size={18}/></button><button type="button" className="resend" onClick={()=>changeView("login")}>Use username and password instead</button></>}
        {view==="forgot"&&<><p className="authTag">We'll verify your registered email before allowing a password reset.</p><button className="authPrimary" disabled={busy} onClick={()=>void sendOtp("password_reset")}>{busy?"Sending code…":"Send reset code"} <ArrowRight size={18}/></button><button type="button" className="resend" onClick={()=>changeView("login")}>Back to login</button></>}
        <p className="authTerms">By continuing, you agree to our Terms & Privacy Policy.</p><div className="authTrust"><span><CheckCircle2 size={15}/> Verified email</span><span><CheckCircle2 size={15}/> Secure account</span><span><CheckCircle2 size={15}/> Password recovery</span></div>
      </section>
    </main>
  );
}
