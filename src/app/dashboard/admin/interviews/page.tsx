"use client";
import { useEffect, useMemo, useState } from "react";
import { useSession } from "next-auth/react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import Navbar from "@/components/Navbar";
import Sidebar from "@/components/Sidebar";
import { cn } from "@/components/lib/utils";
import { Search, Filter, Calendar as CalIcon, User, Layers, Clock } from "lucide-react";

interface Row {
  id: string;
  title: string;
  start: string;
  end?: string;
  candidateEmail?: string;
  recruiterEmail?: string;
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
    if (query.trim()) {
      const q = query.trim().toLowerCase();
      list = list.filter((r) => (r.title || "").toLowerCase().includes(q) || (r.candidateEmail || "").toLowerCase().includes(q));
    }
    list.sort((a, b) => Date.parse(a.start) - Date.parse(b.start));
    return list;
  }, [rows, upcomingOnly, range, query]);

  useEffect(() => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("upcoming", upcomingOnly ? "1" : "0");
    params.set("range", range);
    if (query) params.set("q", query);
    else params.delete("q");
    router.replace(`${pathname}?${params.toString()}`);
  }, [upcomingOnly, range, query]);

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
             <h1 className="text-4xl font-extrabold tracking-tight text-white italic">Session <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-blue-400">Orchestrator</span></h1>
             <p className="text-slate-400">Manage and track your active interview pipeline and historical records.</p>
          </header>
          
          <div className="flex flex-wrap items-center gap-4">
             <div className="flex items-center p-1 rounded-xl bg-white/5 border border-white/5 backdrop-blur-sm">
                {(["today", "week", "all"] as const).map(r => (
                  <button 
                    key={r}
                    onClick={() => setRange(r)}
                    className={cn(
                      "px-4 py-1.5 rounded-lg text-xs font-black uppercase tracking-widest transition-all",
                      range === r ? "bg-indigo-600 text-white shadow-lg" : "text-slate-500 hover:text-white"
                    )}
                  >
                    {r}
                  </button>
                ))}
             </div>
             
             <div className="relative group">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 group-focus-within:text-blue-400 transition-colors" />
                <input 
                   value={query}
                   onChange={(e) => setQuery(e.target.value)}
                   placeholder="Filter sequence..."
                   className="pl-11 pr-4 py-3 rounded-2xl bg-[#09090b]/50 border border-white/10 text-xs font-bold focus:border-blue-500/50 outline-none w-64 transition-all"
                />
             </div>
          </div>
        </div>

        <section className="bg-[#09090b]/50 border border-white/5 backdrop-blur-md rounded-[2.5rem] overflow-hidden shadow-2xl">
           <div className="px-8 py-6 border-b border-white/5 flex items-center justify-between">
              <div className="flex items-center gap-3">
                 <Layers className="w-5 h-5 text-indigo-400" />
                 <h2 className="text-lg font-bold text-white tracking-tight">Active Transmissions</h2>
              </div>
              <label className="flex items-center gap-3 cursor-pointer group">
                 <span className="text-[10px] font-black uppercase tracking-widest text-slate-500 group-hover:text-slate-300 transition-colors">Hide Historical Data</span>
                 <input 
                    type="checkbox" 
                    checked={upcomingOnly} 
                    onChange={(e) => setUpcomingOnly(e.target.checked)} 
                    className="accent-indigo-600 w-4 h-4" 
                 />
              </label>
           </div>

           {loading ? (
             <div className="p-20 flex flex-col items-center justify-center gap-4 opacity-40">
                <div className="w-10 h-10 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
                <span className="text-xs font-black uppercase tracking-[0.2em]">Synchronizing...</span>
             </div>
           ) : displayed.length === 0 ? (
             <div className="p-20 text-center space-y-2 opacity-30">
                <p className="text-lg font-bold text-white uppercase italic">Zero Sessions Detected</p>
                <p className="text-xs font-black uppercase tracking-widest">Adjust filters to broaden the scan</p>
             </div>
           ) : (
             <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                   <thead>
                      <tr className="bg-white/[0.02]">
                         <th className="px-8 py-4 text-[10px] font-black uppercase tracking-widest text-slate-500">Operation / Protocol</th>
                         <th className="px-8 py-4 text-[10px] font-black uppercase tracking-widest text-slate-500">Participant</th>
                         <th className="px-8 py-4 text-[10px] font-black uppercase tracking-widest text-slate-500">Schedule Window</th>
                         <th className="px-8 py-4 text-[10px] font-black uppercase tracking-widest text-slate-500 text-right">Status</th>
                      </tr>
                   </thead>
                   <tbody className="divide-y divide-white/5">
                      {displayed.map((r) => {
                        const isPast = Date.parse(r.start) < Date.now();
                        return (
                          <tr key={r.id} className="group hover:bg-white/[0.02] transition-colors">
                             <td className="px-8 py-5">
                                <div className="flex items-center gap-3">
                                   <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center border border-white/5 text-slate-400 group-hover:text-indigo-400 group-hover:border-indigo-500/20 transition-all">
                                      <CalIcon className="w-4 h-4" />
                                   </div>
                                   <span className="text-sm font-black text-white group-hover:text-indigo-300 transition-all uppercase tracking-tight">{r.title}</span>
                                </div>
                             </td>
                             <td className="px-8 py-5">
                                <div className="flex flex-col">
                                   <span className="text-xs font-bold text-slate-300">{r.candidateEmail || "—"}</span>
                                   <span className="text-[10px] font-black text-slate-500 uppercase tracking-tighter mt-0.5 flex items-center gap-1">
                                      <User className="w-2.5 h-2.5" />
                                      Authenticated
                                   </span>
                                </div>
                             </td>
                             <td className="px-8 py-5">
                                <div className="flex flex-col">
                                   <span className="text-xs font-black text-white">{new Date(r.start).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                                   <span className="text-[10px] font-bold text-slate-500 flex items-center gap-1.5 mt-0.5">
                                      <Clock className="w-3 h-3" />
                                      {new Date(r.start).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                   </span>
                                </div>
                             </td>
                             <td className="px-8 py-5 text-right">
                                <div className={cn(
                                   "inline-flex px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border",
                                   isPast ? "bg-slate-500/10 text-slate-500 border-slate-500/20" : "bg-emerald-500/10 text-emerald-500 border-emerald-500/20 shadow-[0_0_15px_rgba(16,185,129,0.1)]"
                                )}>
                                   {isPast ? "Historical" : "Transmitting"}
                                </div>
                             </td>
                          </tr>
                        )
                      })}
                   </tbody>
                </table>
             </div>
           )}
        </section>
      </main>
    </div>
  );
}
