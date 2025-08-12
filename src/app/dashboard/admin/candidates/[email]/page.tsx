"use client";
import { useEffect, useMemo, useState } from "react";
import { useSession } from "next-auth/react";
import { useParams, useRouter } from "next/navigation";
import Navbar from "@/components/Navbar";
import Sidebar from "@/components/Sidebar";

interface EventRow {
  id: string;
  title: string;
  start: string;
  end?: string;
  candidateEmail?: string;
}

export default function CandidateDetailPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const params = useParams();
  const emailParam = Array.isArray(params.email) ? params.email[0] : (params.email as string);
  const email = decodeURIComponent(emailParam || "");

  const [events, setEvents] = useState<EventRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (status === "loading") return;
    const role = (session as any)?.role ?? "candidate";
    if (role !== "recruiter") {
      router.replace("/dashboard/candidate");
      return;
    }
    if (!email) return;
    fetch("/api/events")
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then((data: EventRow[]) => setEvents(Array.isArray(data) ? data : []))
      .catch(() => setEvents([]))
      .finally(() => setLoading(false));
  }, [status, session, router, email]);

  const upcoming = useMemo(() => {
    const now = Date.now();
    return events
      .filter((e) => e.candidateEmail === email)
      .filter((e) => {
        const t = Date.parse(e.start);
        return !isNaN(t) && t >= now;
      })
      .sort((a, b) => Date.parse(a.start) - Date.parse(b.start));
  }, [events, email]);

  return (
    <div className="min-h-screen text-white grid grid-cols-12">
      <aside className="col-span-2 bg-gray-900 p-4">
        <Sidebar />
      </aside>
      <main className="col-span-10 p-6 space-y-6">
        <Navbar />
        <div className="flex items-baseline gap-3">
          <h1 className="text-2xl font-semibold">Candidate</h1>
          <span className="text-gray-400">{email}</span>
        </div>

        {loading ? (
          <div className="text-gray-300">Loading...</div>
        ) : upcoming.length === 0 ? (
          <div className="text-gray-300">No upcoming interviews for this candidate.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-left border border-gray-800">
              <thead className="bg-gray-800/60">
                <tr>
                  <th className="px-4 py-2 border-b border-gray-800">Title</th>
                  <th className="px-4 py-2 border-b border-gray-800">Start</th>
                  <th className="px-4 py-2 border-b border-gray-800">End</th>
                </tr>
              </thead>
              <tbody>
                {upcoming.map((e) => (
                  <tr key={e.id} className="odd:bg-gray-900/40">
                    <td className="px-4 py-2 border-b border-gray-800">{e.title}</td>
                    <td className="px-4 py-2 border-b border-gray-800">{new Date(e.start).toLocaleString()}</td>
                    <td className="px-4 py-2 border-b border-gray-800">{e.end ? new Date(e.end).toLocaleString() : ""}</td>
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
