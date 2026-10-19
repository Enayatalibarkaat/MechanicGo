"use client";

import Script from "next/script";
import { useCallback, useEffect, useRef, useState } from "react";
import { LocateFixed, Navigation, ShieldCheck, Wifi, WifiOff } from "lucide-react";

declare global { interface Window { L?: any } }
type Role = "CUSTOMER" | "MECHANIC";
type Point = { lat: number; lng: number; heading?: number | null; speed?: number | null; updatedAt?: string | null } | null;
type Snapshot = { status: string; address?: string; customerLocation: Point; mechanicLocation: Point };

export default function LiveTrackingMap({ bookingId, role }: { bookingId: string; role: Role }) {
  const mapRef = useRef<any>(null);
  const customerMarkerRef = useRef<any>(null);
  const mechanicMarkerRef = useRef<any>(null);
  const routeRef = useRef<any>(null);
  const watchRef = useRef<number | null>(null);
  const lastSentRef = useRef(0);
  const [leafletReady, setLeafletReady] = useState(false);
  const [snapshot, setSnapshot] = useState<Snapshot | null>(null);
  const [sharing, setSharing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const fetchSnapshot = useCallback(async () => {
    try {
      const response = await fetch("/api/bookings/" + encodeURIComponent(bookingId) + "/location", { cache: "no-store" });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Could not load live location.");
      setSnapshot(data);
      setError("");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not load live location.");
    } finally { setLoading(false); }
  }, [bookingId]);

  const sendPosition = useCallback(async (position: GeolocationPosition) => {
    const now = Date.now();
    if (now - lastSentRef.current < 4000) return;
    lastSentRef.current = now;
    const coords = position.coords;
    try {
      const response = await fetch("/api/bookings/" + encodeURIComponent(bookingId) + "/location", {
        method: "PATCH", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ lat: coords.latitude, lng: coords.longitude, heading: coords.heading, speed: coords.speed })
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Location sharing could not be updated.");
      setMessage("Location updated just now.");
      void fetchSnapshot();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Location update failed.");
    }
  }, [bookingId, fetchSnapshot]);

  const startSharing = useCallback(() => {
    if (!navigator.geolocation) { setError("This browser does not support GPS location."); return; }
    if (watchRef.current !== null) return;
    setError(""); setMessage("Waiting for GPS permission…");
    const id = navigator.geolocation.watchPosition(
      position => { setSharing(true); setMessage("Your live location is being shared securely."); void sendPosition(position); },
      geoError => {
        setSharing(false);
        const reason = geoError.code === 1 ? "Please allow location permission in your browser to share GPS." : geoError.code === 2 ? "GPS location is unavailable. Try moving outdoors." : "GPS request timed out. Please try again.";
        setError(reason);
        if (watchRef.current !== null) navigator.geolocation.clearWatch(watchRef.current);
        watchRef.current = null;
      },
      { enableHighAccuracy: true, maximumAge: 3000, timeout: 20000 }
    );
    watchRef.current = id;
  }, [sendPosition]);

  const stopSharing = useCallback(() => {
    if (watchRef.current !== null && navigator.geolocation) navigator.geolocation.clearWatch(watchRef.current);
    watchRef.current = null; setSharing(false); setMessage("Live location sharing stopped on this device.");
  }, []);

  useEffect(() => {
    void fetchSnapshot();
    const timer = window.setInterval(() => void fetchSnapshot(), 5000);
    return () => window.clearInterval(timer);
  }, [fetchSnapshot]);

  useEffect(() => () => {
    if (watchRef.current !== null && navigator.geolocation) navigator.geolocation.clearWatch(watchRef.current);
    if (mapRef.current) { mapRef.current.remove(); mapRef.current = null; }
  }, []);

  useEffect(() => {
    if (role === "MECHANIC" && snapshot?.status === "ACCEPTED" && watchRef.current === null) startSharing();
    if (snapshot && snapshot.status !== "ACCEPTED") stopSharing();
  }, [role, snapshot?.status, startSharing, stopSharing]);

  useEffect(() => {
    const L = window.L;
    if (!leafletReady || !L || mapRef.current) return;
    const map = L.map("mechanicgo-live-map", { zoomControl: false, scrollWheelZoom: true }).setView([27.95, 80.78], 13);
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      maxZoom: 19, attribution: '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noreferrer">OpenStreetMap</a> contributors'
    }).addTo(map);
    L.control.zoom({ position: "bottomright" }).addTo(map);
    mapRef.current = map;
    window.setTimeout(() => map.invalidateSize(), 150);
    return () => { if (mapRef.current === map) { map.remove(); mapRef.current = null; } };
  }, [leafletReady]);

  useEffect(() => {
    const L = window.L; const map = mapRef.current;
    if (!leafletReady || !L || !map || !snapshot) return;
    const customer = snapshot.customerLocation;
    const mechanic = snapshot.mechanicLocation;
    const points: any[] = [];
    if (customer && Number.isFinite(customer.lat) && Number.isFinite(customer.lng)) {
      const ll = [customer.lat, customer.lng];
      const icon = L.divIcon({ className: "mg-customer-marker-wrap", html: '<span class="mg-customer-marker"><span></span></span>', iconSize: [30, 30], iconAnchor: [15, 15] });
      if (!customerMarkerRef.current) customerMarkerRef.current = L.marker(ll, { icon, zIndexOffset: 900 }).addTo(map).bindPopup("Customer location");
      else customerMarkerRef.current.setLatLng(ll);
      points.push(ll);
    }
    if (mechanic && Number.isFinite(mechanic.lat) && Number.isFinite(mechanic.lng)) {
      const ll = [mechanic.lat, mechanic.lng];
      const icon = L.divIcon({ className: "mg-mechanic-marker-wrap", html: '<span class="mg-mechanic-marker"><img src="/mechanic-tracker.svg" alt="Mechanic" /></span>', iconSize: [58, 64], iconAnchor: [29, 54] });
      if (!mechanicMarkerRef.current) mechanicMarkerRef.current = L.marker(ll, { icon, zIndexOffset: 1000 }).addTo(map).bindPopup("Mechanic is on the way");
      else {
        const old = mechanicMarkerRef.current.getLatLng();
        const target = L.latLng(ll[0], ll[1]);
        const started = performance.now(); const duration = 850;
        const animate = (now: number) => {
          const t = Math.min(1, (now - started) / duration);
          const eased = t * (2 - t);
          mechanicMarkerRef.current?.setLatLng([old.lat + (target.lat - old.lat) * eased, old.lng + (target.lng - old.lng) * eased]);
          if (t < 1) requestAnimationFrame(animate);
        };
        requestAnimationFrame(animate);
      }
      points.push(ll);
    }
    if (customer && mechanic) {
      const routeUrl = "https://router.project-osrm.org/route/v1/driving/" + mechanic.lng + "," + mechanic.lat + ";" + customer.lng + "," + customer.lat + "?overview=full&geometries=geojson";
      fetch(routeUrl).then(r => r.ok ? r.json() : null).then(data => {
        if (!data?.routes?.[0]?.geometry?.coordinates || !mapRef.current) return;
        const latlngs = data.routes[0].geometry.coordinates.map((p: number[]) => [p[1], p[0]]);
        if (!routeRef.current) routeRef.current = L.polyline(latlngs, { color: "#2563eb", weight: 5, opacity: .88, dashArray: "10 9", lineCap: "round", className: "mg-route-line" }).addTo(map);
        else routeRef.current.setLatLngs(latlngs);
      }).catch(() => {});
    } else if (routeRef.current) { map.removeLayer(routeRef.current); routeRef.current = null; }
    if (points.length > 1) map.fitBounds(L.latLngBounds(points), { padding: [48, 48], maxZoom: 16, animate: true, duration: .6 });
    else if (points.length === 1) map.setView(points[0], Math.max(map.getZoom(), 15), { animate: true });
  }, [leafletReady, snapshot?.customerLocation?.lat, snapshot?.customerLocation?.lng, snapshot?.mechanicLocation?.lat, snapshot?.mechanicLocation?.lng, snapshot?.status]);

  const active = snapshot?.status === "ACCEPTED";
  return <section className="mg-live-card">
    <Script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js" strategy="afterInteractive" onReady={() => setLeafletReady(true)} />
    <div className="mg-map-heading"><div><span className="mg-live-kicker"><i className={active ? "is-live" : ""}/>{active ? "LIVE TRACKING" : "TRACKING STATUS"}</span><h2>{active ? "Mechanic on the way" : snapshot?.status === "IN_PROGRESS" ? "Service in progress" : "Booking location"}</h2><p>{active ? "Map updates automatically as locations change." : "Location sharing is available while your mechanic is on the way."}</p></div><span className="mg-secure-pill"><ShieldCheck size={15}/> Private</span></div>
    <div className="mg-map-shell"><div id="mechanicgo-live-map" className="mg-leaflet-map" aria-label="Live roadside assistance map"/>{!leafletReady&&<div className="mg-map-loading"><span className="bookingSpinner"/>Loading map…</div>}</div>
    <div className="mg-map-legend"><span><i className="mg-legend-customer"/>Customer</span><span><img src="/mechanic-tracker.svg" alt=""/>Mechanic</span><span><i className="mg-legend-route"/>Route</span></div>
    {role === "CUSTOMER" && active && <button className={sharing ? "mg-share-location is-sharing" : "mg-share-location"} onClick={sharing ? stopSharing : startSharing}><LocateFixed size={18}/>{sharing ? "Stop sharing my location" : "Share my live location"}</button>}
    {role === "MECHANIC" && active && <><div className="mg-sharing-status"><Wifi size={17}/>{sharing ? "Sharing your live location with this customer" : "Location sharing is not active yet."}</div>{!sharing&&<button className="mg-share-location" onClick={startSharing}><LocateFixed size={18}/>Start sharing live location</button>}</>}
    {loading && <p className="mg-map-feedback">Connecting to live booking…</p>}
    {message && <p className="mg-map-feedback"><Wifi size={15}/>{message}</p>}
    {error && <p className="mg-map-error" role="alert">{error}</p>}
    {!active && snapshot && <p className="mg-map-feedback"><WifiOff size={15}/> Live sharing is paused because this booking is no longer in the mechanic-on-the-way stage.</p>}
    {active && !snapshot?.mechanicLocation && <p className="mg-map-feedback">Waiting for the mechanic to share GPS. Keep this page open for live updates.</p>}
    <p className="mg-map-footnote">Location sharing runs only during an accepted booking. Closing this page stops browser GPS sharing; the server also rejects updates after the booking status changes.</p>
  </section>;
}
