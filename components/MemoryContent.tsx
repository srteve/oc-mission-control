"use client";
import { useState, useEffect } from "react";
import { Brain, Clock, FileText, RefreshCw, Pencil, Save, X, Check } from "lucide-react";
import { formatDistanceToNow } from "@/lib/utils";

type MemFile = { name: string; path: string; updatedAt: number; size: number };

export default function MemoryContent() {
  const [files, setFiles] = useState<MemFile[]>([]);
  const [selected, setSelected] = useState<string>("MEMORY.md");
  const [content, setContent] = useState<string>("");
  const [updatedAt, setUpdatedAt] = useState<number>(0);
  const [loading, setLoading] = useState(false);
  
  // Edit mode state
  const [editMode, setEditMode] = useState(false);
  const [editContent, setEditContent] = useState("");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    fetch("/api/memory").then(r => r.json()).then((data: MemFile[]) => {
      setFiles(data);
    });
  }, []);

  useEffect(() => {
    if (!selected) return;
    setLoading(true);
    setEditMode(false);
    setSaved(false);
    fetch(`/api/memory?file=${encodeURIComponent(selected)}`)
      .then(r => r.json())
      .then(({ content, updatedAt }) => {
        setContent(content ?? "");
        setUpdatedAt(updatedAt ?? 0);
      })
      .finally(() => setLoading(false));
  }, [selected]);

  const formatSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes}b`;
    return `${(bytes / 1024).toFixed(1)}kb`;
  };

  const handleEdit = () => {
    setEditContent(content);
    setEditMode(true);
    setSaved(false);
  };

  const handleSave = async () => {
    if (!selected) return;
    setSaving(true);
    try {
      const res = await fetch("/api/memory", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ file: selected, content: editContent }),
      });
      if (res.ok) {
        setContent(editContent);
        setSaved(true);
        setTimeout(() => {
          setEditMode(false);
          setSaved(false);
        }, 1000);
      }
    } catch (e) {
      console.error("Failed to save:", e);
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    setEditMode(false);
    setEditContent("");
    setSaved(false);
  };

  return (
    <div className="max-w-6xl mx-auto h-full">
      <div className="flex items-center gap-2 mb-6">
        <Brain size={18} className="text-indigo-400" />
        <h2 className="text-xl font-bold text-white">Memory Browser</h2>
      </div>

      <div className="flex gap-6" style={{ minHeight: "70vh" }}>
        {/* File list */}
        <div className="w-56 flex-shrink-0">
          <p className="text-xs text-gray-500 uppercase tracking-wider mb-3 font-medium">Files</p>
          <div className="space-y-1">
            {files.length === 0 ? (
              [...Array(4)].map((_, i) => (
                <div key={i} className="h-10 bg-gray-900 rounded-lg animate-pulse" />
              ))
            ) : (
              files.map((f) => (
                <button key={f.path} onClick={() => setSelected(f.path)}
                  className={`w-full text-left px-3 py-2.5 rounded-lg text-sm transition-colors ${selected === f.path
                    ? "bg-indigo-600 text-white"
                    : "text-gray-400 hover:bg-gray-800 hover:text-white"}`}>
                  <div className="flex items-center gap-2">
                    <FileText size={13} className="flex-shrink-0" />
                    <span className="truncate font-medium">{f.name}</span>
                  </div>
                  <div className="flex justify-between mt-0.5 ml-5">
                    <span className="text-xs opacity-60">{formatSize(f.size)}</span>
                    <span className="text-xs opacity-60">{formatDistanceToNow(f.updatedAt)}</span>
                  </div>
                </button>
              ))
            )}
          </div>
        </div>

        {/* Content viewer */}
        <div className="flex-1 min-w-0">
          <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden h-full flex flex-col">
            <div className="flex items-center justify-between px-4 py-3 border-b border-gray-800">
              <div className="flex items-center gap-2">
                <FileText size={14} className="text-indigo-400" />
                <span className="text-sm font-medium text-white">{selected}</span>
              </div>
              <div className="flex items-center gap-3">
                {updatedAt > 0 && !editMode && (
                  <span className="text-xs text-gray-500 flex items-center gap-1">
                    <Clock size={11} /> Updated {formatDistanceToNow(updatedAt)}
                  </span>
                )}
                {saved && (
                  <span className="text-xs text-green-400 flex items-center gap-1">
                    <Check size={11} /> Saved ✓
                  </span>
                )}
                {editMode ? (
                  <>
                    <button
                      onClick={handleSave}
                      disabled={saving}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-green-600 hover:bg-green-500 text-white text-xs font-medium transition-colors disabled:opacity-50">
                      <Save size={12} />
                      {saving ? "Saving..." : "Save"}
                    </button>
                    <button
                      onClick={handleCancel}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gray-700 hover:bg-gray-600 text-gray-300 text-xs font-medium transition-colors">
                      <X size={12} />
                      Cancel
                    </button>
                  </>
                ) : (
                  <button
                    onClick={handleEdit}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-medium transition-colors">
                    <Pencil size={12} />
                    Edit
                  </button>
                )}
                {!editMode && (
                  <button onClick={() => setSelected(selected)}
                    className="p-1.5 rounded-lg hover:bg-gray-800 text-gray-500 hover:text-white transition-colors">
                    <RefreshCw size={13} />
                  </button>
                )}
              </div>
            </div>
            <div className="flex-1 overflow-auto p-6">
              {loading ? (
                <div className="space-y-3">
                  {[...Array(8)].map((_, i) => (
                    <div key={i} className={`h-3 bg-gray-800 rounded animate-pulse ${i % 3 === 2 ? "w-2/3" : "w-full"}`} />
                  ))}
                </div>
              ) : editMode ? (
                <textarea
                  value={editContent}
                  onChange={(e) => setEditContent(e.target.value)}
                  className="w-full h-full min-h-[500px] bg-gray-950 text-gray-100 border border-gray-700 rounded-lg p-4 font-mono text-sm resize-none focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  spellCheck={false}
                />
              ) : (
                <pre className="text-sm text-gray-300 font-mono whitespace-pre-wrap leading-relaxed break-words">
                  {content || "Empty file."}
                </pre>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
