"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import {
  Zap, MessageSquare, Globe, FileText, Brain,
  CheckCircle, Clock, ArrowRight, Activity, TrendingUp,
  Wrench, Rocket
} from "lucide-react";
import { formatDistanceToNow } from "@/lib/utils";

type Stats = {
  today: {
    total: number; messages: number; searches: number;
    files: number; memory: number; tasks: number;
  };
  total: number;
  upcomingTasks: number;
  recentActivities: Activity[];
};

type RhythmData = {
  weekDays: { date: string; day: string; count: number; hasActivity: boolean }[];
  streak: number;
  playsThisWeek: number;
};

type Activity = {
  _id: string; _creationTime: number; type: string;
  title: string; description?: string;
};

const typeIcon: Record<string, React.ReactNode> = {
  file_write: <FileText size={14} className="text-blue-400" />,
  file_read: <FileText size={14} className="text-cyan-400" />,
  web_search: <Globe size={14} className="text-green-400" />,
  message_sent: <MessageSquare size={14} className="text-purple-400" />,
  memory_updated: <Brain size={14} className="text-yellow-400" />,
  task_completed: <CheckCircle size={14} className="text-emerald-400" />,
  build: <Wrench size={14} className="text-orange-400" />,
  document_created: <FileText size={14} className="text-yellow-400" />,
  tool_use: <Zap size={14} className="text-cyan-400" />,
  workshop_deploy: <Rocket size={14} className="text-purple-400" />,
};

function StatCard({ label, value, icon, sub }: { label: string; value: number | string; icon: React.ReactNode; sub?: string }) {
  return (
    <div className="bg-gray-900 border border-gray-800 rounded-xl p-5 flex items-center gap-4">
      <div className="bg-gray-800 rounded-lg p-2.5 flex-shrink-0">{icon}</div>
      <div className="min-w-0">
        <div className="text-2xl font-bold text-white tabular-nums">{value}</div>
        <div className="text-xs text-gray-500 mt-0.5">{label}</div>
        {sub && <div className="text-xs text-gray-600 mt-0.5">{sub}</div>}
      </div>
    </div>
  );
}

