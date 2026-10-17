"use client";
import {useEffect,useState} from "react";
import {CarFront,Bike,MapPin,Search,ChevronRight,CalendarClock,ShieldCheck} from "lucide-react";
import {Bottom} from "../components";

type Booking={_id:string;status:string;issueDescription:string;vehicleType:string};
const categories=[[ "Car",CarFront ],[ "Bike",Bike ],[ "Scooter",Bike ]] as const;
function greeting(){const h=new Date().getHours();return h<12?"GOOD MORNING":h<17?"GOOD AFTERNOON":"GOOD EVENING";}

export default function Home(){
 const[name,setName]=useState("there");const[openBookings,setOpenBookings]=useState(0);const[loading,setLoading]=useState(true);
 useEffect(()=>{
  let active=true;
  fetch("/api/profile/current",{cache:"no-store"}).then(async r=>{const d=await r.json();if(active&&r.ok&&d.user?.name)setName(d.user.name.split(" ")[0]);}).catch(()=>{});
  fetch("/api/auth/status",{cache:"no-store"}).then(async r=>{const d=await r.json();if(!active)return;if(r.ok&&d.authenticated&&d.user?.role==="MECHANIC")location.replace("/mechanic/dashboard");}).catch(()=>{});
  const loadBookings=()=>fetch("/api/bookings",{cache:"no-store"}).then(async r=>{const d=await r.json();if(active&&r.ok){const list:Booking[]=d.bookings||[];setOpenBookings(list.filter(b=>!["COMPLETED","CANCELLED"].includes(b.status)).length);}}).catch(()=>{}).finally(()=>{if(active)setLoading(false);});
  void loadBookings();
  const timer=window.setInterval(()=>void loadBookings(),30000);
  return()=>{active=false;window.clearInterval(timer);};
 },[]);
 return <main className="appPage">
  <header className="appHeader"><a href="/services" className="iconBtn" aria-label="Services">☰</a><div className="appBrand"><img src="/mechanicgo-mark.svg" alt=""/> Mechanic<span>Go</span></div><a className="profileDot" href="/profile">{name[0]?.toUpperCase()||"?"}</a></header>
  <section className="homeHero">
   <div className="homeGreeting"><div><span>{greeting()}</span><h1>Hello, {name} 👋</h1></div><div className="locationPill"><MapPin size={14}/> Location at booking</div></div>
   <p>Reliable roadside help, when you need it.</p>
   <a className="appSearch" href="/customer/book"><Search size={19}/><span>Describe your vehicle problem</span><ChevronRight size={18}/></a>
  </section>
  <section className="appSection">
   <div className="rowTitle"><h2>Quick Assistance</h2><a href="/customer/book">Book help <ChevronRight size={14}/></a></div>
   <div className="categoryRow">{categories.map(([label,Icon])=><a href="/customer/book" className="categoryCard" key={label}><div><Icon/></div><b>{label}</b><span>Repair & roadside help</span></a>)}</div>
  </section>
  <section className="homeEmergency"><div><span>ROAD-SIDE ASSISTANCE</span><h2>Vehicle problem?</h2><p>Share the issue and service address. Your request will be sent to available approved mechanics.</p></div><a href="/customer/book">Request help <ChevronRight/></a></section>
  <section className="appSection">
   <div className="rowTitle"><h2>My Bookings</h2><a href="/bookings">View all <ChevronRight size={14}/></a></div>
   <div className="formCard" style={{padding:18}}>
    <div style={{display:"flex",alignItems:"center",gap:12}}><CalendarClock size={24}/><div style={{flex:1}}><b>{loading?"Checking bookings…":openBookings===0?"No active booking":openBookings===1?"1 active booking":openBookings+" active bookings"}</b><p style={{margin:"5px 0 0"}}>{openBookings?"Check your latest request and its status.":"Your actual requests and updates will appear here."}</p></div><a href="/bookings" aria-label="Open bookings"><ChevronRight/></a></div>
   </div>
   <div className="formCard" style={{padding:18,marginTop:12}}><div style={{display:"flex",gap:12,alignItems:"flex-start"}}><ShieldCheck size={22}/><div><b>Verified partner workflow</b><p style={{margin:"6px 0 0"}}>Only mechanics approved for the platform can go online and accept new jobs.</p></div></div></div>
  </section>
  <Bottom active="home"/>
 </main>;
}
