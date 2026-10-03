"use client";
import {CalendarClock,ChevronRight,MapPin,Star} from "lucide-react";
import {Bottom} from "../components";

const active={service:"Car General Service",mechanic:"Arun Kumar",status:"On the Way",eta:"8 mins",price:"₹1,649"};
const past=[["Oil & Filter Change","Sep 18, 2026","₹320","Completed"],["Brake Pad Replacement","Aug 04, 2026","₹1,280","Completed"]];

export default function Bookings(){
  return (
    <main className="appPage">
      <header className="pageHeader">
        <h1>My Bookings</h1>
        <a href="/services">+ New</a>
      </header>

      <section className="bookingSection">
        <div className="sectionLabel">ACTIVE BOOKING</div>
        <article className="activeBooking">
          <div className="bookingTop">
            <div className="miniAvatar">AK</div>
            <div>
              <b>{active.service}</b>
              <span>{active.mechanic} · Verified Expert</span>
            </div>
            <strong>{active.price}</strong>
          </div>

          <div className="bookingStatus">
            <span className="liveStatus"><i/> {active.status}</span>
            <span><CalendarClock size={14}/> ETA {active.eta}</span>
          </div>

          <div className="bookingLocation"><MapPin size={15}/> Kanpur, Uttar Pradesh</div>

          <div className="bookingButtons">
            <a href="/tracking">Track</a>
            <a href="/chat">Chat</a>
          </div>
        </article>
      </section>

      <section className="bookingSection">
        <div className="sectionLabel">PAST BOOKINGS</div>
        {past.map(x=>(
          <article className="pastBooking" key={x[0]}>
            <div className="pastIcon"><CalendarClock/></div>
            <div>
              <b>{x[0]}</b>
              <span>{x[1]} · Arun Kumar</span>
              <small><Star size={12}/> 4.9 · {x[3]}</small>
            </div>
            <strong>{x[2]}<ChevronRight/></strong>
          </article>
        ))}
      </section>

      <Bottom active="bookings"/>
    </main>
  );
}