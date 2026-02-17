import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  activities: defineTable({
    type: v.string(), // file_write, file_read, web_search, message_sent, memory_updated, task_completed, document_created, cron_set, config_changed
    title: v.string(),
    description: v.optional(v.string()),
    metadata: v.optional(v.any()),
  }).index("by_type", ["type"]),

  scheduled_tasks: defineTable({
    title: v.string(),
    description: v.optional(v.string()),
    scheduledAt: v.number(), // Unix timestamp ms
    type: v.string(), // reminder, cron, followup
    status: v.string(), // pending, completed, cancelled
    recurringRule: v.optional(v.string()), // e.g. "every 30m", "daily"
  }).index("by_status", ["status"]).index("by_scheduledAt", ["scheduledAt"]),
});
