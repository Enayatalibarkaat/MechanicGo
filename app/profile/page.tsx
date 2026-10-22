"use client";
import {useEffect,useState} from "react";
import {LogOut,CarFront,Ticket,Settings,HelpCircle,ChevronRight,type LucideIcon} from "lucide-react";
import {Bottom} from "../components";
const menuItems:Array<[LucideIcon,string,string]>=[[CarFront,"My Vehicles","/vehicles"],[Ticket,"Coupons & Offers","/coupons"],[HelpCircle,"Help & Support","/support"],[Settings,"Settings","/settings"]];
export default function Profile(){
 const[name,setName]=useState("Your profile");const[photo,setPhoto]=useState("");const[phone,setPhone]=useState("");const[email,setEmail]=useState("");
 useEffect(()=>{
  try{const p=JSON.parse(localStorage.getItem("mechanicgo_profile")||"{}");if(p.name)setName(p.name);if(p.photo)setPhoto(p.photo);if(p.phone)setPhone(p.phone);if(p.email)setEmail(p.email)}catch{}
  fetch("/api/profile/current",{cache:"no-store"}).then(async r=>{const d=await r.json();if(!r.ok||!d.user)return;const u=d.user;setName(u.name||"Your profile");setEmail(u.email||"");setPhone(u.phone||"");if(!photo&&u.profilePhotoUrl)setPhoto(u.profilePhotoUrl);try{const old=JSON.parse(localStorage.getItem("mechanicgo_profile")||"{}");localStorage.setItem("mechanicgo_profile",JSON.stringify({...old,name:u.name,email:u.email,phone:u.phone,dob:u.dob,gender:u.gender,role:u.role,vehicleTypes:u.vehicleTypes}))}catch{}}).catch(()=>{});
 },[]);
 const logout=()=>{location.href="/logout"};
 return <main className="appPage"><header className="pageHeader"><h1>Profile</h1></header><section className="profileHero"><div className="profileBig">{photo?<img src={photo} alt="Profile"/>:name[0]?.toUpperCase()||"?"}</div><h2>{name}</h2><p>{phone||email||"Add your contact details"}</p><a href="/profile/edit">Edit Profile</a></section><div className="profileCompletion"><div><b>Your profile</b><span>Keep your contact and vehicle details up to date.</span></div><a href="/profile/edit">Edit</a></div><div className="menuList">{menuItems.map(([Icon,t,u])=><a href={u} key={t}><Icon/><span>{t}</span><ChevronRight/></a>)}<button className="menuListLogout logout" onClick={logout}><LogOut/><span>Logout</span></button></div><Bottom active="profile"/></main>
}
