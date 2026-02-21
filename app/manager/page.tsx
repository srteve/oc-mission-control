"use client";
import dynamic from "next/dynamic";
const ManagerContent = dynamic(() => import("@/components/ManagerContent"), { ssr: false });
export default function ManagerPage() { return <ManagerContent />; }
