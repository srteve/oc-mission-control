"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Activity, Calendar, Search, Compass, Brain, MessageSquare, Clock, Home, Rocket, DollarSign, Inbox, Globe, Users, Lightbulb, BadgeCheck } from "lucide-react";
import { useState, useEffect } from "react";

function TunnelBadge() {
  const [url, setUrl] = useState<string | null>(null);
  useEffect(() => {
    fetch("/api/tunnel").then(r => r.json()).then(d => setUrl(d.url)).catch(() => {});
  }, []);
  if (!url) return null;
  const short = url.replace("https://", "").split(".")[0];
  return (
    <a href={url} target="_blank" rel="noopener noreferrer"
      className="flex items-center gap-1.5 px-2 py-1.5 rounded-lg bg-emerald-900/30 border border-emerald-800/50 hover:bg-emerald-900/50 transition-colors group">
      <Globe size={10} className="text-emerald-400 flex-shrink-0" />
      <span className="text-xs text-emerald-400 truncate">{short}…</span>
      <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse ml-auto flex-shrink-0" />
    </a>
  );
}

const nav = [
  { href: "/", label: "HQ", icon: Home, exact: true },
  { href: "/feed", label: "Activity Feed", icon: Activity },
  { href: "/memory", label: "Memory", icon: Brain },
  { href: "/sessions", label: "Sessions", icon: MessageSquare },
  { href: "/team", label: "Team", icon: Users },
  { href: "/manager", label: "Manager", icon: BadgeCheck },
  { href: "/ideas", label: "Ideas", icon: Lightbulb },
  { href: "/inbox", label: "Inbox", icon: Inbox },
  { href: "/crons", label: "Cron Monitor", icon: Clock },
  { href: "/workshop", label: "Workshop", icon: Rocket },
  { href: "/cost", label: "Cost", icon: DollarSign },
  { href: "/calendar", label: "Calendar", icon: Calendar },
  { href: "/search", label: "Search", icon: Search },
];

type AgentStatus = {
  state: "idle" | "active" | "running";
  since: number;
  label?: string;
};

const stateConfig = {
  idle:    { dot: "bg-gray-500",                     text: "text-gray-500", label: "Idle" },
  active:  { dot: "bg-green-400 animate-pulse",      text: "text-green-400", label: "Active" },
  running: { dot: "bg-amber-400 animate-pulse",      text: "text-amber-400", label: "Running" },
};

function StatusDot({ status }: { status: AgentStatus }) {
  const cfg = stateConfig[status.state];
  const elapsed = Math.floor((Date.now() - status.since) / 1000);
  const elapsedStr = elapsed < 60 ? `${elapsed}s` : elapsed < 3600 ? `${Math.floor(elapsed / 60)}m` : `${Math.floor(elapsed / 3600)}h`;

  return (
    <div className="mt-2 flex items-start gap-2">
      <div className={`w-2 h-2 rounded-full flex-shrink-0 mt-1 ${cfg.dot}`} />
      <div className="min-w-0">
        <p className={`text-xs font-medium ${cfg.text}`}>
          {status.label && status.state !== "idle" ? status.label : cfg.label}
        </p>
        {status.state !== "idle" && (
          <p className="text-xs text-gray-600">{elapsedStr} ago</p>
        )}
      </div>
    </div>
  );
}

export default function Sidebar({ onCmdK }: { onCmdK?: () => void }) {
  const pathname = usePathname();
  const [status, setStatus] = useState<AgentStatus>({ state: "idle", since: Date.now() });

  useEffect(() => {
    const load = () =>
      fetch("/api/status")
        .then(r => r.json())
        .then(setStatus)
        .catch(() => {});
    load();
    const id = setInterval(load, 5000);
    return () => clearInterval(id);
  }, []);

  return (
    <aside className="fixed top-0 left-0 h-screen w-56 bg-gray-900 border-r border-gray-800 flex flex-col z-10">
      <div className="p-5 border-b border-gray-800">
        <div className="flex items-center gap-3">
          <Compass className="text-indigo-400 flex-shrink-0" size={22} />
          <div>
            <h1 className="text-base font-bold text-white leading-none">Mission Control</h1>
            <p className="text-xs text-gray-500 mt-0.5">Quinn 🧭</p>
          </div>
        </div>
        <StatusDot status={status} />
      </div>
      <nav className="flex-1 p-3 space-y-0.5 overflow-y-auto">
        {nav.map(({ href, label, icon: Icon, exact }) => {
          const active = exact ? pathname === href : pathname.startsWith(href);
          return (
            <Link key={href} href={href}
              className={`flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                active
                  ? "bg-indigo-600 text-white"
                  : "text-gray-400 hover:bg-gray-800 hover:text-white"
              }`}>
              <Icon size={16} />
              {label}
            </Link>
          );
        })}
      </nav>
      <div className="p-3 border-t border-gray-800 space-y-2">
        <TunnelBadge />
        <button onClick={onCmdK}
          className="w-full flex items-center justify-between px-3 py-2 rounded-lg bg-gray-800 hover:bg-gray-700 transition-colors text-gray-500 hover:text-gray-300 text-xs">
          <div className="flex items-center gap-2">
            <Search size={12} />
            <span>Search & navigate</span>
          </div>
          <kbd className="font-mono text-gray-600">⌘K</kbd>
        </button>
      </div>
    </aside>
  );
}
