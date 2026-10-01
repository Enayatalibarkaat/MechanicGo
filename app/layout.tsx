import type { Metadata } from "next";
import "./globals.css";
export const metadata: Metadata={title:"MechanicGo — Roadside help, on demand",description:"Fast, reliable roadside assistance and mechanic booking."};
export default function RootLayout({children}:{children:React.ReactNode}){return <html lang="en"><body>{children}</body></html>}