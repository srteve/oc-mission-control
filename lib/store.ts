import fs from "fs";
import path from "path";

const DATA_DIR = path.join(process.cwd(), "data");

function readJSON<T>(file: string): T[] {
  try {
    const raw = fs.readFileSync(path.join(DATA_DIR, file), "utf-8");
    return JSON.parse(raw) as T[];
  } catch {
    return [];
  }
}

function writeJSON<T>(file: string, data: T[]): void {
  fs.mkdirSync(DATA_DIR, { recursive: true });
  fs.writeFileSync(path.join(DATA_DIR, file), JSON.stringify(data, null, 2));
}

export type Activity = {
  _id: string;
  _creationTime: number;
  type: string;
  title: string;
  description?: string;
  metadata?: Record<string, unknown>;
};

export type Task = {
  _id: string;
  title: string;
  description?: string;
  scheduledAt: number;
  type: string;
  status: string;
  recurringRule?: string;
};

export type Idea = {
  _id: string;
  title: string;
  summary?: string;
  status: string;
  tags: string[];
  link?: string;
  owner: string;
  createdAt: number;
  updatedAt: number;
};

export const activities = {
  list(type?: string, limit?: number): Activity[] {
    let all = readJSON<Activity>("activities.json").reverse();
    if (type) all = all.filter((a) => a.type === type);
    if (limit) all = all.slice(0, limit);
    return all;
  },
  add(data: Omit<Activity, "_id" | "_creationTime">): Activity {
    const all = readJSON<Activity>("activities.json");
    const entry: Activity = {
      _id: `act_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
      _creationTime: Date.now(),
      ...data,
    };
    all.push(entry);
    writeJSON("activities.json", all);
    return entry;
  },
  todayCount(): number {
    const start = new Date();
    start.setHours(0, 0, 0, 0);
    return readJSON<Activity>("activities.json").filter(
      (a) => a._creationTime >= start.getTime()
    ).length;
  },
  search(q: string): Activity[] {
    const lower = q.toLowerCase();
    return readJSON<Activity>("activities.json")
      .reverse()
      .filter(
        (a) =>
          a.title.toLowerCase().includes(lower) ||
          (a.description?.toLowerCase().includes(lower) ?? false)
      );
  },
};

export const tasks = {
  list(status?: string): Task[] {
    const all = readJSON<Task>("tasks.json");
    return status ? all.filter((t) => t.status === status) : all;
  },
  add(data: Omit<Task, "_id">): Task {
    const all = readJSON<Task>("tasks.json");
    const entry: Task = {
      _id: `task_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
      ...data,
    };
    all.push(entry);
    writeJSON("tasks.json", all);
    return entry;
  },
  update(id: string, patch: Partial<Task>): Task | null {
    const all = readJSON<Task>("tasks.json");
    const idx = all.findIndex((t) => t._id === id);
    if (idx === -1) return null;
    all[idx] = { ...all[idx], ...patch };
    writeJSON("tasks.json", all);
    return all[idx];
  },
  remove(id: string): boolean {
    const all = readJSON<Task>("tasks.json");
    const next = all.filter((t) => t._id !== id);
    writeJSON("tasks.json", next);
    return next.length < all.length;
  },
  upcomingCount(): number {
    const now = Date.now();
    const weekAhead = now + 7 * 24 * 60 * 60 * 1000;
    return readJSON<Task>("tasks.json").filter(
      (t) =>
        t.scheduledAt >= now &&
        t.scheduledAt <= weekAhead &&
        t.status === "pending"
    ).length;
  },
  search(q: string): Task[] {
    const lower = q.toLowerCase();
    return readJSON<Task>("tasks.json").filter(
      (t) =>
        t.title.toLowerCase().includes(lower) ||
        (t.description?.toLowerCase().includes(lower) ?? false)
    );
  },
};

export const ideas = {
  list(opts?: { status?: string; owner?: string; q?: string }): Idea[] {
    const { status, owner, q } = opts ?? {};
    let all = readJSON<Idea>("ideas.json");
    if (status && status !== "All") all = all.filter((i) => i.status === status);
    if (owner && owner !== "All") all = all.filter((i) => i.owner === owner);
    if (q) {
      const lower = q.toLowerCase();
      all = all.filter((i) =>
        i.title.toLowerCase().includes(lower) ||
        (i.summary?.toLowerCase().includes(lower) ?? false) ||
        i.tags.some((t) => t.toLowerCase().includes(lower))
      );
    }
    return all.sort((a, b) => b.updatedAt - a.updatedAt);
  },
  add(data: Omit<Idea, "_id" | "createdAt" | "updatedAt">): Idea {
    const all = readJSON<Idea>("ideas.json");
    const now = Date.now();
    const entry: Idea = {
      _id: `idea_${now}_${Math.random().toString(36).slice(2, 7)}`,
      createdAt: now,
      updatedAt: now,
      ...data,
    };
    all.push(entry);
    writeJSON("ideas.json", all);
    return entry;
  },
  update(id: string, patch: Partial<Idea>): Idea | null {
    const all = readJSON<Idea>("ideas.json");
    const idx = all.findIndex((t) => t._id === id);
    if (idx === -1) return null;
    all[idx] = { ...all[idx], ...patch, updatedAt: Date.now() };
    writeJSON("ideas.json", all);
    return all[idx];
  },
  remove(id: string): boolean {
    const all = readJSON<Idea>("ideas.json");
    const next = all.filter((t) => t._id !== id);
    writeJSON("ideas.json", next);
    return next.length < all.length;
  },
};
