"use client";
import dynamic from "next/dynamic";
const HQContent = dynamic(() => import("@/components/HQContent"), { ssr: false });
export default function Home() { return <HQContent />; }
