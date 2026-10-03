import {Home,CalendarDays,Wrench,MessageCircle,UserRound} from "lucide-react";
export function Bottom({active}:{active:string}){
  const items=[["home",Home,"Home","/home"],["bookings",CalendarDays,"Bookings","/bookings"],["services",Wrench,"Services","/services"],["chat",MessageCircle,"Chat","/chat"],["profile",UserRound,"Profile","/profile"]] as const;
  return <nav className="bottomNav">{items.map(([id,Icon,label,href])=><a key={id} className={active===id?"on":""} href={href}><Icon/><span>{label}</span></a>)}</nav>;
}