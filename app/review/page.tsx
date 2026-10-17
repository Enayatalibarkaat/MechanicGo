"use client";
import {ArrowLeft,Star,MessageSquareText} from "lucide-react";
export default function Review(){
 return <main className="appPage"><header className="pageHeader"><a href="/bookings" aria-label="Back to bookings"><ArrowLeft/></a><h1>Service Review</h1></header><section className="formCard" style={{padding:24}}><div className="setupIcon"><Star size={26}/></div><h2>Reviews are coming soon</h2><p>Reviews aren't connected to the booking database yet. Your feedback will not be recorded until that system is ready, so this page won't show a false submission confirmation.</p><div style={{display:"flex",gap:10,alignItems:"flex-start",marginTop:16}}><MessageSquareText size={19}/><span>After the review feature is connected, you'll be able to rate the mechanic assigned to a completed booking.</span></div><a className="primaryWide" href="/bookings">Go to My Bookings</a></section></main>;
}
