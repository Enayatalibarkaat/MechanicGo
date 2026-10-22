"use client";
import {useCallback,useEffect,useMemo,useState} from "react";
import {CalendarClock,ChevronRight,MapPin,RefreshCw,Wrench,Clock3,CheckCircle2,XCircle,Navigation,Phone, X,LifeBuoy,ArrowLeft} from "lucide-react";
import {Bottom} from "../components";

type Booking={
 _id:string;vehicleType:string;issueDescription:string;status:string;createdAt:string;updatedAt?:string;
 location?:{address?:string;lat?:number;lng?:number};
 mechanicId?:{name?:string;phone?:string}|string|null;
};
type View="active"|"history";
const labels:Record<string,string>={SEARCHING:"Finding a mechanic",ACCEPTED:"Mechanic assigned",IN_PROGRESS:"Service in progress",COMPLETED:"Completed",CANCELLED:"Cancelled"};

export default function Bookings(){
 const[items,setItems]=useState<Booking[]>([]);
 const[loading,setLoading]=useState(true);
 const[error,setError]=useState("");
 const[notice,setNotice]=useState("");
 const[view,setView]=useState<View>("active");
 const[busyId,setBusyId]=useState("");
 const[trackingId,setTrackingId]=useState("");
 const load=useCallback(async()=>{
   setError("");
   try{
     const r=await fetch("/api/bookings",{cache:"no-store"});
     const d=await r.json();
     if(!r.ok)throw new Error(d.error||"Could not load bookings.");
     setItems(d.bookings||[]);
   }catch(e){setError(e instanceof Error?e.message:"Network error. Please try again.");}
   finally{setLoading(false);}
 },[]);
 useEffect(()=>{void load();const timer=window.setInterval(()=>void load(),8000);return()=>window.clearInterval(timer);},[load]);
 const active=useMemo(()=>items.filter(b=>!["COMPLETED","CANCELLED"].includes(b.status)),[items]);
 const past=useMemo(()=>items.filter(b=>["COMPLETED","CANCELLED"].includes(b.status)),[items]);
 const tracked=items.find(b=>b._id===trackingId);
 const cancel=async(b:Booking)=>{
   if(!window.confirm("Cancel this mechanic booking? It will move to Booking History."))return;
   setBusyId(b._id);setError("");setNotice("");
   try{
     const r=await fetch("/api/bookings/"+encodeURIComponent(b._id)+"/status",{method:"PATCH",headers:{"Content-Type":"application/json"},body:JSON.stringify({status:"CANCELLED"})});
     const d=await r.json();
     if(!r.ok)throw new Error(d.error||"Could not cancel this booking.");
     setItems(current=>current.map(item=>item._id===b._id?{...item,...d.booking}:item));
     setView("history");
     setNotice("Booking cancelled. You can find it in your booking history.");
     await load();
   }catch(e){setError(e instanceof Error?e.message:"Could not cancel booking. Please try again.");}
   finally{setBusyId("");}
 };
 const card=(b:Booking,history=false)=><article className="activeBooking premiumBooking" key={b._id}>
   <div className="bookingTop"><div className="miniAvatar"><Wrench size={20}/></div><div className="bookingHeading"><b>{b.vehicleType} repair</b><span>{labels[b.status]||b.status.replaceAll("_"," ")}</span></div><span className={"bookingStatePill "+(b.status==="COMPLETED"?"isComplete":b.status==="CANCELLED"?"isCancelled":"isActive")}>{b.status==="COMPLETED"?"Completed":b.status==="CANCELLED"?"Cancelled":"Active"}</span></div>
   <p className="bookingIssue">{b.issueDescription}</p>
   {b.location?.address&&<div className="bookingLocation"><MapPin size={15}/>{b.location.address}</div>}
   <div className="bookingStatus"><span><CalendarClock size={14}/>{new Date(b.createdAt).toLocaleString()}</span><span className={"liveStatus "+(b.status==="CANCELLED"?"statusCancelled":b.status==="COMPLETED"?"statusComplete":"")}><i/> {labels[b.status]||b.status}</span></div>
   {typeof b.mechanicId==="object"&&b.mechanicId?.name&&<div className="bookingLocation assignedMechanic"><Wrench size={15}/><span>Mechanic: <b>{b.mechanicId.name}</b>{b.mechanicId.phone?" · "+b.mechanicId.phone:""}</span></div>}
   <small className="bookingId">Booking ID: {b._id}</small>
   {!history&&<div className="bookingActions">
     <a className="trackBookingBtn" href={"/tracking?bookingId="+encodeURIComponent(b._id)}><Navigation size={17}/>{b.status==="SEARCHING"?"Track request":"Track mechanic"}</a>
     {(b.status==="SEARCHING"||b.status==="ACCEPTED")&&<button className="cancelBookingBtn" disabled={busyId===b._id} onClick={()=>void cancel(b)}><XCircle size={17}/>{busyId===b._id?"Cancelling…":"Cancel booking"}</button>}
   </div>}
 </article>;
 return <main className="appPage">
  <header className="pageHeader"><a href="/home" className="pageBackBtn" aria-label="Back to home"><ArrowLeft size={22}/></a><h1>My Bookings</h1><div className="bookingHeaderActions"><button className={"historyTopBtn "+(view==="history"?"selected":"")} onClick={()=>{setView(view==="history"?"active":"history");setNotice("");}}><Clock3 size={16}/> History <span>{past.length}</span></button><a href="/customer/book">+ New</a></div></header>
  <div className="bookingViewTabs" role="tablist" aria-label="Bookings view">
    <button role="tab" aria-selected={view==="active"} className={view==="active"?"selected":""} onClick={()=>{setView("active");setNotice("");}}>Active <span>{active.length}</span></button>
    <button role="tab" aria-selected={view==="history"} className={view==="history"?"selected":""} onClick={()=>{setView("history");setNotice("");}}>History <span>{past.length}</span></button>
  </div>
  <section className="bookingSection">
   <div className="rowTitle"><div className="sectionLabel">{view==="active"?"ACTIVE BOOKINGS":"BOOKING HISTORY"}</div><button className="iconBtn" onClick={()=>void load()} aria-label="Refresh bookings"><RefreshCw size={16}/></button></div>
   {notice&&<div className="bookingNotice" role="status"><CheckCircle2 size={18}/>{notice}</div>}
   {error&&<div className="bookingError" role="alert"><p>{error}</p><button onClick={()=>void load()}>Try again</button></div>}
   {loading?<div className="bookingLoading"><span className="bookingSpinner"/>Loading your bookings…</div>:
    view==="active"?(active.length?<div className="bookingList">{active.map(b=>card(b,false))}</div>:<div className="bookingEmpty"><div className="emptyBookingIcon"><Wrench size={25}/></div><h2>No active bookings</h2><p>Your upcoming mechanic requests will appear here. Create a booking to get started.</p><a className="primaryWide" href="/customer/book">Book a mechanic <ChevronRight size={16}/></a></div>):
    (past.length?<div className="bookingList">{past.map(b=>card(b,true))}</div>:<div className="bookingEmpty"><div className="emptyBookingIcon"><Clock3 size={25}/></div><h2>No booking history yet</h2><p>Completed and cancelled bookings will be saved here automatically.</p><button className="trackBookingBtn" onClick={()=>setView("active")}>View active bookings</button></div>)}
  </section>
  {tracked&&<div className="trackingOverlay" role="dialog" aria-modal="true" aria-labelledby="trackingTitle" onClick={e=>{if(e.target===e.currentTarget)setTrackingId("");}}>
    <section className="trackingDialog">
      <button className="trackingClose" onClick={()=>setTrackingId("")} aria-label="Close tracking"><X size={20}/></button>
      <div className="trackingIcon"><Navigation size={24}/></div>
      <p className="trackingEyebrow">BOOKING TRACKER</p><h2 id="trackingTitle">{tracked.status==="SEARCHING"?"Finding your mechanic":tracked.status==="ACCEPTED"?"Your mechanic is assigned":tracked.status==="IN_PROGRESS"?"Service is in progress":labels[tracked.status]||"Booking status"}</h2>
      <p className="trackingDescription">Your booking status refreshes automatically. Live Google Maps tracking will be added in a future update.</p>
      <div className="trackingTimeline">
       {([{key:"SEARCHING",title:"Request received",desc:"Your booking is in the dispatch system."},{key:"ACCEPTED",title:"Mechanic assigned",desc:"A mechanic has accepted your request."},{key:"IN_PROGRESS",title:"Repair in progress",desc:"The mechanic has started the service."},{key:"COMPLETED",title:"Service completed",desc:"Your booking is complete."}] as const).map((step,i)=>{
         const order=["SEARCHING","ACCEPTED","IN_PROGRESS","COMPLETED"];
         const current=order.indexOf(tracked.status);
         const done=tracked.status==="CANCELLED"?false:i<=current;
         return <div className={"trackingTimelineStep "+(done?"done":"")} key={step.key}><span>{tracked.status==="CANCELLED"&&i===0?<XCircle size={16}/>:done?<CheckCircle2 size={16}/>:i+1}</span><div><b>{step.title}</b><small>{step.key==="SEARCHING"?step.desc:step.key=== "ACCEPTED"&&typeof tracked.mechanicId==="object"&&tracked.mechanicId?.name?"Assigned to "+tracked.mechanicId.name:step.desc}</small></div></div>;
       })}
       {tracked.status==="CANCELLED"&&<div className="trackingCancelled"><XCircle size={17}/> This booking was cancelled.</div>}
      </div>
      {typeof tracked.mechanicId==="object"&&tracked.mechanicId?.name&&<div className="trackingMechanic"><div className="miniAvatar"><Wrench size={20}/></div><div><b>{tracked.mechanicId.name}</b><span>Assigned mechanic</span></div>{tracked.mechanicId.phone&&<a href={"tel:"+tracked.mechanicId.phone} aria-label="Call mechanic"><Phone size={18}/></a>}</div>}
      {tracked.location?.address&&<div className="trackingAddress"><MapPin size={17}/><span>{tracked.location.address}</span></div>}
      <div className="trackingFooter"><span><RefreshCw size={14}/> Updates every 8 seconds</span><button onClick={()=>void load()}>Refresh now</button></div>
    </section>
  </div>}
  <Bottom active="bookings"/>
 </main>;
}
