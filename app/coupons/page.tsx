"use client";

import { useCallback, useEffect, useState, type FormEvent } from "react";
import { ArrowLeft, BadgeCheck, CheckCircle2, CircleAlert, Clock3, Copy, Gift, LoaderCircle, Ticket, XCircle } from "lucide-react";
import { Bottom } from "../components";

type Coupon = { code: string; amount: number; active: boolean; status: "CLAIMED" | "USED" | "INACTIVE"; startsAt?: string | null; expiresAt?: string | null; claimedAt?: string | null; redeemedAt?: string | null };
const money = (amount: number) => new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(amount);
const dateLabel = (value?: string | null) => value ? new Date(value).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }) : "";

export default function CouponsPage() {
  const [code, setCode] = useState("");
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const loadCoupons = useCallback(async () => {
    try {
      const response = await fetch("/api/coupons", { cache: "no-store" });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Could not load coupons.");
      setCoupons(Array.isArray(data.coupons) ? data.coupons : []);
    } catch (e) { setError(e instanceof Error ? e.message : "Could not load coupons."); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { void loadCoupons(); }, [loadCoupons]);

  const claimCoupon = async (event: FormEvent) => {
    event.preventDefault();
    setError(""); setMessage("");
    const clean = code.trim().toUpperCase().replace(/\s+/g, "");
    if (!/^[A-Z0-9]{12}$/.test(clean)) { setError("Enter all 12 letters/numbers from your coupon."); return; }
    setBusy(true);
    try {
      const response = await fetch("/api/coupons", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ code: clean }) });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "This coupon could not be claimed.");
      setMessage(`Coupon claimed! You have ${money(Number(data.coupon.amount))} in coupon value.`);
      setCode("");
      await loadCoupons();
    } catch (e) { setError(e instanceof Error ? e.message : "Could not claim this coupon."); }
    finally { setBusy(false); }
  };

  const copyCode = async (value: string) => {
    try { await navigator.clipboard.writeText(value); setMessage("Coupon code copied."); }
    catch { setMessage("Your coupon code is " + value); }
  };

  return <main className="appPage couponsPage">
    <header className="pageHeader"><a href="/profile" aria-label="Back to profile"><ArrowLeft size={21}/></a><h1>Coupons & Offers</h1><span className="couponsHeaderIcon"><Ticket size={20}/></span></header>
    <section className="couponHero">
      <div className="couponHeroOrb couponHeroOrbOne"/><div className="couponHeroOrb couponHeroOrbTwo"/>
      <div className="couponHeroTop"><span className="couponHeroIcon"><Gift size={23}/></span><span className="couponHeroBadge"><SparkIcon/> Exclusive offer</span></div>
      <p className="couponEyebrow">YOUR NEXT REPAIR, FOR LESS</p>
      <h2>Got a coupon code?</h2>
      <p className="couponHeroText">Enter the 12-character code shared with you. We’ll verify it and show its exact value before you claim it.</p>
      <form className="couponClaimForm" onSubmit={claimCoupon}>
        <label htmlFor="coupon-code">12-character coupon code</label>
        <div className="couponInputRow"><input id="coupon-code" value={code} onChange={e=>setCode(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g,"").slice(0,12))} autoCapitalize="characters" autoComplete="off" spellCheck={false} maxLength={12} placeholder="e.g. MG7K2P9X4B6Q"/><span>{code.length}/12</span></div>
        <button className="couponClaimButton" type="submit" disabled={busy || code.length !== 12}>{busy ? <><LoaderCircle className="couponSpin" size={18}/> Verifying coupon…</> : <>Verify & claim <Ticket size={18}/></>}</button>
      </form>
    </section>
    {message && <div className="couponMessage couponMessageSuccess" role="status"><CheckCircle2 size={18}/><span>{message}</span><button onClick={()=>setMessage("")} aria-label="Dismiss message"><XCircle size={17}/></button></div>}
    {error && <div className="couponMessage couponMessageError" role="alert"><CircleAlert size={18}/><span>{error}</span><button onClick={()=>setError("")} aria-label="Dismiss error"><XCircle size={17}/></button></div>}
    <section className="couponListSection">
      <div className="couponSectionHeading"><div><span className="couponEyebrow">SAVED TO YOUR ACCOUNT</span><h2>My coupons</h2></div><span className="couponCount">{coupons.length}</span></div>
      {loading ? <div className="couponLoading"><LoaderCircle className="couponSpin" size={22}/> Loading your coupons…</div> : coupons.length === 0 ? <div className="couponEmpty"><span><Ticket size={25}/></span><h3>Your offers will appear here</h3><p>Claim a coupon above. Its value and status will stay here so you can apply it while booking a mechanic.</p></div> :
        <div className="couponList">{coupons.map(c=> <article className={"couponCard "+(c.status!=="CLAIMED"?"couponCardMuted":"")} key={c.code}>
          <div className="couponCardMain"><div className="couponValue"><small>COUPON VALUE</small><strong>{money(c.amount)}</strong></div><span className={"couponStatus "+(c.status==="CLAIMED"?"couponStatusReady":c.status==="USED"?"couponStatusUsed":"couponStatusOff")}>{c.status==="CLAIMED"?"Ready to use":c.status==="USED"?"Already used":"Inactive"}</span></div>
          <div className="couponCodeLine"><code>{c.code}</code><button type="button" onClick={()=>void copyCode(c.code)} aria-label={"Copy coupon "+c.code}><Copy size={16}/> Copy</button></div>
          <div className="couponCardFooter"><span><Clock3 size={14}/>{c.expiresAt ? "Expires "+dateLabel(c.expiresAt) : "No expiry date set"}</span>{c.status==="CLAIMED" ? <a href={"/customer/book?coupon="+encodeURIComponent(c.code)}>Use on booking <BadgeCheck size={15}/></a> : <span>{c.status==="USED"?"Redeemed":"Disabled by issuer"}</span>}</div>
        </article>)}</div>}
    </section>
    <div className="couponSecurityNote"><CheckCircle2 size={17}/><p>Each coupon can be claimed by one account and redeemed once. The issuer can deactivate a code at any time.</p></div>
    <Bottom active="profile"/>
  </main>;
}

function SparkIcon() { return <span aria-hidden="true">✦</span>; }
