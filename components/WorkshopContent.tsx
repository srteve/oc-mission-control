"use client";
import { useState, useEffect } from "react";
import { Rocket, Send, Loader2, Clock, Zap } from "lucide-react";
import { formatDistanceToNow } from "@/lib/utils";

type Activity = {
  _id: string;
  _creationTime: number;
  type: string;
  title: string;
  description?: string;
};

export default function WorkshopContent() {
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [recentDeploys, setRecentDeploys] = useState<Activity[]>([]);
  const [loadError, setLoadError] = useState<string | null>(null);

  // Load recent workshop deployments
  useEffect(() => {
    fetch("/api/log-activity?type=workshop_deploy&limit=5")
      .then(r => r.json())
      .then(data => {
        if (Array.isArray(data)) {
          setRecentDeploys(data);
        }
      })
      .catch(err => {
        console.error("Failed to load recent deploys:", err);
        setLoadError("Could not load recent deployments");
      });
  }, []);

  const handleSend = async () => {
    if (!message.trim() || sending) return;

    setSending(true);
    try {
      const res = await fetch("/api/workshop/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: message.trim() }),
      });

      const data = await res.json();

      if (!res.ok || data.error) {
        alert(data.error || "Failed to send message");
        return;
      }

      // Log the activity
      await fetch("/api/log-activity", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "workshop_deploy",
          title: "Workshop deployment",
          description: message.trim().slice(0, 100),
        }),
      });

      // Add to local list
      setRecentDeploys(prev => [{
        _id: `local_${Date.now()}`,
        _creationTime: Date.now(),
        type: "workshop_deploy",
        title: "Workshop deployment",
        description: message.trim().slice(0, 100),
      }, ...prev.slice(0, 4)]);

      setMessage("");
    } catch (err) {
      console.error("Send error:", err);
      alert("Failed to send message");
    } finally {
      setSending(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
      handleSend();
    }
  };

  return (
    <div className="max-w-3xl mx-auto">
      <div className="flex items-center gap-2 mb-6">
        <Rocket size={20} className="text-purple-400" />
        <h2 className="text-xl font-bold text-white">Workshop</h2>
      </div>

      {/* Send Message Section */}
      <div className="bg-gray-900 border border-gray-800 rounded-xl p-6 mb-8">
        <label className="block text-sm font-medium text-gray-300 mb-3">
          Send a task or idea to Quinn
        </label>
        <textarea
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="What would you like Quinn to work on? Examples:
- Search for X and summarize findings
- Review the recent code changes
- Check my calendar for tomorrow
- Write a test for the login function"
          className="w-full h-40 bg-gray-950 border border-gray-800 rounded-lg p-4 text-white placeholder-gray-600 resize-none focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 transition-colors"
        />
        <div className="flex items-center justify-between mt-4">
          <p className="text-xs text-gray-600">
            Press <kbd className="px-1.5 py-0.5 bg-gray-800 rounded text-gray-400">⌘</kbd> + <kbd className="px-1.5 py-0.5 bg-gray-800 rounded text-gray-400">Enter</kbd> to send
          </p>
          <button
            onClick={handleSend}
            disabled={!message.trim() || sending}
            className="flex items-center gap-2 px-5 py-2.5 bg-purple-600 hover:bg-purple-500 disabled:bg-gray-700 disabled:text-gray-500 text-white rounded-lg font-medium transition-colors"
          >
            {sending ? (
              <>
                <Loader2 size={16} className="animate-spin" />
                Deploying...
              </>
            ) : (
              <>
                Deploy to Quinn
                <Rocket size={16} />
              </>
            )}
          </button>
        </div>
      </div>

      {/* Recent Deployments */}
      <div>
        <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-3 flex items-center gap-2">
          <Zap size={13} className="text-purple-400" /> Recent Deployments
        </h3>
        {loadError ? (
          <div className="text-center py-6 text-gray-600 border border-gray-800 rounded-xl">
            <p className="text-sm">{loadError}</p>
          </div>
        ) : recentDeploys.length === 0 ? (
          <div className="text-center py-8 text-gray-600 border border-gray-800 rounded-xl">
            <Rocket size={24} className="mx-auto mb-2 opacity-30" />
            <p className="text-sm">No deployments yet.</p>
            <p className="text-xs mt-1">Send a message above to get started.</p>
          </div>
        ) : (
          <div className="space-y-2">
            {recentDeploys.map((deploy) => (
              <div key={deploy._id} className="flex items-start gap-3 px-4 py-3 bg-gray-900 border border-gray-800 rounded-lg">
                <Rocket size={14} className="text-purple-400 flex-shrink-0 mt-0.5" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-white truncate">{deploy.title}</p>
                  {deploy.description && (
                    <p className="text-xs text-gray-500 truncate mt-0.5">{deploy.description}</p>
                  )}
                </div>
                <div className="flex items-center gap-1.5 flex-shrink-0">
                  <Clock size={11} className="text-gray-600" />
                  <span className="text-xs text-gray-600">{formatDistanceToNow(deploy._creationTime)}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
