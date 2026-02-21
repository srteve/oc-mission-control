"use client";
import { Settings2, Bot, Shield, PenTool, Target, Wrench, Gavel, Palette, MessageSquare } from "lucide-react";
import { useState, useEffect } from "react";
import Link from "next/link";
import { formatDistanceToNow } from "@/lib/utils";

const profiles = [
  {
    name: "Ledger",
    role: "Admin (Front Door)",
    icon: <Shield size={16} className="text-emerald-400" />,
    purpose: "Triage + structuring only. Converts messy inputs into Brief Cards and routes to the right agent.",
    when: "Messy input, unclear task, or mis‑scoped request.",
    model: "Default (manager)",
    temperature: "0.3–0.4",
    budget: "400–800 tokens",
    outputs: ["Brief Cards", "Task reframes", "Routing recommendation"],
    constraints: [
      "No content creation",
      "One agent per run, no chaining",
      "Must end with handoff tag",
    ],
  },
  {
    name: "Quill",
    role: "Writer",
    icon: <PenTool size={16} className="text-indigo-400" />,
    purpose: "Narrative clarity. Produces docs, PRDs, scripts, and long‑form writing.",
    when: "You need a clear narrative, doc, or executive‑ready copy.",
    model: "Default (writer)",
    temperature: "0.4–0.6",
    budget: "900–1500 tokens (1500–3000 only on explicit long‑form)",
    outputs: ["PRDs", "Narratives", "Scripts", "Executive memos"],
    constraints: ["No GTM positioning", "No sales sequencing", "Must end with handoff tag"],
  },
  {
    name: "Compass",
    role: "Marketer",
    icon: <Target size={16} className="text-amber-400" />,
    purpose: "Positioning, messaging architecture, and GTM logic anchored to market truth.",
    when: "You need positioning, ICP clarity, or GTM structure.",
    model: "Default (marketer)",
    temperature: "0.4–0.6",
    budget: "900–1500 tokens",
    outputs: ["Positioning", "Messaging architecture", "GTM plan", "Funnel logic"],
    constraints: ["No long‑form writing", "No sales call scripts", "Must end with handoff tag"],
  },
  {
    name: "Wrench",
    role: "Developer",
    icon: <Wrench size={16} className="text-sky-400" />,
    purpose: "Implementation, debugging, and automation when explicitly requested.",
    when: "You need code, fixes, or a safe automation plan.",
    model: "Default (developer)",
    temperature: "0.2–0.4",
    budget: "1200–2200 tokens",
    outputs: ["Code", "Patch plans", "Debug steps", "Risk flags"],
    constraints: ["Automation only when requested", "Must include rollback plan", "Must end with handoff tag"],
  },
  {
    name: "Gavel",
    role: "Sales",
    icon: <Gavel size={16} className="text-rose-400" />,
    purpose: "Sequences, qualification, objections, call structure, and close plans.",
    when: "You need pipeline motion or deal‑level execution.",
    model: "Default (sales)",
    temperature: "0.4–0.6",
    budget: "700–1200 tokens",
    outputs: ["Sequences", "Call frameworks", "Qualification flows", "Objection handling"],
    constraints: ["No positioning strategy", "No long‑form docs", "Must end with handoff tag"],
  },
  {
    name: "Chisel",
    role: "Designer",
    icon: <Palette size={16} className="text-purple-400" />,
    purpose: "Information architecture, layout hierarchy, interaction specs.",
    when: "You need structure before visual design or build.",
    model: "Default (designer)",
    temperature: "0.3–0.5",
    budget: "700–1200 tokens",
    outputs: ["IA", "Layout hierarchy", "Interaction specs", "Component lists"],
    constraints: ["No brand voice writing", "No dev implementation", "Must end with handoff tag"],
  },
];

const protocols = [
  {
    title: "Agent Response Contract",
    items: [
      "Assumptions (max 3 bullets)",
      "Output (the deliverable)",
      "Next Actions (max 5 bullets)",
      "Open Questions (only if blocking)",
    ],
    icon: <Settings2 size={14} className="text-cyan-400" />,
  },
  {
    title: "Handoff Tag",
    items: [
      "Suggested next agent: X",
      "Paste‑forward context: 3–7 bullets",
    ],
    icon: <Bot size={14} className="text-emerald-400" />,
  },
];

