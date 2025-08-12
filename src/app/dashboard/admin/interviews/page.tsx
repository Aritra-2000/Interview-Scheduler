"use client";
import { useEffect, useMemo, useState } from "react";
import { useSession } from "next-auth/react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import Navbar from "@/components/Navbar";
import Sidebar from "@/components/Sidebar";

interface Row {
  id: string;
  title: string;
  start: string;
  end?: string;
  candidateEmail?: string;
}

export default function AllInterviewsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [upcomingOnly, setUpcomingOnly] = useState<boolean>(searchParams.get("upcoming") !== "0");
  const [range, setRange] = useState<"all" | "today" | "week">((searchParams.get("range") as any) || "all");
  const [query, setQuery] = useState<string>(searchParams.get("q") || "");

  useEffect(() => {
    if (status === "loading") return;
    const role = (session as any)?.role ?? "candidate";
    if (role !== "recruiter") {
      router.replace("/dashboard/candidate");
      return;
    }
    // recruiter: fetch all interviews
    fetch("/api/events")
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then((data: Row[]) => setRows(data))
      .catch(() => setRows([]))
      .finally(() => setLoading(false));
  }, [status, session, router]);

  const displayed = useMemo(() => {
    let list = rows.slice();
    const now = Date.now();
    if (upcomingOnly) {
      list = list.filter((r) => {
        const t = Date.parse(r.start);
        return !isNaN(t) && t >= now;
      });
    }
    // Range filter
    if (range === "today") {
      const start = new Date();
      start.setHours(0, 0, 0, 0);
      const end = new Date();
      end.setHours(23, 59, 59, 999);
      list = list.filter((r) => {
        const t = Date.parse(r.start);
        return !isNaN(t) && t >= start.getTime() && t <= end.getTime();
      });
    } else if (range === "week") {
      const end = new Date(now + 7 * 24 * 60 * 60 * 1000);
      list = list.filter((r) => {
        const t = Date.parse(r.start);
        return !isNaN(t) && t <= end.getTime();
      });
    }
    // Text search
    if (query.trim()) {
      const q = query.trim().toLowerCase();
      list = list.filter((r) => (r.title || "").toLowerCase().includes(q) || (r.candidateEmail || "").toLowerCase().includes(q));
    }
    // Sort by start asc
    list.sort((a, b) => Date.parse(a.start) - Date.parse(b.start));
    return list;
  }, [rows, upcomingOnly, range, query]);

  // Persist controls in URL
  useEffect(() => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("upcoming", upcomingOnly ? "1" : "0");
    params.set("range", range);
    if (query) params.set("q", query);
    else params.delete("q");
    router.replace(`${pathname}?${params.toString()}`);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [upcomingOnly, range, query]);

  return (
    <div className="min-h-screen text-white grid grid-cols-12">
      <aside className="col-span-2 bg-gray-900 p-4">
        <Sidebar />
      </aside>
      <main className="col-span-10 p-6 space-y-6">
        <Navbar />
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <h1 className="text-2xl font-semibold">All Interviews</h1>
          <div className="flex items-center gap-3">
            <label className="text-sm flex items-center gap-2 select-none">
              <input
                type="checkbox"
                className="accent-gray-700"
                checked={upcomingOnly}
                onChange={(e) => setUpcomingOnly(e.target.checked)}
              />
              Upcoming only
            </label>
            <div className="flex items-center gap-2 text-sm">
              <button
                onClick={() => setRange("today")}
                className={`px-2 py-1 rounded border ${range === "today" ? "bg-gray-800 border-gray-700" : "border-gray-800 hover:bg-gray-800/60"}`}
              >
                Today
              </button>
              <button
                onClick={() => setRange("week")}
                className={`px-2 py-1 rounded border ${range === "week" ? "bg-gray-800 border-gray-700" : "border-gray-800 hover:bg-gray-800/60"}`}
              >
                This Week
              </button>
              <button
                onClick={() => setRange("all")}
                className={`px-2 py-1 rounded border ${range === "all" ? "bg-gray-800 border-gray-700" : "border-gray-800 hover:bg-gray-800/60"}`}
              >
                All
              </button>
            </div>
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search (title or email)"
              className="px-3 py-1.5 rounded bg-gray-900 border border-gray-800 text-sm"
            />
          </div>
        </div>

        {loading ? (
          <div className="text-gray-300">Loading...</div>
        ) : displayed.length === 0 ? (
          <div className="text-gray-300">No interviews found.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-left border border-gray-800">
              <thead className="bg-gray-800/60">
                <tr>
                  <th className="px-4 py-2 border-b border-gray-800">Title</th>
                  <th className="px-4 py-2 border-b border-gray-800">Candidate</th>
                  <th className="px-4 py-2 border-b border-gray-800">Start</th>
                  <th className="px-4 py-2 border-b border-gray-800">End</th>
                </tr>
              </thead>
              <tbody>
                {displayed.map((r) => (
                  <tr key={r.id} className="odd:bg-gray-900/40">
                    <td className="px-4 py-2 border-b border-gray-800">{r.title}</td>
                    <td className="px-4 py-2 border-b border-gray-800">{r.candidateEmail || "-"}</td>
                    <td className="px-4 py-2 border-b border-gray-800">{new Date(r.start).toLocaleString()}</td>
                    <td className="px-4 py-2 border-b border-gray-800">{r.end ? new Date(r.end).toLocaleString() : ""}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </main>
    </div>
  );
}
