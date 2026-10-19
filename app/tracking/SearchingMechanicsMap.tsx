"use client";

import Script from "next/script";
import { useEffect, useRef, useState } from "react";
import { MapPin, Radio, Search } from "lucide-react";

declare global { interface Window { L?: any } }

export default function SearchingMechanicsMap({ address, lat, lng }: { address: string; lat?: number; lng?: number }) {
  const mapRef = useRef<any>(null);
  const timerRef = useRef<number | null>(null);
  const [ready, setReady] = useState(false);
  const [areaLabel, setAreaLabel] = useState(address || "Your service area");
  const [activePings, setActivePings] = useState(0);

  useEffect(() => {
    let cancelled = false;
    async function locateArea() {
      if (!address) return;
      try {
        const response = await fetch("https://nominatim.openstreetmap.org/search?format=jsonv2&limit=1&q=" + encodeURIComponent(address));
        const data = await response.json();
        if (!cancelled && data?.[0]) setAreaLabel(data[0].display_name?.split(",").slice(0, 3).join(",") || address);
      } catch { /* The map still opens at the local fallback when geocoding is unavailable. */ }
    }
    void locateArea();
    return () => { cancelled = true; };
  }, [address]);

  useEffect(() => {
    const L = window.L;
    if (!ready || !L || mapRef.current) return;
    const hasGps = Number.isFinite(lat) && Number.isFinite(lng);
    const initialCenter: [number, number] = hasGps ? [Number(lat), Number(lng)] : [27.95, 80.78];
    const map = L.map("mg-search-area-map", { zoomControl: false, attributionControl: true, scrollWheelZoom: false, dragging: true })
      .setView(initialCenter, 15);
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      maxZoom: 19,
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noreferrer">OpenStreetMap</a>'
    }).addTo(map);
    L.control.zoom({ position: "bottomright" }).addTo(map);
    mapRef.current = map;
    const customerIcon = L.divIcon({ className: "mg-search-home-wrap", html: '<span class="mg-search-home"><span></span></span>', iconSize: [32, 32], iconAnchor: [16, 16] });
    const home = L.marker(initialCenter, { icon: customerIcon, zIndexOffset: 1000 }).addTo(map).bindTooltip("Your service area", { permanent: false, direction: "top" });
    let geocodeCancelled = false;
    (hasGps ? Promise.resolve([]) : fetch("https://nominatim.openstreetmap.org/search?format=jsonv2&limit=1&q=" + encodeURIComponent(address || "Bhira, Lakhimpur Kheri, Uttar Pradesh, India"))
      .then(r => r.ok ? r.json() : []))
      .then(data => {
        if (geocodeCancelled || !mapRef.current || !data?.[0]) return;
        const center: [number, number] = [Number(data[0].lat), Number(data[0].lon)];
        map.setView(center, 14, { animate: true });
        home.setLatLng(center);
      }).catch(() => {});
    const active: any[] = [];
    const spawn = () => {
      if (!mapRef.current) return;
      const center = map.getCenter();
      const lat = center.lat + (Math.random() - .5) * .012;
      const lng = center.lng + (Math.random() - .5) * .016;
      const icon = L.divIcon({
        className: "mg-search-mechanic-wrap",
        html: '<span class="mg-search-mechanic"><img src="/mechanic-tracker.svg" alt=""/><span class="mg-search-popover"><b>Mechanic nearby</b><small>Checking availability…</small></span></span>',
        iconSize: [48, 64], iconAnchor: [24, 48]
      });
      const marker = L.marker([lat, lng], { icon, zIndexOffset: 700 }).addTo(map);
      active.push(marker);
      setActivePings(n => n + 1);
      window.setTimeout(() => {
        if (mapRef.current) map.removeLayer(marker);
        const index = active.indexOf(marker);
        if (index >= 0) active.splice(index, 1);
        setActivePings(n => Math.max(0, n - 1));
      }, 2300 + Math.random() * 700);
    };
    spawn();
    timerRef.current = window.setInterval(spawn, 1150);
    return () => {
      geocodeCancelled = true;
      if (timerRef.current !== null) window.clearInterval(timerRef.current);
      active.forEach(marker => { if (mapRef.current) map.removeLayer(marker); });
      if (mapRef.current === map) { map.remove(); mapRef.current = null; }
    };
  }, [ready, address, lat, lng]);

  return <section className="mg-search-map-card">
    <Script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js" strategy="afterInteractive" onReady={() => setReady(true)} />
    <div className="mg-search-map-top">
      <div className="mg-search-map-icon"><Search size={19}/></div>
      <div className="mg-search-map-copy"><span className="mg-search-eyebrow"><i/> SEARCHING YOUR AREA</span><h2>Finding your mechanic</h2><p><MapPin size={14}/>{areaLabel}</p></div>
      <span className="mg-search-count"><b>{activePings}</b><small>signals</small></span>
    </div>
    <div className="mg-search-map-shell">
      <div id="mg-search-area-map" className="mg-search-area-map" aria-label={"Mechanic search map around " + address}/>
      {!ready && <div className="mg-map-loading"><span className="bookingSpinner"/>Preparing area map…</div>}
      <div className="mg-search-map-chip"><Radio size={14}/> Live request dispatch</div>
    </div>
    <div className="mg-search-map-footer"><span className="mg-search-live-dot"/><div><b>Request sent to eligible partners</b><p>Matching mechanics who are online can accept. As soon as one accepts, the request closes for everyone else.</p></div></div>
    <p className="mg-search-disclaimer">Animated pins are a search visual, not verified mechanic GPS positions. Real mechanic location appears only after a mechanic accepts your booking.</p>
  </section>;
}
