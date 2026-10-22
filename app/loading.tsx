import { Wrench } from "lucide-react";

export default function Loading() {
  return (
    <main className="mg-loading-screen" role="status" aria-live="polite" aria-label="Loading MechanicGo">
      <div className="mg-route-loader-card">
        <div className="mg-route-mascot">
          <img src="/mechanicgo-mechanic.svg" alt="" />
          <span><Wrench size={20} /></span>
        </div>
        <div className="mg-route-loader-title">MechanicGo</div>
        <p>Our mechanic is getting things ready…</p>
        <div className="mg-route-loader-track"><span /></div>
      </div>
      <style>{`
        .mg-loading-screen{min-height:65dvh;display:grid;place-items:center;padding:22px;background:#f6faf7}
        .mg-loading-screen .mg-route-loader-card{width:min(100%,310px);padding:27px 24px 23px;border:1px solid #dceee2;border-radius:26px;background:#fff;box-shadow:0 24px 70px #124a2b12;text-align:center}
        .mg-loading-screen .mg-route-mascot{position:relative;width:100px;height:92px;margin:0 auto 10px;display:grid;place-items:center}
        .mg-loading-screen .mg-route-mascot img{width:82px;height:86px;object-fit:contain;animation:mgMechanicBusy .9s ease-in-out infinite alternate;transform-origin:50% 85%}
        .mg-loading-screen .mg-route-mascot>span{position:absolute;right:2px;bottom:8px;width:31px;height:31px;border-radius:50%;display:grid;place-items:center;background:#e7f7ed;color:#07865e;animation:mgWrenchBusy .75s ease-in-out infinite alternate}
        .mg-loading-screen .mg-route-loader-title{font:800 18px Manrope,system-ui,sans-serif;color:#163329}
        .mg-loading-screen p{margin:6px 0 18px;font-size:12px;color:#72867a}
        .mg-loading-screen .mg-route-loader-track{height:4px;border-radius:99px;overflow:hidden;background:#e0f1e6}
        .mg-loading-screen .mg-route-loader-track span{display:block;width:35%;height:100%;border-radius:99px;background:linear-gradient(90deg,#079669,#7cdda7);animation:mgLoaderProgress 1.05s ease-in-out infinite}
        @media(prefers-reduced-motion:reduce){.mg-loading-screen .mg-route-mascot img,.mg-loading-screen .mg-route-mascot>span,.mg-loading-screen .mg-route-loader-track span{animation:none}}
      `}</style>
    </main>
  );
}
