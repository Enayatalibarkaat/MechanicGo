"use client";
import {FormEvent,useEffect,useRef,useState} from "react";
import {ArrowLeft,Bot,Send,ShieldCheck,Sparkles,Clock3,Wrench,CircleHelp,UserRound} from "lucide-react";
type Msg={role:"user"|"assistant";text:string};
export default function Chat(){
 const [messages,setMessages]=useState<Msg[]>([{role:"assistant",text:"Namaste! 👋 Main MechanicGo Support hoon. Booking, payment ya vehicle service se related sawal poochhiye — main aapki help karungi."}]);
 const [draft,setDraft]=useState("");const [busy,setBusy]=useState(false);const [error,setError]=useState("");const end=useRef<HTMLDivElement>(null);
 useEffect(()=>{end.current?.scrollIntoView({behavior:"smooth"})},[messages,busy]);
 async function send(text:string){const q=text.trim();if(!q||busy)return;setDraft("");setError("");setMessages(v=>[...v,{role:"user",text:q}]);setBusy(true);try{const r=await fetch("/api/assistant",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({message:q,history:messages.slice(-10).map(m=>({role:m.role==="assistant"?"model":"user",text:m.text}))})});const j=await r.json();if(!r.ok&&!j.reply)throw Error();setMessages(v=>[...v,{role:"assistant",text:j.reply||"Please dobara try kijiye."}])}catch{setError("Message send nahi hua. Internet check karke dobara try karein.")}finally{setBusy(false)}}
 function submit(e:FormEvent){e.preventDefault();void send(draft)}
 return <main className="supportChatPage"><section className="supportChatShell">
  <header className="supportChatHeader"><a href="/bookings" className="chatIconButton" aria-label="Back"><ArrowLeft size={21}/></a><div className="chatBotAvatar"><Bot size={25}/></div><div className="chatIdentity"><h1>MechanicGo Support</h1><span><i/> AI assistant · Replies instantly</span></div><a href="/support" className="chatIconButton" aria-label="Help"><CircleHelp size={20}/></a></header>
  <div className="chatSafety"><ShieldCheck size={15}/> Official support · Never share OTPs or passwords</div>
  <div className="chatMessages"><div className="chatIntro"><span><Sparkles size={20}/></span><div><b>Hi there! How can I help?</b><p>Booking se lekar vehicle service tak — apna sawal neeche likhiye.</p></div></div>
   {messages.map((m,i)=><div className={"chatRow "+(m.role==="user"?"chatUser":"")} key={i}>{m.role==="assistant"&&<div className="chatSmallAvatar"><Bot size={16}/></div>}<div className="chatBubbleGroup"><small>{m.role==="user"?"You":"MechanicGo Support"}</small><div className="chatBubble">{m.text}</div></div>{m.role==="user"&&<div className="chatSmallAvatar chatUserAvatar"><UserRound size={16}/></div>}</div>)}
   {busy&&<div className="chatRow"><div className="chatSmallAvatar"><Bot size={16}/></div><div className="chatBubbleGroup"><small>Support is typing…</small><div className="chatBubble chatDots">•••</div></div></div>}<div ref={end}/>
  </div>
  {messages.length===1&&<div className="chatQuickReplies"><button onClick={()=>void send("How can I check my booking status?")}><Clock3 size={16}/> Booking status</button><button onClick={()=>void send("I need help with my vehicle problem.")}><Wrench size={16}/> Vehicle help</button><button onClick={()=>void send("I need help with payment options.")}><ShieldCheck size={16}/> Payment help</button></div>}
  {error&&<p className="chatError">{error}</p>}
  <div className="chatComposerWrap"><form className="chatComposer" onSubmit={submit}><input value={draft} onChange={e=>setDraft(e.target.value)} placeholder="Type your message…" maxLength={1500} disabled={busy} aria-label="Your message"/><button disabled={!draft.trim()||busy} aria-label="Send message"><Send size={19}/></button></form><p>AI can make mistakes. For booking-specific help, visit <a href="/bookings">My Bookings</a>.</p></div>
 </section></main>
}