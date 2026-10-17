"use client";
import {useCallback,useEffect,useState} from "react";
import {Plus,CarFront,Bike,ChevronRight,Trash2,RefreshCw} from "lucide-react";
type Vehicle={_id:string;type:string;brand:string;model:string;year:number;registrationNumber:string;fuelType:string;color?:string};
export default function Vehicles(){
 const[vehicles,setVehicles]=useState<Vehicle[]>([]);const[loading,setLoading]=useState(true);const[error,setError]=useState("");const[busy,setBusy]=useState("");
 const load=useCallback(async()=>{setError("");try{const r=await fetch("/api/vehicles",{cache:"no-store"});const d=await r.json();if(!r.ok)throw new Error(d.error||"Could not load vehicles.");setVehicles(d.vehicles||[]);}catch(e){setError(e instanceof Error?e.message:"Could not load vehicles.");}finally{setLoading(false);}},[]);
 useEffect(()=>{void load();},[load]);
 const remove=async(id:string)=>{if(!window.confirm("Remove this vehicle from your account?"))return;setBusy(id);setError("");try{const r=await fetch("/api/vehicles/"+id,{method:"DELETE"});const d=await r.json();if(!r.ok)throw new Error(d.error||"Could not delete vehicle.");setVehicles(old=>old.filter(v=>v._id!==id));}catch(e){setError(e instanceof Error?e.message:"Could not delete vehicle.");}finally{setBusy("");}};
 return <main className="appPage"><header className="pageHeader"><a href="/home">‹</a><h1>My Vehicles</h1><a href="/vehicles/add" aria-label="Add vehicle"><Plus/></a></header>
 {error&&<p className="setupError">{error}</p>}
 <section className="vehicleList">{loading?<p>Loading your vehicles…</p>:vehicles.length===0?<div className="formCard" style={{padding:22}}><h2>No vehicles saved</h2><p>Add your vehicle details for easier reference when requesting roadside help.</p><a className="primaryWide" href="/vehicles/add"><Plus/> Add your first vehicle</a></div>:vehicles.map(v=><article className="vehicleCard" key={v._id}><div>{v.type==="CAR"?<CarFront/>:<Bike/>}</div><section><b>{v.brand} {v.model}</b><span>{v.fuelType} · {v.year}{v.color?" · "+v.color:""}</span><small>{v.registrationNumber}</small></section><button className="iconBtn" disabled={busy===v._id} onClick={()=>void remove(v._id)} aria-label={"Remove "+v.registrationNumber}><Trash2 size={17}/></button><ChevronRight/></article>)}</section>
 <button className="secondaryWide" onClick={()=>void load()}><RefreshCw size={16}/> Refresh</button>
 </main>;
}
