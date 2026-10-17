"use client";
import {useEffect} from "react";
export default function BookingConfirmed(){
 useEffect(()=>{location.replace("/bookings");},[]);
 return <main className="appPage"><section className="formCard" style={{padding:24}}><h1>Checking booking status…</h1><p>Your real booking status is available in My Bookings.</p><a className="primaryWide" href="/bookings">Open My Bookings</a></section></main>;
}
