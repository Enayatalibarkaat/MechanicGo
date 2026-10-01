"use client";
import {CarFront,Bike,MapPin,Search,SlidersHorizontal,type LucideIcon} from "lucide-react";
import {Bottom} from "../components";

const categories: Array<[string,LucideIcon,string]> = [
  ["Car",CarFront,"₹299"],
  ["Bike",Bike,"₹199"],
  ["Scooter",Bike,"₹199"]
];

export default function Home(){
  return <main className="appPage">
    <header className="appHeader"><button className="iconBtn">☰</button><div className="appBrand"><img src="/mechanicgo-mark.svg"/> Mechanic<span>Go</span></div><div className="profileDot">J</div></header>
    <section className="homeHero"><h1>Hello, John 👋</h1><p>Your vehicle's health is our top priority.</p><div className="appSearch"><Search size={19}/><span>What service do you need?</span><SlidersHorizontal size={19}/></div></section>
    <section className="appSection"><div className="rowTitle"><h2>Vehicle Categories</h2><a>View all</a></div><div className="categoryRow">
      {categories.map(([n,Icon,p])=><a href="/booking-summary" className="categoryCard" key={n}><div><Icon/></div><b>{n}</b><span>From {p}</span></a>)}
    </div></section>
    <section className="appSection"><div className="rowTitle"><h2>Nearby Mechanics</h2><a><MapPin size={15}/> Kanpur</a></div><div className="miniMap"><div className="mapRoad rA"/><div className="mapRoad rB"/><MapPin className="bigMapPin"/><div className="mapExplore"><b>12 Specialists Near You</b><span>Avg. arrival 15–20 mins</span><a href="/tracking">Explore Map</a></div></div>
      <div className="proCard"><div className="proAvatar">PA</div><div className="proInfo"><b>Precision Auto Care</b><span>Expert in Luxury Sedans & EVs</span><small>✓ VERIFIED · <strong>1.2 km away</strong></small></div><span className="rating">☆ 4.9</span><div className="proBtns"><a href="/profile">View Profile</a><a href="/booking-summary">Book Now</a></div></div>
    </section>
    <div className="offer">Seasonal Care<h2>40% OFF<br/>Monsoon Service</h2><button>Claim Offer</button></div>
    <Bottom active="home"/>
  </main>
}