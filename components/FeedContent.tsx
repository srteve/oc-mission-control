"use client";
import { useState, useEffect } from "react";
import {
  FileText, Globe, MessageSquare, Brain, CheckCircle,
  FilePlus, Clock, Settings, Eye, Zap, Filter, Wrench
} from "lucide-react";
import { formatDistanceToNow } from "@/lib/utils";

type Activity = {
  _id: string;
  _creationTime: number;
  type: string;
  title: string;
  description?: string;
};

const ACTIVITY_TYPES = [
  { value: "", label: "All" },
  { value: "file_write", label: "File Write" },
  { value: "file_read", label: "File Read" },
  { value: "web_search", label: "Web Search" },
  { value: "message_sent", label: "Message Sent" },
  { value: "memory_updated", label: "Memory Updated" },
  { value: "task_completed", label: "Task Completed" },
  { value: "document_created", label: "Document Created" },
  { value: "build", label: "Build" },
  { value: "tool_use", label: "Tool Use" },
  { value: "cron_set", label: "Cron Set" },
  { value: "config_changed", label: "Config Changed" },
];

const TIME_FILTERS = ["All Time", "Today", "This Week"];

const typeIcon: Record<string, React.ReactNode> = {
  file_write: <FileText size={16} className="text-blue-400" />,
  file_read: <Eye size={16} className="text-cyan-400" />,
  web_search: <Globe size={16} className="text-green-400" />,
  message_sent: <MessageSquare size={16} className="text-purple-400" />,
  memory_updated: <Brain size={16} className="text-yellow-400" />,
  task_completed: <CheckCircle size={16} className="text-emerald-400" />,
  document_created: <FilePlus size={16} className="text-pink-400" />,
  build: <Wrench size={16} className="text-orange-400" />,
  tool_use: <Zap size={16} className="text-cyan-400" />,
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
  build: "bg-orange-900/50 text-orange-300",
  tool_use: "bg-cyan-900/50 text-cyan-300",
  cron_set: "bg-orange-900/50 text-orange-300",
  config_changed: "bg-red-900/50 text-red-300",
};

export default function FeedContent() {
  const [typeFilter, setTypeFilter] = useState("");
  const [timeFilter, setTimeFilter] = useState("All Time");
  const [activities, setActivities] = useState<Activity[] | undefined>(undefined);
  const [todayCount, setTodayCount] = useState<number | undefined>(undefined);
  const [upcomingCount, setUpcomingCount] = useState<number | undefined>(undefined);

  // Initial load
  useEffect(() => {
    const url = `/api/log-activity${typeFilter ? `?type=${typeFilter}` : ""}`;
    fetch(url).then(r => r.json()).then(setActivities);
    fetch("/api/activities/count").then(r => r.json()).then(d => setTodayCount(d.count));
    fetch("/api/tasks/count").then(r => r.json()).then(d => setUpcomingCount(d.count));
  }, [typeFilter]);

  // SSE for live updates
  useEffect(() => {
    const es = new EventSource("/api/events/stream");
    es.addEventListener("activity", () => {
      fetch(`/api/log-activity${typeFilter ? `?type=${typeFilter}` : ""}`).then(r => r.json()).then(setActivities);
      fetch("/api/activities/count").then(r => r.json()).then(d => setTodayCount(d.count));
    });
    return () => es.close();
  }, [typeFilter]);

  const filtered = (activities ?? []).filter((a) => {
    if (timeFilter === "Today") {
      const start = new Date(); start.setHours(0, 0, 0, 0);
      return a._creationTime >= start.getTime();
    }
    if (timeFilter === "This Week") {
      const start = new Date(); start.setDate(start.getDate() - start.getDay());
      start.setHours(0, 0, 0, 0);
      return a._creationTime >= start.getTime();
    }
    return true;
  });

  return (
    <div className="max-w-4xl mx-auto">
      <div className="grid grid-cols-3 gap-4 mb-8">
        {[
          { label: "Activities Today", value: todayCount ?? "—", icon: <Zap size={20} className="text-indigo-400" /> },
          { label: "Upcoming Tasks", value: upcomingCount ?? "—", icon: <Clock size={20} className="text-purple-400" /> },
          { label: "Total Activities", value: activities?.length ?? "—", icon: <CheckCircle size={20} className="text-green-400" /> },
        ].map(({ label, value, icon }) => (
          <div key={label} className="bg-gray-900 border border-gray-800 rounded-xl p-4 flex items-center gap-4">
            <div className="bg-gray-800 rounded-lg p-2">{icon}</div>
            <div>
              <div className="text-2xl font-bold text-white">{value}</div>
              <div className="text-xs text-gray-500">{label}</div>
            </div>
          </div>
        ))}
      </div>

      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold text-white flex items-center gap-2">
          <Filter size={18} className="text-indigo-400" /> Activity Feed
        </h2>
        <div className="flex gap-2">
          {TIME_FILTERS.map((f) => (
            <button key={f} onClick={() => setTimeFilter(f)}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${timeFilter === f ? "bg-indigo-600 text-white" : "bg-gray-800 text-gray-400 hover:text-white"}`}>
              {f}
            </button>
          ))}
        </div>
      </div>

      <div className="flex flex-wrap gap-2 mb-6">
        {ACTIVITY_TYPES.map(({ value, label }) => (
          <button key={value} onClick={() => setTypeFilter(value)}
            className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${typeFilter === value ? "bg-indigo-600 text-white" : "bg-gray-800 text-gray-400 hover:text-white"}`}>
            {label}
          </button>
        ))}
      </div>

      {activities === undefined ? (
        <div className="space-y-3">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="bg-gray-900 border border-gray-800 rounded-xl p-4 animate-pulse">
              <div className="h-4 bg-gray-800 rounded w-1/3 mb-2" />
              <div className="h-3 bg-gray-800 rounded w-2/3" />
            </div>
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 text-gray-600">
          <Zap size={40} className="mx-auto mb-4 opacity-30" />
          <p className="text-lg">No activities yet.</p>
          <p className="text-sm mt-1">I&apos;ll log actions here as they happen.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((activity) => (
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
