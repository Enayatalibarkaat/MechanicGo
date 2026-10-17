"use client";
import { useEffect } from "react";
export default function LogoutPage() {
  useEffect(() => {
    fetch("/api/auth/logout", { method: "POST" }).finally(() => {
      for (const key of [
        "mechanicgo_auth", "mechanicgo_profile_complete", "mechanicgo_email",
        "mechanicgo_email_verified", "mechanicgo_username", "mechanicgo_profile_name",
        "mechanicgo_pending_name", "mechanicgo_telegram_consent", "mechanicgo_profile"
      ]) localStorage.removeItem(key);
      location.replace("/auth");
    });
  }, []);
  return <main className="entryScreen"><h1>Signing out…</h1></main>;
}
