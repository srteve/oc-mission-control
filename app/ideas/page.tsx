"use client";
import dynamic from "next/dynamic";
const IdeasContent = dynamic(() => import("@/components/IdeasContent"), { ssr: false });
export default function IdeasPage() { return <IdeasContent />; }
