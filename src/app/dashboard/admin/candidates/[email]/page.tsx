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

  const candidateEvents = useMemo(() => {
    return events.filter((e) => e.candidateEmail === email).sort((a, b) => Date.parse(a.start) - Date.parse(b.start));
  }, [events, email]);

  const stats = useMemo(() => {
    const now = Date.now();
    const up = candidateEvents.filter(e => Date.parse(e.start) >= now).length;
    const past = candidateEvents.length - up;
    return { upcoming: up, completed: past };
  }, [candidateEvents]);

  if (loading && status !== "loading") return (
    <div className="min-h-screen bg-[#020203] flex items-center justify-center">
       <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
    </div>
  );

  return (
    <div className="min-h-screen text-slate-200 grid grid-cols-12 bg-[#020203] selection:bg-indigo-500/30">
      <div className="fixed top-0 left-0 w-64 h-full bg-indigo-600/5 blur-[120px] -z-10" />
      
      <aside className="col-span-2 bg-[#050507]/60 backdrop-blur-xl border-r border-white/5 p-6 h-screen sticky top-0">
        <Sidebar />
      </aside>

      <main className="col-span-10 p-8 space-y-8 overflow-y-auto relative">
        <div className="absolute top-0 right-0 w-[500px] h-[400px] bg-blue-600/10 blur-[150px] pointer-events-none -z-10" />
        
        <Navbar />

        <div className="flex flex-col gap-8">
           {/* Profile Header Card */}
           <div className="bg-[#09090b]/50 border border-white/5 backdrop-blur-md rounded-3xl p-8 relative overflow-hidden shadow-2xl">
              <div className="absolute -top-24 -right-24 w-64 h-64 bg-indigo-600/10 blur-[80px] rounded-full" />
              
              <div className="flex flex-col md:flex-row items-center gap-8 relative z-10">
                 <div className="w-24 h-24 rounded-3xl bg-gradient-to-br from-indigo-500 to-blue-600 flex items-center justify-center text-white text-4xl font-black shadow-[0_10px_40px_-10px_rgba(79,70,229,0.5)]">
                    {email[0].toUpperCase()}
                 </div>
                 <div className="flex-1 text-center md:text-left">
                    <h1 className="text-3xl font-extrabold text-white tracking-tight">Candidate Profile</h1>
                    <p className="text-indigo-400 font-medium mt-1">{email}</p>
                    <div className="flex flex-wrap items-center gap-4 mt-6 justify-center md:justify-start">
                       <div className="px-4 py-2 rounded-2xl bg-white/5 border border-white/5 backdrop-blur-sm">
                          <span className="text-[10px] font-black uppercase tracking-widest text-slate-500 block">Total Rounds</span>
                          <span className="text-lg font-bold text-white">{candidateEvents.length}</span>
                       </div>
                       <div className="px-4 py-2 rounded-2xl bg-white/5 border border-white/5 backdrop-blur-sm">
                          <span className="text-[10px] font-black uppercase tracking-widest text-slate-500 block">Upcoming</span>
                          <span className="text-lg font-bold text-indigo-400">{stats.upcoming}</span>
                       </div>
                       <div className="px-4 py-2 rounded-2xl bg-white/5 border border-white/5 backdrop-blur-sm">
                          <span className="text-[10px] font-black uppercase tracking-widest text-slate-500 block">Completed</span>
                          <span className="text-lg font-bold text-emerald-400">{stats.completed}</span>
                       </div>
                    </div>
                 </div>
                 <div className="flex flex-col gap-3">
                    <button className="px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-sm transition-all shadow-lg shadow-indigo-600/20">Schedule Next</button>
                    <button className="px-6 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 font-bold text-sm border border-white/5 transition-all">Send Note</button>
                 </div>
              </div>
           </div>

           {/* Timeline / List Card */}
           <div className="bg-[#09090b]/50 border border-white/5 backdrop-blur-md rounded-3xl overflow-hidden shadow-2xl">
              <div className="p-6 border-b border-white/5 bg-white/[0.02] flex items-center justify-between">
                 <h2 className="text-lg font-bold text-white flex items-center gap-3">
                    <span className="w-1.5 h-6 bg-indigo-500 rounded-full" />
                    Interview Timeline
                 </h2>
                 <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">Chronological Order</span>
              </div>

              <div className="p-0 overflow-x-auto">
                 <table className="w-full text-left border-collapse">
                    <thead>
                       <tr className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 border-b border-white/5">
                          <th className="px-8 py-5">Session Title</th>
                          <th className="px-8 py-5">Date & Time</th>
                          <th className="px-8 py-5">Duration</th>
                          <th className="px-8 py-5 text-right">Status</th>
                       </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                       {candidateEvents.map((e) => {
                          const isUpcoming = Date.parse(e.start) >= Date.now();
                          const duration = e.end ? Math.round((Date.parse(e.end) - Date.parse(e.start)) / 60000) : 30;
                          
                          return (
                             <tr key={e.id} className="group hover:bg-white/[0.02] transition-all">
                                <td className="px-8 py-5">
                                   <div className="flex flex-col">
                                      <span className="text-sm font-bold text-white group-hover:text-indigo-400 transition-colors">{e.title}</span>
                                      <span className="text-[10px] text-slate-500 font-bold tracking-widest uppercase mt-0.5">#{e.id.slice(-6).toUpperCase()}</span>
                                   </div>
                                </td>
                                <td className="px-8 py-5">
                                   <div className="flex items-center gap-3">
                                      <div className="p-2 rounded-lg bg-white/5 text-slate-400">
                                         <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                                      </div>
                                      <div className="flex flex-col">
                                         <span className="text-sm font-medium text-slate-200">{new Date(e.start).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                                         <span className="text-xs text-slate-500">{new Date(e.start).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                      </div>
                                   </div>
                                </td>
                                <td className="px-8 py-5">
                                   <span className="text-sm text-slate-400">{duration} minutes</span>
                                </td>
                                <td className="px-8 py-5 text-right font-medium">
                                   {isUpcoming ? (
                                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-[10px] font-black uppercase text-indigo-400 tracking-widest">Upcoming</span>
                                   ) : (
                                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-[10px] font-black uppercase text-emerald-400 tracking-widest">Completed</span>
                                   )}
                                </td>
                             </tr>
                          );
                       })}
                    </tbody>
                 </table>
                 {candidateEvents.length === 0 && (
                    <div className="py-24 flex flex-col items-center justify-center opacity-40">
                       <svg className="w-16 h-16 text-slate-500 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                       <p className="text-sm font-bold uppercase tracking-widest">No session history found</p>
                    </div>
                 )}
              </div>
           </div>
        </div>
      </main>
    </div>
  );
}
