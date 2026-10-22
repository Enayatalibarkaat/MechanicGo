"use client";
import {CarFront,Bike,ChevronRight,LifeBuoy,ArrowLeft,Truck,BusFront,BatteryCharging,Wrench,Zap} from "lucide-react";
import {Bottom} from "../components";
const services=[
 ["Car repair","Starting, battery, tyre and common car issues","CAR",CarFront],
 ["Bike repair","Bike breakdown, starting and punctures","BIKE",Bike],
 ["Scooty repair","Scooter and scooty mechanical issues","SCOOTER",Bike],
 ["Scooty EV","Electric scooter diagnostics and service","SCOOTER_EV",Zap],
 ["EV service","Electric car checks and EV-specific assistance","EV",BatteryCharging],
 ["Battery service","Battery testing and jump-start assistance","BATTERY",BatteryCharging],
 ["Roadside help","Breakdown support wherever your vehicle stops","ROAD_SIDE",LifeBuoy],
 ["Truck repair","Heavy vehicle breakdown and repair requests","TRUCK",Truck],
 ["Bus repair","Bus and passenger vehicle assistance","BUS",BusFront]
] as const;
export default function Services(){
 return <main className="appPage mgServicesPage">
  <header className="pageHeader"><a href="/home" className="pageBackBtn" aria-label="Back to home"><ArrowLeft size={22}/></a><h1>Services</h1></header>
  <section className="serviceIntro"><span className="eyebrow">ROAD-SIDE ASSISTANCE</span><h2>What do you need help with?</h2><p>Choose the exact service. We’ll keep your selected service with the booking so the mechanic knows what you need.</p></section>
  <div className="mgServicesGrid">{services.map(([name,description,service,Icon])=><a href={"/customer/book?service="+service} className="mgServiceTile" key={service}><div className="mgServiceIcon"><Icon size={24}/></div><div className="mgServiceText"><b>{name}</b><span>{description}</span><small>Request this service <ChevronRight size={14}/></small></div></a>)}</div>
  <section className="formCard mgServiceNote"><b>Service-specific booking</b><p>Your selected service is carried into the booking and shown to eligible mechanics. EV and electric-scooty requests are only offered to partners who list the relevant EV capability.</p></section>
  <Bottom active="services"/>
 </main>;
}
