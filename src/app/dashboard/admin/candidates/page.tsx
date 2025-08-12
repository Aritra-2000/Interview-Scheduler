"use client";
import { useEffect, useMemo, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Navbar from "@/components/Navbar";
import Sidebar from "@/components/Sidebar";
import Link from "next/link";

interface EventRow {
  id: string;
  title: string;
  start: string;
  end?: string;
  candidateEmail?: string;
  candidateName?: string;
}

export default function CandidatesListPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [events, setEvents] = useState<EventRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (status === "loading") return;
    const role = (session as any)?.role ?? "candidate";
    if (role !== "recruiter") {
      router.replace("/dashboard/candidate");
      return;
    }
    fetch("/api/events")
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then((data: EventRow[]) => setEvents(Array.isArray(data) ? data : []))
      .catch(() => setEvents([]))
      .finally(() => setLoading(false));
  }, [status, session, router]);

  const upcomingByCandidate = useMemo(() => {
    const now = Date.now();
    const future = events.filter((e) => {
      const t = Date.parse(e.start);
      return e.candidateEmail && !isNaN(t) && t >= now;
    });
    const map = new Map<string, { nextStart: string; name?: string }>();
    for (const e of future) {
      const email = e.candidateEmail as string;
      const rec = map.get(email);
      const eTime = Date.parse(e.start);
      if (!rec || eTime < Date.parse(rec.nextStart)) {
        map.set(email, { nextStart: e.start, name: e.candidateName || rec?.name });
      } else if (!rec.name && e.candidateName) {
        // keep earliest start but backfill name when available
        map.set(email, { nextStart: rec.nextStart, name: e.candidateName });
      }
    }
    const rows = Array.from(map.entries()).map(([email, v]) => ({ email, nextStart: v.nextStart, name: v.name }));
    rows.sort((a, b) => Date.parse(a.nextStart) - Date.parse(b.nextStart));
    return rows;
  }, [events]);

  return (
    <div className="min-h-screen text-white grid grid-cols-12">
      <aside className="col-span-2 bg-gray-900 p-4">
        <Sidebar />
      </aside>
      <main className="col-span-10 p-6 space-y-6">
        <Navbar />
        <h1 className="text-2xl font-semibold">Candidates</h1>
        <p className="text-gray-400">Upcoming candidates and their next interview</p>

        {loading ? (
          <div className="text-gray-300">Loading...</div>
        ) : upcomingByCandidate.length === 0 ? (
          <div className="text-gray-300">No upcoming interviews.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-left border border-gray-800">
              <thead className="bg-gray-800/60">
                <tr>
                  <th className="px-4 py-2 border-b border-gray-800">Candidate Name</th>
                  <th className="px-4 py-2 border-b border-gray-800">Email</th>
                  <th className="px-4 py-2 border-b border-gray-800">Next Interview</th>
                </tr>
              </thead>
              <tbody>
                {upcomingByCandidate.map((row) => (
                  <tr key={row.email} className="odd:bg-gray-900/40">
                    <td className="px-4 py-2 border-b border-gray-800">
                      <Link className="text-blue-400 hover:underline" href={`/dashboard/admin/candidates/${encodeURIComponent(row.email)}`}>
                        {row.name}
                      </Link>
                    </td>
                    <td className="px-4 py-2 border-b border-gray-800">{row.email}</td>
                    <td className="px-4 py-2 border-b border-gray-800">{new Date(row.nextStart).toLocaleString()}</td>
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
