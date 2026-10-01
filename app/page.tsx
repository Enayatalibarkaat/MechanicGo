"use client";

import {useState} from "react";
import {ArrowLeft,ArrowRight,Bike,BriefcaseBusiness,CarFront,CheckCircle2,ChevronRight,Clock3,HelpCircle,LocateFixed,Menu,MessageCircle,Phone,Search,ShieldCheck,Star,Truck,X} from "lucide-react";

const services=[
  ["Car","₹299","15–25 min",CarFront],
  ["Bike","₹199","10–20 min",Bike],
  ["Scooter","₹199","10–20 min",Bike],
  ["Truck","₹699","25–40 min",Truck],
] as const;

export default function Home(){
  const[selected,setSelected]=useState("Car");
  const[booked,setBooked]=useState(false);
  const[menu,setMenu]=useState(false);

  return <main>
    <header className="nav">
      <a className="brand" href="/"><img className="brandMark" src="/mechanicgo-mark.svg" alt="MechanicGo"/><span>Mechanic<span className="accent">Go</span></span></a>
      <nav><a href="#services">Services</a><a href="#nearby">Nearby mechanics</a><a href="#how">How it works</a></nav>
      <div className="navActions"><a className="ghost" href="/auth">Log in</a><a className="primary small" href="/auth?mode=register">Get help <ArrowRight size={15}/></a><button className="menu" onClick={()=>setMenu(!menu)}>{menu?<X/>:<Menu/>}</button></div>
    </header>

    {menu&&<div className="mobileMenu"><a href="#services" onClick={()=>setMenu(false)}>Services</a><a href="#nearby" onClick={()=>setMenu(false)}>Nearby mechanics</a><a href="#how" onClick={()=>setMenu(false)}>How it works</a><a href="/auth" onClick={()=>setMenu(false)}>Login / Register</a></div>}

    <section className="hero">
      <div className="heroCopy">
        <div className="pill"><span className="liveDot"/> 24/7 roadside assistance</div>
        <h1>Help on the road.<br/><em>Right when you need it.</em></h1>
        <p>Book a verified mechanic near you in seconds. Transparent pricing, live tracking and help that comes to you.</p>
        <div className="searchBox"><div className="searchIcon"><Search size={19}/></div><div><small>Where do you need help?</small><strong>Detecting your location…</strong></div><button onClick={()=>document.getElementById("services")?.scrollIntoView({behavior:"smooth"})}><LocateFixed size={18}/> Use location</button></div>
        <div className="trust"><div><ShieldCheck size={17}/>Verified mechanics</div><div><Clock3 size={17}/>Average 15 min ETA</div><div><Star size={17}/>4.8/5 rated</div></div>
      </div>

      <div className="heroVisual liveMap">
        <div className="mapSky"/><div className="mapBlock b1"/><div className="mapBlock b2"/><div className="mapBlock b3"/><div className="mapBlock b4"/>
        <div className="park park1"><span>Central Park</span></div><div className="park park2"/>
        <div className="road road1"/><div className="road road2"/><div className="road road3"/><div className="blueRoute routeA"/><div className="blueRoute routeB"/>
        <div className="mapTop"><button className="mapRound"><ArrowLeft size={18}/></button><div className="mapTitle"><b>MechanicGo</b><span><i/> LIVE TRACK</span></div><button className="mapRound"><HelpCircle size={18}/></button></div>
        <div className="arrival"><strong>8</strong><span>mins</span><div>Arriving<br/><b>at 2:45 PM</b></div></div>
        <div className="zoom"><button>+</button><button>−</button><button><LocateFixed size={19}/></button></div>
        <div className="mapPin user"><LocateFixed size={16}/></div><div className="mapPin mechanicPin m1">⚒</div><div className="mapPin mechanicPin m2">⚒</div>
        <div className="trackingSheet">
          <div className="grab"/>
          <div className="mechanicTop"><div className="mechanicPhoto">AK</div><div className="mechanicIdentity"><b>Arun Kumar</b><span><Star size={13} fill="currentColor"/> 4.9 · 1,200+ jobs</span></div><strong>Arriving</strong></div>
          <div className="trackingLine"><div className="trackStep done"><span>✓</span><b>Accepted</b></div><div className="trackStep active"><span>🚗</span><b>On the Way</b></div><div className="trackStep"><span><BriefcaseBusiness size={15}/></span><b>Arriving</b></div></div>
          <div className="mapActions"><button className="outlineAction"><MessageCircle size={18}/>Chat</button><button className="primaryAction"><Phone size={18}/>Call</button></div>
        </div>
      </div>
    </section>

    <section id="services" className="section"><div className="sectionHead"><div><span className="eyebrow">QUICK HELP</span><h2>What do you need?</h2></div><a href="#nearby">View nearby <ChevronRight size={16}/></a></div><div className="serviceGrid">{services.map(([name,price,eta,Icon])=><button key={name} className={selected===name?"service active":"service"} onClick={()=>setSelected(name)}><div className="serviceIcon"><Icon size={25}/></div><div className="serviceText"><b>{name}</b><span>From {price} · {eta}</span></div><ChevronRight size={17}/></button>)}</div></section>

    <section id="nearby" className="nearby"><div className="nearbyMap liveMap compactMap"><div className="mapSky"/><div className="mapBlock b1"/><div className="mapBlock b2"/><div className="mapBlock b3"/><div className="road road1"/><div className="road road2"/><div className="blueRoute routeA"/><div className="mapPin user"><LocateFixed size={15}/></div><div className="mapPin mechanicPin m1">⚒</div><div className="you">You</div></div><div className="nearbyPanel"><span className="eyebrow">NEARBY NOW</span><h2>Mechanics around you</h2><p className="muted">Available for <b>{selected}</b> assistance</p>{[["Aman Auto Care","4.9","1.2 km","12 min","₹299","A"],["Khan Motors","4.8","2.1 km","18 min","₹349","K"]].map(m=><div className="mechanic" key={m[0]}><div className="avatar">{m[5]}</div><div className="mechanicMain"><div className="nameRow"><b>{m[0]}</b><span className="verified"><CheckCircle2 size={13}/> Verified</span></div><div className="meta"><span><Star size={13} fill="currentColor"/> {m[1]}</span><span>• {m[2]}</span><span>• {m[3]}</span></div></div><div className="mechanicAction"><strong>{m[4]}</strong><button onClick={()=>setBooked(true)}>Book</button></div></div>)}</div></section>

    <section id="how" className="how"><div><span className="eyebrow">SIMPLE BY DESIGN</span><h2>From stuck to sorted<br/>in a few taps.</h2></div><div className="steps">{[["01","Choose a service","Tell us what happened and select your vehicle."],["02","Pick a mechanic","Compare verified pros, ratings, price and ETA."],["03","Track & relax","Watch your mechanic arrive in real time."]].map(s=><div key={s[0]}><i>{s[0]}</i><b>{s[1]}</b><span>{s[2]}</span></div>)}</div></section>

    <footer><div className="brand"><img className="brandMark" src="/mechanicgo-mark.svg" alt="MechanicGo"/><span>Mechanic<span className="accent">Go</span></span></div><span>Fast. Reliable. Anytime.</span><span>© 2026 MechanicGo</span></footer>

    {booked&&<div className="modalBack" onClick={()=>setBooked(false)}><div className="modal" onClick={e=>e.stopPropagation()}><button className="close" onClick={()=>setBooked(false)}><X/></button><div className="success"><CheckCircle2 size={42}/></div><span className="eyebrow">REQUEST RECEIVED</span><h2>Your mechanic is on the way.</h2><p>Aman Auto Care has been notified. Estimated arrival <b>12 minutes</b>.</p><div className="bookingLine"><span>Booking ID</span><b>MG-48291</b></div><div className="bookingLine"><span>Estimated price</span><b>₹299</b></div><div className="modalButtons"><button className="ghost full" onClick={()=>setBooked(false)}>Close</button><button className="primary full"><MessageCircle size={17}/> Chat mechanic</button></div></div></div>}
  </main>
}
