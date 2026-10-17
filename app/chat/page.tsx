"use client";
import {useEffect} from "react";
import {ArrowLeft,MessageCircle,ShieldCheck} from "lucide-react";
export default function Chat(){
 useEffect(()=>{},[]);
 return <main className="appPage"><header className="pageHeader"><a href="/bookings" aria-label="Back to bookings"><ArrowLeft/></a><h1>Booking Messages</h1></header><section className="formCard" style={{padding:24}}><div className="setupIcon"><MessageCircle size={26}/></div><h2>In-app chat is not connected yet</h2><p>Messages sent here would not reach your mechanic, so this screen will not pretend to send them.</p><div style={{display:"flex",gap:10,alignItems:"flex-start",marginTop:16}}><ShieldCheck size={19}/><span>Check your actual booking status in My Bookings. Customer–mechanic messaging will be enabled once the messaging service is connected.</span></div><a className="primaryWide" href="/bookings">Go to My Bookings</a><a className="secondaryWide" href="/support">Help & Support</a></section></main>;
}
