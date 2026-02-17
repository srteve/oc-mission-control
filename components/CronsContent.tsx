"use client";
import { useState, useEffect } from "react";
import { Clock, RefreshCw, Play, AlertCircle, Calendar, CheckCircle, XCircle } from "lucide-react";
import { formatDistanceToNow } from "@/lib/utils";

type CronJob = {
  id: string;
  name: string;
  schedule: string;
  payload?: unknown;
  enabled: boolean;
  nextRun?: number;
  lastRun?: number;
};

type CronsData = {
  jobs: CronJob[];
};

function formatSchedule(schedule: string): string {
  // Convert cron expression to human-readable
  if (!schedule) return "Unknown";
  
  // Common patterns
  const parts = schedule.split(" ");
  if (parts.length === 5) {
    const [min, hour, day, month, dow] = parts;
    
    // Every X minutes
    if (min.includes("/")) {
      const interval = min.split("/")[1];
      return `Every ${interval} minutes`;
    }
    // Every X hours
    if (hour.includes("/")) {
      const interval = hour.split("/")[1];
      return `Every ${interval} hours`;
    }
    // Daily at specific time
    if (day === "*" && month === "*" && dow === "*") {
      return `Daily at ${hour}:${min.padStart(2, "0")}`;
    }
    // Weekly
    if (day === "*" && month === "*" && dow !== "*") {
      const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
      const dayName = days[parseInt(dow)] || dow;
      return `Weekly on ${dayName} at ${hour}:${min.padStart(2, "0")}`;
    }
    // Monthly
    if (day !== "*" && month === "*" && dow === "*") {
      return `Monthly on day ${day} at ${hour}:${min.padStart(2, "0")}`;
    }
  }
  
  return schedule;
}

function formatTimestamp(ts?: number): string {
  if (!ts) return "Never";
  return new Date(ts * 1000).toLocaleString("en-IE", {
    month: "short", day: "numeric", hour: "2-digit", minute: "2-digit", timeZone: "Europe/Dublin"
  });
}

export default function CronsContent() {
  const [data, setData] = useState<CronsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [runningJob, setRunningJob] = useState<string | null>(null);

  const load = () => {
    setLoading(true);
    fetch("/api/crons")
      .then(r => r.json())
      .then(setData)
      .finally(() => setLoading(false));
  };

  const runJob = async (jobId: string) => {
    setRunningJob(jobId);
    try {
      await fetch("/api/crons", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "run", jobId }),
      });
      // Refresh after running
      setTimeout(load, 1000);
    } finally {
      setRunningJob(null);
    }
  };

  useEffect(() => { load(); }, []);

  const jobs = data?.jobs ?? [];
  const enabledJobs = jobs.filter(j => j.enabled);
  const disabledJobs = jobs.filter(j => !j.enabled);

  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <Clock size={18} className="text-indigo-400" />
          <h2 className="text-xl font-bold text-white">Cron Monitor</h2>
        </div>
        <button onClick={load}
          className="flex items-center gap-2 px-3 py-1.5 text-sm bg-gray-800 text-gray-400 hover:text-white rounded-lg transition-colors">
          <RefreshCw size={13} /> Refresh
        </button>
      </div>

      {loading ? (
        <div className="space-y-3">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-20 bg-gray-900 rounded-xl animate-pulse" />
          ))}
        </div>
      ) : jobs.length === 0 ? (
        <div className="text-center py-16 text-gray-500 border border-gray-800 rounded-xl">
          <Clock size={32} className="mx-auto mb-3 opacity-30" />
          <p className="text-lg font-medium">No cron jobs</p>
          <p className="text-sm mt-1 text-gray-600">Quinn hasn't scheduled any recurring tasks yet.</p>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Enabled Jobs */}
          {enabledJobs.length > 0 && (
            <div>
              <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-3 flex items-center gap-2">
                <CheckCircle size={13} className="text-emerald-400" /> Active ({enabledJobs.length})
              </h3>
              <div className="space-y-2">
                {enabledJobs.map((job) => (
                  <div key={job.id} className="bg-gray-900 border border-gray-800 rounded-xl p-4 hover:border-gray-700 transition-colors">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-medium text-white">{job.name}</p>
                          <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-900/40 border border-emerald-700/50 text-emerald-300">
                            Active
                          </span>
                        </div>
                        <p className="text-xs text-gray-500 mt-1 font-mono">{formatSchedule(job.schedule)}</p>
                      </div>
                      <button
                        onClick={() => runJob(job.id)}
                        disabled={runningJob === job.id}
                        className="flex items-center gap-1.5 px-3 py-1.5 text-xs bg-indigo-600 hover:bg-indigo-500 disabled:bg-gray-700 text-white rounded-lg transition-colors"
                      >
                        {runningJob === job.id ? (
                          <RefreshCw size={12} className="animate-spin" />
                        ) : (
                          <Play size={12} />
                        )}
                        Run Now
                      </button>
                    </div>
                    <div className="flex items-center gap-4 mt-3 pt-3 border-t border-gray-800">
                      <div className="flex items-center gap-1.5">
                        <Calendar size={11} className="text-gray-500" />
                        <span className="text-xs text-gray-500">Next: {formatTimestamp(job.nextRun)}</span>
                      </div>
                      {job.lastRun && (
                        <div className="flex items-center gap-1.5">
                          <CheckCircle size={11} className="text-gray-500" />
                          <span className="text-xs text-gray-500">Last: {formatTimestamp(job.lastRun)}</span>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Disabled Jobs */}
          {disabledJobs.length > 0 && (
            <div>
              <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-3 flex items-center gap-2">
                <XCircle size={13} className="text-gray-500" /> Disabled ({disabledJobs.length})
              </h3>
              <div className="space-y-2">
                {disabledJobs.map((job) => (
                  <div key={job.id} className="bg-gray-900/50 border border-gray-800 rounded-xl p-4 opacity-60">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-medium text-gray-400">{job.name}</p>
                          <span className="text-xs px-2 py-0.5 rounded-full bg-gray-800 border border-gray-700 text-gray-500">
                            Disabled
                          </span>
                        </div>
                        <p className="text-xs text-gray-600 mt-1 font-mono">{formatSchedule(job.schedule)}</p>
                      </div>
                      <button
                        onClick={() => runJob(job.id)}
                        disabled={runningJob === job.id}
                        className="flex items-center gap-1.5 px-3 py-1.5 text-xs bg-gray-700 hover:bg-gray-600 disabled:bg-gray-800 text-gray-300 rounded-lg transition-colors"
                      >
                        {runningJob === job.id ? (
                          <RefreshCw size={12} className="animate-spin" />
                        ) : (
                          <Play size={12} />
                        )}
                        Run Now
                      </button>
                    </div>
                    {job.lastRun && (
                      <div className="flex items-center gap-4 mt-3 pt-3 border-t border-gray-800">
                        <div className="flex items-center gap-1.5">
                          <CheckCircle size={11} className="text-gray-600" />
                          <span className="text-xs text-gray-600">Last ran: {formatTimestamp(job.lastRun)}</span>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
