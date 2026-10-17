"use client";
import {useEffect,useState} from "react";
import {ArrowLeft,ShieldCheck,UserRound,LockKeyhole,Phone,CheckCircle2} from "lucide-react";

export default function Settings(){
 const[profile,setProfile]=useState<any>(null);const[username,setUsername]=useState("");const[phone,setPhone]=useState("");const[currentPassword,setCurrentPassword]=useState("");const[password,setPassword]=useState("");const[confirmPassword,setConfirmPassword]=useState("");const[busy,setBusy]=useState(false);const[error,setError]=useState("");const[notice,setNotice]=useState("");
 useEffect(()=>{fetch("/api/profile/current",{cache:"no-store"}).then(async r=>{const d=await r.json();if(!r.ok||!d.user){setError(d.error||"Please sign in again.");return;}setProfile(d.user);setUsername(d.user.username||"");setPhone(d.user.phone||"");}).catch(()=>setError("Could not load account settings."));},[]);
 const save=async()=>{
  setError("");setNotice("");
  const normalizedUsername=username.trim().toLowerCase();const cleanPhone=phone.replace(/[()\\s.-]/g,"");
  if(!/^[a-z0-9][a-z0-9_.]{2,19}$/.test(normalizedUsername)){setError("Username must be 3–20 characters: letters, numbers, dots or underscores.");return;}
  if(!/^\\+?[0-9]{10,15}$/.test(cleanPhone)){setError("A valid mobile number is required (10–15 digits, country code optional).");return;}
  if(profile?.hasUsername&&!currentPassword){setError("Enter your current password before changing login credentials.");return;}
  if(password.length<8||password.length>128||!/[A-Za-z]/.test(password)||!/[0-9]/.test(password)){setError("New password must be at least 8 characters and include a letter and number.");return;}
  if(password!==confirmPassword){setError("Passwords do not match.");return;}
  setBusy(true);
  try{
   const r=await fetch("/api/profile/save",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({event:"credentials_update",email:profile.email,username:normalizedUsername,phone:cleanPhone,currentPassword,password,confirmPassword})});
   const d=await r.json();if(!r.ok)throw new Error(d.error||"Could not update login credentials.");
   setUsername(d.username);setPhone(d.phone);setCurrentPassword("");setPassword("");setConfirmPassword("");setProfile((old:any)=>({...old,username:d.username,hasUsername:true,phone:d.phone}));
   try{const old=JSON.parse(localStorage.getItem("mechanicgo_profile")||"{}");localStorage.setItem("mechanicgo_profile",JSON.stringify({...old,username:d.username,phone:d.phone}));localStorage.setItem("mechanicgo_username",d.username);}catch{}
   setNotice(d.telegramSent?"Username, password and mobile updated. Telegram audit notification delivered.":"Credentials updated securely, but Telegram audit notification failed: "+(d.telegramError||"No delivery confirmation."));
  }catch(e){setError(e instanceof Error?e.message:"Could not update credentials.");}finally{setBusy(false);}
 };
 return <main className="appPage">
  <header className="pageHeader"><a href="/profile" aria-label="Back to profile"><ArrowLeft/></a><h1>Login & Security</h1></header>
  <section className="formCard" style={{padding:24}}>
   <div className="setupIcon"><ShieldCheck size={26}/></div><h2 style={{marginBottom:6}}>Username & password</h2>
   <p style={{color:"#667085",lineHeight:1.5}}>Use a unique username and password to log in. If you created your account before this feature, set them here after signing in with email OTP.</p>
   {profile&&<p className="privacyHint" style={{textAlign:"left"}}>Registered email: {profile.email}</p>}
   <label>Unique username<div className="setupInput"><UserRound size={18}/><input value={username} onChange={e=>setUsername(e.target.value.toLowerCase())} autoComplete="username" autoCapitalize="none" maxLength={20} placeholder="e.g. enayat_ali"/></div><small>3–20 characters: letters, numbers, dots and underscores. Usernames cannot be shared.</small></label>
   <label>Mobile number (required)<div className="setupInput"><Phone size={18}/><input value={phone} onChange={e=>setPhone(e.target.value)} type="tel" autoComplete="tel" inputMode="tel" maxLength={20} placeholder="10-digit mobile number"/></div></label>
   {profile?.hasUsername&&<label>Current password<div className="setupInput"><LockKeyhole size={18}/><input value={currentPassword} onChange={e=>setCurrentPassword(e.target.value)} type="password" autoComplete="current-password" maxLength={128} placeholder="Current password"/></div></label>}
   <label>{profile?.hasUsername?"New password":"Create password"}<div className="setupInput"><LockKeyhole size={18}/><input value={password} onChange={e=>setPassword(e.target.value)} type="password" autoComplete="new-password" maxLength={128} placeholder="At least 8 characters, with letter + number"/></div></label>
   <label>Confirm password<div className="setupInput"><LockKeyhole size={18}/><input value={confirmPassword} onChange={e=>setConfirmPassword(e.target.value)} type="password" autoComplete="new-password" maxLength={128} placeholder="Enter the same password again"/></div></label>
   {error&&<p className="setupError" role="alert">{error}</p>}{notice&&<p className={notice.includes("failed")?"setupError":"authNotice"} role="status">{notice}</p>}
   <button className="primaryWide" onClick={()=>void save()} disabled={busy||!profile}>{busy?"Saving securely…":"Save login credentials"}</button>
   <a className="secondaryWide" href="/auth?forgot=1">Forgot password?</a>
   <p className="privacyHint"><ShieldCheck size={15}/> Your password is hashed before storage and is never sent to Telegram. Telegram receives only an audit notice about which account changed its credentials.</p>
  </section>
 </main>;
}
