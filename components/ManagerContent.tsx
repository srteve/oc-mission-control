"use client";
import { useMemo, useState } from "react";
import { Clipboard, Sparkles, CheckCircle, AlertTriangle, Filter, Send, BadgeCheck } from "lucide-react";

const AGENTS = ["Ledger", "Quill", "Compass", "Wrench", "Gavel", "Chisel"];

const inferAgent = (text: string) => {
  const t = text.toLowerCase();
  if (/\b(write|draft|doc|prd|script|memo|story)\b/.test(t)) return "Quill";
  if (/\b(positioning|gtm|marketing|messaging|funnel|pricing|icp)\b/.test(t)) return "Compass";
  if (/\b(code|bug|debug|deploy|api|automation|build)\b/.test(t)) return "Wrench";
  if (/\b(sales|sequence|call|objection|close|pipeline)\b/.test(t)) return "Gavel";
  if (/\b(design|layout|ia|wireframe|component|ux)\b/.test(t)) return "Chisel";
  return "Ledger";
};

const extractBullets = (text: string) => {
  const lines = text.split(/\r?\n/).map(l => l.trim()).filter(Boolean);
  const bullets = lines.filter(l => /^[-•]/.test(l)).map(l => l.replace(/^[-•]\s*/, ""));
  if (bullets.length) return bullets.slice(0, 7);
  const sentences = text.split(/(?<=[.!?])\s+/).filter(Boolean);
  return sentences.slice(0, 5).map(s => s.trim());
};

