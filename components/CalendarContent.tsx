"use client";
import { useState, useEffect } from "react";
import { ChevronLeft, ChevronRight, Clock, Bell, RefreshCw, Calendar } from "lucide-react";

type Task = {
  _id: string;
  scheduledAt: number;
  status: string;
  type: string;
  title: string;
  description?: string;
};

const HOURS = Array.from({ length: 24 }, (_, i) => i);
const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

function getWeekDates(offset: number) {
  const now = new Date();
  const day = now.getDay();
  const monday = new Date(now);
  monday.setDate(now.getDate() - ((day + 6) % 7) + offset * 7);
  monday.setHours(0, 0, 0, 0);
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    return d;
  });
}

const typeIcon: Record<string, React.ReactNode> = {
  reminder: <Bell size={12} />,
  cron: <RefreshCw size={12} />,
  followup: <Clock size={12} />,
};

const typeColor: Record<string, string> = {
  reminder: "bg-indigo-600 border-indigo-500",
  cron: "bg-purple-600 border-purple-500",
  followup: "bg-emerald-700 border-emerald-500",
};

function usePoll<T>(url: string, interval = 5000) {
  const [data, setData] = useState<T | undefined>(undefined);
  useEffect(() => {
    let cancelled = false;
    const load = () =>
      fetch(url)
        .then((r) => r.json())
        .then((d) => { if (!cancelled) setData(d); })
        .catch(() => {});
    load();
    const id = setInterval(load, interval);
    return () => { cancelled = true; clearInterval(id); };
  }, [url, interval]);
  return data;
}

export default function CalendarContent() {
  const [weekOffset, setWeekOffset] = useState(0);
  const weekDates = getWeekDates(weekOffset);
  const tasks = usePoll<Task[]>("/api/scheduled-tasks");
  const today = new Date();

  const weekStart = weekDates[0].getTime();
  const weekEnd = weekDates[6].getTime() + 86400000;

  const weekTasks = (tasks ?? []).filter(
    (t) => t.scheduledAt >= weekStart && t.scheduledAt < weekEnd
  );

  const formatWeekLabel = () => {
    const start = weekDates[0];
    const end = weekDates[6];
    return `${start.toLocaleDateString("en-IE", { month: "short", day: "numeric", timeZone: "Europe/Dublin" })} – ${end.toLocaleDateString("en-IE", { month: "short", day: "numeric", year: "numeric", timeZone: "Europe/Dublin" })}`;
  };

  return (
    <div className="max-w-6xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold text-white flex items-center gap-2">
          <Calendar size={18} className="text-indigo-400" /> Weekly Calendar
        </h2>
        <div className="flex items-center gap-3">
          <button onClick={() => setWeekOffset(0)} className="px-3 py-1.5 text-sm bg-gray-800 text-gray-400 hover:text-white rounded-lg transition-colors">Today</button>
          <div className="flex items-center gap-1">
            <button onClick={() => setWeekOffset((o) => o - 1)} className="p-1.5 rounded-lg bg-gray-800 hover:bg-gray-700 text-gray-400 hover:text-white transition-colors"><ChevronLeft size={18} /></button>
            <span className="text-sm text-gray-400 min-w-[200px] text-center">{formatWeekLabel()}</span>
            <button onClick={() => setWeekOffset((o) => o + 1)} className="p-1.5 rounded-lg bg-gray-800 hover:bg-gray-700 text-gray-400 hover:text-white transition-colors"><ChevronRight size={18} /></button>
          </div>
        </div>
      </div>

      <div className="flex gap-4 mb-4">
        {Object.entries(typeColor).map(([type, color]) => (
          <div key={type} className="flex items-center gap-2 text-xs text-gray-400">
            <div className={`w-3 h-3 rounded ${color.split(" ")[0]}`} />
            <span className="capitalize">{type}</span>
          </div>
        ))}
      </div>

      <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
        <div className="grid grid-cols-8 border-b border-gray-800">
          <div className="py-3 px-2 text-xs text-gray-600 text-center">Time</div>
          {weekDates.map((date, i) => {
            const isToday = date.toDateString() === today.toDateString();
            return (
              <div key={i} className={`py-3 px-2 text-center border-l border-gray-800 ${isToday ? "bg-indigo-900/30" : ""}`}>
                <div className="text-xs text-gray-500">{DAYS[i]}</div>
                <div className={`text-sm font-semibold mt-0.5 ${isToday ? "text-indigo-400" : "text-white"}`}>{date.getDate()}</div>
              </div>
            );
          })}
        </div>
        <div className="overflow-y-auto max-h-[600px]">
          {HOURS.filter(h => h >= 7 && h <= 21).map((hour) => (
            <div key={hour} className="grid grid-cols-8 border-b border-gray-800/50 min-h-[60px]">
              <div className="py-2 px-2 text-xs text-gray-600 text-right pr-3 pt-1.5">
                {hour === 0 ? "12am" : hour < 12 ? `${hour}am` : hour === 12 ? "12pm" : `${hour - 12}pm`}
              </div>
              {weekDates.map((date, dayIdx) => {
                const isToday = date.toDateString() === today.toDateString();
                const dayTasks = weekTasks.filter((t) => {
                  const taskDate = new Date(t.scheduledAt);
                  return taskDate.toDateString() === date.toDateString() && taskDate.getHours() === hour;
                });
                return (
                  <div key={dayIdx} className={`border-l border-gray-800/50 p-1 ${isToday ? "bg-indigo-900/10" : ""}`}>
                    {dayTasks.map((task) => (
                      <div key={task._id}
                        className={`text-xs px-2 py-1 rounded border mb-1 flex items-center gap-1 cursor-pointer ${typeColor[task.type] ?? "bg-gray-700 border-gray-600"} ${task.status === "completed" ? "opacity-50 line-through" : ""}`}
                        title={task.description ?? task.title}>
                        {typeIcon[task.type]}
                        <span className="truncate">{task.title}</span>
                      </div>
                    ))}
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      </div>

      {tasks !== undefined && weekTasks.length === 0 && (
        <div className="text-center mt-8 text-gray-600">
          <Clock size={32} className="mx-auto mb-3 opacity-30" />
          <p>No tasks scheduled this week.</p>
        </div>
      )}
    </div>
  );
}
