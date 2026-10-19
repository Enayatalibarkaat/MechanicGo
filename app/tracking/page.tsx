"use client";

import { useCallback, useEffect, useState } from "react";
import { ArrowLeft, CalendarClock, MapPin, Navigation, RefreshCw, ShieldCheck, Wrench } from "lucide-react";
import { Bottom } from "../components";
import LiveTrackingMap from "./LiveTrackingMap";

type Booking = { _id:string; vehicleType:string; issueDescription:string; status:string; createdAt:string; location?:{address?:string;lat?:number;lng?:number}; mechanicId?:{name?:string;phone?:string}|string|null };
const labels:Record<string,string>={SEARCHING:"Finding a mechanic",ACCEPTED:"Mechanic assigned — on the way",IN_PROGRESS:"Service in progress",COMPLETED:"Service completed",CANCELLED:"Booking cancelled"};

export default function Tracking(){
 const [booking,setBooking]=useState<Booking|null>(null);
 const [loading,setLoading]=useState(true);
 const [error,setError]=useState("");
 const [bookingId,setBookingId]=useState("");
 const load=useCallback(async()=>{
  try{
   setError("");
   const urlId=typeof window!=="undefined"?new URLSearchParams(window.location.search).get("bookingId")||"": "";
   if(urlId)setBookingId(urlId);
   const response=await fetch("/api/bookings",{cache:"no-store"});
   const data=await response.json();
   if(!response.ok)throw new Error(data.error||"Could not load your booking.");
   const list:Booking[]=data.bookings||[];
   const selected=(urlId?list.find(item=>item._id===urlId):null)||list.find(item=>item.status==="ACCEPTED")||list.find(item=>!["COMPLETED","CANCELLED"].includes(item.status))||null;
   setBooking(selected);
   if(urlId&&!selected)throw new Error("This booking was not found in your account.");
  }catch(e){setError(e instanceof Error?e.message:"Could not load booking.");}
  finally{setLoading(false);}
 },[]);
 useEffect(()=>{void load();const timer=window.setInterval(()=>void load(),8000);return()=>window.clearInterval(timer);},[load]);
 return <main className="appPage">
  <header className="pageHeader"><a href="/bookings" aria-label="Back to bookings"><ArrowLeft/></a><h1>Live Tracking</h1><button className="iconBtn" onClick={()=>void load()} aria-label="Refresh booking"><RefreshCw size={17}/></button></header>
  {loading?<section className="formCard" style={{padding:24}}><div className="bookingLoading"><span className="bookingSpinner"/>Loading your booking…</div></section>:error?<section className="formCard" style={{padding:24}}><p className="setupError">{error}</p><button className="secondaryWide" onClick={()=>void load()}>Try again</button><a className="primaryWide" href="/bookings">My Bookings</a></section>:!booking?<section className="formCard" style={{padding:24}}><div className="setupIcon"><Navigation size={24}/></div><h2>No active booking found</h2><p>Book a mechanic first. When a mechanic accepts your request, live tracking will become available.</p><a className="primaryWide" href="/customer/book">Book a mechanic</a></section>:<>
   <section className="formCard mg-booking-summary" style={{padding:20}}>
    <div className="mg-summary-title"><div className="setupIcon"><Wrench size={23}/></div><div><span className="setupEyebrow">BOOKING STATUS</span><h2>{booking.vehicleType} repair</h2></div></div>
    <p className="mg-status-line"><i className={booking.status==="ACCEPTED"?"is-live":""}/>{labels[booking.status]||booking.status}</p>
    <p><b>Issue:</b> {booking.issueDescription}</p>
    {booking.location?.address&&<p className="bookingLocation"><MapPin size={15}/>{booking.location.address}</p>}
    <p className="bookingLocation"><CalendarClock size={15}/>{new Date(booking.createdAt).toLocaleString()}</p>
    {typeof booking.mechanicId==="object"&&booking.mechanicId?.name&&<div className="bookingLocation"><ShieldCheck size={16}/> Assigned mechanic: <b>{booking.mechanicId.name}</b>{booking.mechanicId.phone&&<a href={"tel:"+booking.mechanicId.phone}>Call</a>}</div>}
   </section>
   {booking.status==="ACCEPTED"?<LiveTrackingMap bookingId={booking._id} role="CUSTOMER"/>:<section className="mg-waiting-card"><div className="bookingLoading"><span className="bookingSpinner"/>{booking.status==="SEARCHING"?"Waiting for a mechanic to accept your request…":booking.status==="IN_PROGRESS"?"The mechanic has arrived and started service. Live GPS sharing is paused.":"Live tracking has ended for this booking."}</div><p>Your booking status refreshes automatically. Live location sharing is enabled only while the mechanic is on the way.</p></section>}
  </>}
  <a className="secondaryWide" href="/bookings">My Bookings</a><Bottom active="bookings"/>
 </main>;
}
