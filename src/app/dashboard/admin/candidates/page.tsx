"use client";
import { useEffect, useMemo, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Navbar from "@/components/Navbar";
import Sidebar from "@/components/Sidebar";
import { cn } from "@/components/lib/utils";
import { User, Mail, Calendar as CalIcon, ChevronRight, Search, Activity } from "lucide-react";

interface Row {
  id: string;
  title: string;
  start: string;
  end?: string;
  candidateEmail?: string;
  recruiterEmail?: string;
}

export default function CandidatesListPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    if (status === "loading") return;
    const role = (session as any)?.role ?? "candidate";
    if (role !== "recruiter") {
      router.replace("/dashboard/candidate");
      return;
    }
    fetch("/api/events")
      .then((r) => r.json())
      .then((data: Row[]) => setRows(data))
      .catch(() => setRows([]))
      .finally(() => setLoading(false));
  }, [status, session, router]);

  const upcomingByCandidate = useMemo(() => {
    const list = rows.filter((r) => !!r.candidateEmail);
    const map: Record<string, Row[]> = {};
    list.forEach((r) => {
      const email = r.candidateEmail!;
      if (!map[email]) map[email] = [];
      map[email].push(r);
    });
    
    return Object.entries(map).map(([email, events]) => {
      const sorted = events.sort((a, b) => Date.parse(a.start) - Date.parse(b.start));
      return { email, events: sorted };
    }).sort((a,b) => a.email.localeCompare(b.email));
  }, [rows]);

  const filteredCandidates = useMemo(() => {
    if (!searchQuery.trim()) return upcomingByCandidate;
    const q = searchQuery.toLowerCase();
    return upcomingByCandidate.filter(c => c.email.toLowerCase().includes(q));
  }, [upcomingByCandidate, searchQuery]);

  return (
    <div className="min-h-screen text-slate-200 grid grid-cols-12 bg-[#020203] selection:bg-indigo-500/30">
      <div className="fixed top-0 left-0 w-64 h-full bg-indigo-600/5 blur-[120px] -z-10" />
      
      <aside className="col-span-2 bg-[#050507]/60 backdrop-blur-xl border-r border-white/5 p-6 h-screen sticky top-0">
        <Sidebar />
      </aside>

      <main className="col-span-10 p-8 space-y-10 overflow-y-auto">
        <Navbar />

        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
          <header className="flex flex-col gap-2">
             <h1 className="text-4xl font-extrabold tracking-tight text-white">Talent <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-blue-400">Pipeline</span></h1>
             <p className="text-slate-400">Total of {upcomingByCandidate.length} active candidates trackable across all hiring stages.</p>
          </header>

          <div className="relative group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 group-focus-within:text-indigo-400 transition-colors" />
            <input 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Locate participant..."
              className="pl-11 pr-4 py-3 rounded-2xl bg-[#09090b]/50 border border-white/10 text-xs font-bold focus:border-indigo-500/50 outline-none w-64 transition-all"
            />
          </div>
        </div>

        {loading ? (
             <div className="p-20 flex flex-col items-center justify-center gap-4 opacity-40">
                <div className="w-10 h-10 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
                <span className="text-xs font-black uppercase tracking-[0.2em]">Mapping Nodes...</span>
             </div>
        ) : filteredCandidates.length === 0 ? (
           <div className="p-20 text-center space-y-2 opacity-30 bg-white/[0.01] rounded-[3rem] border border-dashed border-white/5">
              <p className="text-lg font-bold text-white uppercase italic">Pipeline Empty</p>
              <p className="text-xs font-black uppercase tracking-widest">No matching candidates found in current scan</p>
           </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredCandidates.map((c) => (
              <Link
                key={c.email}
                href={`/dashboard/admin/candidates/${encodeURIComponent(c.email)}`}
                className="group p-6 rounded-[2.5rem] bg-[#09090b]/50 border border-white/5 hover:border-indigo-500/30 backdrop-blur-md transition-all hover:shadow-2xl hover:shadow-indigo-500/10 active:scale-[0.98]"
              >
                <div className="flex items-center justify-between mb-6">
                   <div className="w-12 h-12 rounded-2xl bg-indigo-600/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 group-hover:bg-indigo-600 group-hover:text-white transition-all">
                      <User className="w-6 h-6" />
                   </div>
                   <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/5 text-[10px] font-black uppercase text-slate-500 group-hover:text-amber-400 group-hover:border-amber-400/20 transition-all">
                      <Activity className="w-3 h-3" />
                      Active
                   </div>
                </div>

                <div className="space-y-1 mb-6">
                   <h3 className="text-lg font-bold text-white group-hover:text-indigo-300 transition-colors truncate">{c.email.split('@')[0]}</h3>
                   <div className="flex items-center gap-2 text-slate-500">
                      <Mail className="w-3 h-3" />
                      <span className="text-xs font-medium truncate">{c.email}</span>
                   </div>
                </div>

                <div className="pt-6 border-t border-white/5 flex items-center justify-between">
                   <div className="flex flex-col">
                      <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Upcoming Sessions</span>
                      <span className="text-sm font-bold text-white mt-0.5">{c.events.length} Planned</span>
                   </div>
                   <div className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center group-hover:bg-indigo-600 transition-all">
                      <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-white" />
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
