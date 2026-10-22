import {Home,CalendarDays,Wrench,Ticket,UserRound,ArrowLeft} from "lucide-react";
export function Bottom({active}:{active:string}){
  const items=[[ "home",Home,"Home","/home"],["bookings",CalendarDays,"Bookings","/bookings"],["coupons",Ticket,"Offers","/coupons"],["profile",UserRound,"Profile","/profile"]] as const;
  return <nav className="bottomNav mgBottomNav" aria-label="Main navigation">
    <a key="home" className={active==="home"?"on":""} href="/home"><Home/><span>Home</span></a>
    <a key="bookings" className={active==="bookings"?"on":""} href="/bookings"><CalendarDays/><span>Bookings</span></a>
    <a key="book" className="mgNavBook" href="/customer/book" aria-label="Book a mechanic"><span><Wrench size={23}/></span><b>Book</b></a>
    <a key="coupons" className={active==="coupons"?"on":""} href="/coupons"><Ticket/><span>Offers</span></a>
    <a key="profile" className={active==="profile"?"on":""} href="/profile"><UserRound/><span>Profile</span></a>
  </nav>;
}

export function BackLink({href="/home",label="Go back"}:{href?:string;label?:string}){
  return <a className="pageBackBtn" href={href} aria-label={label} title={label}><ArrowLeft size={22}/></a>;
}
