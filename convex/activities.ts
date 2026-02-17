import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

export const list = query({
  args: {
    type: v.optional(v.string()),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, { type, limit }) => {
    let q = ctx.db.query("activities").order("desc");
    const results = await q.collect();
    const filtered = type ? results.filter((a) => a.type === type) : results;
    return limit ? filtered.slice(0, limit) : filtered;
  },
});

export const todayCount = query({
  args: {},
  handler: async (ctx) => {
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);
    const all = await ctx.db.query("activities").order("desc").collect();
    return all.filter((a) => a._creationTime >= startOfDay.getTime()).length;
  },
});

export const add = mutation({
  args: {
    type: v.string(),
    title: v.string(),
    description: v.optional(v.string()),
    metadata: v.optional(v.any()),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("activities", args);
  },
});

export const search = query({
  args: { query: v.string() },
  handler: async (ctx, { query }) => {
    const all = await ctx.db.query("activities").order("desc").collect();
    const q = query.toLowerCase();
    return all.filter(
      (a) =>
        a.title.toLowerCase().includes(q) ||
        (a.description?.toLowerCase().includes(q) ?? false)
    );
  },
});
