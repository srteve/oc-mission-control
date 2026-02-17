"use client";
import dynamic from "next/dynamic";
const InboxContent = dynamic(() => import("@/components/InboxContent"), { ssr: false });
export default function InboxPage() { return <InboxContent />; }
