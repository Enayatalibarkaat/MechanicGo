"use client";
import {useEffect,useState} from "react";
import {ArrowLeft,MapPin,Wrench,RefreshCw,ChevronRight,ShieldCheck} from "lucide-react";
import {Bottom} from "../components";
type Mechanic={id:string;name:string;vehicleTypes:string[]};
export default function Mechanics(){
 const[mechanics,setMechanics]=useState<Mechanic[]>([]);const[loading,setLoading]=useState(true);const[error,setError]=useState("");
 const load=async()=>{setLoading(true);setError("");try{const r=await fetch("/api/mechanics",{cache:"no-store"});const d=await r.json();if(!r.ok)throw new Error(d.error||"Could not load available mechanics.");setMechanics(d.mechanics||[]);}catch(e){setError(e instanceof Error?e.message:"Could not load available mechanics.");}finally{setLoading(false);}};
 useEffect(()=>{void load();},[]);
 return <main className="appPage">
  <header className="pageHeader"><a href="/services" aria-label="Back to services"><ArrowLeft/></a><h1>Available Mechanics</h1><button className="iconBtn" aria-label="Refresh" onClick={()=>void load()}><RefreshCw size={17}/></button></header>
  <section className="serviceIntro"><span className="eyebrow">APPROVED PARTNERS</span><h2>Mechanics currently on duty</h2><p>Only verified partners who are active and online appear here. Requests are offered to eligible mechanics, who can accept them.</p></section>
  <section className="mechanicList">
   {loading?<p>Loading available mechanics…</p>:error?<div className="formCard" style={{padding:18}}><p className="setupError">{error}</p><button className="secondaryWide" onClick={()=>void load()}>Try again</button></div>:mechanics.length===0?<div className="formCard" style={{padding:22}}><div className="setupIcon"><MapPin/></div><h2>No mechanics are online right now</h2><p>Your booking request can still be created. We will notify the configured dispatch channel, and an approved mechanic can accept it when available.</p><a className="primaryWide" href="/customer/book">Request roadside help <ChevronRight size={17}/></a></div>:mechanics.map(m=><article className="mechanicLarge" key={m.id}><div className="largeAvatar"><Wrench/></div><div className="largeInfo"><div className="largeTitle"><b>{m.name}</b><ShieldCheck size={15}/></div><span>Approved · On duty</span><div className="largeMeta">{m.vehicleTypes.map(v=><span key={v}>{v==="BOTH"?"Car & Bike":v==="BIKE"?"Bike":"Car"}</span>)}</div><div className="largeEta">Accepts suitable repair requests</div></div><a href="/customer/book" aria-label={"Request help for "+m.name}><ChevronRight/></a></article>)}
  </section>
  <Bottom active="services"/>
 </main>;
}
