"use client";
import { useState, useEffect, useRef } from "react";
import { MessageCircle, Clock, Loader2 } from "lucide-react";
import { formatDistanceToNow } from "@/lib/utils";

type Message = {
  role: "user" | "assistant";
  text: string;
  timestamp: number;
  sessionId: string;
  channel?: string;
};

export default function InboxContent() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [lastActiveAt, setLastActiveAt] = useState<number>(Date.now());
  const [loading, setLoading] = useState(true);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetch("/api/inbox")
      .then(r => r.json())
      .then(({ messages, lastActiveAt }) => {
        setMessages(messages);
        setLastActiveAt(lastActiveAt);
      })
      .finally(() => setLoading(false));
  }, []);

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  // Group messages by session date
  const groupedMessages: { date: string; messages: Message[] }[] = [];
  let currentGroup: Message[] = [];
  let currentDate = "";

  messages.forEach((msg) => {
    const msgDate = new Date(msg.timestamp).toLocaleDateString("en-IE", {
      weekday: "short",
      month: "short",
      day: "numeric",
      timeZone: "Europe/Dublin",
    });
    if (msgDate !== currentDate) {
      if (currentGroup.length > 0) {
        groupedMessages.push({ date: currentDate, messages: currentGroup });
      }
      currentDate = msgDate;
      currentGroup = [msg];
    } else {
      currentGroup.push(msg);
    }
  });
  if (currentGroup.length > 0) {
    groupedMessages.push({ date: currentDate, messages: currentGroup });
  }

  return (
    <div className="max-w-3xl mx-auto h-full">
      <div className="flex items-center gap-2 mb-6">
        <MessageCircle size={18} className="text-indigo-400" />
        <h2 className="text-xl font-bold text-white">Conversation</h2>
      </div>

      <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden h-[calc(100vh-180px)] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-800">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-white">Recent Messages</span>
          </div>
          <div className="flex items-center gap-2 text-xs text-gray-500">
            <Clock size={12} />
            <span>Last active {formatDistanceToNow(lastActiveAt)}</span>
          </div>
        </div>

        {/* Messages */}
        <div ref={scrollRef} className="flex-1 overflow-auto p-4">
          {loading ? (
            <div className="flex items-center justify-center h-full">
              <Loader2 size={24} className="text-indigo-400 animate-spin" />
            </div>
          ) : messages.length === 0 ? (
            <div className="flex items-center justify-center h-full text-gray-500">
              No messages yet
            </div>
          ) : (
            <div className="space-y-4">
              {groupedMessages.map((group, groupIdx) => (
                <div key={groupIdx}>
                  {/* Date divider */}
                  <div className="flex items-center justify-center my-4">
                    <div className="bg-gray-800 px-3 py-1 rounded-full">
                      <span className="text-xs text-gray-400">{group.date}</span>
                    </div>
                  </div>

                  {/* Messages in this group */}
                  <div className="space-y-3">
                    {group.messages.map((msg, idx) => (
                      <div
                        key={idx}
                        className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
                      >
                        <div
                          className={`max-w-[75%] px-4 py-2.5 rounded-2xl ${
                            msg.role === "user"
                              ? "bg-indigo-600 text-white rounded-br-md"
                              : "bg-gray-800 text-gray-100 rounded-bl-md"
                          }`}
                        >
                          <p className="text-sm whitespace-pre-wrap break-words leading-relaxed">
                            {msg.text}
                          </p>
                          <div
                            className={`text-xs mt-1.5 ${
                              msg.role === "user" ? "text-indigo-200" : "text-gray-500"
                            }`}
                          >
                            {formatDistanceToNow(msg.timestamp)}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
