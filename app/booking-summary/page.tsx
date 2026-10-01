"use client";
import {useState} from "react";
import {ArrowLeft,CalendarDays,MapPin,Star,Ticket,WalletCards,CreditCard,Landmark,ChevronRight,type LucideIcon} from "lucide-react";

const paymentMethods: Array<[string,string,string,LucideIcon]> = [
  ["upi","UPI (GPay / PhonePe)","Instant payment & verification",WalletCards],
  ["card","Credit / Debit Card","Visa, Mastercard, RuPay",CreditCard],
  ["cash","Cash After Service","Pay directly to mechanic",Landmark]
];

export default function BookingSummary(){
  const[p,setP]=useState("upi");
  return <main className="appPage">
    <header className="pageHeader"><a href="/home"><ArrowLeft/></a><h1>Booking Summary</h1></header>
    <section className="summaryCard"><div className="serviceBig"><div><CalendarDays/></div><article><b>Car General Service</b><span>▣ Today, 2:45 PM</span><span><MapPin size={15}/> Kanpur, Uttar Pradesh</span></article></div></section>
    <section className="summaryCard mechanicSummary"><div className="proAvatar">AK</div><article><b>Arun Kumar</b><span><Star size={14}/> 4.9 · <strong>Verified Expert</strong></span></article><a href="/profile">View Profile</a></section>
    <section className="summaryCard paymentDetails"><label>PAYMENT DETAILS</label><p><span>Visiting Charge</span><b>₹299</b></p><p><span>Service Charge</span><b>₹1,200</b></p><p><span>Tax (GST 12%)</span><b>₹150</b></p><hr/><p className="total"><span>Total Amount</span><b>₹1,649</b></p></section>
    <button className="coupon"><Ticket/> Apply Coupon <b>SELECT</b></button>
    <section className="paymentMethods"><label>PAYMENT METHODS</label>
      {paymentMethods.map(([id,t,s,Icon])=><button className={p===id?"payOption selected":"payOption"} key={id} onClick={()=>setP(id)}><Icon/><span><b>{t}</b><small>{s}</small></span><i/></button>)}
    </section>
    <a className="payCta" href="/booking-confirmed">Confirm & Pay ₹1,649 <ChevronRight/></a>
    <p className="terms">By paying, you agree to MechanicGo's <b>Terms of Service</b></p>
  </main>
}