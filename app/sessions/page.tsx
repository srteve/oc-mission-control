"use client";
import dynamic from "next/dynamic";
const SessionsContent = dynamic(() => import("@/components/SessionsContent"), { ssr: false });
export default function SessionsPage() { return <SessionsContent />; }
