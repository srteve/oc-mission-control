"use client";
import { Geist } from "next/font/google";
import "./globals.css";
import { useState, useEffect, useCallback } from "react";
import Sidebar from "@/components/Sidebar";
import CommandPalette from "@/components/CommandPalette";

const geist = Geist({ subsets: ["latin"] });

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const [cmdK, setCmdK] = useState(false);

  const openPalette = useCallback(() => setCmdK(true), []);
  const closePalette = useCallback(() => setCmdK(false), []);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setCmdK(prev => !prev);
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  return (
    <html lang="en" className="dark">
      <body className={`${geist.className} bg-gray-950 text-gray-100 min-h-screen`}>
        <div className="flex min-h-screen">
          <Sidebar onCmdK={openPalette} />
          <main className="flex-1 ml-56 p-8">{children}</main>
        </div>
        <CommandPalette open={cmdK} onClose={closePalette} />
      </body>
    </html>
  );
}
