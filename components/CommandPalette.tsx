"use client";
import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Search, Brain, MessageSquare, Clock, Activity, Calendar, Home, FileText } from "lucide-react";

type Result = { label: string; desc: string; icon: React.ReactNode; action: () => void };

const PAGES = [
  { label: "HQ", desc: "Overview dashboard", href: "/", icon: <Home size={15} /> },
  { label: "Activity Feed", desc: "All logged actions", href: "/feed", icon: <Activity size={15} /> },
  { label: "Memory", desc: "What I know", href: "/memory", icon: <Brain size={15} /> },
  { label: "Sessions", desc: "Conversation history", href: "/sessions", icon: <MessageSquare size={15} /> },
  { label: "Cron Monitor", desc: "Schedules & tasks", href: "/crons", icon: <Clock size={15} /> },
  { label: "Calendar", desc: "Weekly calendar", href: "/calendar", icon: <Calendar size={15} /> },
  { label: "Search", desc: "Search activities", href: "/search", icon: <Search size={15} /> },
];

export default function CommandPalette({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Result[]>([]);
  const [searchResults, setSearchResults] = useState<{ _id: string; title: string; description?: string; type: string }[]>([]);
  const [idx, setIdx] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  const buildResults = useCallback((): Result[] => {
    const q = query.toLowerCase();
    const pages = PAGES.filter(p => !q || p.label.toLowerCase().includes(q) || p.desc.toLowerCase().includes(q))
      .map(p => ({
        label: p.label, desc: p.desc, icon: p.icon,
        action: () => { router.push(p.href); onClose(); }
      }));

    const activityItems = searchResults.map(a => ({
      label: a.title,
      desc: a.description ?? a.type,
      icon: <FileText size={15} className="text-gray-400" />,
      action: () => { router.push("/feed"); onClose(); }
    }));

    return [...pages, ...activityItems];
  }, [query, searchResults, router, onClose]);

  useEffect(() => {
    setResults(buildResults());
    setIdx(0);
  }, [buildResults]);

  useEffect(() => {
    if (!open) { setQuery(""); setSearchResults([]); return; }
    setTimeout(() => inputRef.current?.focus(), 50);
  }, [open]);

  useEffect(() => {
    if (query.length < 2) { setSearchResults([]); return; }
    const timer = setTimeout(() => {
      fetch(`/api/search-docs?q=${encodeURIComponent(query)}`)
        .then(r => r.json())
        .then(d => setSearchResults(d.slice(0, 4)))
        .catch(() => {});
    }, 200);
    return () => clearTimeout(timer);
  }, [query]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown") { e.preventDefault(); setIdx(i => Math.min(i + 1, results.length - 1)); }
    if (e.key === "ArrowUp") { e.preventDefault(); setIdx(i => Math.max(i - 1, 0)); }
    if (e.key === "Enter" && results[idx]) { results[idx].action(); }
    if (e.key === "Escape") { onClose(); }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-24 px-4"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-lg bg-gray-900 border border-gray-700 rounded-2xl shadow-2xl overflow-hidden">
        <div className="flex items-center gap-3 px-4 py-3 border-b border-gray-800">
          <Search size={16} className="text-gray-500 flex-shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={e => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Navigate or search activities…"
            className="flex-1 bg-transparent text-white placeholder-gray-500 text-sm outline-none"
          />
          <kbd className="text-xs text-gray-600 bg-gray-800 px-1.5 py-0.5 rounded font-mono">ESC</kbd>
        </div>
        <div className="max-h-80 overflow-y-auto py-2">
          {results.length === 0 ? (
            <p className="text-center text-sm text-gray-600 py-8">No results</p>
          ) : (
            results.map((r, i) => (
              <button key={i} onClick={r.action}
                onMouseEnter={() => setIdx(i)}
                className={`w-full flex items-center gap-3 px-4 py-2.5 text-left transition-colors ${i === idx ? "bg-indigo-600/20 text-white" : "text-gray-400 hover:bg-gray-800"}`}>
                <span className={`flex-shrink-0 ${i === idx ? "text-indigo-400" : "text-gray-500"}`}>{r.icon}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{r.label}</p>
                  <p className="text-xs text-gray-500 truncate">{r.desc}</p>
                </div>
              </button>
            ))
          )}
        </div>
        <div className="px-4 py-2 border-t border-gray-800 flex gap-3 text-xs text-gray-600">
          <span><kbd className="font-mono">↑↓</kbd> navigate</span>
          <span><kbd className="font-mono">↵</kbd> open</span>
          <span><kbd className="font-mono">esc</kbd> close</span>
        </div>
      </div>
    </div>
  );
}
