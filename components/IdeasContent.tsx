"use client";
import { useState, useEffect } from "react";
import { Lightbulb, Plus, Search, Link as LinkIcon, Tag, Pencil, Trash2, Save, X, Filter } from "lucide-react";
import { formatDistanceToNow } from "@/lib/utils";

type Idea = {
  _id: string;
  title: string;
  summary?: string;
  status: string;
  tags: string[];
  link?: string;
  owner: string;
  createdAt: number;
  updatedAt: number;
};

const STATUSES = ["Exploring", "Next Up", "In Build", "Shipped"] as const;
const OWNERS = ["All", "Quinn", "Stephen"] as const;

export default function IdeasContent() {
  const [ideas, setIdeas] = useState<Idea[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<string>("All");
  const [owner, setOwner] = useState<string>("All");
  const [editId, setEditId] = useState<string | null>(null);

  const [title, setTitle] = useState("");
  const [summary, setSummary] = useState("");
  const [link, setLink] = useState("");
  const [tags, setTags] = useState("");
  const [newStatus, setNewStatus] = useState<string>(STATUSES[0]);
  const [newOwner, setNewOwner] = useState<string>("Quinn");

  const load = () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (status !== "All") params.set("status", status);
    if (owner !== "All") params.set("owner", owner);
    if (search.trim()) params.set("q", search.trim());
    fetch(`/api/ideas?${params.toString()}`)
      .then(r => r.json())
      .then(setIdeas)
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, [status, owner]);

  const resetForm = () => {
    setTitle("");
    setSummary("");
    setLink("");
    setTags("");
    setNewStatus(STATUSES[0]);
    setNewOwner("Quinn");
    setEditId(null);
  };

  const handleSubmit = async () => {
    if (!title.trim()) return;
    const payload = {
      title: title.trim(),
      summary: summary.trim() || undefined,
      status: newStatus,
      owner: newOwner,
      link: link.trim() || undefined,
      tags: tags.split(",").map(t => t.trim()).filter(Boolean),
    };

    if (editId) {
      await fetch("/api/ideas", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: editId, patch: payload }),
      });
    } else {
      await fetch("/api/ideas", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
    }

    resetForm();
    load();
  };

  const handleEdit = (idea: Idea) => {
    setEditId(idea._id);
    setTitle(idea.title);
    setSummary(idea.summary ?? "");
    setLink(idea.link ?? "");
    setTags(idea.tags.join(", "));
    setNewStatus(idea.status);
    setNewOwner(idea.owner);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this idea?")) return;
    await fetch("/api/ideas", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
    if (editId === id) resetForm();
    load();
  };

  const handleSearch = () => load();

  return (
    <div className="max-w-6xl mx-auto">
      <div className="flex items-center gap-2 mb-6">
        <Lightbulb size={18} className="text-amber-400" />
        <h2 className="text-xl font-bold text-white">Ideas</h2>
      </div>

      <div className="grid grid-cols-3 gap-6">
        {/* Form */}
        <div className="col-span-1">
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
            <div className="flex items-center gap-2 mb-3">
              <Plus size={14} className="text-emerald-400" />
              <p className="text-sm font-semibold text-white">{editId ? "Edit idea" : "Add idea"}</p>
            </div>
            <div className="space-y-3">
              <input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Title"
                className="w-full bg-gray-950 border border-gray-800 rounded-lg px-3 py-2 text-sm text-white"
              />
              <textarea
                value={summary}
                onChange={(e) => setSummary(e.target.value)}
                placeholder="Summary"
                className="w-full h-24 bg-gray-950 border border-gray-800 rounded-lg px-3 py-2 text-sm text-white"
              />
              <input
                value={link}
                onChange={(e) => setLink(e.target.value)}
                placeholder="Optional link"
                className="w-full bg-gray-950 border border-gray-800 rounded-lg px-3 py-2 text-sm text-white"
              />
              <input
                value={tags}
                onChange={(e) => setTags(e.target.value)}
                placeholder="Tags (comma-separated)"
                className="w-full bg-gray-950 border border-gray-800 rounded-lg px-3 py-2 text-sm text-white"
              />
              <div className="grid grid-cols-2 gap-2">
                <select
                  value={newStatus}
                  onChange={(e) => setNewStatus(e.target.value)}
                  className="bg-gray-950 border border-gray-800 rounded-lg px-3 py-2 text-sm text-white"
                >
                  {STATUSES.map((s) => (<option key={s} value={s}>{s}</option>))}
                </select>
                <select
                  value={newOwner}
                  onChange={(e) => setNewOwner(e.target.value)}
                  className="bg-gray-950 border border-gray-800 rounded-lg px-3 py-2 text-sm text-white"
                >
                  {OWNERS.filter(o => o !== "All").map((o) => (<option key={o} value={o}>{o}</option>))}
                </select>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={handleSubmit}
                  className="flex items-center gap-2 px-3 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-xs text-white"
                >
                  <Save size={12} /> {editId ? "Save" : "Add"}
                </button>
                {editId && (
                  <button
                    onClick={resetForm}
                    className="flex items-center gap-2 px-3 py-2 rounded-lg bg-gray-700 hover:bg-gray-600 text-xs text-gray-200"
                  >
                    <X size={12} /> Cancel
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* List */}
        <div className="col-span-2">
          <div className="flex items-center gap-2 mb-3">
            <div className="flex items-center gap-2 bg-gray-900 border border-gray-800 rounded-lg px-3 py-2 flex-1">
              <Search size={14} className="text-gray-500" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                placeholder="Search title, summary, tags"
                className="bg-transparent text-sm text-white w-full outline-none"
              />
              <button onClick={handleSearch} className="text-xs text-indigo-300">Search</button>
            </div>
            <div className="flex items-center gap-2">
              <Filter size={14} className="text-gray-500" />
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                className="bg-gray-900 border border-gray-800 rounded-lg px-2.5 py-2 text-xs text-gray-200"
              >
                <option value="All">All statuses</option>
                {STATUSES.map((s) => (<option key={s} value={s}>{s}</option>))}
              </select>
              <select
                value={owner}
                onChange={(e) => setOwner(e.target.value)}
                className="bg-gray-900 border border-gray-800 rounded-lg px-2.5 py-2 text-xs text-gray-200"
              >
                {OWNERS.map((o) => (<option key={o} value={o}>{o}</option>))}
              </select>
            </div>
          </div>

          <div className="space-y-2">
            {loading ? (
              [...Array(6)].map((_, i) => (
                <div key={i} className="h-20 bg-gray-900 border border-gray-800 rounded-xl animate-pulse" />
              ))
            ) : ideas.length === 0 ? (
              <div className="text-center py-12 text-gray-600 border border-gray-800 rounded-xl">
                <Lightbulb size={28} className="mx-auto mb-2 opacity-30" />
                <p className="text-sm">No ideas yet.</p>
              </div>
            ) : (
              ideas.map((idea) => (
                <div key={idea._id} className="bg-gray-900 border border-gray-800 rounded-xl p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-white truncate">{idea.title}</p>
                      {idea.summary && (
                        <p className="text-xs text-gray-500 mt-1 line-clamp-2">{idea.summary}</p>
                      )}
                      <div className="flex items-center gap-3 mt-2 text-xs text-gray-500">
                        <span className="px-2 py-0.5 rounded-full bg-gray-800 text-gray-300">{idea.status}</span>
                        <span className="px-2 py-0.5 rounded-full bg-gray-800 text-gray-300">{idea.owner}</span>
                        <span>Updated {formatDistanceToNow(idea.updatedAt)}</span>
                      </div>
                      <div className="flex items-center gap-2 mt-2 text-xs text-gray-500">
                        {idea.link && (
                          <a href={idea.link} target="_blank" rel="noreferrer" className="flex items-center gap-1 text-indigo-300 hover:text-indigo-200">
                            <LinkIcon size={12} /> Link
                          </a>
                        )}
                        {idea.tags.length > 0 && (
                          <span className="flex items-center gap-1"><Tag size={12} /> {idea.tags.join(", ")}</span>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button onClick={() => handleEdit(idea)} className="p-2 rounded-lg bg-gray-800 hover:bg-gray-700 text-gray-300">
                        <Pencil size={12} />
                      </button>
                      <button onClick={() => handleDelete(idea._id)} className="p-2 rounded-lg bg-gray-800 hover:bg-gray-700 text-rose-300">
                        <Trash2 size={12} />
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
