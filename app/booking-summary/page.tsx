"use client";
import {useEffect} from "react";
export default function BookingSummary(){
 useEffect(()=>{location.replace("/customer/book");},[]);
 return <main className="appPage"><section className="formCard" style={{padding:24}}><h1>Start a real booking</h1><p>Online payments have not been enabled. You can submit a repair request and check its actual status in My Bookings.</p><a className="primaryWide" href="/customer/book">Create repair request</a></section></main>;
}
