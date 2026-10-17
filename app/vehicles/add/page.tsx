"use client";
import {useState} from "react";
import {ArrowLeft,CarFront,Bike,CheckCircle2} from "lucide-react";
export default function AddVehicle(){
 const[type,setType]=useState("BIKE");const[brand,setBrand]=useState("");const[model,setModel]=useState("");const[year,setYear]=useState(String(new Date().getFullYear()));const[registrationNumber,setRegistrationNumber]=useState("");const[fuelType,setFuelType]=useState("PETROL");const[color,setColor]=useState("");const[busy,setBusy]=useState(false);const[error,setError]=useState("");
 const save=async()=>{setError("");if(!brand.trim()||!model.trim()||!registrationNumber.trim()){setError("Enter brand, model and registration number.");return;}setBusy(true);try{const r=await fetch("/api/vehicles",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({type,brand,model,year:Number(year),registrationNumber,fuelType,color})});const d=await r.json();if(!r.ok)throw new Error(d.error||"Could not save vehicle.");location.replace("/vehicles");}catch(e){setError(e instanceof Error?e.message:"Could not save vehicle.");}finally{setBusy(false);}};
 return <main className="appPage"><header className="pageHeader"><a href="/vehicles" aria-label="Back to vehicles"><ArrowLeft/></a><h1>Add Vehicle</h1></header><section className="formCard" style={{padding:22}}>
  <label className="setupLabel">Vehicle type<div className="genderGrid"><button type="button" className={type==="CAR"?"gender active":"gender"} onClick={()=>setType("CAR")}><CarFront/> Car</button><button type="button" className={type==="BIKE"?"gender active":"gender"} onClick={()=>setType("BIKE")}><Bike/> Bike</button><button type="button" className={type==="SCOOTER"?"gender active":"gender"} onClick={()=>setType("SCOOTER")}><Bike/> Scooter</button></div></label>
  <label className="setupLabel">Brand<input value={brand} onChange={e=>setBrand(e.target.value)} maxLength={60} placeholder="e.g. Honda"/></label>
  <label className="setupLabel">Model<input value={model} onChange={e=>setModel(e.target.value)} maxLength={80} placeholder="e.g. Activa 6G"/></label>
  <label className="setupLabel">Year<input type="number" value={year} onChange={e=>setYear(e.target.value)} min="1950" max={new Date().getFullYear()+1}/></label>
  <label className="setupLabel">Registration number<input value={registrationNumber} onChange={e=>setRegistrationNumber(e.target.value.toUpperCase())} maxLength={20} placeholder="e.g. UP32AB1234" autoCapitalize="characters"/></label>
  <label className="setupLabel">Fuel type<select value={fuelType} onChange={e=>setFuelType(e.target.value)}><option value="PETROL">Petrol</option><option value="DIESEL">Diesel</option><option value="CNG">CNG</option><option value="ELECTRIC">Electric</option><option value="HYBRID">Hybrid</option><option value="OTHER">Other</option></select></label>
  <label className="setupLabel">Colour (optional)<input value={color} onChange={e=>setColor(e.target.value)} maxLength={40} placeholder="e.g. Black"/></label>
  {error&&<p className="setupError" role="alert">{error}</p>}
  <button className="primaryWide" onClick={()=>void save()} disabled={busy}>{busy?"Saving vehicle…":"Save Vehicle"} <CheckCircle2 size={18}/></button>
  <p className="privacyHint">Your vehicle is saved to your account and is only available when you are signed in.</p>
 </section></main>;
}
