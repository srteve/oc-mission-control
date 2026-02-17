import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

export const list = query({
  args: { status: v.optional(v.string()) },
  handler: async (ctx, { status }) => {
    const all = await ctx.db.query("scheduled_tasks").order("asc").collect();
    return status ? all.filter((t) => t.status === status) : all;
  },
});

export const upcomingCount = query({
  args: {},
  handler: async (ctx) => {
    const now = Date.now();
    const weekAhead = now + 7 * 24 * 60 * 60 * 1000;
    const all = await ctx.db.query("scheduled_tasks").collect();
    return all.filter(
      (t) => t.scheduledAt >= now && t.scheduledAt <= weekAhead && t.status === "pending"
    ).length;
  },
});

export const add = mutation({
  args: {
    title: v.string(),
    description: v.optional(v.string()),
    scheduledAt: v.number(),
    type: v.string(),
    status: v.optional(v.string()),
    recurringRule: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("scheduled_tasks", {
      ...args,
      status: args.status ?? "pending",
    });
  },
});

export const update = mutation({
  args: {
    id: v.id("scheduled_tasks"),
    status: v.optional(v.string()),
    title: v.optional(v.string()),
    description: v.optional(v.string()),
    scheduledAt: v.optional(v.number()),
  },
  handler: async (ctx, { id, ...patch }) => {
    return await ctx.db.patch(id, patch);
  },
});

export const remove = mutation({
  args: { id: v.id("scheduled_tasks") },
  handler: async (ctx, { id }) => {
    return await ctx.db.delete(id);
  },
});

export const search = query({
  args: { query: v.string() },
  handler: async (ctx, { query }) => {
    const all = await ctx.db.query("scheduled_tasks").collect();
    const q = query.toLowerCase();
    return all.filter(
      (t) =>
        t.title.toLowerCase().includes(q) ||
        (t.description?.toLowerCase().includes(q) ?? false)
    );
  },
});
