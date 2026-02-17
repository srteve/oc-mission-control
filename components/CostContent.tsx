"use client";

import { useEffect, useState } from "react";
import { DollarSign, Calendar, TrendingUp, Clock } from "lucide-react";

type CostData = {
  today: { total: number; sessions: number };
  thisWeek: { total: number; sessions: number };
  allTime: { total: number; sessions: number };
  byDay: { date: string; total: number; sessions: number }[];
  topSessions: { id: string; preview: string; cost: number; startedAt: number }[];
  breakdown: { input: number; output: number; cacheRead: number; cacheWrite: number };
};

function formatCost(cost: number): string {
  return cost.toFixed(2);
}

function formatDate(timestamp: number): string {
  return new Date(timestamp).toLocaleDateString("en-IE", {
    month: "short",
    day: "numeric",
    timeZone: "Europe/Dublin",
  });
}

function formatDateLabel(dateStr: string): string {
  const date = new Date(dateStr + "T00:00:00");
  return date.toLocaleDateString("en-IE", { weekday: "short", timeZone: "Europe/Dublin" });
}

export default function CostContent() {
  const [data, setData] = useState<CostData | null>(null);

  useEffect(() => {
    fetch("/api/cost")
      .then((r) => r.json())
      .then(setData);
  }, []);

  const maxDayCost = data ? Math.max(...data.byDay.map((d) => d.total), 0.01) : 0.01;
  const today = new Date().toISOString().split("T")[0];

  return (
    <div className="max-w-5xl mx-auto">
      {/* Header */}
      <div className="mb-6 flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Cost Dashboard</h1>
          <p className="text-gray-500 text-sm mt-1">
            Track your AI spending over time
          </p>
        </div>
        {data && (
          <div className="bg-indigo-500/10 border border-indigo-500/30 rounded-lg px-4 py-2">
            <span className="text-sm text-gray-400">All time:</span>
            <span className="text-lg font-bold text-indigo-400 ml-2">
              ${formatCost(data.allTime.total)}
            </span>
          </div>
        )}
      </div>

      {/* Stat Cards */}
      {data === null ? (
        <div className="grid grid-cols-3 gap-4 mb-8">
          {[...Array(3)].map((_, i) => (
            <div
              key={i}
              className="bg-gray-900 border border-gray-800 rounded-xl p-5 h-20 animate-pulse"
            />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-3 gap-4 mb-8">
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-5 flex items-center gap-4">
            <div className="bg-gray-800 rounded-lg p-2.5 flex-shrink-0">
              <DollarSign size={18} className="text-green-400" />
            </div>
            <div className="min-w-0">
              <div className="text-2xl font-bold text-white tabular-nums">
                ${formatCost(data.today.total)}
              </div>
              <div className="text-xs text-gray-500 mt-0.5">Today</div>
              <div className="text-xs text-gray-600 mt-0.5">
                {data.today.sessions} sessions
              </div>
            </div>
          </div>

          <div className="bg-gray-900 border border-gray-800 rounded-xl p-5 flex items-center gap-4">
            <div className="bg-gray-800 rounded-lg p-2.5 flex-shrink-0">
              <Calendar size={18} className="text-blue-400" />
            </div>
            <div className="min-w-0">
              <div className="text-2xl font-bold text-white tabular-nums">
                ${formatCost(data.thisWeek.total)}
              </div>
              <div className="text-xs text-gray-500 mt-0.5">This week</div>
              <div className="text-xs text-gray-600 mt-0.5">
                {data.thisWeek.sessions} sessions
              </div>
            </div>
          </div>

          <div className="bg-gray-900 border border-gray-800 rounded-xl p-5 flex items-center gap-4">
            <div className="bg-gray-800 rounded-lg p-2.5 flex-shrink-0">
              <TrendingUp size={18} className="text-purple-400" />
            </div>
            <div className="min-w-0">
              <div className="text-2xl font-bold text-white tabular-nums">
                ${formatCost(data.allTime.total)}
              </div>
              <div className="text-xs text-gray-500 mt-0.5">All time</div>
              <div className="text-xs text-gray-600 mt-0.5">
                {data.allTime.sessions} sessions
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 14-day bar chart */}
      <div className="bg-gray-900 border border-gray-800 rounded-xl p-5 mb-8">
        <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-4">
          Last 14 Days
        </h2>
        {data === null ? (
          <div className="h-40 animate-pulse bg-gray-800 rounded-lg" />
        ) : (
          <div className="flex items-end gap-1.5" style={{ height: "140px" }}>
            {data.byDay.map((day) => {
              const BAR_MAX_PX = 110;
              const barHeight = day.total > 0
                ? Math.max(Math.round((day.total / maxDayCost) * BAR_MAX_PX), 4)
                : 2;
              const isToday = day.date === today;
              return (
                <div key={day.date} className="flex-1 flex flex-col items-center justify-end gap-1" style={{ height: "140px" }}>
                  {day.total > 0 && (
                    <span className="text-xs text-gray-500 mb-0.5">
                      ${formatCost(day.total)}
                    </span>
                  )}
                  <div
                    className={`w-full rounded-t-sm transition-all ${
                      isToday ? "bg-indigo-400" : day.total > 0 ? "bg-indigo-600 hover:bg-indigo-500" : "bg-gray-800"
                    }`}
                    style={{ height: `${barHeight}px` }}
                    title={`${day.date}: $${formatCost(day.total)}`}
                  />
                  <span
                    className={`text-xs mt-1 ${
                      isToday ? "text-indigo-400 font-medium" : "text-gray-600"
                    }`}
                  >
                    {formatDateLabel(day.date)}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Cost breakdown */}
      {data && (
        <div className="flex flex-wrap gap-3 mb-8">
          <div className="bg-blue-500/10 border border-blue-500/30 rounded-full px-4 py-1.5">
            <span className="text-xs text-blue-400">Input:</span>
            <span className="text-sm font-medium text-white ml-1">
              ${formatCost(data.breakdown.input)}
            </span>
          </div>
          <div className="bg-purple-500/10 border border-purple-500/30 rounded-full px-4 py-1.5">
            <span className="text-xs text-purple-400">Output:</span>
            <span className="text-sm font-medium text-white ml-1">
              ${formatCost(data.breakdown.output)}
            </span>
          </div>
          <div className="bg-amber-500/10 border border-amber-500/30 rounded-full px-4 py-1.5">
            <span className="text-xs text-amber-400">Cache read:</span>
            <span className="text-sm font-medium text-white ml-1">
              ${formatCost(data.breakdown.cacheRead)}
            </span>
          </div>
          <div className="bg-cyan-500/10 border border-cyan-500/30 rounded-full px-4 py-1.5">
            <span className="text-xs text-cyan-400">Cache write:</span>
            <span className="text-sm font-medium text-white ml-1">
              ${formatCost(data.breakdown.cacheWrite)}
            </span>
          </div>
        </div>
      )}

      {/* Top sessions table */}
      <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-800">
          <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider">
            Top Sessions by Cost
          </h2>
        </div>
        {data === null ? (
          <div className="p-5">
            {[...Array(5)].map((_, i) => (
              <div
                key={i}
                className="h-12 bg-gray-800 rounded-lg mb-2 animate-pulse"
              />
            ))}
          </div>
        ) : data.topSessions.length === 0 ? (
          <div className="p-10 text-center">
            <DollarSign
              size={32}
              className="mx-auto mb-3 text-gray-700"
            />
            <p className="text-gray-500 text-sm">No cost data available</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-800">
            {data.topSessions.map((session) => (
              <div
                key={session.id}
                className="px-5 py-3 hover:bg-gray-800/50 transition-colors flex items-center gap-4"
              >
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-gray-300 truncate">
                    {session.preview || session.id}
                  </p>
                </div>
                <div className="text-right flex-shrink-0">
                  <p className="text-sm font-medium text-white">
                    ${formatCost(session.cost)}
                  </p>
                  <p className="text-xs text-gray-500">
                    {formatDate(session.startedAt)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
