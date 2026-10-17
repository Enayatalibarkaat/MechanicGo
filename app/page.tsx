"use client";
import {useEffect} from "react";
export default function Entry(){
  useEffect(()=>{
    const auth=localStorage.getItem("mechanicgo_auth")==="1";
    const profile=localStorage.getItem("mechanicgo_profile_complete")==="1";
    let role="CUSTOMER";
    try{role=JSON.parse(localStorage.getItem("mechanicgo_profile")||"{}").role||"CUSTOMER"}catch{}
    if(!auth){location.replace("/auth");return;}
    if(!profile){location.replace("/profile-setup");return;}
    location.replace(role==="MECHANIC"?"/mechanic/dashboard":role==="ADMIN"?"/admin":"/home");
  },[]);
  return <main className="entryScreen"><img src="/mechanicgo-mark.svg" alt="MechanicGo"/><h1>Mechanic<span>Go</span></h1><p>Fast. Reliable. Anytime.</p></main>;
}