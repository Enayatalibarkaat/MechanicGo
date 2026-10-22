"use client";

import {useCallback,useEffect,useState} from "react";
import {BellRing,CalendarClock,CheckCircle2,ChevronRight,Ticket,AlertCircle,RefreshCw} from "lucide-react";
import {Bottom,BackLink} from "../components";

type Booking={_id:string;status:string;issueDescription?:string;vehicleType?:string;serviceType?:string;createdAt?:string;updatedAt?:string;location?:{address?:string}};
type Coupon={code:string;amount:number;status:string;claimedAt?:string|null;expiresAt?:string|null};
const statusText:Record<string,string>={SEARCHING:"Finding a mechanic",ACCEPTED:"Mechanic accepted your booking",IN_PROGRESS:"Your service is in progress",COMPLETED:"Service completed",CANCELLED:"Booking cancelled"};
const dateLabel=(value?:string|null)=>{if(!value)return "Recently";const date=new Date(value);return Number.isNaN(date.getTime())?"Recently":date.toLocaleString("en-IN",{day:"numeric",month:"short",hour:"numeric",minute:"2-digit"});};

export default function NotificationsPage(){
 const[bookings,setBookings]=useState<Booking[]>([]);
 const[coupons,setCoupons]=useState<Coupon[]>([]);
 const[loading,setLoading]=useState(true);
 const[error,setError]=useState("");
 const[updatedAt,setUpdatedAt]=useState("");
 const load=useCallback(async()=>{
  setError("");
  try{
   const [br,cr]=await Promise.all([fetch("/api/bookings",{cache:"no-store"}),fetch("/api/coupons",{cache:"no-store"})]);
   const bd=await br.json();const cd=await cr.json();
   if(!br.ok)throw new Error(bd.error||"Could not load booking notifications.");
   setBookings(Array.isArray(bd.bookings)?bd.bookings:[]);
   if(cr.ok)setCoupons(Array.isArray(cd.coupons)?cd.coupons:[]);
   setUpdatedAt(new Date().toLocaleTimeString("en-IN",{hour:"numeric",minute:"2-digit"}));
  }catch(e){setError(e instanceof Error?e.message:"Network error. Please try again.");}
  finally{setLoading(false);}
 },[]);
 useEffect(()=>{void load();const timer=window.setInterval(()=>void load(),30000);try{localStorage.setItem("mg_home_notice_reads",JSON.stringify(["welcome-offer",...bookings.map(b=>"booking-"+b._id+"-"+b.status)]));}catch{}return()=>window.clearInterval(timer);},[load,bookings.map(b=>b._id+":"+b.status).join("|")]);
 const recent=[...bookings].sort((a,b)=>new Date(b.updatedAt||b.createdAt||0).getTime()-new Date(a.updatedAt||a.createdAt||0).getTime()).slice(0,12);
 return <main className="appPage mgNotificationsPage">
  <header className="pageHeader mgNotificationsHeader"><BackLink href="/home" label="Back to home"/><div><h1>Notifications</h1><p>Booking updates and your offers</p></div><button className="mgNotificationRefresh" onClick={()=>void load()} aria-label="Refresh notifications"><RefreshCw size={18}/></button></header>
  <section className="mgNotificationsIntro"><span className="mgNotificationsBell"><BellRing size={23}/></span><div><b>You’re up to date</b><p>We’ll show your booking progress and coupon activity here.</p></div></section>
  {error&&<div className="mgNotificationError" role="alert"><AlertCircle size={17}/><span>{error}</span><button onClick={()=>void load()}>Retry</button></div>}
  <section className="mgNotificationsSection"><div className="mgNotificationsSectionTitle"><h2>Booking activity</h2><a href="/bookings">View bookings <ChevronRight size={15}/></a></div>
   {loading?<div className="mgNotificationEmpty"><RefreshCw size={19}/> Loading your latest updates…</div>:recent.length===0?<div className="mgNotificationEmpty"><CalendarClock size={23}/><b>No booking updates yet</b><span>Your mechanic booking status will appear here.</span><a href="/customer/book">Book a mechanic <ChevronRight size={15}/></a></div>:recent.map(b=><article className="mgNotificationRecord" key={b._id}><span className={"mgNotificationRecordIcon "+(b.status==="COMPLETED"?"success":b.status==="CANCELLED"?"muted":"")}><CalendarClock size={19}/></span><div className="mgNotificationRecordCopy"><b>{statusText[b.status]||String(b.status||"Booking update").replaceAll("_"," ")}</b><p>{b.issueDescription||((b.serviceType||b.vehicleType||"Vehicle")+" service")} · {(b.serviceType||b.vehicleType||"Vehicle").replaceAll("_"," ")}</p><small>{dateLabel(b.updatedAt||b.createdAt)}</small></div><a href="/bookings" aria-label="Open bookings"><ChevronRight size={18}/></a></article>)}
  </section>
  <section className="mgNotificationsSection"><div className="mgNotificationsSectionTitle"><h2>Coupon activity</h2><a href="/coupons">Coupons & offers <ChevronRight size={15}/></a></div>
   {coupons.length===0?<div className="mgNotificationEmpty compact"><Ticket size={21}/><span>Claim a coupon to see its value and status here.</span><a href="/coupons">Explore offers <ChevronRight size={15}/></a></div>:coupons.slice(0,10).map(c=><article className="mgNotificationRecord" key={c.code}><span className="mgNotificationRecordIcon offer"><Ticket size={19}/></span><div className="mgNotificationRecordCopy"><b>{c.status==="USED"?"Coupon redeemed":c.status==="CLAIMED"?"Coupon claimed":"Coupon unavailable"}</b><p>{c.code} · ₹{Number(c.amount||0)} off</p><small>{c.claimedAt?dateLabel(c.claimedAt):c.expiresAt?"Expires "+dateLabel(c.expiresAt):"Coupon status update"}</small></div><a href="/coupons" aria-label="Open coupons"><ChevronRight size={18}/></a></article>)}
  </section>
  <p className="mgNotificationsFootnote"><CheckCircle2 size={14}/> Last refreshed {updatedAt||"—"} · This page refreshes automatically.</p>
  <Bottom active=""/>
 </main>;
}
