import type { Metadata } from "next";
import "./globals.css";
import "./pro.css";
export const metadata: Metadata={title:"MechanicGo — Roadside help, on demand",description:"Fast, reliable roadside assistance and mechanic booking."};
export default function RootLayout({children}:{children:React.ReactNode}){return <html lang="en"><head><link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" crossOrigin="anonymous"/></head><body>{children}</body></html>}