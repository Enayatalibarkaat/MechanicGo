"use client";
import {useEffect} from "react";
export default function Entry(){
  useEffect(()=>{const auth=localStorage.getItem("mechanicgo_auth")==="1";const profile=localStorage.getItem("mechanicgo_profile_complete")==="1";location.replace(auth?(profile?"/home":"/profile-setup"):"/auth")},[]);
  return <main className="entryScreen"><img src="/mechanicgo-mark.svg" alt="MechanicGo"/><h1>Mechanic<span>Go</span></h1><p>Fast. Reliable. Anytime.</p></main>;
}