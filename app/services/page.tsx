"use client";
import {CarFront,Bike,Truck,Bus,Tractor,Zap,LifeBuoy} from "lucide-react";
import {Bottom} from "../components";

const services=[["Car Service","General service, inspection & repair","From ₹299",CarFront],["Bike Service","Service, puncture & breakdown","From ₹199",Bike],["Scooter Service","Battery, tyre & engine help","From ₹199",Bike],["Van Service","Roadside repair & maintenance","From ₹399",CarFront],["Truck Assistance","Heavy vehicle roadside help","From ₹699",Truck],["Bus Assistance","Emergency repair & towing","From ₹799",Bus],["Tractor Help","Farm vehicle breakdown support","From ₹499",Tractor],["EV Assistance","EV diagnostics & charging","From ₹349",Zap],["Towing","Safe towing to nearby workshop","From ₹599",LifeBuoy]] as const;

export default function Services(){
  return (
    <main className="appPage">
      <header className="pageHeader">
        <h1>Services</h1>
        <a href="/home">Close</a>
      </header>

      <section className="serviceIntro">
        <span className="eyebrow">ROADSIDE ASSISTANCE</span>
        <h2>What can we help with?</h2>
        <p>Select a service and we'll show verified mechanics near you.</p>
      </section>

      <div className="serviceList">
        {services.map(([n,d,p,Icon])=>(
          <a href="/mechanics" className="serviceTile" key={n}>
            <div className="serviceTileIcon"><Icon/></div>
            <div>
              <b>{n}</b>
              <span>{d}</span>
              <small>{p}</small>
            </div>
            <span className="arrow">›</span>
          </a>
        ))}
      </div>

      <Bottom active="services"/>
    </main>
  );
}