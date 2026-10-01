"use client";
import {ArrowLeft,Bell,MapPin,ShieldCheck,Moon,ChevronRight,type LucideIcon} from "lucide-react";

const settingsItems: Array<[LucideIcon,string]> = [
  [Bell,"Notifications"],
  [MapPin,"Location & Permissions"],
  [ShieldCheck,"Privacy & Security"],
  [Moon,"Appearance"]
];

export default function Settings(){
  return <main className="appPage">
    <header className="pageHeader"><a href="/profile"><ArrowLeft/></a><h1>Settings</h1></header>
    <div className="menuList">
      {settingsItems.map(([Icon,t])=><a href="#" key={t}><Icon/><span>{t}</span><ChevronRight/></a>)}
    </div>
  </main>
}