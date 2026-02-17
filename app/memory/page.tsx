"use client";
import dynamic from "next/dynamic";
const MemoryContent = dynamic(() => import("@/components/MemoryContent"), { ssr: false });
export default function MemoryPage() { return <MemoryContent />; }