type Session = {
  id: string; startedAt: number; lastActiveAt: number;
  messageCount: number; preview: string;
};

export default function TeamContent() {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setLoading(true);
    fetch("/api/sessions")
      .then(r => r.json())
      .then(setSessions)
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="max-w-5xl mx-auto">
      <div className="flex items-center gap-2 mb-2">
        <Bot size={18} className="text-indigo-400" />
        <h2 className="text-xl font-bold text-white">Team</h2>
      </div>
      <p className="text-sm text-gray-500 mb-6">
        Tactical Execution Team — profiles only (Phase 1). Manual invocation, single‑agent runs.
      </p>

      <div className="grid grid-cols-3 gap-4 mb-8">
        {profiles.map((p) => (
          <div key={p.name} className="bg-gray-900 border border-gray-800 rounded-xl p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-gray-800 flex items-center justify-center">
                  {p.icon}
                </div>
                <div>
                  <p className="text-sm font-semibold text-white">{p.name}</p>
                  <p className="text-xs text-gray-500">{p.role}</p>
                </div>
              </div>
              <span className="text-[10px] px-2 py-1 rounded-full bg-gray-800 text-gray-400">{p.budget}</span>
            </div>
            <p className="text-xs text-gray-400 mt-3 leading-relaxed">{p.purpose}</p>
            <p className="text-[11px] text-gray-500 mt-2"><span className="text-gray-400">When to use:</span> {p.when}</p>

            <div className="mt-3 grid grid-cols-2 gap-2 text-[11px] text-gray-500">
              <div>
                <p className="text-gray-400">Model</p>
                <p className="text-gray-500">{p.model}</p>
              </div>
              <div>
                <p className="text-gray-400">Temperature</p>
                <p className="text-gray-500">{p.temperature}</p>
              </div>
            </div>

            <details className="mt-3">
              <summary className="text-xs text-indigo-300 hover:text-indigo-200 cursor-pointer">Capabilities & constraints</summary>
              <div className="mt-2 text-xs text-gray-400">
                <p className="text-gray-500 uppercase tracking-wider text-[10px] mb-1">Primary outputs</p>
                <ul className="list-disc list-inside space-y-0.5 mb-2">
                  {p.outputs.map((o) => (<li key={o}>{o}</li>))}
                </ul>
                <p className="text-gray-500 uppercase tracking-wider text-[10px] mb-1">Constraints</p>
                <ul className="list-disc list-inside space-y-0.5">
                  {p.constraints.map((c) => (<li key={c}>{c}</li>))}
                </ul>
              </div>
            </details>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-2 gap-4 mb-10">
        {protocols.map((p) => (
          <div key={p.title} className="bg-gray-900 border border-gray-800 rounded-xl p-4">
            <div className="flex items-center gap-2 mb-2">
              {p.icon}
              <h3 className="text-sm font-semibold text-white">{p.title}</h3>
            </div>
            <ul className="text-xs text-gray-400 list-disc list-inside space-y-0.5">
              {p.items.map((i) => (<li key={i}>{i}</li>))}
            </ul>
          </div>
        ))}
      </div>

      <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider">
            Live sessions
          </h3>
          <Link href="/sessions" className="text-xs text-indigo-300 hover:text-indigo-200">Open Sessions</Link>
        </div>

        {loading ? (
          <div className="space-y-2">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-12 bg-gray-800/60 rounded-lg animate-pulse" />
            ))}
          </div>
        ) : sessions.length === 0 ? (
          <div className="text-xs text-gray-500">No sessions yet.</div>
        ) : (
          <div className="space-y-2">
            {sessions.slice(0, 6).map((s) => (
              <div key={s.id} className="flex items-start gap-3 bg-gray-950 border border-gray-800 rounded-lg p-3">
                <MessageSquare size={14} className="text-indigo-400 mt-0.5" />
                <div className="min-w-0 flex-1">
                  <p className="text-xs text-gray-300 truncate">{s.preview || "No preview"}</p>
                  <div className="text-[11px] text-gray-600 mt-1">
                    Active {formatDistanceToNow(s.lastActiveAt)} · {s.messageCount} msgs
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