export default function ManagerContent() {
  const [rawInput, setRawInput] = useState("");
  const [task, setTask] = useState("");
  const [audience, setAudience] = useState("");
  const [decision, setDecision] = useState("");
  const [constraints, setConstraints] = useState("");
  const [inputs, setInputs] = useState("");
  const [doneDef, setDoneDef] = useState("");
  const [agent, setAgent] = useState("Ledger");

  const [assumptions, setAssumptions] = useState("");
  const [output, setOutput] = useState("");
  const [nextActions, setNextActions] = useState("");
  const [openQuestions, setOpenQuestions] = useState("");

  const [pasteSource, setPasteSource] = useState("");
  const [pasteForward, setPasteForward] = useState("");

  const [clarity, setClarity] = useState(2);
  const [usefulness, setUsefulness] = useState(2);
  const [doneness, setDoneness] = useState(2);
  const [reviewNotes, setReviewNotes] = useState("");
  const [reviewSaved, setReviewSaved] = useState(false);

  const generate = () => {
    const trimmed = rawInput.trim();
    if (!trimmed) return;
    setTask(trimmed.split(/\n/)[0].slice(0, 140));
    setAgent(inferAgent(trimmed));
    if (!decision) setDecision("");
    if (!doneDef) setDoneDef("Clear output that can be shipped or used immediately.");
  };

  const briefCard = useMemo(() => {
    return [
      `Task: ${task}`,
      `Audience: ${audience}`,
      `Decision supported: ${decision}`,
      `Constraints: ${constraints}`,
      `Inputs: ${inputs}`,
      `Definition of done: ${doneDef}`,
      `Suggested agent: ${agent}`,
    ].join("\n");
  }, [task, audience, decision, constraints, inputs, doneDef, agent]);

  const responseContract = useMemo(() => {
    return [
      "Assumptions:", assumptions,
      "\nOutput:", output,
      "\nNext Actions:", nextActions,
      "\nOpen Questions:", openQuestions,
    ].join("\n");
  }, [assumptions, output, nextActions, openQuestions]);

  const missing = [
    !assumptions.trim() && "Assumptions",
    !output.trim() && "Output",
    !nextActions.trim() && "Next Actions",
  ].filter(Boolean) as string[];

  const handlePasteForward = () => {
    const source = pasteSource.trim() || output.trim();
    const bullets = extractBullets(source);
    setPasteForward(bullets.map(b => `- ${b}`).join("\n"));
  };

  const saveReview = async () => {
    await fetch("/api/reviews", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ clarity, usefulness, doneness, notes: reviewNotes }),
    });
    setReviewSaved(true);
    setTimeout(() => setReviewSaved(false), 1200);
  };

  const copy = async (text: string) => navigator.clipboard.writeText(text);

  return (
    <div className="max-w-6xl mx-auto">
      <div className="flex items-center gap-2 mb-6">
        <BadgeCheck size={18} className="text-indigo-400" />
        <h2 className="text-xl font-bold text-white">Manager View</h2>
      </div>

      <div className="grid grid-cols-2 gap-6">
        {/* Brief Card */}
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2 text-sm text-white">
              <Sparkles size={14} className="text-amber-400" /> Brief Card Generator
            </div>
            <button onClick={() => copy(briefCard)} className="text-xs text-indigo-300 flex items-center gap-1">
              <Clipboard size={12} /> Copy
            </button>
          </div>
          <textarea
            value={rawInput}
            onChange={(e) => setRawInput(e.target.value)}
            placeholder="Paste messy input here"
            className="w-full h-24 bg-gray-950 border border-gray-800 rounded-lg px-3 py-2 text-sm text-white"
          />
          <button onClick={generate} className="mt-2 text-xs px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white">
            Generate
          </button>

          <div className="grid grid-cols-2 gap-2 mt-3">
            <input value={task} onChange={(e) => setTask(e.target.value)} placeholder="Task" className="bg-gray-950 border border-gray-800 rounded-lg px-3 py-2 text-sm text-white" />
            <input value={audience} onChange={(e) => setAudience(e.target.value)} placeholder="Audience" className="bg-gray-950 border border-gray-800 rounded-lg px-3 py-2 text-sm text-white" />
            <input value={decision} onChange={(e) => setDecision(e.target.value)} placeholder="Decision supported" className="bg-gray-950 border border-gray-800 rounded-lg px-3 py-2 text-sm text-white" />
            <input value={constraints} onChange={(e) => setConstraints(e.target.value)} placeholder="Constraints" className="bg-gray-950 border border-gray-800 rounded-lg px-3 py-2 text-sm text-white" />
            <input value={inputs} onChange={(e) => setInputs(e.target.value)} placeholder="Inputs" className="bg-gray-950 border border-gray-800 rounded-lg px-3 py-2 text-sm text-white" />
            <input value={doneDef} onChange={(e) => setDoneDef(e.target.value)} placeholder="Definition of done" className="bg-gray-950 border border-gray-800 rounded-lg px-3 py-2 text-sm text-white" />
            <select value={agent} onChange={(e) => setAgent(e.target.value)} className="bg-gray-950 border border-gray-800 rounded-lg px-3 py-2 text-sm text-white">
              {AGENTS.map(a => <option key={a} value={a}>{a}</option>)}
            </select>
          </div>

          <pre className="mt-3 text-xs text-gray-400 bg-gray-950 border border-gray-800 rounded-lg p-3 whitespace-pre-wrap">{briefCard}</pre>
        </div>

        {/* Response Contract */}
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2 text-sm text-white">
              <Filter size={14} className="text-cyan-400" /> Response Contract
            </div>
            <button onClick={() => copy(responseContract)} className="text-xs text-indigo-300 flex items-center gap-1">
              <Clipboard size={12} /> Copy
            </button>
          </div>
          <textarea value={assumptions} onChange={(e) => setAssumptions(e.target.value)} placeholder="Assumptions (max 3 bullets)" className="w-full h-14 bg-gray-950 border border-gray-800 rounded-lg px-3 py-2 text-sm text-white" />
          <textarea value={output} onChange={(e) => setOutput(e.target.value)} placeholder="Output" className="w-full h-28 bg-gray-950 border border-gray-800 rounded-lg px-3 py-2 text-sm text-white mt-2" />
          <textarea value={nextActions} onChange={(e) => setNextActions(e.target.value)} placeholder="Next Actions (max 5 bullets)" className="w-full h-16 bg-gray-950 border border-gray-800 rounded-lg px-3 py-2 text-sm text-white mt-2" />
          <textarea value={openQuestions} onChange={(e) => setOpenQuestions(e.target.value)} placeholder="Open Questions (blocking only)" className="w-full h-14 bg-gray-950 border border-gray-800 rounded-lg px-3 py-2 text-sm text-white mt-2" />

          <div className="mt-3 text-xs flex items-center gap-2">
            {missing.length === 0 ? (
              <span className="text-emerald-400 flex items-center gap-1"><CheckCircle size={12} /> Contract complete</span>
            ) : (
              <span className="text-amber-400 flex items-center gap-1"><AlertTriangle size={12} /> Missing: {missing.join(", ")}</span>
            )}
          </div>
        </div>

        {/* Paste-forward */}
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2 text-sm text-white">
              <Send size={14} className="text-emerald-400" /> Paste‑Forward Context
            </div>
            <button onClick={() => copy(pasteForward)} className="text-xs text-indigo-300 flex items-center gap-1">
              <Clipboard size={12} /> Copy
            </button>
          </div>
          <textarea value={pasteSource} onChange={(e) => setPasteSource(e.target.value)} placeholder="Paste output here (or leave empty to use Output above)" className="w-full h-20 bg-gray-950 border border-gray-800 rounded-lg px-3 py-2 text-sm text-white" />
          <button onClick={handlePasteForward} className="mt-2 text-xs px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white">
            Extract bullets
          </button>
          <textarea value={pasteForward} onChange={(e) => setPasteForward(e.target.value)} placeholder="Paste-forward bullets" className="w-full h-20 bg-gray-950 border border-gray-800 rounded-lg px-3 py-2 text-sm text-white mt-2" />
        </div>

        {/* Lightweight scoring */}
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
          <div className="flex items-center gap-2 text-sm text-white mb-3">
            <CheckCircle size={14} className="text-indigo-400" /> Lightweight Scoring
          </div>
          <div className="grid grid-cols-3 gap-2 text-xs text-gray-400">
            <label>Clarity
              <input type="range" min="1" max="3" value={clarity} onChange={(e) => setClarity(Number(e.target.value))} className="w-full" />
            </label>
            <label>Usefulness
              <input type="range" min="1" max="3" value={usefulness} onChange={(e) => setUsefulness(Number(e.target.value))} className="w-full" />
            </label>
            <label>Done‑ness
              <input type="range" min="1" max="3" value={doneness} onChange={(e) => setDoneness(Number(e.target.value))} className="w-full" />
            </label>
          </div>
          <textarea value={reviewNotes} onChange={(e) => setReviewNotes(e.target.value)} placeholder="Notes (optional)" className="w-full h-16 bg-gray-950 border border-gray-800 rounded-lg px-3 py-2 text-sm text-white mt-2" />
          <button onClick={saveReview} className="mt-2 text-xs px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white">
            Save score
          </button>
          {reviewSaved && <p className="text-xs text-emerald-400 mt-2">Saved</p>}
        </div>
      </div>
    </div>
  );
}
