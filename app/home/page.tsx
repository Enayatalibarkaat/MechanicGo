"use client";

import {useEffect,useState} from "react";
import {
  Bike, CarFront, ChevronRight, CalendarClock, ShieldCheck, MapPin,
  Search, Wrench, Ticket, Car, LifeBuoy, CircleHelp, Clock3, Sparkles
} from "lucide-react";
import {Bottom} from "../components";

type Booking={_id:string;status:string;issueDescription:string;vehicleType:string;createdAt?:string};
function greeting(){const h=new Date().getHours();return h<12?"GOOD MORNING":h<17?"GOOD AFTERNOON":"GOOD EVENING";}

export default function Home(){
 const[name,setName]=useState("there");
 const[photoUrl,setPhotoUrl]=useState("");
 const[openBookings,setOpenBookings]=useState(0);
 const[loading,setLoading]=useState(true);
 const[latestBooking,setLatestBooking]=useState<Booking|null>(null);
 useEffect(()=>{
  let active=true;
  fetch("/api/profile/current",{cache:"no-store"}).then(async r=>{const d=await r.json();if(active&&r.ok&&d.user){if(d.user.name)setName(d.user.name.split(" ")[0]);setPhotoUrl(d.user.profilePhotoUrl||"");}}).catch(()=>{});
  fetch("/api/auth/status",{cache:"no-store"}).then(async r=>{const d=await r.json();if(active&&r.ok&&d.authenticated&&d.user?.role==="MECHANIC")location.replace("/mechanic/dashboard");}).catch(()=>{});
  const loadBookings=()=>fetch("/api/bookings",{cache:"no-store"}).then(async r=>{const d=await r.json();if(active&&r.ok){const list:Booking[]=d.bookings||[];const current=list.filter(b=>!["COMPLETED","CANCELLED"].includes(b.status));setOpenBookings(current.length);setLatestBooking(current[0]||null);}}).catch(()=>{}).finally(()=>{if(active)setLoading(false);});
  void loadBookings();
  const timer=window.setInterval(()=>void loadBookings(),30000);
  return()=>{active=false;window.clearInterval(timer);};
 },[]);
 return <main className="appPage homePage">
  <header className="homeHeaderBar">
   <a href="/home" className="homeHeaderBrand" aria-label="MechanicGo home"><img src="/mechanicgo-mark.svg" alt=""/>Mechanic<span>Go</span></a>
   <a className="homeProfileButton" href="/profile" aria-label="Open profile">{photoUrl?<img src={photoUrl} alt="Profile photo" onError={()=>setPhotoUrl("")}/>:name[0]?.toUpperCase()||"?"}</a>
  </header>

  <section className="homeWelcome">
   <div className="homeWelcomeTop">
    <div className="homeWelcomeCopy">
     <span className="homeWelcomeKicker"><span className="liveDot"/> YOUR ROAD-HELP COMPANION</span>
     <h1>{greeting().toLowerCase().replace(/^./,c=>c.toUpperCase())}, <span>{name}</span> 👋</h1>
     <p>Vehicle trouble? Get your service request started in a few simple steps.</p>
    </div>
   </div>
   <span className="homeLocationBadge"><MapPin size={13}/> Your service location is selected during booking</span>
  </section>

  <section className="homeBookHero">
   <div className="homeBookHeroTop"><span className="homeBookHeroIcon"><Wrench size={22}/></span><div><span>NEED HELP ON THE ROAD?</span><span style={{marginTop:4,letterSpacing:0,fontWeight:600,fontSize:11,color:"#fff"}}>Start a service request</span></div></div>
   <h2>Get back on the road with confidence.</h2>
   <p>Tell us what happened, share your location and request help from available mechanics.</p>
   <a className="homeBookHeroLink" href="/customer/book"><Search size={17}/> Book a mechanic <ChevronRight size={17}/></a>
  </section>

  <div className="homeTrustRow" aria-label="Service highlights">
   <div className="homeTrustItem"><span className="homeTrustIcon"><ShieldCheck size={17}/></span><div><b>Verified flow</b><small>Partner approval</small></div></div>
   <div className="homeTrustItem"><span className="homeTrustIcon"><Clock3 size={17}/></span><div><b>Easy booking</b><small>Step by step</small></div></div>
   <div className="homeTrustItem"><span className="homeTrustIcon"><MapPin size={17}/></span><div><b>Location aware</b><small>At booking</small></div></div>
  </div>

  <section className="homeContentSection">
   <div className="homeSectionTitle"><div><h2>What do you need?</h2><p>Choose the closest match to your vehicle.</p></div><a href="/services">All services <ChevronRight size={14}/></a></div>
   <div className="homeServiceGrid">
    <a href="/customer/book" className="homeServiceCard"><span className="homeServiceIcon"><CarFront size={23}/></span><b>Car repair</b><small>Starting, battery, tyre</small></a>
    <a href="/customer/book" className="homeServiceCard"><span className="homeServiceIcon"><Bike size={23}/></span><b>Bike repair</b><small>Breakdown & puncture</small></a>
    <a href="/customer/book" className="homeServiceCard"><span className="homeServiceIcon"><LifeBuoy size={23}/></span><b>Roadside help</b><small>Explain your issue</small></a>
   </div>
  </section>

  <section className="homeContentSection">
   <div className="homeSectionTitle"><div><h2>My bookings</h2><p>Keep an eye on your service requests.</p></div><a href="/bookings">View all <ChevronRight size={14}/></a></div>
   <a href={latestBooking?"/bookings":"/customer/book"} className="homeBookingCard">
    <span className="homeBookingIcon"><CalendarClock size={22}/></span>
    <div className="homeBookingCopy">
     <b>{loading?"Checking your bookings…":latestBooking?latestBooking.issueDescription||"Your latest service request":openBookings>0?"Your service requests":"Ready when you need help"}</b>
     <p>{loading?"Getting the latest status":latestBooking?("Status: "+String(latestBooking.status||"REQUESTED").replace(/_/g," ").toLowerCase().replace(/^./,c=>c.toUpperCase())):"Book help or review your previous requests."}</p>
    </div>
    <span className="homeBookingCount">{loading?"…":openBookings}</span>
   </a>
  </section>

  <section className="homeCouponPromo">
   <span className="homeCouponPromoIcon"><Ticket size={22}/></span>
   <div className="homeCouponPromoCopy"><span>EXCLUSIVE FOR YOU</span><b>Have a coupon code?</b><small>Claim your offer and apply it when you book a mechanic.</small></div>
   <a href="/coupons" aria-label="Open coupons and offers"><ChevronRight size={20}/></a>
  </section>

  <section className="homeContentSection">
   <div className="homeSectionTitle"><div><h2>Made for you</h2><p>Useful shortcuts, right where you need them.</p></div></div>
   <div className="homeShortcutGrid">
    <a className="homeShortcut" href="/vehicles"><span><Car size={19}/></span><span><b>My vehicles</b><small>Save your vehicle details</small></span></a>
    <a className="homeShortcut" href="/coupons"><span><Ticket size={19}/></span><span><b>Coupons & offers</b><small>Claim an available coupon</small></span></a>
    <a className="homeShortcut" href="/support"><span><CircleHelp size={19}/></span><span><b>Help & support</b><small>Find help using the app</small></span></a>
    <a className="homeShortcut" href="/profile"><span><Sparkles size={19}/></span><span><b>Your profile</b><small>Keep account details updated</small></span></a>
   </div>
  </section>

  <div className="homeSafetyNote"><ShieldCheck size={20}/><div><b>A clearer, safer booking experience</b><p>Review your request details before sending. Service availability and the final repair cost depend on mechanic acceptance and inspection.</p></div></div>
  <div className="homeBottomSpacer"/>
  <Bottom active="home"/>
 </main>;
}
