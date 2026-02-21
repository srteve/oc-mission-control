"use client";
import dynamic from "next/dynamic";
const TeamContent = dynamic(() => import("@/components/TeamContent"), { ssr: false });
export default function TeamPage() { return <TeamContent />; }
