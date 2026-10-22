"use client";
import {useEffect,useState} from "react";
import {CarFront,Bike,CalendarClock,RefreshCw,ArrowLeft} from "lucide-react";
import {Bottom} from "../components";
type Booking={_id:string;vehicleType:string;serviceType?:string;issueDescription:string;status:string;createdAt:string;location?:{address?:string};mechanicId?:{name?:string}|string|null};
const serviceNames:Record<string,string>={REPAIR:"General repair",BIKE:"Bike repair",SCOOTER:"Scooty repair",SCOOTER_EV:"Scooty EV",CAR:"Car repair",EV:"EV service",TRUCK:"Truck repair",BUS:"Bus repair",ROAD_SIDE:"Roadside help",BATTERY:"Battery service"};
export default function HistoryPage(){
 const[items,setItems]=useState<Booking[]>([]);const[loading,setLoading]=useState(true);const[error,setError]=useState("");
 const load=async()=>{setError("");try{const r=await fetch("/api/bookings",{cache:"no-store"});const d=await r.json();if(!r.ok)throw new Error(d.error||"Could not load service history.");setItems((d.bookings||[]).filter((b:Booking)=>b.status==="COMPLETED"));}catch(e){setError(e instanceof Error?e.message:"Could not load service history.");}finally{setLoading(false);}};
 useEffect(()=>{void load();},[]);
 return <main className="appPage"><header className="pageHeader"><a href="/home" className="pageBackBtn" aria-label="Back to home"><ArrowLeft size={22}/></a><h1>Service History</h1><button className="iconBtn" onClick={()=>void load()} aria-label="Refresh"><RefreshCw size={17}/></button></header>
 <section className="healthCard"><label>YOUR SERVICE RECORD</label><h2>{loading?"Loading…":items.length+" completed service"+(items.length===1?"":"s")}</h2><p>This list is based on completed bookings saved to your account. Costs and invoices are not shown unless recorded by the platform.</p></section>
 {error&&<p className="setupError">{error}</p>}
 <section className="historyList"><div className="rowTitle"><h2>Completed bookings</h2></div>
 {loading?<p>Loading service history…</p>:items.length===0?<div className="formCard" style={{padding:20}}><p>No completed bookings yet.</p><a className="primaryWide" href="/customer/book">Book a service</a></div>:items.map(b=><article className="historyCard" key={b._id}>{b.vehicleType==="CAR"?<CarFront/>:<Bike/>}<div><h3>{(b.serviceType ? serviceNames[b.serviceType]||b.vehicleType+" repair" : b.vehicleType+" repair"}</h3><span>{b.issueDescription}</span><small><CalendarClock size={13}/> {new Date(b.createdAt).toLocaleString()}<br/>{b.location?.address||"Service address not recorded"}</small></div><strong>COMPLETED<small>{typeof b.mechanicId==="object"&&b.mechanicId?.name?"Mechanic: "+b.mechanicId.name:"Booking ID: "+b._id}</small></strong></article>)}
 </section><Bottom active="bookings"/>
 </main>;
}
