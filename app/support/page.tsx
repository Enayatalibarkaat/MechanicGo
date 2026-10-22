import {MessageCircle,ChevronRight,Sparkles,CalendarClock,ShieldCheck,ArrowLeft} from "lucide-react";
export default function Support(){
 return <main className="appPage"><header className="pageHeader"><a href="/profile" className="pageBackBtn" aria-label="Back to profile"><ArrowLeft size={22}/></a><h1>Help & Support</h1></header>
 <section className="supportHero"><Sparkles/><h2>MechanicGo Support Assistant</h2><p>Ask a question about repair requests, account setup, or vehicle information. AI replies depend on the support service configuration.</p><a href="/support/ai">Open support assistant <ChevronRight/></a></section>
 <div className="supportCards"><a href="/bookings"><CalendarClock/><b>My Bookings</b><span>Check the latest saved request status</span></a><a href="/terms"><ShieldCheck/><b>Terms & Privacy</b><span>Review account and data information</span></a></div>
 <section className="formCard" style={{padding:18,marginTop:16}}><b>Not connected yet</b><p>There is no live customer–mechanic chat or verified call-centre number configured in this version. We don't display placeholder phone numbers or claim messages were sent.</p></section>
 </main>;
}
