"use client";
import { ReactNode } from "react";
import { Settings } from "lucide-react";

const convexUrl = process.env.NEXT_PUBLIC_CONVEX_URL ?? "";

export function ConvexGuard({ children }: { children: ReactNode }) {
  if (!convexUrl) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
        <Settings size={48} className="text-gray-700 mb-4" />
        <h2 className="text-xl font-bold text-white mb-2">Convex not connected</h2>
        <p className="text-gray-400 max-w-md text-sm">
          Run <code className="bg-gray-800 px-2 py-1 rounded text-indigo-400">npx convex dev</code> in the{" "}
          <code className="bg-gray-800 px-2 py-1 rounded text-indigo-400">mission-control</code> directory,
          then copy your deployment URL into <code className="bg-gray-800 px-2 py-1 rounded text-indigo-400">.env.local</code>.
        </p>
        <p className="text-gray-600 text-xs mt-4">NEXT_PUBLIC_CONVEX_URL is not set</p>
      </div>
    );
  }
  return <>{children}</>;
}
