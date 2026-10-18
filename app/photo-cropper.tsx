"use client";

import { useEffect, useRef, useState } from "react";
import { Check, Move, X } from "lucide-react";

type Props = {
  file: File | null;
  onCancel: () => void;
  onCrop: (dataUrl: string) => void;
};

const FRAME = 280;
const OUTPUT = 480;

export default function PhotoCropper({ file, onCancel, onCrop }: Props) {
  const [source, setSource] = useState("");
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });
  const [zoom, setZoom] = useState(1);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [error, setError] = useState("");
  const drag = useRef<{ pointerX: number; pointerY: number; x: number; y: number } | null>(null);
  const scale = dimensions.width && dimensions.height
    ? Math.max(FRAME / dimensions.width, FRAME / dimensions.height) * zoom
    : 1;
  const imageWidth = dimensions.width * scale;
  const imageHeight = dimensions.height * scale;

  useEffect(() => {
    if (!file) { setSource(""); return; }
    const url = URL.createObjectURL(file);
    setSource(url);
    setDimensions({ width: 0, height: 0 });
    setZoom(1);
    setPosition({ x: 0, y: 0 });
    setError("");
    return () => URL.revokeObjectURL(url);
  }, [file]);

  useEffect(() => {
    if (!dimensions.width || !dimensions.height) return;
    const s = Math.max(FRAME / dimensions.width, FRAME / dimensions.height);
    const w = dimensions.width * s;
    const h = dimensions.height * s;
    setPosition({ x: (FRAME - w) / 2, y: (FRAME - h) / 2 });
  }, [dimensions.width, dimensions.height]);

  if (!file) return null;

  const clamp = (x: number, y: number, w = imageWidth, h = imageHeight) => ({
    x: Math.min(0, Math.max(FRAME - w, x)),
    y: Math.min(0, Math.max(FRAME - h, y))
  });

  const changeZoom = (next: number) => {
    const centerX = FRAME / 2 - position.x;
    const centerY = FRAME / 2 - position.y;
    const ratio = next / zoom;
    const nextScale = scale * ratio;
    const nextWidth = dimensions.width * nextScale;
    const nextHeight = dimensions.height * nextScale;
    const nextPosition = clamp(FRAME / 2 - centerX * ratio, FRAME / 2 - centerY * ratio, nextWidth, nextHeight);
    setZoom(next);
    setPosition(nextPosition);
  };

  const finishCrop = () => {
    setError("");
    const image = new Image();
    image.onerror = () => setError("Photo could not be processed. Please choose another image.");
    image.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = OUTPUT;
      canvas.height = OUTPUT;
      const context = canvas.getContext("2d");
      if (!context) { setError("Photo processing is not supported on this device."); return; }
      const sourceScale = scale;
      const sx = Math.max(0, Math.min(image.naturalWidth - FRAME / sourceScale, -position.x / sourceScale));
      const sy = Math.max(0, Math.min(image.naturalHeight - FRAME / sourceScale, -position.y / sourceScale));
      const side = Math.min(image.naturalWidth, image.naturalHeight, FRAME / sourceScale);
      context.drawImage(image, sx, sy, side, side, 0, 0, OUTPUT, OUTPUT);
      onCrop(canvas.toDataURL("image/jpeg", 0.88));
    };
    image.src = source;
  };

  return (
    <div role="dialog" aria-modal="true" aria-labelledby="photo-crop-title" className="photoCropOverlay">
      <section className="photoCropDialog">
        <header className="photoCropHeader">
          <div><h2 id="photo-crop-title">Crop profile photo</h2><p>Drag the photo and adjust zoom. The saved crop is square (1:1).</p></div>
          <button type="button" onClick={onCancel} aria-label="Cancel crop"><X size={22}/></button>
        </header>
        <div
          className="photoCropViewport"
          onPointerDown={e => {
            if (!dimensions.width) return;
            e.currentTarget.setPointerCapture(e.pointerId);
            drag.current = { pointerX: e.clientX, pointerY: e.clientY, x: position.x, y: position.y };
          }}
          onPointerMove={e => {
            if (!drag.current) return;
            setPosition(clamp(drag.current.x + e.clientX - drag.current.pointerX, drag.current.y + e.clientY - drag.current.pointerY));
          }}
          onPointerUp={() => { drag.current = null; }}
          onPointerCancel={() => { drag.current = null; }}
          style={{ touchAction: "none" }}
        >
          {source && <img
            src={source}
            alt="Crop preview"
            draggable={false}
            onLoad={e => setDimensions({ width: e.currentTarget.naturalWidth, height: e.currentTarget.naturalHeight })}
            style={{ position: "absolute", width: imageWidth || "100%", height: imageHeight || "100%", maxWidth: "none", maxHeight: "none", left: position.x, top: position.y, pointerEvents: "none", userSelect: "none" }}
          />}
          <div className="photoCropCircle" aria-hidden="true" />
          <span className="photoCropHint"><Move size={14}/> Drag to position</span>
        </div>
        <label className="photoCropZoom">Zoom <input type="range" min={1} max={3} step={0.01} value={zoom} onChange={e => changeZoom(Number(e.target.value))} disabled={!dimensions.width}/><span>{zoom.toFixed(1)}×</span></label>
        {error && <p className="photoCropError" role="alert">{error}</p>}
        <footer className="photoCropActions"><button type="button" className="photoCropCancel" onClick={onCancel}>Cancel</button><button type="button" className="photoCropConfirm" onClick={finishCrop} disabled={!dimensions.width}><Check size={18}/> Use this photo</button></footer>
      </section>
    </div>
  );
}
