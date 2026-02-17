"use client";
import dynamic from "next/dynamic";
const CronsContent = dynamic(() => import("@/components/CronsContent"), { ssr: false });
export default function CronsPage() { return <CronsContent />; }
