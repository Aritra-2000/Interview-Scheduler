"use client";
import { useEffect, useMemo, useState } from "react";
import { useSession } from "next-auth/react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import Navbar from "@/components/Navbar";
import Sidebar from "@/components/Sidebar";
import EventModal, { type EventForm } from "@/components/EventModal";
import { cn } from "@/components/lib/utils";
import { Edit2, Trash2 } from "lucide-react";

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
  const [modalOpen, setModalOpen] = useState(false);
  const [modalInitial, setModalInitial] = useState<Partial<EventForm>>({});
  const [activeId, setActiveId] = useState<string | null>(null);
  const [toast, setToast] = useState<{ type: "success" | "error" | "info"; message: string } | null>(null);

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

  if (loading && status !== "loading") return (
    <div className="min-h-screen bg-[#020203] flex items-center justify-center">
       <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
    </div>
  );

  return (
    <div className="min-h-screen text-slate-200 grid grid-cols-12 bg-[#020203] selection:bg-blue-500/30">
      <div className="fixed top-0 left-0 w-64 h-full bg-blue-600/5 blur-[120px] -z-10" />
      
      <aside className="col-span-2 bg-[#050507]/60 backdrop-blur-xl border-r border-white/5 p-6 h-screen sticky top-0">
        <Sidebar />
      </aside>

      <main className="col-span-10 p-8 space-y-8 overflow-y-auto relative">
        <div className="absolute top-0 right-0 w-[500px] h-[400px] bg-indigo-600/10 blur-[150px] pointer-events-none -z-10" />
        
        <Navbar />

        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
          <header className="flex flex-col gap-2">
           <h1 className="text-4xl font-extrabold tracking-tight text-white italic">Session <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-blue-400">Orchestrator</span></h1>
           <p className="text-slate-400">Manage and track your active interview pipeline and historical records.</p>
        </header>
          
          <div className="flex flex-wrap items-center gap-4">
             <div className="flex items-center p-1 rounded-xl bg-white/5 border border-white/5 backdrop-blur-sm">
                {(["all", "today", "week"] as const).map((r) => (
                  <button
                    key={r}
                    onClick={() => setRange(r)}
                    className={cn(
                        "px-4 py-1.5 rounded-lg text-xs font-bold transition-all uppercase tracking-widest",
                        range === r ? "bg-blue-600 text-white shadow-lg shadow-blue-600/20" : "text-slate-400 hover:text-slate-200 hover:bg-white/5"
                    )}
                  >
                    {r}
                  </button>
                ))}
             </div>

             <div className="relative">
                <input
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="Search candidates..."
                    className="pl-10 pr-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-sm focus:border-blue-500/50 outline-none focus:ring-1 focus:ring-blue-500/30 transition-all w-64 placeholder:text-slate-600"
                />
                <svg className="w-4 h-4 absolute left-3.5 top-3.5 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
             </div>
          </div>
        </div>

        <div className="bg-[#09090b]/50 border border-white/5 backdrop-blur-md rounded-3xl overflow-hidden shadow-2xl">
          <div className="p-6 border-b border-white/5 flex items-center justify-between bg-white/[0.02]">
             <div className="flex items-center gap-6">
                <div className="text-sm font-bold text-slate-300">
                    Showing <span className="text-blue-400">{displayed.length}</span> Results
                </div>
                <label className="flex items-center gap-2 cursor-pointer group">
                  <div className="relative inline-flex items-center">
                    <input
                        type="checkbox"
                        className="sr-only peer"
                        checked={upcomingOnly}
                        onChange={(e) => setUpcomingOnly(e.target.checked)}
                    />
                    <div className="w-9 h-5 bg-white/10 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-slate-400 after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-blue-600 peer-checked:after:bg-white border border-white/5"></div>
                  </div>
                  <span className="text-xs font-bold uppercase tracking-widest text-slate-500 group-hover:text-slate-300 transition-colors">Upcoming Only</span>
                </label>
             </div>
             <button onClick={() => setRows([])} className="text-xs font-bold text-slate-500 hover:text-blue-400 transition-colors uppercase tracking-widest">Refresh Feed</button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-white/5 text-[10px] uppercase font-black tracking-[0.2em] text-slate-500">
                  <th className="px-8 py-5">Interview Task</th>
                  <th className="px-8 py-5">Candidate</th>
                  <th className="px-8 py-5">Scheduled For</th>
                  <th className="px-8 py-5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {displayed.map((r, i) => (
                  <tr key={r.id} className="group hover:bg-white/[0.02] transition-colors">
                    <td className="px-8 py-5">
                       <div className="flex flex-col">
                          <span className="text-sm font-bold text-white group-hover:text-blue-400 transition-colors">{r.title}</span>
                          <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider mt-0.5">Reference ID: {r.id.slice(-6).toUpperCase()}</span>
                       </div>
                    </td>
                    <td className="px-8 py-5">
                       <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-lg bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400 text-xs font-black uppercase">
                            {r.candidateEmail?.[0] || "?"}
                          </div>
                          <span className="text-sm text-slate-300 group-hover:text-white transition-colors">{r.candidateEmail || "-"}</span>
                       </div>
                    </td>
                    <td className="px-8 py-5">
                       <div className="flex flex-col">
                          <span className="text-sm font-medium text-slate-200">{new Date(r.start).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })}</span>
                          <span className="text-xs text-slate-500">{new Date(r.start).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                       </div>
                    </td>
                    <td className="px-8 py-5 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button 
                          onClick={() => {
                            setActiveId(r.id);
                            setModalInitial({ 
                                title: r.title, 
                                start: r.start, 
                                end: r.end, 
                                candidateEmail: r.candidateEmail, 
                                notes: (r as any).notes,
                                rating: (r as any).rating,
                                stage: (r as any).stage
                            });
                            setModalOpen(true);
                          }}
                          className="p-2 rounded-xl bg-white/5 text-slate-400 hover:bg-blue-600/20 hover:text-blue-400 border border-white/5 transition-all hover:scale-110 active:scale-95"
                          title="View / Edit"
                        >
                          <Edit2 className="w-4.5 h-4.5" />
                        </button>
                        <button 
                          onClick={async () => {
                            if (!confirm("Are you sure you want to cancel this interview?")) return;
                            const res = await fetch(`/api/events/${r.id}`, { method: "DELETE" });
                            const payload = await res.json().catch(() => null);
                            if (res.ok) {
                              setToast({ type: "success", message: payload?.emailSent ? "Cancelled and email sent!" : "Interview cancelled." });
                              setRows(rows.filter(row => row.id !== r.id));
                              setTimeout(() => setToast(null), 3000);
                            }
                          }}
                          className="p-2 rounded-xl bg-white/5 text-slate-400 hover:bg-red-600/20 hover:text-red-400 border border-white/5 transition-all hover:scale-110 active:scale-95"
                          title="Withdraw"
                        >
                          <Trash2 className="w-4.5 h-4.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {displayed.length === 0 && (
                <div className="py-20 flex flex-col items-center justify-center text-slate-500 gap-4">
                    <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center border border-white/10">
                        <svg className="w-8 h-8 opacity-20" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                    </div>
                    <p className="font-bold uppercase tracking-widest text-sm italic">No data matched your criteria</p>
                </div>
            )}
          </div>
        </div>
      </main>

      <EventModal 
        open={modalOpen}
        mode="edit"
        initial={modalInitial}
        onClose={() => setModalOpen(false)}
        onSubmit={async (data) => {
          if (!activeId) return;
          const res = await fetch(`/api/events/${activeId}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(data),
          });
          const payload = await res.json().catch(() => null);
          if (!res.ok) throw new Error(payload?.error || "Update failed");
          
          setToast({ type: "success", message: payload?.emailSent ? "Rescheduled and email sent!" : "Rescheduled successfully." });
          fetch("/api/events").then(r => r.json()).then(setRows);
          setModalOpen(false);
          setTimeout(() => setToast(null), 3000);
        }}
      />

      {toast && (
        <div className={cn(
            "fixed bottom-8 right-8 px-6 py-3.5 rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.5)] border backdrop-blur-xl z-[100] transition-all animate-in fade-in slide-in-from-bottom-5",
            toast.type === "success" ? "bg-emerald-600/90 border-emerald-500/50 text-white" : 
            toast.type === "error" ? "bg-red-600/90 border-red-500/50 text-white" :
            "bg-blue-600/90 border-blue-500/50 text-white"
        )}>
          <div className="flex items-center gap-4">
            <div className="w-6 h-6 rounded-full bg-white/20 flex items-center justify-center">
                {toast.type === "success" && <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>}
            </div>
            <p className="text-sm font-bold tracking-tight">{toast.message}</p>
          </div>
        </div>
      )}
    </div>
  );
}
