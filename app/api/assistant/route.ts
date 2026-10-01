import {NextResponse} from "next/server";
export async function POST(req:Request){
 try{
  const {message}=await req.json(); if(!message)return NextResponse.json({error:"Message required"},{status:400});
  const key=process.env.GEMINI_API_KEY;
  if(!key)return NextResponse.json({reply:"AI support key abhi configure nahi hui hai. Filhaal main demo support mode mein hoon. Booking ID, payment ya vehicle issue bataiye."});
  const model=process.env.GEMINI_MODEL||"gemini-2.5-flash-lite";
  const prompt="You are MechanicGo's official customer-support assistant. Be polite, concise, practical and empathetic. Help with booking, mechanic ETA, payments, coupons, invoices, vehicles, service history and roadside-assistance guidance. Never claim to have performed an action you cannot actually perform. If there is an emergency, tell the user to contact local emergency services. User message: "+message;
  const r=await fetch("https://generativelanguage.googleapis.com/v1beta/models/"+model+":generateContent?key="+key,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({contents:[{parts:[{text:prompt}]}],generationConfig:{temperature:.35,maxOutputTokens:600}})});
  const j=await r.json(); if(!r.ok)return NextResponse.json({reply:"AI service temporarily unavailable. Please try again or use human support."});
  const reply=j?.candidates?.[0]?.content?.parts?.map((p:any)=>p.text||"").join("")||"Please try again.";
  return NextResponse.json({reply});
 }catch{return NextResponse.json({reply:"Support service temporarily unavailable. Please try again."});}
}