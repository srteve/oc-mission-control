"use client";
import { useState, useEffect } from "react";
import { MessageSquare, Clock, DollarSign, ArrowLeft, User, Bot } from "lucide-react";
import { formatDistanceToNow } from "@/lib/utils";

type Session = {
  id: string; startedAt: number; lastActiveAt: number;
  messageCount: number; userMessages: number; assistantMessages: number;
  totalCost: number; preview: string;
};

type Message = {
  role: string; text: string; timestamp?: number; model?: string; cost?: number;
};

type SessionDetail = { id: string; messages: Message[] };

function formatDuration(start: number, end: number) {
  const ms = end - start;
  const mins = Math.floor(ms / 60000);
  if (mins < 1) return "< 1 min";
  if (mins < 60) return `${mins}m`;
  return `${Math.floor(mins / 60)}h ${mins % 60}m`;
}

export default function SessionsContent() {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [selected, setSelected] = useState<SessionDetail | null>(null);
  const [loading, setLoading] = useState(false);
  const [detailLoading, setDetailLoading] = useState(false);

  useEffect(() => {
    setLoading(true);
    fetch("/api/sessions")
      .then(r => r.json())
      .then(setSessions)
      .finally(() => setLoading(false));
  }, []);

  const openSession = (id: string) => {
    setDetailLoading(true);
    fetch(`/api/sessions?id=${id}`)
      .then(r => r.json())
      .then(setSelected)
      .finally(() => setDetailLoading(false));
  };

  if (selected) {
    return (
      <div className="max-w-3xl mx-auto">
        <button onClick={() => setSelected(null)}
          className="flex items-center gap-2 text-sm text-gray-400 hover:text-white mb-6 transition-colors">
          <ArrowLeft size={14} /> Back to sessions
        </button>
        <div className="mb-4">
          <h2 className="text-lg font-bold text-white font-mono text-sm">{selected.id}</h2>
        </div>
        {detailLoading ? (
          <div className="space-y-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-16 bg-gray-900 rounded-xl animate-pulse" />
            ))}
          </div>
        ) : (
          <div className="space-y-3">
            {selected.messages
              .filter(m => m.text && m.text.trim())
              .map((m, i) => (
                <div key={i} className={`flex gap-3 ${m.role === "user" ? "" : "flex-row-reverse"}`}>
                  <div className={`flex-shrink-0 w-7 h-7 rounded-full flex items-center justify-center text-xs ${m.role === "user" ? "bg-indigo-600" : "bg-gray-700"}`}>
                    {m.role === "user" ? <User size={13} /> : <Bot size={13} />}
                  </div>
                  <div className={`max-w-[80%] px-4 py-2.5 rounded-xl text-sm ${m.role === "user"
                    ? "bg-indigo-600/20 border border-indigo-500/30 text-white"
                    : "bg-gray-900 border border-gray-700 text-gray-300"
                  }`}>
                    <p className="whitespace-pre-wrap break-words leading-relaxed">{m.text.slice(0, 800)}{m.text.length > 800 ? "…" : ""}</p>
                    {m.timestamp && (
                      <p className={`text-xs mt-1.5 ${m.role === "user" ? "text-indigo-400/60" : "text-gray-600"}`}>
                        {formatDistanceToNow(m.timestamp)}
                        {m.cost ? ` · $${m.cost.toFixed(4)}` : ""}
                      </p>
                    )}
                  </div>
                </div>
              ))}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex items-center gap-2 mb-6">
        <MessageSquare size={18} className="text-indigo-400" />
        <h2 className="text-xl font-bold text-white">Sessions</h2>
        <span className="text-sm text-gray-500 ml-2">{sessions.length} conversations</span>
      </div>

      {loading ? (
        <div className="space-y-3">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="h-20 bg-gray-900 border border-gray-800 rounded-xl animate-pulse" />
          ))}
        </div>
      ) : sessions.length === 0 ? (
        <div className="text-center py-16 text-gray-600">
          <MessageSquare size={40} className="mx-auto mb-4 opacity-30" />
          <p>No sessions found.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {sessions.map((s) => (
            <button key={s.id} onClick={() => openSession(s.id)}
              className="w-full text-left bg-gray-900 border border-gray-800 rounded-xl p-4 hover:border-gray-600 hover:bg-gray-800/40 transition-all group">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-gray-300 truncate leading-snug">{s.preview || "No preview available"}</p>
                  <div className="flex items-center gap-3 mt-2">
                    <span className="text-xs text-gray-500 flex items-center gap-1">
                      <Clock size={11} /> {formatDistanceToNow(s.lastActiveAt)}
                    </span>
                    <span className="text-xs text-gray-500 flex items-center gap-1">
                      <MessageSquare size={11} /> {s.messageCount} msgs
                    </span>
                    <span className="text-xs text-gray-500">
                      {formatDuration(s.startedAt, s.lastActiveAt)}
                    </span>
                    {s.totalCost > 0 && (
                      <span className="text-xs text-gray-500 flex items-center gap-1">
                        <DollarSign size={11} /> ${s.totalCost.toFixed(4)}
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex-shrink-0 text-right">
                  <div className="text-xs font-mono text-gray-600 group-hover:text-gray-500 transition-colors">
                    {s.id.slice(0, 8)}
                  </div>
                </div>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
