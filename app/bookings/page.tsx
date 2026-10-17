"use client";
import {useCallback,useEffect,useState} from "react";
import {CalendarClock,ChevronRight,MapPin,RefreshCw,Wrench} from "lucide-react";
import {Bottom} from "../components";

type Booking={
 _id:string;vehicleType:string;issueDescription:string;status:string;createdAt:string;
 location?:{address?:string};mechanicId?:{name?:string;phone?:string}|string|null;
};
const labels:Record<string,string>={SEARCHING:"Finding a mechanic",ACCEPTED:"Mechanic assigned",IN_PROGRESS:"Service in progress",COMPLETED:"Completed",CANCELLED:"Cancelled"};

export default function Bookings(){
 const[items,setItems]=useState<Booking[]>([]);const[loading,setLoading]=useState(true);const[error,setError]=useState("");
 const load=useCallback(async()=>{setError("");try{const r=await fetch("/api/bookings",{cache:"no-store"});const d=await r.json();if(!r.ok)throw new Error(d.error||"Could not load bookings.");setItems(d.bookings||[]);}catch(e){setError(e instanceof Error?e.message:"Network error. Please try again.");}finally{setLoading(false);}},[]);
 useEffect(()=>{void load();const timer=window.setInterval(()=>void load(),20000);return()=>window.clearInterval(timer);},[load]);
 const active=items.filter(b=>!["COMPLETED","CANCELLED"].includes(b.status));const past=items.filter(b=>["COMPLETED","CANCELLED"].includes(b.status));
 const card=(b:Booking)=><article className="activeBooking" key={b._id}>
  <div className="bookingTop"><div className="miniAvatar"><Wrench size={20}/></div><div><b>{b.vehicleType} repair</b><span>{labels[b.status]||b.status.replaceAll("_"," ")}</span></div></div>
  <p>{b.issueDescription}</p>
  {b.location?.address&&<div className="bookingLocation"><MapPin size={15}/>{b.location.address}</div>}
  <div className="bookingStatus"><span><CalendarClock size={14}/>{new Date(b.createdAt).toLocaleString()}</span><span className="liveStatus"><i/> {labels[b.status]||b.status}</span></div>
  {typeof b.mechanicId==="object"&&b.mechanicId?.name&&<div className="bookingLocation"><Wrench size={15}/>Assigned mechanic: {b.mechanicId.name}{b.mechanicId.phone?" · "+b.mechanicId.phone:""}</div>}
  <small>Booking ID: {b._id}</small>
 </article>;
 return <main className="appPage">
  <header className="pageHeader"><h1>My Bookings</h1><a href="/customer/book">+ New</a></header>
  <section className="bookingSection"><div className="rowTitle"><div className="sectionLabel">ACTIVE BOOKINGS</div><button className="iconBtn" onClick={()=>void load()} aria-label="Refresh bookings"><RefreshCw size={16}/></button></div>
   {loading?<p>Loading your bookings…</p>:error?<div className="formCard" style={{padding:18}}><p className="setupError">{error}</p><button className="secondaryWide" onClick={()=>void load()}>Try again</button></div>:active.length?active.map(card):<div className="formCard" style={{padding:20}}><h2>No active bookings</h2><p>Your upcoming mechanic requests will appear here. Create a booking to get started.</p><a className="primaryWide" href="/customer/book">Book a mechanic <ChevronRight size={16}/></a></div>}
  </section>
  <section className="bookingSection"><div className="sectionLabel">BOOKING HISTORY</div>
   {loading?null:past.length?past.map(card):<p>No completed or cancelled bookings yet.</p>}
  </section>
  <Bottom active="bookings"/>
 </main>;
}