export default function HQContent() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [rhythm, setRhythm] = useState<RhythmData | null>(null);
  const [liveActivity, setLiveActivity] = useState<Activity | null>(null);

  useEffect(() => {
    fetch("/api/stats").then(r => r.json()).then(setStats);
    fetch("/api/rhythm").then(r => r.json()).then(setRhythm);

    const es = new EventSource("/api/events/stream");
    es.addEventListener("activity", (e) => {
      const data = JSON.parse(e.data) as Activity;
      setLiveActivity(data);
      // refresh stats
      fetch("/api/stats").then(r => r.json()).then(setStats);
      fetch("/api/rhythm").then(r => r.json()).then(setRhythm);
    });
    return () => es.close();
  }, []);

  const statCards = stats ? [
    { label: "Actions today", value: stats.today.total, icon: <Zap size={18} className="text-indigo-400" /> },
    { label: "Messages sent", value: stats.today.messages, icon: <MessageSquare size={18} className="text-purple-400" /> },
    { label: "Web searches", value: stats.today.searches, icon: <Globe size={18} className="text-green-400" /> },
    { label: "Files touched", value: stats.today.files, icon: <FileText size={18} className="text-blue-400" /> },
    { label: "Memory updates", value: stats.today.memory, icon: <Brain size={18} className="text-yellow-400" /> },
    { label: "Tasks upcoming", value: stats.upcomingTasks, icon: <Clock size={18} className="text-orange-400" /> },
  ] : [];

  return (
    <div className="max-w-5xl mx-auto">
      {/* Current Status Banner */}
      <div className="mb-6">
        <div className="bg-gray-900 border border-gray-800 rounded-xl px-5 py-4">
          <div className="flex items-center gap-3">
            <div className={`w-3 h-3 rounded-full flex-shrink-0 ${
              liveActivity && (Date.now() - liveActivity._creationTime < 5 * 60 * 1000)
                ? "bg-green-400 animate-pulse"
                : "bg-gray-500"
            }`} />
            <div>
              <p className="text-sm text-gray-300">
                Quinn is:{" "}
                <span className="font-medium text-white">
                  {liveActivity && (Date.now() - liveActivity._creationTime < 5 * 60 * 1000)
                    ? `Working on: ${liveActivity.title}`
                    : "Idle"
                  }
                </span>
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Header */}
      <div className="mb-6 flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">HQ</h1>
          <p className="text-gray-500 text-sm mt-1">
            {new Date().toLocaleDateString("en-IE", { weekday: "long", day: "numeric", month: "long", year: "numeric", timeZone: "Europe/Dublin" })}
          </p>
        </div>
      </div>

      {/* Stats grid */}
      {stats === null ? (
        <div className="grid grid-cols-3 gap-4 mb-8">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="bg-gray-900 border border-gray-800 rounded-xl p-5 h-20 animate-pulse" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-3 gap-4 mb-8">
          {statCards.map(({ label, value, icon }) => (
            <StatCard key={label} label={label} value={value} icon={icon} />
          ))}
        </div>
      )}

      {/* Weekly Rhythm */}
      {rhythm && (
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-4 mb-8">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider">
              Weekly Rhythm
            </h2>
            <div className="flex items-center gap-4 text-xs">
              <span className="text-gray-500">
                Plays this week: <span className="text-white font-medium">{rhythm.playsThisWeek}</span>
              </span>
              <span className="text-gray-500">
                Streak: <span className="text-green-400 font-medium">{rhythm.streak} days</span>
              </span>
            </div>
          </div>
          <div className="flex items-center justify-between gap-2">
            {rhythm.weekDays.map((day) => (
              <div key={day.date} className="flex flex-col items-center gap-1.5">
                <div
                  className={`w-8 h-8 rounded-md flex items-center justify-center ${
                    day.hasActivity
                      ? "bg-green-500/20 text-green-400"
                      : "bg-gray-800 text-gray-600"
                  }`}
                >
                  {day.hasActivity && <Activity size={16} />}
                </div>
                <span className="text-xs text-gray-500">{day.day}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="grid grid-cols-5 gap-6">
        {/* Recent Activity */}
        <div className="col-span-3">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider flex items-center gap-2">
              <Activity size={14} /> Recent Activity
            </h2>
            <Link href="/feed" className="text-xs text-indigo-400 hover:text-indigo-300 flex items-center gap-1">
              View all <ArrowRight size={12} />
            </Link>
          </div>
          <div className="space-y-2">
            {stats === null ? (
              [...Array(5)].map((_, i) => (
                <div key={i} className="bg-gray-900 border border-gray-800 rounded-lg p-3 h-14 animate-pulse" />
              ))
            ) : stats.recentActivities.length === 0 ? (
              <div className="text-center py-10 text-gray-600">
                <Zap size={28} className="mx-auto mb-2 opacity-30" />
                <p className="text-sm">No activity yet.</p>
              </div>
            ) : (
              stats.recentActivities.map((a) => (
                <div key={a._id} className="bg-gray-900 border border-gray-800 rounded-lg p-3 hover:border-gray-700 transition-colors flex items-start gap-3">
                  <div className="mt-0.5 flex-shrink-0">
                    {typeIcon[a.type] ?? <Zap size={14} className="text-gray-400" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-white truncate">{a.title}</p>
                    {a.description && <p className="text-xs text-gray-500 truncate mt-0.5">{a.description}</p>}
                  </div>
                  <span className="text-xs text-gray-600 flex-shrink-0">{formatDistanceToNow(a._creationTime)}</span>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Quick Links */}
        <div className="col-span-2">
          <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-4 flex items-center gap-2">
            <TrendingUp size={14} /> Quick Access
          </h2>
          <div className="space-y-2">
            {[
              { href: "/memory", label: "Memory Browser", desc: "What I know", emoji: "🧠" },
              { href: "/sessions", label: "Sessions", desc: "Conversation history", emoji: "💬" },
              { href: "/manager", label: "Manager", desc: "Brief + contract", emoji: "🧭" },
              { href: "/ideas", label: "Ideas", desc: "Build pipeline", emoji: "💡" },
              { href: "/cost", label: "Cost Dashboard", desc: "AI spending", emoji: "💰" },
              { href: "/crons", label: "Cron Monitor", desc: "Active schedules", emoji: "⏰" },
              { href: "/workshop", label: "Workshop", desc: "Send tasks to Quinn", emoji: "🚀" },
              { href: "/feed", label: "Activity Feed", desc: "Full action log", emoji: "📡" },
              { href: "/calendar", label: "Calendar", desc: "Upcoming tasks", emoji: "📅" },
              { href: "/search", label: "Search", desc: "Find anything", emoji: "🔍" },
            ].map(({ href, label, desc, emoji }) => (
              <Link key={href} href={href}
                className="flex items-center gap-3 p-3 bg-gray-900 border border-gray-800 rounded-lg hover:border-gray-600 hover:bg-gray-800/50 transition-all group">
                <span className="text-lg">{emoji}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-white">{label}</p>
                  <p className="text-xs text-gray-500">{desc}</p>
                </div>
                <ArrowRight size={14} className="text-gray-700 group-hover:text-gray-400 transition-colors" />
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
