"use client";

import { useCallback, useEffect, useState } from "react";
import { ArrowLeft, CalendarClock, CheckCircle2, Clock3, MapPin, Phone, RefreshCw, ShieldCheck, Wrench } from "lucide-react";
import { Bottom } from "../components";
import LiveTrackingMap from "./LiveTrackingMap";
import SearchingMechanicsMap from "./SearchingMechanicsMap";

type Booking = {
  _id: string; vehicleType: string; serviceType?: string; issueDescription: string; status: string; createdAt: string;
  location?: { address?: string; lat?: number; lng?: number };
  mechanicId?: { name?: string; phone?: string } | string | null;
};
const serviceNames:Record<string,string>={REPAIR:"General repair",BIKE:"Bike repair",SCOOTER:"Scooty repair",SCOOTER_EV:"Scooty EV service",CAR:"Car repair",EV:"EV service",TRUCK:"Truck repair",BUS:"Bus repair",ROAD_SIDE:"Roadside help",BATTERY:"Battery service"};
const labels: Record<string, string> = {
  SEARCHING: "Finding a mechanic", ACCEPTED: "Mechanic assigned",
  IN_PROGRESS: "Service in progress", COMPLETED: "Service completed", CANCELLED: "Booking cancelled"
};

export default function Tracking() {
  const [booking, setBooking] = useState<Booking | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async (manual = false) => {
    if (manual) setRefreshing(true);
    try {
      setError("");
      const urlId = typeof window !== "undefined" ? new URLSearchParams(window.location.search).get("bookingId") || "" : "";
      const response = await fetch("/api/bookings", { cache: "no-store" });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Could not load your booking.");
      const list: Booking[] = data.bookings || [];
      const selected = (urlId ? list.find(item => item._id === urlId) : null)
        || list.find(item => item.status === "ACCEPTED")
        || list.find(item => !["COMPLETED", "CANCELLED"].includes(item.status)) || null;
      setBooking(selected);
      if (urlId && !selected) throw new Error("This booking was not found in your account.");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not load booking.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    void load();
    const timer = window.setInterval(() => void load(), 5000);
    return () => window.clearInterval(timer);
  }, [load]);

  const created = booking?.createdAt ? new Date(booking.createdAt) : null;

  return <main className="appPage mg-tracking-page">
    <header className="pageHeader mg-tracking-header">
      <a href="/bookings" className="pageBackBtn" aria-label="Back to bookings"><ArrowLeft size={22}/></a>
      <div><span>MECHANICGO</span><h1>Booking tracker</h1></div>
      <button className="iconBtn" onClick={() => void load(true)} aria-label="Refresh booking" disabled={refreshing}>
        <RefreshCw size={18} className={refreshing ? "mg-refreshing" : ""}/>
      </button>
    </header>

    <div className="mg-tracking-content">
      {loading ? <section className="mg-tracking-empty"><span className="bookingSpinner"/><p>Loading your booking…</p></section>
      : error ? <section className="mg-tracking-empty"><p className="setupError">{error}</p><button className="mg-primary-action" onClick={() => void load(true)}>Try again</button><a className="mg-secondary-action" href="/bookings">My bookings</a></section>
      : !booking ? <section className="mg-tracking-empty"><div className="mg-empty-icon"><Wrench size={26}/></div><h2>No active booking</h2><p>Book a mechanic and we’ll show the request progress here.</p><a className="mg-primary-action" href="/customer/book">Book a mechanic</a></section>
      : <>
        <section className="mg-booking-hero">
          <div className="mg-booking-hero-top">
            <div className="mg-vehicle-icon"><Wrench size={23}/></div>
            <div className="mg-booking-headings"><span>BOOKING REQUEST</span><h2>{(booking.serviceType ? serviceNames[booking.serviceType]||booking.vehicleType+" repair" : booking.vehicleType+" repair"}</h2><p>#{booking._id.slice(-7).toUpperCase()}</p></div>
            <span className={"mg-status-badge " + (booking.status === "ACCEPTED" ? "is-accepted" : booking.status === "SEARCHING" ? "is-searching" : "")}><i/>{labels[booking.status] || booking.status}</span>
          </div>
          <div className="mg-booking-details">
            <div className="mg-detail-row"><span className="mg-detail-icon"><Wrench size={16}/></span><div><small>SERVICE REQUEST · {serviceNames[booking.serviceType||"REPAIR"]||booking.vehicleType+" repair"}</small><b>{booking.issueDescription}</b></div></div>
            <div className="mg-detail-row"><span className="mg-detail-icon"><MapPin size={16}/></span><div><small>SERVICE LOCATION</small><b>{booking.location?.address || "Address saved with booking"}</b></div></div>
            {created && <div className="mg-detail-row"><span className="mg-detail-icon"><CalendarClock size={16}/></span><div><small>REQUESTED ON</small><b>{created.toLocaleString()}</b></div></div>}
            {typeof booking.mechanicId === "object" && booking.mechanicId?.name && <div className="mg-assigned-mechanic"><span className="mg-mechanic-avatar"><Wrench size={19}/></span><div><small>YOUR MECHANIC</small><b>{booking.mechanicId.name}</b><span>Booking accepted</span></div>{booking.mechanicId.phone && <a href={"tel:" + booking.mechanicId.phone} aria-label="Call mechanic"><Phone size={18}/></a>}</div>}
          </div>
          <div className="mg-booking-secure"><ShieldCheck size={16}/><span>Your request is shared with eligible partners. Your live GPS is private and only enabled during the trip.</span></div>
        </section>

        {booking.status === "SEARCHING" && <SearchingMechanicsMap address={booking.location?.address || "Bhira, Lakhimpur Kheri, Uttar Pradesh, India"} lat={booking.location?.lat} lng={booking.location?.lng}/>}
        {booking.status === "ACCEPTED" && <LiveTrackingMap bookingId={booking._id} role="CUSTOMER"/>}
        {booking.status === "IN_PROGRESS" && <section className="mg-final-status"><CheckCircle2 size={24}/><div><b>Your mechanic has started the service</b><p>Live GPS sharing is paused while the repair is in progress.</p></div></section>}
        {booking.status === "COMPLETED" && <section className="mg-final-status"><CheckCircle2 size={24}/><div><b>Service completed</b><p>Thanks for choosing MechanicGo.</p><a className="mg-secondary-action" href={"/review?bookingId="+encodeURIComponent(booking._id)}>Rate this service <span aria-hidden="true">→</span></a></div></section>}
        {booking.status === "CANCELLED" && <section className="mg-final-status is-cancelled"><Clock3 size={24}/><div><b>This booking was cancelled</b><p>You can create a new request whenever you need help.</p></div></section>}
      </>}
      <a className="mg-secondary-action mg-my-bookings" href="/bookings">View all my bookings</a>
    </div>
    <Bottom active="bookings"/>
  </main>;
}
