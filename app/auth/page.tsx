"use client";

import {useState} from "react";
import {ArrowLeft,ArrowRight,CheckCircle2,LockKeyhole,Phone,UserRound} from "lucide-react";

export default function Auth(){
  const[register,setRegister]=useState(false);
  return <main className="authPage">
    <div className="authTop"><a href="/" className="backLink"><ArrowLeft size={18}/> Back</a><img src="/mechanicgo-mark.svg" alt="MechanicGo"/></div>
    <section className="authCard">
      <div className="authLogo"><img src="/mechanicgo-mark.svg" alt="MechanicGo"/></div>
      <div className="authBrand">Mechanic<span>Go</span></div>
      <p className="authTag">Fast. Reliable. Anytime.</p>
      <div className="authTabs"><button className={!register?"selected":""} onClick={()=>setRegister(false)}>Login</button><button className={register?"selected":""} onClick={()=>setRegister(true)}>Register</button></div>
      {register&&<label><span>Name</span><div className="input"><UserRound size={18}/><input placeholder="Your full name"/></div></label>}
      <label><span>Mobile number</span><div className="input"><Phone size={18}/><input inputMode="tel" placeholder="+91 00000 00000"/></div></label>
      <button className="authPrimary">Continue with OTP <ArrowRight size={18}/></button>
      <div className="secureNote"><LockKeyhole size={15}/> Secure OTP verification</div>
      <div className="guest"><button>Explore services as a guest</button></div>
      <div className="authTrust"><span><CheckCircle2 size={15}/> Certified experts</span><span><CheckCircle2 size={15}/> Express booking</span><span><CheckCircle2 size={15}/> Premium support</span></div>
    </section>
  </main>
}
