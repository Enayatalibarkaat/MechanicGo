"use client";
import {useEffect,useState} from "react";
import {ArrowLeft,MapPin,Wrench,CalendarClock,RefreshCw,ShieldCheck} from "lucide-react";
type Booking={_id:string;vehicleType:string;issueDescription:string;status:string;createdAt:string;location?:{address?:string};mechanicId?:{name?:string;phone?:string}|string|null};
const statusText:Record<string,string>={SEARCHING:"Looking for an available mechanic",ACCEPTED:"A mechanic has accepted the request",IN_PROGRESS:"Your service is in progress",COMPLETED:"Service marked completed",CANCELLED:"This booking was cancelled"};
export default function Tracking(){
 const[booking,setBooking]=useState<Booking|null>(null);const[loading,setLoading]=useState(true);const[error,setError]=useState("");
 const load=async()=>{setError("");try{const r=await fetch("/api/bookings",{cache:"no-store"});const d=await r.json();if(!r.ok)throw new Error(d.error||"Could not load booking status.");const list:Booking[]=d.bookings||[];setBooking(list.find(x=>!["COMPLETED","CANCELLED"].includes(x.status))||list[0]||null);}catch(e){setError(e instanceof Error?e.message:"Could not load booking status.");}finally{setLoading(false);}};
 useEffect(()=>{void load();const timer=window.setInterval(()=>void load(),20000);return()=>window.clearInterval(timer);},[]);
 return <main className="appPage"><header className="pageHeader"><a href="/bookings" aria-label="Back"><ArrowLeft/></a><h1>Booking Status</h1><button className="iconBtn" onClick={()=>void load()} aria-label="Refresh"><RefreshCw size={17}/></button></header>
 <section className="formCard" style={{padding:22}}>
  {loading?<p>Loading booking status…</p>:error?<><p className="setupError">{error}</p><button className="secondaryWide" onClick={()=>void load()}>Try again</button></>:!booking?<><h2>No booking to track</h2><p>Create a repair request first. Its status will show here after submission.</p><a className="primaryWide" href="/customer/book">Book a mechanic</a></>:<>
   <div className="setupIcon"><Wrench size={26}/></div><div className="setupEyebrow">BOOKING STATUS</div><h2>{booking.vehicleType} repair</h2><p>{statusText[booking.status]||booking.status.replaceAll("_"," ")}</p><p><b>Issue:</b> {booking.issueDescription}</p>{booking.location?.address&&<p><MapPin size={15}/> {booking.location.address}</p>}<p><CalendarClock size={15}/> {new Date(booking.createdAt).toLocaleString()}</p><small>Booking ID: {booking._id}</small>
   {typeof booking.mechanicId==="object"&&booking.mechanicId?.name&&<div style={{marginTop:18}}><ShieldCheck size={18}/><b>Assigned mechanic: {booking.mechanicId.name}</b>{booking.mechanicId.phone&&<p>Contact: {booking.mechanicId.phone}</p>}</div>}
   <div style={{marginTop:22}}><b>Live GPS tracking is not enabled yet.</b><p>You can refresh this page to see confirmed booking-status changes.</p></div>
  </>}
 </section><a className="secondaryWide" href="/bookings">My Bookings</a></main>;
}
