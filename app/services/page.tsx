"use client";
import {CarFront,Bike,ChevronRight,LifeBuoy,ArrowLeft} from "lucide-react";
import {Bottom} from "../components";
const services=[[ "Car repair","Car starting, battery, tyre and roadside issues",CarFront ],[ "Bike repair","Bike and scooter starting, puncture and breakdown issues",Bike ],[ "Roadside help","Describe the issue and where your vehicle is located",LifeBuoy ]] as const;
export default function Services(){
 return <main className="appPage">
  <header className="pageHeader"><a href="/home" className="pageBackBtn" aria-label="Back to home"><ArrowLeft size={22}/></a><h1>Services</h1></header>
  <section className="serviceIntro"><span className="eyebrow">ROAD-SIDE ASSISTANCE</span><h2>What do you need help with?</h2><p>Choose a vehicle type, explain the issue, and enter the service address. Available approved mechanics can then accept the request.</p></section>
  <div className="serviceList">{services.map(([name,description,Icon])=><a href="/customer/book" className="serviceTile" key={name}><div className="serviceTileIcon"><Icon/></div><div><b>{name}</b><span>{description}</span><small>Request assistance</small></div><span className="arrow"><ChevronRight/></span></a>)}</div>
  <section className="formCard" style={{padding:18,marginTop:16}}><b>Clear service status</b><p>MechanicGo currently confirms the repair request only. Online payments, live GPS tracking and in-app chat are not active yet.</p></section>
  <Bottom active="services"/>
 </main>;
}
