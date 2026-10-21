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
  const [showPassword, setShowPassword] = useState(false);
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
      if (name.trim().replace(/[^\p{L}]/gu, "").length < 4) { setError("Enter your full name using at least 4 letters."); return; }
      const cleanPhone = phone.replace(/[()\s.-]/g, "");
      if (!/^[6-9][0-9]{9}$/.test(cleanPhone)) { setError("Enter a valid 10-digit Indian mobile number."); return; }
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
    if (!username.trim() || !password) { setError("Enter your username/email and password."); return; }
    setBusy(true);
    try {
      const response = await fetch("/api/auth/verify-otp", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "password-login", identifier: username.trim(), password })
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
    if (needsUsername && !/^[a-z0-9][a-z0-9_.]{4,19}$/i.test(newUsername.trim())) {
      setError("Choose a username of 5–20 letters, numbers, dots or underscores."); return;
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
    <main className="authPage"><div className="authTop"><button type="button" className="backLink" onClick={() => changeView("login")}><ArrowLeft size={18}/> Back to login</button><img className="authMechanicLogo" src="/mechanicgo-mechanic.svg" alt="MechanicGo mechanic"/></div>
      <section className="authCard"><div className="authLogo"><KeyRound size={30} color="#2563eb"/></div><div className="authBrand">Set new<span> password</span></div><p className="authTag">Email verified for {email}.</p>
        {needsUsername && <label><span>Choose username</span><div className="input"><UserRound size={18}/><input value={newUsername} onChange={e=>setNewUsername(e.target.value)} autoCapitalize="none" maxLength={20} placeholder="e.g. enayat_ali"/></div><small>5–20 characters: letters, numbers, dot or underscore.</small></label>}
        <label><span>New password</span><div className="input"><LockKeyhole size={18}/><input type="password" value={password} onChange={e=>setPassword(e.target.value)} autoComplete="new-password" maxLength={128} placeholder="At least 8 characters"/></div></label>
        <label><span>Confirm new password</span><div className="input"><LockKeyhole size={18}/><input type="password" value={confirmPassword} onChange={e=>setConfirmPassword(e.target.value)} autoComplete="new-password" maxLength={128} placeholder="Enter password again"/></div></label>
        {error&&<p className="authError" role="alert">{error}</p>}<button className="authPrimary" disabled={busy} onClick={()=>void resetPassword()}>{busy?"Saving…":"Reset password"} <ArrowRight size={18}/></button>
      </section></main>
  );

  if (otpStep) return (
    <main className="authPage"><div className="authTop"><button type="button" className="backLink" onClick={() => { setOtpStep(false); setCode(""); setError(""); setNotice(""); }}><ArrowLeft size={18}/> Change email</button><img className="authMechanicBrandIcon" src="/mechanicgo-mechanic.svg" alt="MechanicGo mechanic"/></div>
      <section className="authCard"><div className="authLogo"><Mail size={30} color="#2563eb"/></div><div className="authBrand">Verify<span> email</span></div><p className="authTag">Enter the 6-digit code sent to <strong>{email}</strong>.</p>
        <div className="otpBoxes" aria-label="6-digit email verification code">{Array.from({length:6},(_,i)=><input key={i} ref={el=>{inputs.current[i]=el;}} value={code[i]||""} maxLength={1} inputMode="numeric" autoComplete={i===0?"one-time-code":"off"} aria-label={`Digit ${i+1}`} onChange={e=>updateDigit(i,e.target.value)} onKeyDown={e=>{if(e.key==="Backspace"&&!code[i]&&i>0)inputs.current[i-1]?.focus();}} onPaste={e=>{const pasted=e.clipboardData.getData("text").replace(/\D/g,"").slice(0,6);if(pasted){e.preventDefault();setCode(pasted);inputs.current[Math.min(pasted.length,5)]?.focus();}}}/>)}</div>
        {error&&<p className="authError" role="alert">{error}</p>}{notice&&!error&&<p className="authNotice" role="status">{notice}</p>}
        <button className="authPrimary" disabled={busy||code.length!==6} onClick={()=>void verifyOtp()}>{busy?"Verifying…":"Verify & Continue"} <ArrowRight size={18}/></button><div className="secureNote"><LockKeyhole size={15}/> Code expires in 5 minutes</div><button className="resend" disabled={busy} onClick={()=>void sendOtp(otpPurpose)}>{busy?"Sending…":"Send a new code"}</button>
      </section></main>
  );

  return (
    <main className="authPage"><div className="authTop"><a href="/" className="backLink"><ArrowLeft size={18}/> Back</a><img className="authMechanicBrandIcon" src="/mechanicgo-mechanic.svg" alt="MechanicGo mechanic"/></div>
      <section className="authCard"><div className="authLogo authMascotLogo"><img className="authMechanicBrandIcon" src="/mechanicgo-mechanic.svg" alt="MechanicGo cartoon mechanic"/></div><div className="authBrand">Mechanic<span>Go</span></div><p className="authTag">Roadside help, on demand.</p><div className="authEyebrow">{view === "login" ? "WELCOME BACK" : view === "register" ? "CREATE YOUR ACCOUNT" : view === "forgot" ? "ACCOUNT RECOVERY" : "SECURE EMAIL SIGN-IN"}</div><p className="authIntro">{view === "login" ? "Sign in to continue your journey." : view === "register" ? "Join MechanicGo for reliable roadside assistance." : view === "forgot" ? "We’ll help you safely recover your account." : "A one-time code keeps your account protected."}</p>
        {view!=="forgot"&&<div className="authTabs"><button className={view==="login"||view==="otp-login"?"selected":""} onClick={()=>changeView("login")}>Login</button><button className={view==="register"?"selected":""} onClick={()=>changeView("register")}>Register</button></div>}
        {view==="register"&&<>
          <label><span>Full name</span><div className="input"><UserRound size={18}/><input value={name} onChange={e=>setName(e.target.value)} autoComplete="name" maxLength={80} placeholder="Your full name"/></div></label>
          <label><span>Mobile number</span><div className="input indiaPhoneInput"><Phone size={18}/><span className="indiaDialCode">+91</span><input value={phone} onChange={e=>setPhone(e.target.value.replace(/\D/g,"").slice(0,10))} type="tel" inputMode="numeric" autoComplete="tel-national" maxLength={10} placeholder="10-digit mobile number" aria-label="10-digit Indian mobile number"/></div><small className="fieldHint">India (+91) · Enter 10 digits</small></label>
        </>}
        {(view==="register"||view==="otp-login"||view==="forgot")&&<label><span>Email address</span><div className="input"><Mail size={18}/><input type="email" value={email} onChange={e=>setEmail(e.target.value)} placeholder="you@example.com" autoComplete="email" inputMode="email"/></div></label>}
        {view==="login"&&<>
          <label><span>Username or Gmail</span><div className="input"><UserRound size={18}/><input value={username} onChange={e=>setUsername(e.target.value)} autoCapitalize="none" autoComplete="username" maxLength={254} placeholder="Username or email address"/></div></label>
          <label><span>Password</span><div className="input authPasswordInput"><LockKeyhole size={18}/><input type={showPassword ? "text" : "password"} value={password} onChange={e=>setPassword(e.target.value)} autoComplete="current-password" maxLength={128} placeholder="Your password"/><button type="button" className="passwordVisibilityToggle" style={{display:"flex",visibility:"visible",opacity:1,flex:"0 0 42px",width:42,minWidth:42,height:42,alignItems:"center",justifyContent:"center",padding:0,margin:0,border:0,background:"transparent",color:"#52647a",cursor:"pointer",position:"relative",zIndex:5}} onClick={()=>setShowPassword(v=>!v)} aria-label={showPassword ? "Hide password" : "Show password"} aria-pressed={showPassword} title={showPassword ? "Hide password" : "Show password"}>{showPassword ? <svg aria-hidden="true" viewBox="0 0 24 24" style={{display:"block",width:22,height:22,stroke:"#52647a",fill:"none",strokeWidth:2,strokeLinecap:"round",strokeLinejoin:"round"}}><path d="M3 3l18 18"/><path d="M10.6 10.6a2 2 0 002.8 2.8"/><path d="M9.9 5.2A10.8 10.8 0 0112 5c6.4 0 10 7 10 7a16 16 0 01-3.1 3.7"/><path d="M6.2 6.2C3.5 8 2 12 2 12s3.6 7 10 7a10.7 10.7 0 004-.8"/></svg> : <svg aria-hidden="true" viewBox="0 0 24 24" style={{display:"block",width:22,height:22,stroke:"#52647a",fill:"none",strokeWidth:2,strokeLinecap:"round",strokeLinejoin:"round"}}><path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7S2 12 2 12Z"/><circle cx="12" cy="12" r="3"/></svg>}</button></div></label>
        </>}
        {error&&<p className="authError" role="alert">{error}</p>}{notice&&!error&&<p className="authNotice" role="status">{notice}</p>}
        {view==="login"&&<><button className="authPrimary" disabled={busy} onClick={()=>void loginWithPassword()}>{busy?"Signing in…":"Login with username or Gmail"} <ArrowRight size={18}/></button><button type="button" className="resend" onClick={()=>changeView("forgot")}>Forgot password?</button><div className="authOtpButtonWrap" style={{display:"block",width:"100%",maxWidth:"100%",margin:"10px 0 0",padding:0,position:"relative",left:0,boxSizing:"border-box"}}><button type="button" className="secondaryWide" style={{display:"flex",width:"100%",maxWidth:"100%",minWidth:0,boxSizing:"border-box",position:"static",left:0,right:0,transform:"none",margin:0,justifyContent:"center",alignItems:"center",textAlign:"center"}} onClick={()=>changeView("otp-login")}>Login with email OTP</button></div></>}
        {view==="register"&&<><button className="authPrimary" disabled={busy} onClick={()=>void sendOtp("register")}>{busy?"Sending email…":"Continue registration with OTP"} <ArrowRight size={18}/></button><div className="secureNote"><ShieldCheck size={15}/> Next step: username, password and profile details</div></>}
        {view==="otp-login"&&<><button className="authPrimary" disabled={busy} onClick={()=>void sendOtp("login")}>{busy?"Sending email…":"Send login OTP"} <ArrowRight size={18}/></button><button type="button" className="resend" onClick={()=>changeView("login")}>Use username and password instead</button></>}
        {view==="forgot"&&<><p className="authTag">We'll verify your registered email before allowing a password reset.</p><button className="authPrimary" disabled={busy} onClick={()=>void sendOtp("password_reset")}>{busy?"Sending code…":"Send reset code"} <ArrowRight size={18}/></button><button type="button" className="resend" onClick={()=>changeView("login")}>Back to login</button></>}
        <p className="authTerms">By continuing, you agree to our Terms & Privacy Policy.</p><div className="authTrust"><span><CheckCircle2 size={15}/> Verified email</span><span><CheckCircle2 size={15}/> Secure account</span><span><CheckCircle2 size={15}/> Password recovery</span></div>
      </section>
    </main>
  );
}
