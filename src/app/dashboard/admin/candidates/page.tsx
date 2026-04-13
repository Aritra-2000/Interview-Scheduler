"use client";
import { useEffect, useMemo, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Navbar from "@/components/Navbar";
import Sidebar from "@/components/Sidebar";
import Link from "next/link";
import { Users } from "lucide-react";

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
    const map = new Map<string, { nextStart: string; name?: string; count: number }>();
    for (const e of future) {
      const email = e.candidateEmail as string;
      const rec = map.get(email);
      const eTime = Date.parse(e.start);
      const count = (rec?.count || 0) + 1;
      
      if (!rec || eTime < Date.parse(rec.nextStart)) {
        map.set(email, { nextStart: e.start, name: e.candidateName || rec?.name, count });
      } else {
        map.set(email, { ...rec, count });
      }
    }
    const rows = Array.from(map.entries()).map(([email, v]) => ({ email, nextStart: v.nextStart, name: v.name, count: v.count }));
    rows.sort((a, b) => Date.parse(a.nextStart) - Date.parse(b.nextStart));
    return rows;
  }, [events]);

  if (loading && status !== "loading") return (
    <div className="min-h-screen bg-[#020203] flex items-center justify-center">
       <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-violet-500"></div>
    </div>
  );

  return (
    <div className="min-h-screen text-slate-200 grid grid-cols-12 bg-[#020203] selection:bg-violet-500/30">
      <div className="fixed top-0 left-0 w-64 h-full bg-violet-600/5 blur-[120px] -z-10" />
      
      <aside className="col-span-2 bg-[#050507]/60 backdrop-blur-xl border-r border-white/5 p-6 h-screen sticky top-0">
        <Sidebar />
      </aside>

      <main className="col-span-10 p-8 space-y-10 overflow-y-auto relative">
        <div className="absolute top-0 right-0 w-[500px] h-[400px] bg-violet-600/10 blur-[150px] pointer-events-none -z-10" />
        
        <Navbar />

        <header className="flex flex-col gap-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-violet-500/10 border border-violet-500/20 text-violet-400 text-xs font-bold tracking-widest uppercase w-fit">
            Talent Pool
          </div>
          <h1 className="text-4xl font-extrabold tracking-tight text-white">Talent <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-blue-400">Pipeline</span></h1>
          <p className="text-slate-400 max-w-2xl text-lg">Total of {upcomingByCandidate.length} active candidates trackable across all hiring stages.</p>
        </header>

        {upcomingByCandidate.length === 0 ? (
          <div className="py-20 flex flex-col items-center justify-center text-slate-500 gap-4 bg-[#09090b]/50 border border-white/5 rounded-3xl backdrop-blur-md">
             <div className="w-20 h-20 rounded-full bg-white/5 flex items-center justify-center border border-white/10">
                <Users className="w-10 h-10 opacity-20" />
             </div>
             <p className="font-bold uppercase tracking-[0.2em] text-sm italic">No active candidates found</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {upcomingByCandidate.map((row) => (
              <Link 
                key={row.email} 
                href={`/dashboard/admin/candidates/${encodeURIComponent(row.email)}`}
                className="group relative p-6 rounded-3xl bg-[#09090b]/50 border border-white/5 backdrop-blur-md hover:border-violet-500/30 transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl overflow-hidden"
              >
                {/* Micro-glow */}
                <div className="absolute -top-10 -right-10 w-32 h-32 bg-violet-600/10 blur-3xl rounded-full group-hover:bg-violet-600/20 transition-all" />
                
                <div className="flex flex-col gap-6 relative z-10">
                  <div className="flex items-center gap-4">
                    <div className="w-14 h-14 rounded-2xl bg-violet-500/10 border border-violet-500/20 flex items-center justify-center text-violet-400 text-xl font-black uppercase shadow-inner group-hover:scale-110 transition-transform">
                      {row.name?.[0] || row.email[0]}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="text-lg font-bold text-white truncate group-hover:text-violet-400 transition-colors">{row.name || "Anonymous Candidate"}</h3>
                      <p className="text-xs text-slate-500 truncate mt-0.5">{row.email}</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                     <div className="p-3 rounded-2xl bg-white/[0.03] border border-white/5">
                        <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">Status</p>
                        <div className="flex items-center gap-1.5 mt-1">
                            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                            <span className="text-xs font-bold text-emerald-400">Interviewing</span>
                        </div>
                     </div>
                     <div className="p-3 rounded-2xl bg-white/[0.03] border border-white/5 text-right">
                        <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">Events</p>
                        <p className="text-sm font-bold text-slate-200 mt-1">{row.count} Scheduled</p>
                     </div>
                  </div>

                  <div className="pt-4 border-t border-white/5">
                    <div className="flex items-center justify-between">
                        <div className="flex flex-col">
                            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Next Session</span>
                            <span className="text-xs font-bold text-white mt-0.5">
                                {new Date(row.nextStart).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })} at {new Date(row.nextStart).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                        </div>
                        <div className="w-8 h-8 rounded-full bg-white/5 border border-white/5 flex items-center justify-center text-slate-400 group-hover:bg-violet-600 group-hover:text-white transition-all">
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M9 5l7 7-7 7" /></svg>
                        </div>
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
