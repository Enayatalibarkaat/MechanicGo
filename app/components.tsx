import {Home,CalendarDays,Wrench,LifeBuoy,UserRound,ArrowLeft} from "lucide-react";
export function Bottom({active}:{active:string}){
  const items=[["home",Home,"Home","/home"],["bookings",CalendarDays,"Bookings","/bookings"],["services",Wrench,"Services","/services"],["support",LifeBuoy,"Support","/support"],["profile",UserRound,"Profile","/profile"]] as const;
  return <nav className="bottomNav">{items.map(([id,Icon,label,href])=><a key={id} className={active===id?"on":""} href={href}><Icon/><span>{label}</span></a>)}</nav>;
}

export function BackLink({href="/home",label="Go back"}:{href?:string;label?:string}){
  return <a className="pageBackBtn" href={href} aria-label={label} title={label}><ArrowLeft size={22}/></a>;
}
