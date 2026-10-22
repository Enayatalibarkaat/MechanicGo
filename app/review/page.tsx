"use client";

import {useCallback,useEffect,useMemo,useState} from "react";
import {ArrowLeft,Star,CheckCircle2,LoaderCircle,CalendarClock,Wrench,ChevronRight} from "lucide-react";
import {Bottom} from "../components";

type Booking={_id:string;status:string;vehicleType:string;issueDescription:string;createdAt:string;mechanicId?:{name?:string}|string|null;review?:{rating?:number|null;comment?:string;reviewedAt?:string|null}};
const dateLabel=(value:string)=>new Date(value).toLocaleDateString("en-IN",{day:"numeric",month:"short",year:"numeric"});

export default function Review(){
 const[items,setItems]=useState<Booking[]>([]);
 const[selectedId,setSelectedId]=useState("");
 const[rating,setRating]=useState(0);
 const[comment,setComment]=useState("");
 const[loading,setLoading]=useState(true);
 const[saving,setSaving]=useState(false);
 const[error,setError]=useState("");
 const[success,setSuccess]=useState("");
 const load=useCallback(async()=>{
  setLoading(true);setError("");
  try{
   const response=await fetch("/api/bookings",{cache:"no-store"});
   const data=await response.json();
   if(!response.ok)throw new Error(data.error||"Could not load completed bookings.");
   const completed:Booking[]=(data.bookings||[]).filter((b:Booking)=>b.status==="COMPLETED");
   setItems(completed);
   const requested=typeof window!=="undefined"?new URLSearchParams(window.location.search).get("bookingId")||"": "";
   const preferred=completed.find(b=>b._id===requested)||completed.find(b=>!b.review?.rating);
   setSelectedId(current=>completed.some(b=>b._id===current)?current:preferred?preferred._id:completed[0]?._id||"");
  }catch(e){setError(e instanceof Error?e.message:"Could not load completed bookings.");}
  finally{setLoading(false);}
 },[]);
 useEffect(()=>{void load();},[load]);
 const selected=useMemo(()=>items.find(b=>b._id===selectedId)||null,[items,selectedId]);
 useEffect(()=>{setRating(0);setComment("");setSuccess("");},[selectedId]);
 const submit=async()=>{
  if(!selected||rating<1){setError("Please select a booking and a star rating.");return;}
  setSaving(true);setError("");setSuccess("");
  try{
   const response=await fetch("/api/bookings/"+encodeURIComponent(selected._id)+"/review",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({rating,comment})});
   const data=await response.json();
   if(!response.ok)throw new Error(data.error||"Could not save your review.");
   setItems(current=>current.map(b=>b._id===selected._id?{...b,review:data.booking.review}:b));
   setSuccess("Thank you! Your review has been saved.");
  }catch(e){setError(e instanceof Error?e.message:"Could not save your review.");}
  finally{setSaving(false);}
 };
 const hasMechanic=(b:Booking)=>Boolean(b.mechanicId);
 return <main className="appPage reviewPage">
  <header className="pageHeader"><a href="/bookings" className="pageBackBtn" aria-label="Back to bookings"><ArrowLeft size={22}/></a><h1>Service Review</h1></header>
  <section className="reviewIntro"><span className="reviewIntroIcon"><Star size={22}/></span><span className="reviewEyebrow">YOUR FEEDBACK MATTERS</span><h2>How was your service?</h2><p>Your honest feedback helps us improve the mechanic experience.</p></section>
  <section className="reviewFormCard">
   {loading?<div className="reviewLoading"><LoaderCircle className="reviewSpin" size={22}/>Loading completed bookings…</div>
   :error&&!items.length?<div className="reviewMessage reviewError" role="alert">{error}<button onClick={()=>void load()}>Try again</button></div>
   :!items.length?<div className="reviewEmpty"><span><CalendarClock size={25}/></span><h2>No completed bookings yet</h2><p>You can leave a review here after your mechanic has completed a service.</p><a href="/bookings" className="reviewSecondaryBtn">View my bookings <ChevronRight size={16}/></a></div>
   :<>
    <label className="reviewFieldLabel" htmlFor="review-booking">Choose a completed booking</label>
    <select id="review-booking" className="reviewSelect" value={selectedId} onChange={e=>{setSelectedId(e.target.value);setError("");}}>{items.map(b=><option key={b._id} value={b._id}>{b.vehicleType} repair · {dateLabel(b.createdAt)} · #{b._id.slice(-6).toUpperCase()}</option>)}</select>
    {selected&&<div className="reviewBookingSummary"><span><Wrench size={19}/></span><div><b>{selected.vehicleType} repair</b><small>{selected.issueDescription}</small><small>{typeof selected.mechanicId==="object"&&selected.mechanicId?.name?"Mechanic: "+selected.mechanicId.name:hasMechanic(selected)?"Assigned mechanic":"Mechanic details unavailable"}</small></div><CheckCircle2 size={19}/></div>}
    {selected?.review?.rating?<div className="reviewAlreadySaved"><CheckCircle2 size={20}/><div><b>Review submitted</b><span>You rated this service {selected.review.rating} out of 5 stars.</span>{selected.review.comment&&<p>{selected.review.comment}</p>}</div></div>
    :selected&&!hasMechanic(selected)?<div className="reviewMessage reviewInfo">This booking does not have an assigned mechanic, so it cannot be reviewed.</div>
    :selected&&<>
      <div className="reviewStarsLabel">Rate your experience</div>
      <div className="reviewStars" role="group" aria-label="Rate from 1 to 5 stars">{[1,2,3,4,5].map(n=><button type="button" key={n} className={n<=rating?"selected":""} aria-label={n+" star"+(n===1?"":"s")} aria-pressed={rating===n} onClick={()=>{setRating(n);setError("");}}><Star size={30} fill={n<=rating?"currentColor":"none"}/></button>)}</div>
      <p className="reviewRatingCaption">{rating===0?"Tap a star to rate":rating===1?"Poor":rating===2?"Fair":rating===3?"Good":rating===4?"Very good":"Excellent"}</p>
      <label className="reviewFieldLabel" htmlFor="review-comment">Tell us more <span>Optional</span></label>
      <textarea id="review-comment" className="reviewTextarea" maxLength={500} rows={4} value={comment} onChange={e=>setComment(e.target.value)} placeholder="What went well? Anything we could improve?"/>
      <div className="reviewCharCount">{comment.length}/500</div>
      <button type="button" className="reviewSubmitBtn" disabled={saving||rating<1} onClick={()=>void submit()}>{saving?<><LoaderCircle className="reviewSpin" size={18}/> Saving review…</>:<><Star size={18}/> Submit review</>}</button>
    </>}
   </>}
   {error&&items.length>0&&<div className="reviewMessage reviewError" role="alert">{error}</div>}
   {success&&<div className="reviewMessage reviewSuccess" role="status"><CheckCircle2 size={18}/>{success}</div>}
  </section>
  <Bottom active="bookings"/>
 </main>;
}
