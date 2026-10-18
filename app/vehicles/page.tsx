"use client";
import { useCallback, useEffect, useState } from "react";
import { Plus, CarFront, Bike, BusFront, ChevronRight, Trash2, RefreshCw, Truck, LoaderCircle, ArrowLeft } from "lucide-react";

type Vehicle = { _id: string; type: string; brand: string; model: string; year: number; registrationNumber: string; fuelType: string; color?: string };
const vehicleIcon = (type: string) => type === "CAR" ? CarFront : type === "TRUCK" ? Truck : type === "BUS" ? BusFront : Bike;
const vehicleTypeName = (type: string) => ({ CAR: "Car", BIKE: "Bike", SCOOTER: "Scooter", TRUCK: "Truck", BUS: "Bus" }[type] || type);

export default function Vehicles() {
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState("");
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async (manual = false) => {
    setError("");
    if (manual) setRefreshing(true);
    try {
      const response = await fetch("/api/vehicles", { cache: "no-store" });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Could not load vehicles.");
      setVehicles(data.vehicles || []);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not load vehicles.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { void load(); }, [load]);

  const remove = async (id: string) => {
    if (!window.confirm("Remove this vehicle from your account?")) return;
    setBusy(id); setError("");
    try {
      const response = await fetch("/api/vehicles/" + id, { method: "DELETE" });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Could not delete vehicle.");
      setVehicles(old => old.filter(vehicle => vehicle._id !== id));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not delete vehicle.");
    } finally { setBusy(""); }
  };

  return <main className="appPage vehicleListPage">
    <header className="pageHeader vehicleListHeader">
      <a href="/home" aria-label="Back to home"><ArrowLeft /></a>
      <h1>My Vehicles</h1>
      <div className="vehicleHeaderActions">
        <button type="button" className="vehicleHeaderIcon" onClick={() => void load(true)} disabled={refreshing || loading} aria-label="Refresh vehicles">{refreshing || loading ? <LoaderCircle className="spinIcon" size={20} /> : <RefreshCw size={20} />}</button>
        <a className="vehicleHeaderAdd" href="/vehicles/add" aria-label="Add vehicle"><Plus size={22} /></a>
      </div>
    </header>

    {error && <p className="setupError vehicleListError" role="alert">{error}</p>}

    <section className="vehicleList">
      {loading ? <div className="vehicleLoading"><LoaderCircle className="spinIcon" size={24} /><span>Loading your vehicles…</span></div> :
        vehicles.length === 0 ? <div className="vehicleEmptyCard">
          <div className="vehicleEmptyIcon"><CarFront size={31} /></div>
          <span className="vehicleEyebrow">YOUR GARAGE</span>
          <h2>No vehicles saved yet</h2>
          <p>Add your car, bike, scooter, truck or bus once. We’ll keep the details ready for your next roadside-help request.</p>
          <a className="primaryWide vehicleEmptyCta" href="/vehicles/add"><Plus size={20} /> Add your first vehicle <ChevronRight size={19} /></a>
          <button className="vehicleRefreshLink" type="button" onClick={() => void load(true)} disabled={refreshing}>{refreshing ? <LoaderCircle className="spinIcon" size={16} /> : <RefreshCw size={16} />}{refreshing ? "Refreshing…" : "Refresh list"}</button>
        </div> :
        <>
          <div className="vehicleListIntro"><div><span className="vehicleEyebrow">YOUR GARAGE</span><p>{vehicles.length} saved {vehicles.length === 1 ? "vehicle" : "vehicles"}</p></div><a href="/vehicles/add"><Plus size={17} /> Add vehicle</a></div>
          {vehicles.map(vehicle => {
            const Icon = vehicleIcon(vehicle.type);
            return <article className="vehicleCard" key={vehicle._id}>
              <div className="vehicleCardIcon"><Icon size={25} /></div>
              <section>
                <b>{vehicle.brand} {vehicle.model}</b>
                <span>{vehicleTypeName(vehicle.type)} · {vehicle.year} · {vehicle.fuelType.replaceAll("_", " ")}</span>
                <small>{vehicle.registrationNumber}{vehicle.color ? " · " + vehicle.color : ""}</small>
              </section>
              <button className="iconBtn vehicleDeleteBtn" disabled={busy === vehicle._id} onClick={() => void remove(vehicle._id)} aria-label={"Remove " + vehicle.registrationNumber}>{busy === vehicle._id ? <LoaderCircle className="spinIcon" size={18} /> : <Trash2 size={18} />}</button>
              <ChevronRight className="vehicleCardChevron" size={19} />
            </article>;
          })}
          <button className="vehicleRefreshLink vehicleRefreshBottom" type="button" onClick={() => void load(true)} disabled={refreshing}>{refreshing ? <LoaderCircle className="spinIcon" size={16} /> : <RefreshCw size={16} />}{refreshing ? "Refreshing…" : "Refresh list"}</button>
        </>}
    </section>
  </main>;
}
