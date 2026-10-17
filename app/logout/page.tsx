"use client";
import { useEffect } from "react";
export default function LogoutPage(){useEffect(()=>{fetch("/api/auth/logout",{method:"POST"}).finally(()=>{localStorage.removeItem("mechanicgo_auth");localStorage.removeItem("mechanicgo_profile_complete");location.replace("/auth");});},[]);return <main className="entryScreen"><h1>Signing out…</h1></main>;}