"use client";

import {useEffect,useMemo,useState} from "react";
import {
  Bike,CarFront,Truck,BusFront,BatteryCharging,ChevronRight,ChevronDown,
  CalendarDays,ShieldCheck,MapPin,Search,Wrench,Ticket,LifeBuoy,
  Bell,BellRing,X,ArrowRight,Zap,CheckCircle2
} from "lucide-react";
import {Bottom} from "../components";

type Booking={_id:string;status:string;issueDescription:string;vehicleType:string;createdAt?:string};
type Notice={id:string;title:string;message:string;time:string;kind:"booking"|"offer"|"info"};
function greeting(){const h=new Date().getHours();return h<12?"Good morning":h<17?"Good afternoon":"Good evening";}

export default function Home(){
 const[name,setName]=useState("there");
 const[photoUrl,setPhotoUrl]=useState("");
 const[openBookings,setOpenBookings]=useState(0);
 const[loading,setLoading]=useState(true);
 const[latestBooking,setLatestBooking]=useState<Booking|null>(null);
 const[notificationsOpen,setNotificationsOpen]=useState(false);
 const[searchOpen,setSearchOpen]=useState(false);
 const[readIds,setReadIds]=useState<string[]>([]);
 const[locationOpen,setLocationOpen]=useState(false);
 const locationLabel="Bhira, Lakhimpur Kheri";
 useEffect(()=>{
  let active=true;
  fetch("/api/profile/current",{cache:"no-store"}).then(async r=>{const d=await r.json();if(active&&r.ok&&d.user){if(d.user.name)setName(d.user.name.split(" ")[0]);setPhotoUrl(d.user.profilePhotoUrl||"");}}).catch(()=>{});
  fetch("/api/auth/status",{cache:"no-store"}).then(async r=>{const d=await r.json();if(active&&r.ok&&d.authenticated&&d.user?.role==="MECHANIC")window.location.replace("/mechanic/dashboard");}).catch(()=>{});
  const loadBookings=()=>fetch("/api/bookings",{cache:"no-store"}).then(async r=>{const d=await r.json();if(active&&r.ok){const list:Booking[]=d.bookings||[];const current=list.filter(b=>!["COMPLETED","CANCELLED"].includes(b.status));setOpenBookings(current.length);setLatestBooking(current[0]||null);}}).catch(()=>{}).finally(()=>{if(active)setLoading(false);});
  void loadBookings();const timer=window.setInterval(()=>void loadBookings(),30000);
  try{const saved=localStorage.getItem("mg_home_notice_reads");if(saved)setReadIds(JSON.parse(saved));}catch{}
  return()=>{active=false;window.clearInterval(timer);};
 },[]);
 const notices:Notice[]=useMemo(()=>{
  const items:Notice[]=[{id:"welcome-offer",title:"Your first booking offer",message:"Check Coupons & Offers for available savings on your service.",time:"Offer",kind:"offer"}];
  if(latestBooking)items.unshift({id:"booking-"+latestBooking._id+"-"+latestBooking.status,title:"Your booking update",message:(latestBooking.issueDescription||"Service request")+" · "+String(latestBooking.status||"REQUESTED").replace(/_/g," ").toLowerCase(),time:"Latest booking",kind:"booking"});
  if(openBookings>0&&!latestBooking)items.unshift({id:"booking-active",title:"You have an active booking",message:"Open Bookings to check the latest status.",time:"Now",kind:"booking"});
  return items;
 },[latestBooking,openBookings]);
 const unread=notices.filter(n=>!readIds.includes(n.id)).length;
 const markRead=()=>{const ids=notices.map(n=>n.id);setReadIds(ids);try{localStorage.setItem("mg_home_notice_reads",JSON.stringify(ids));}catch{}};
 const serviceItems=[
  {name:"Bike repair",Icon:Bike,desc:"Breakdown & puncture"},
  {name:"Car repair",Icon:CarFront,desc:"Battery, tyre & more"},
  {name:"Roadside help",Icon:Wrench,desc:"Help on the road"},
  {name:"Battery service",Icon:BatteryCharging,desc:"Jump-start & battery"},
  {name:"Truck repair",Icon:Truck,desc:"Heavy vehicle support"},
  {name:"Bus repair",Icon:BusFront,desc:"Bus service assistance"}
 ];
 return <main className="appPage homePage mgHome">
  <header className="homeHeaderBar mgHomeHeader">
   <button className="mgLocationButton" onClick={()=>setLocationOpen(v=>!v)} aria-expanded={locationOpen}><span className="mgLocationPin"><MapPin size={18} fill="currentColor"/></span><span><small>Current location</small><b>{locationLabel}</b></span><ChevronDown size={15}/></button>
   <div className="mgHeaderActions">
    <button className="mgRoundAction" aria-label="Search services" onClick={()=>setSearchOpen(v=>!v)}><Search size={21}/></button>
    <button className="mgRoundAction mgBellButton" aria-label="Notifications" aria-expanded={notificationsOpen} onClick={()=>{setNotificationsOpen(v=>!v);setSearchOpen(false);if(!notificationsOpen)markRead();}}><Bell size={21}/>{unread>0&&<i>{unread>9?"9+":unread}</i>}</button>
   </div>
  </header>
  {locationOpen&&<div className="mgLocationPanel"><MapPin size={17}/><div><b>Service location</b><span>{locationLabel}</span><small>Your exact address can be selected while booking.</small></div><button onClick={()=>{setLocationOpen(false);window.location.href="/customer/book";}}>Change <ArrowRight size={14}/></button></div>}
  {searchOpen&&<form className="mgSearchPanel" onSubmit={e=>{e.preventDefault();window.location.href="/services";}}><Search size={18}/><input aria-label="Search services" placeholder="Search bike, car, truck, bus…" autoFocus/><button type="submit">Search</button><button type="button" aria-label="Close search" onClick={()=>setSearchOpen(false)}><X size={17}/></button></form>}
  {notificationsOpen&&<aside className="mgNotificationPanel" aria-label="Notifications"><div className="mgNoticeHead"><div><b>Notifications</b><small>Updates for your account</small></div><button onClick={()=>setNotificationsOpen(false)} aria-label="Close notifications"><X size={18}/></button></div>{notices.map(n=><div className="mgNoticeItem" key={n.id}><span className={"mgNoticeIcon "+n.kind}>{n.kind==="booking"?<BellRing size={18}/>:n.kind==="offer"?<Ticket size={18}/>:<CheckCircle2 size={18}/>}</span><div><b>{n.title}</b><p>{n.message}</p><small>{n.time}</small></div></div>)}<a className="mgNoticeFooter" href={latestBooking?"/bookings":"/coupons"}>{latestBooking?"View booking updates":"Explore offers"} <ArrowRight size={15}/></a></aside>}
  <section className="mgHomeHero">
   <div className="mgHeroCopy"><span className="mgHeroEyebrow"><span/> RELIABLE VEHICLE SERVICE</span><h1>Mechanic<span>Go</span></h1><p>Reliable Vehicle Service<br/>Right at Your Doorstep</p><a href="/customer/book" className="mgHeroButton">Book a mechanic <ArrowRight size={18}/></a></div>
   <div className="mgHeroArt" aria-hidden="true"><div className="mgHeroGlow"/><span className="mgHeroVehicle mgHeroBike"><Bike size={59}/></span><span className="mgHeroVehicle mgHeroCar"><CarFront size={76}/></span><img src="/mechanicgo-mechanic.svg" alt=""/></div>
  </section>
  <section className="mgQuickFeatures" aria-label="Service benefits">
   <a href="/customer/book"><span><Zap size={21} fill="currentColor"/></span><b>Quick Booking</b></a>
   <a href="/tracking"><span><MapPin size={21} fill="currentColor"/></span><b>Live Tracking</b></a>
   <a href="/services"><span><ShieldCheck size={21} fill="currentColor"/></span><b>Verified</b></a>
   <a href="/support"><span><LifeBuoy size={21}/></span><b>24/7 Support</b></a>
  </section>
  <section className="homeContentSection mgHomeServices">
   <div className="homeSectionTitle"><div><h2>What do you need?</h2><p>Choose your vehicle or service</p></div><a href="/services">See all <ArrowRight size={15}/></a></div>
   <div className="mgVehicleGrid">{serviceItems.map(({name,Icon,desc})=><a key={name} href="/customer/book" className="mgVehicleTile"><span><Icon size={27} strokeWidth={1.8}/></span><b>{name}</b><small>{desc}</small></a>)}</div>
  </section>
  <section className="homeContentSection mgOfferSection">
   <div className="homeSectionTitle"><div><h2>Offers for you</h2><p>Save on your next service</p></div><a href="/coupons">See all <ArrowRight size={15}/></a></div>
   <div className="mgOfferBanner"><div className="mgOfferText"><span>LIMITED TIME</span><h3>Flat ₹100 OFF</h3><p>On your first booking</p><a href="/coupons">Claim Offer <ArrowRight size={15}/></a></div><div className="mgOfferArt" aria-hidden="true"><div className="mgGiftBox"><span/><i/></div><b className="mgCoin coinOne">%</b><b className="mgCoin coinTwo">₹</b><i className="mgSparkle one"/><i className="mgSparkle two"/></div></div>
  </section>
  <section className="homeContentSection mgBookingPeek">
   <div className="homeSectionTitle"><div><h2>My bookings</h2><p>Stay up to date with your service</p></div><a href="/bookings">View all <ArrowRight size={15}/></a></div>
   <a href={latestBooking?"/bookings":"/customer/book"} className="homeBookingCard"><span className="homeBookingIcon"><CalendarDays size={22}/></span><div className="homeBookingCopy"><b>{loading?"Checking your bookings…":latestBooking?latestBooking.issueDescription||"Your latest service request":openBookings>0?"Your service requests":"Ready when you need help"}</b><p>{loading?"Getting the latest status":latestBooking?"Status: "+String(latestBooking.status||"REQUESTED").replace(/_/g," ").toLowerCase().replace(/^./,c=>c.toUpperCase()):"Book help or review your previous requests."}</p></div><span className="homeBookingCount">{loading?"…":openBookings}</span></a>
  </section>
  <div className="mgHomeTrust"><ShieldCheck size={19}/><span><b>Reliable help, made simple</b><small>Review service details before confirming your booking.</small></span></div>
  <div className="homeBottomSpacer"/>
  <Bottom active="home"/>
 </main>;
}
