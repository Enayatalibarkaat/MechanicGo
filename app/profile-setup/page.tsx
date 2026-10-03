"use client";
import {useEffect,useState} from "react";
import {ArrowRight,Camera,CalendarDays,UserRound,CheckCircle2} from "lucide-react";

export default function ProfileSetup(){
  const[name,setName]=useState("");
  const[dob,setDob]=useState("");
  const[gender,setGender]=useState("Male");
  const[photo,setPhoto]=useState("");

  useEffect(()=>{setName(localStorage.getItem("mechanicgo_pending_name")||"")},[]);

  const save=()=>{
    if(!name.trim()||!dob||!gender)return;
    localStorage.setItem("mechanicgo_profile",JSON.stringify({name,dob,gender,photo}));
    localStorage.setItem("mechanicgo_profile_complete","1");
    document.cookie="mechanicgo_profile=1; path=/; max-age=2592000";
    localStorage.removeItem("mechanicgo_pending_name");
    location.href="/home";
  };

  return (
    <main className="setupPage">
      <div className="setupTop">
        <img src="/mechanicgo-mark.svg" alt="MechanicGo"/>
        <span>Step 2 of 2</span>
      </div>

      <section className="setupCard">
        <div className="setupIcon"><UserRound/></div>
        <h1>Complete your profile</h1>
        <p>Just a few details so we can personalise your MechanicGo experience.</p>

        <label>Profile photo <span>Optional</span>
          <div className="photoPicker">
            <div className="setupAvatar">
              {photo?<img src={photo} alt="Profile"/>:<UserRound/>}
            </div>
            <label className="cameraBtn">
              <Camera size={17}/>
              <input type="file" accept="image/*" onChange={e=>{
                const f=e.target.files?.[0];
                if(f){
                  const r=new FileReader();
                  r.onload=()=>setPhoto(String(r.result));
                  r.readAsDataURL(f);
                }
              }}/>
            </label>
            <small>Add a clear photo so mechanics can recognise you</small>
          </div>
        </label>

        <label>Full name
          <div className="setupInput">
            <UserRound/>
            <input value={name} onChange={e=>setName(e.target.value)} placeholder="Enter your name"/>
          </div>
        </label>

        <label>Date of birth
          <div className="setupInput">
            <CalendarDays/>
            <input type="date" value={dob} onChange={e=>setDob(e.target.value)}/>
          </div>
        </label>

        <label>Gender
          <div className="genderGrid">
            {["Male","Female","Other","Prefer not to say"].map(g=>
              <button type="button" key={g} className={gender===g?"gender active":"gender"} onClick={()=>setGender(g)}>
                {g}{gender===g&&<CheckCircle2 size={15}/>}
              </button>
            )}
          </div>
        </label>

        <button className="setupContinue" onClick={save}>
          Continue to MechanicGo <ArrowRight/>
        </button>
        <small className="privacyHint">Your profile information is kept private and used only to improve your service.</small>
      </section>
    </main>
  );
}