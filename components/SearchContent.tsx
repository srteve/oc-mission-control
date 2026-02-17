"use client";
import { useState } from "react";
import { Search, FileText, Globe, MessageSquare, Brain, CheckCircle, FilePlus, Clock, Settings, Eye, Zap } from "lucide-react";
import { formatDistanceToNow } from "@/lib/utils";

type Activity = {
  _id: string;
  _creationTime: number;
  type: string;
  title: string;
  description?: string;
};

const typeIcon: Record<string, React.ReactNode> = {
  file_write: <FileText size={16} className="text-blue-400" />,
  file_read: <Eye size={16} className="text-cyan-400" />,
  web_search: <Globe size={16} className="text-green-400" />,
  message_sent: <MessageSquare size={16} className="text-purple-400" />,
  memory_updated: <Brain size={16} className="text-yellow-400" />,
  task_completed: <CheckCircle size={16} className="text-emerald-400" />,
  document_created: <FilePlus size={16} className="text-pink-400" />,
  cron_set: <Clock size={16} className="text-orange-400" />,
  config_changed: <Settings size={16} className="text-red-400" />,
};

const typeBadge: Record<string, string> = {
  file_write: "bg-blue-900/50 text-blue-300",
  file_read: "bg-cyan-900/50 text-cyan-300",
  web_search: "bg-green-900/50 text-green-300",
  message_sent: "bg-purple-900/50 text-purple-300",
  memory_updated: "bg-yellow-900/50 text-yellow-300",
  task_completed: "bg-emerald-900/50 text-emerald-300",
  document_created: "bg-pink-900/50 text-pink-300",
  cron_set: "bg-orange-900/50 text-orange-300",
  config_changed: "bg-red-900/50 text-red-300",
};

export default function SearchContent() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Activity[] | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;
    setLoading(true);
    try {
      const r = await fetch(`/api/search-docs?q=${encodeURIComponent(query)}`);
      const data = await r.json();
      setResults(data);
    } catch {
      setResults([]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto">
      <h2 className="text-xl font-bold text-white flex items-center gap-2 mb-6">
        <Search size={18} className="text-indigo-400" /> Search Activities
      </h2>
      <form onSubmit={handleSearch} className="flex gap-3 mb-8">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search activity titles and descriptions…"
          className="flex-1 bg-gray-900 border border-gray-700 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-indigo-500 transition-colors"
        />
        <button
          type="submit"
          disabled={loading}
          className="px-6 py-3 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white rounded-xl font-medium transition-colors"
        >
          {loading ? "…" : "Search"}
        </button>
      </form>

      {results === null ? (
        <div className="text-center py-16 text-gray-600">
          <Search size={40} className="mx-auto mb-4 opacity-30" />
          <p>Search across all logged activities.</p>
        </div>
      ) : results.length === 0 ? (
        <div className="text-center py-16 text-gray-600">
          <Zap size={40} className="mx-auto mb-4 opacity-30" />
          <p>No results for &ldquo;{query}&rdquo;</p>
        </div>
      ) : (
        <div className="space-y-3">
          <p className="text-xs text-gray-500 mb-4">{results.length} result{results.length !== 1 ? "s" : ""}</p>
          {results.map((activity) => (
            <div key={activity._id} className="bg-gray-900 border border-gray-800 rounded-xl p-4 hover:border-gray-700 transition-colors">
              <div className="flex items-start gap-3">
                <div className="mt-0.5 flex-shrink-0">
                  {typeIcon[activity.type] ?? <Zap size={16} className="text-gray-400" />}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-medium text-white text-sm">{activity.title}</span>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${typeBadge[activity.type] ?? "bg-gray-800 text-gray-400"}`}>
                      {activity.type.replace(/_/g, " ")}
                    </span>
                  </div>
                  {activity.description && <p className="text-sm text-gray-400 mt-1">{activity.description}</p>}
                </div>
                <div className="text-xs text-gray-600 flex-shrink-0">{formatDistanceToNow(activity._creationTime)}</div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
