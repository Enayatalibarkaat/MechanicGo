"use client";

import {useEffect,useState} from "react";
import {createPortal} from "react-dom";
import {Home,CalendarDays,Wrench,Ticket,UserRound,ArrowLeft} from "lucide-react";

export function Bottom({active}:{active:string}){
  const [mounted,setMounted]=useState(false);
  useEffect(()=>{setMounted(true);return()=>setMounted(false);},[]);
  if(!mounted)return null;
  return createPortal(<nav className="bottomNav mgBottomNav" aria-label="Main navigation">
    <a className={active==="home"?"on":""} href="/home"><Home/><span>Home</span></a>
    <a className={active==="bookings"?"on":""} href="/bookings"><CalendarDays/><span>Bookings</span></a>
    <a className="mgNavBook" href="/customer/book" aria-label="Book a mechanic"><span><Wrench size={23}/></span><b>Book</b></a>
    <a className={active==="coupons"?"on":""} href="/coupons"><Ticket/><span>Offers</span></a>
    <a className={active==="profile"?"on":""} href="/profile"><UserRound/><span>Profile</span></a>
  </nav>,document.body);
}

export function BackLink({href="/home",label="Go back"}:{href?:string;label?:string}){
  return <a className="pageBackBtn" href={href} aria-label={label} title={label}><ArrowLeft size={22}/></a>;
}
