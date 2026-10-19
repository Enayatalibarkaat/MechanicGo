"use client";

import { useEffect } from "react";

export default function RouteTransitions() {
  useEffect(() => {
    const onClick = (event: MouseEvent) => {
      if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
      const target = event.target;
      if (!(target instanceof Element)) return;
      const link = target.closest("a[href]") as HTMLAnchorElement | null;
      if (!link || link.target === "_blank" || link.hasAttribute("download")) return;
      const rawHref = link.getAttribute("href") || "";
      if (!rawHref || rawHref.startsWith("#") || /^(mailto:|tel:|javascript:)/i.test(rawHref)) return;
      let destination: URL;
      try { destination = new URL(link.href, window.location.href); } catch { return; }
      if (destination.origin !== window.location.origin) return;
      if (destination.pathname === window.location.pathname && destination.search === window.location.search && destination.hash !== "") return;
      if (destination.href === window.location.href) return;

      const currentParts = window.location.pathname.split("/").filter(Boolean);
      const nextParts = destination.pathname.split("/").filter(Boolean);
      const label = [link.getAttribute("aria-label"), link.getAttribute("title"), link.textContent].filter(Boolean).join(" ").toLowerCase();
      const isBack = link.dataset.transition === "back" || /(^|\\b)(back|go back|close|cancel)(\\b|$)/i.test(label) || nextParts.length < currentParts.length;
      const direction = isBack ? "back" : "forward";
      try { sessionStorage.setItem("mg-page-direction", direction); } catch {}
      document.documentElement.classList.remove("mg-page-leaving-forward", "mg-page-leaving-back");
      document.documentElement.classList.add(isBack ? "mg-page-leaving-back" : "mg-page-leaving-forward");
      event.preventDefault();
      window.setTimeout(() => { window.location.assign(destination.href); }, 105);
    };
    const clearAnimation = () => {
      document.documentElement.classList.remove("mg-page-leaving-forward", "mg-page-leaving-back");
      delete document.documentElement.dataset.mgNav;
    };
    document.addEventListener("click", onClick, true);
    window.addEventListener("pageshow", clearAnimation);
    const reset = window.setTimeout(clearAnimation, 460);
    return () => {
      document.removeEventListener("click", onClick, true);
      window.removeEventListener("pageshow", clearAnimation);
      window.clearTimeout(reset);
    };
  }, []);
  return null;
}
