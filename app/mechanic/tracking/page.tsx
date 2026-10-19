"use client";
import { useEffect, useState } from "react";
import { ArrowLeft, MapPin, ShieldCheck, Wrench } from "lucide-react";
import LiveTrackingMap from "../../tracking/LiveTrackingMap";

export default function MechanicTracking(){
 const [bookingId,setBookingId]=useState("");
 const [booking,setBooking]=useState<any>(null);
 const [loading,setLoading]=useState(true);
 const [error,setError]=useState("");
 useEffect(()=>{
  const id=new URLSearchParams(window.location.search).get("bookingId")||"";
  setBookingId(id);
  if(!id){setError("Open tracking from an accepted booking in your mechanic dashboard.");setLoading(false);return;}
  let alive=true;
  const load=async()=>{
   try{
    const auth=await fetch("/api/auth/status",{cache:"no-store"});const ad=await auth.json();
    if(!auth.ok||!ad.authenticated)throw new Error(ad.error||"Please sign in again.");
    if(ad.user.role!=="MECHANIC")throw new Error("Sign in with your mechanic account to share GPS.");
    const response=await fetch("/api/bookings",{cache:"no-store"});const data=await response.json();
    if(!response.ok)throw new Error(data.error||"Could not load booking.");
    const found=(data.bookings||[]).find((b:any)=>b._id===id);
    if(!found)throw new Error("This booking is not assigned to your account.");
    if(alive)setBooking(found);
   }catch(e){if(alive)setError(e instanceof Error?e.message:"Could not load booking.");}
   finally{if(alive)setLoading(false);}
  };
  void load();const timer=window.setInterval(()=>void load(),8000);
  return()=>{alive=false;window.clearInterval(timer);};
 },[]);
 return <main className="appPage">
  <header className="pageHeader"><a href="/mechanic/dashboard" aria-label="Back to mechanic dashboard"><ArrowLeft/></a><h1>Share Live Location</h1></header>
  {loading?<section className="formCard" style={{padding:24}}><div className="bookingLoading"><span className="bookingSpinner"/>Loading assigned booking…</div></section>:error?<section className="formCard" style={{padding:24}}><p className="setupError">{error}</p><a className="secondaryWide" href="/mechanic/dashboard">Back to dashboard</a></section>:booking?<>
   <section className="formCard mg-booking-summary" style={{padding:20}}>
    <div className="mg-summary-title"><div className="setupIcon"><Wrench size={23}/></div><div><span className="setupEyebrow">ASSIGNED BOOKING</span><h2>{booking.vehicleType} repair</h2></div></div>
    <p><b>Issue:</b> {booking.issueDescription}</p>
    {booking.location?.address&&<p className="bookingLocation"><MapPin size={15}/>{booking.location.address}</p>}
    <p className="mg-privacy-note"><ShieldCheck size={16}/> Your location is shared only with the customer for this accepted booking.</p>
   </section>
   {booking.status==="ACCEPTED"?<LiveTrackingMap bookingId={bookingId} role="MECHANIC"/>:<section className="mg-waiting-card"><h2>Live sharing is paused</h2><p>This booking is no longer in the “mechanic on the way” stage. GPS updates are disabled automatically.</p></section>}
  </>:null}
 </main>;
}
