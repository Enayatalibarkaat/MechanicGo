"use client";
import {useEffect} from "react";
export default function Entry(){
  useEffect(()=>{
    let active=true;
    fetch("/api/auth/status",{cache:"no-store"})
      .then(async response=>{
        const data=await response.json();
        if(!active)return;
        if(!response.ok||!data.authenticated){
          location.replace("/auth");
          return;
        }
        const role=data.user?.role;
        location.replace(role==="MECHANIC"?"/mechanic/dashboard":"/home");
      })
      .catch(()=>{
        if(active) location.replace("/auth");
      });
    return ()=>{active=false;};
  },[]);
  return <main className="entryScreen"><img src="/mechanicgo-mark.svg" alt="MechanicGo"/><h1>Mechanic<span>Go</span></h1><p>Checking your secure session…</p></main>;
}
