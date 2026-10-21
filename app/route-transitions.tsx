"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { Wrench } from "lucide-react";

export default function RouteTransitions() {
  const router = useRouter();
  const pathname = usePathname();
  const [loading, setLoading] = useState(false);
  const timeoutRef = useRef<number | null>(null);

  useEffect(() => {
    setLoading(false);
    document.documentElement.classList.remove("mg-page-leaving-forward", "mg-page-leaving-back");
    if (timeoutRef.current) window.clearTimeout(timeoutRef.current);
  }, [pathname]);

  useEffect(() => {
    const onClick = (event: MouseEvent) => {
      if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
      const target = event.target;
      if (!(target instanceof Element)) return;
      const link = target.closest("a[href]") as HTMLAnchorElement | null;
      if (!link || link.target === "_blank" || link.hasAttribute("download") || link.getAttribute("rel") === "external") return;
      const rawHref = link.getAttribute("href") || "";
      if (!rawHref || rawHref.startsWith("#") || /^(mailto:|tel:|javascript:)/i.test(rawHref)) return;
      let destination: URL;
      try { destination = new URL(link.href, window.location.href); } catch { return; }
      if (destination.origin !== window.location.origin) return;
      if (destination.pathname === window.location.pathname && destination.search === window.location.search) {
        if (destination.hash && destination.hash !== window.location.hash) return;
        return;
      }

      const currentParts = window.location.pathname.split("/").filter(Boolean);
      const nextParts = destination.pathname.split("/").filter(Boolean);
      const label = [link.getAttribute("aria-label"), link.getAttribute("title"), link.textContent].filter(Boolean).join(" ").toLowerCase();
      const isBack = link.dataset.transition === "back" || /(back|go back|close|cancel)/i.test(label) || nextParts.length < currentParts.length;
      document.documentElement.dataset.mgNav = isBack ? "back" : "forward";
      setLoading(true);
      if (timeoutRef.current) window.clearTimeout(timeoutRef.current);
      // Client-side navigation avoids a full page reload and keeps the current screen responsive.
      event.preventDefault();
      router.push(destination.pathname + destination.search + destination.hash);
      timeoutRef.current = window.setTimeout(() => setLoading(false), 12000);
      if (destination.pathname === window.location.pathname) {
        window.setTimeout(() => setLoading(false), 250);
      }
    };
    const onPopState = () => { document.documentElement.dataset.mgNav = "back"; };
    document.addEventListener("click", onClick, true);
    window.addEventListener("popstate", onPopState);
    return () => {
      document.removeEventListener("click", onClick, true);
      window.removeEventListener("popstate", onPopState);
      if (timeoutRef.current) window.clearTimeout(timeoutRef.current);
    };
  }, [router]);

  return loading ? <div className="mg-route-loader" role="status" aria-live="polite" aria-label="Loading page">
    <div className="mg-route-loader-card">
      <div className="mg-route-mascot"><img src="/mechanicgo-mechanic.svg" alt="MechanicGo mechanic at work"/><span><Wrench size={20}/></span></div>
      <div className="mg-route-loader-title">MechanicGo</div>
      <p>Getting things ready for you…</p>
      <div className="mg-route-loader-track"><span/></div>
    </div>
  </div> : null;
}
