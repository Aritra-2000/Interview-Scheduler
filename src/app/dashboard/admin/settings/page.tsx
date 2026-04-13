"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import Sidebar from "@/components/Sidebar";
import Navbar from "@/components/Navbar";

type Settings = {
  timezone: string;
  workDays: number[];
  workStart: string;
  workEnd: string;
  defaultDurationMinutes: number;
  bufferMinutes: number;
  notifications: {
    scheduled: boolean;
    rescheduled: boolean;
    cancelled: boolean;
    reminders: boolean;
    reminderMinutes: number;
  };
  emailFromName?: string;
  emailReplyTo?: string;
};

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export default function SettingsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const role = (session as any)?.role;
  const isRecruiter = role === "recruiter";

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState<string>("");
  const [data, setData] = useState<Settings | null>(null);
  const [toast, setToast] = useState<{ type: "success" | "error"; message: string } | null>(null);

  useEffect(() => {
    if (status === "loading") return;
    if (!session || !isRecruiter) {
      router.push("/dashboard");
      return;
    }
    (async () => {
      try {
        const res = await fetch("/api/settings", { cache: "no-store" });
        const json = await res.json();
        if (!res.ok) throw new Error(json?.error || "Failed to load settings");

        if (!json?.timezone || json.timezone !== "Asia/Kolkata") {
          const updated = { ...json, timezone: "Asia/Kolkata" };
          setData(updated);
          await fetch("/api/settings", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(updated) });
        } else {
          setData(json);
        }
      } catch (e: any) {
        setErr(e?.message || "Failed to load settings");
      } finally {
        setLoading(false);
      }
    })();
  }, [status, session, isRecruiter, router]);

  const toggleWorkDay = (idx: number) => {
    if (!data) return;
    const set = new Set(data.workDays);
    if (set.has(idx)) set.delete(idx); else set.add(idx);
    setData({ ...data, workDays: Array.from(set).sort((a, b) => a - b) });
  };

  const save = async () => {
    if (!data) return;
    setSaving(true);
    setErr("");
    try {
      const res = await fetch("/api/settings", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) });
      if (!res.ok) throw new Error("Failed to save");
      const saved = await res.json();
      setData(saved);
      setToast({ type: "success", message: "Environment parameters synchronized." });
      setTimeout(() => setToast(null), 3000);
    } catch (e: any) {
      setErr(e?.message || "Save failed");
      setToast({ type: "error", message: e?.message || "Save failed" });
      setTimeout(() => setToast(null), 3000);
    } finally {
      setSaving(false);
    }
  };

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

      <main className="col-span-10 p-8 space-y-10 overflow-y-auto relative">
        <div className="absolute top-0 right-0 w-[500px] h-[400px] bg-blue-600/10 blur-[150px] pointer-events-none -z-10" />
        
        <Navbar />

        <header className="flex flex-col gap-2">
           <h1 className="text-4xl font-extrabold tracking-tight text-white italic">System <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-blue-400">Settings</span></h1>
           <p className="text-slate-400 max-w-2xl">Configure your working availability, global timezone, and automated notification triggers.</p>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
           {/* General Configuration */}
           <div className="bg-[#09090b]/50 border border-white/5 backdrop-blur-md rounded-[2.5rem] p-8 space-y-8 shadow-2xl">
              <div className="flex items-center gap-3 pb-6 border-b border-white/5">
                 <div className="w-1.5 h-6 bg-indigo-500 rounded-full" />
                 <h2 className="text-xl font-bold text-white">Availability Engine</h2>
              </div>
              
              <div className="space-y-6">
                 <div className="group">
                    <label className="block text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2 px-1">Global Timezone</label>
                    <input 
                       value={data?.timezone}
                       onChange={(e) => setData(data ? { ...data, timezone: e.target.value } : null)}
                       className="w-full px-4 py-3 rounded-2xl bg-white/[0.03] border border-white/10 text-sm focus:border-indigo-500 transition-all outline-none" 
                       placeholder="e.g., Asia/Kolkata" 
                    />
                 </div>

                 <div>
                    <label className="block text-[10px] font-black uppercase tracking-widest text-slate-500 mb-3 px-1">Work Week Distribution</label>
                    <div className="flex flex-wrap gap-2">
                       {WEEKDAYS.map((d, i) => {
                          const active = (data?.workDays || []).includes(i);
                          return (
                             <button 
                                key={i} 
                                type="button" 
                                onClick={() => toggleWorkDay(i)}
                                className={cn(
                                   "w-12 h-12 rounded-xl border text-xs font-black uppercase transition-all",
                                   active 
                                      ? "bg-indigo-600 text-white border-transparent shadow-lg shadow-indigo-600/20" 
                                      : "bg-white/[0.03] border-white/10 text-slate-500 hover:border-white/20"
                                )}
                             >
                                {d.slice(0, 1)}
                             </button>
                          );
                       })}
                    </div>
                 </div>

                 <div className="grid grid-cols-2 gap-6">
                    <div>
                       <label className="block text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2 px-1">Shift Start</label>
                       <input 
                          type="time" 
                          value={data?.workStart} 
                          onChange={(e) => setData(data ? { ...data, workStart: e.target.value } : null)}
                          className="w-full px-4 py-3 rounded-2xl bg-white/[0.03] border border-white/10 text-sm focus:border-indigo-500 transition-all outline-none" 
                       />
                    </div>
                    <div>
                       <label className="block text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2 px-1">Shift End</label>
                       <input 
                          type="time" 
                          value={data?.workEnd} 
                          onChange={(e) => setData(data ? { ...data, workEnd: e.target.value } : null)}
                          className="w-full px-4 py-3 rounded-2xl bg-white/[0.03] border border-white/10 text-sm focus:border-indigo-500 transition-all outline-none" 
                       />
                    </div>
                 </div>

                 <div className="grid grid-cols-2 gap-6 pt-4">
                    <div className="p-4 rounded-3xl bg-white/[0.02] border border-white/5 space-y-3">
                       <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400">Default Duration</label>
                       <div className="flex items-center gap-3">
                          <input 
                             type="number" 
                             value={data?.defaultDurationMinutes}
                             onChange={(e) => setData(data ? { ...data, defaultDurationMinutes: Number(e.target.value) } : null)}
                             className="w-20 bg-transparent text-2xl font-black text-white outline-none" 
                          />
                          <span className="text-xs font-bold text-slate-600 uppercase">Mins</span>
                       </div>
                    </div>
                    <div className="p-4 rounded-3xl bg-white/[0.02] border border-white/5 space-y-3">
                       <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400">Session Buffer</label>
                       <div className="flex items-center gap-3">
                          <input 
                             type="number" 
                             value={data?.bufferMinutes}
                             onChange={(e) => setData(data ? { ...data, bufferMinutes: Number(e.target.value) } : null)}
                             className="w-20 bg-transparent text-2xl font-black text-white outline-none" 
                          />
                          <span className="text-xs font-bold text-slate-600 uppercase">Mins</span>
                       </div>
                    </div>
                 </div>
              </div>
           </div>

           {/* Communication & Triggers */}
           <div className="space-y-8">
              <div className="bg-[#09090b]/50 border border-white/5 backdrop-blur-md rounded-[2.5rem] p-8 space-y-6 shadow-2xl">
                 <div className="flex items-center gap-3 mb-2">
                    <div className="w-1.5 h-6 bg-blue-500 rounded-full" />
                    <h2 className="text-xl font-bold text-white">Email Branding</h2>
                 </div>
                 <div className="space-y-4">
                    <div>
                       <label className="block text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2 px-1">Sent From Identity</label>
                       <input 
                          value={data?.emailFromName || ""}
                          onChange={(e) => setData(data ? { ...data, emailFromName: e.target.value } : null)}
                          className="w-full px-4 py-3 rounded-2xl bg-white/[0.03] border border-white/10 text-sm focus:border-blue-500 transition-all outline-none" 
                          placeholder="Interview Scheduler Team"
                       />
                    </div>
                    <div>
                       <label className="block text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2 px-1">Reply-To Address</label>
                       <input 
                          value={data?.emailReplyTo || ""}
                          onChange={(e) => setData(data ? { ...data, emailReplyTo: e.target.value } : null)}
                          className="w-full px-4 py-3 rounded-2xl bg-white/[0.03] border border-white/10 text-sm focus:border-blue-500 transition-all outline-none" 
                          placeholder="hr@company.com"
                       />
                    </div>
                 </div>
              </div>

              <div className="bg-[#09090b]/50 border border-white/5 backdrop-blur-md rounded-[2.5rem] p-8 space-y-6 shadow-2xl">
                 <div className="flex items-center gap-3 mb-2">
                    <div className="w-1.5 h-6 bg-emerald-500 rounded-full" />
                    <h2 className="text-xl font-bold text-white">Event Triggers</h2>
                 </div>
                 <div className="grid grid-cols-2 gap-4">
                    {[
                       { key: "scheduled", label: "New Booking" },
                       { key: "rescheduled", label: "Time Change" },
                       { key: "cancelled", label: "Cancellation" }
                    ].map(t => (
                       <label key={t.key} className="flex items-center justify-between p-4 rounded-2xl bg-white/[0.02] border border-white/5 cursor-pointer group hover:bg-white/[0.04] transition-all">
                          <span className="text-xs font-bold text-slate-400 group-hover:text-white transition-colors">{t.label}</span>
                          <input 
                             type="checkbox" 
                             checked={!!(data?.notifications && (data.notifications as any)[t.key])} 
                             onChange={(e) => setData(data ? { ...data, notifications: { ...(data.notifications || {}), [t.key]: e.target.checked } } : null)}
                             className="accent-indigo-600 w-4 h-4"
                          />
                       </label>
                    ))}
                    <div className="col-span-2 flex items-center justify-between p-4 rounded-2xl bg-white/[0.02] border border-white/5">
                        <div className="flex flex-col gap-0.5">
                            <span className="text-xs font-bold text-white">Smart Reminders</span>
                            <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider italic">Trigger before start</span>
                        </div>
                        <div className="flex items-center gap-3">
                            <input 
                                type="number" 
                                value={data?.notifications?.reminderMinutes || 0}
                                onChange={(e) => setData(data ? { ...data, notifications: { ...(data.notifications || {}), reminderMinutes: Number(e.target.value) } } : null)}
                                className="w-12 bg-transparent text-right font-black text-indigo-400 outline-none"
                            />
                            <div className="w-10 h-6 bg-white/5 rounded-full relative">
                                <input 
                                    type="checkbox" 
                                    checked={!!data?.notifications?.reminders} 
                                    onChange={(e) => setData(data ? { ...data, notifications: { ...(data.notifications || {}), reminders: e.target.checked } } : null)}
                                    className="opacity-0 absolute inset-0 w-full h-full cursor-pointer z-10"
                                />
                                <div className={cn("absolute top-1 left-1 w-4 h-4 rounded-full transition-all", data?.notifications?.reminders ? "translate-x-4 bg-indigo-500" : "bg-slate-600")} />
                            </div>
                        </div>
                    </div>
                 </div>
              </div>

              <div className="pt-4">
                 <button 
                    onClick={save} 
                    disabled={saving} 
                    className="w-full py-5 rounded-[2rem] bg-indigo-600 hover:bg-indigo-500 text-white font-black text-lg shadow-[0_20px_50px_-10px_rgba(79,70,229,0.3)] disabled:opacity-50 disabled:shadow-none transition-all active:scale-95 flex items-center justify-center gap-3"
                 >
                    {saving && <Loader2 className="w-5 h-5 animate-spin" />}
                    {saving ? "Synchronizing Context..." : "Update System Parameters"}
                 </button>
              </div>
           </div>
        </div>
      </main>

      {toast && (
        <div className={cn(
            "fixed bottom-8 right-8 px-6 py-4 rounded-2xl shadow-2xl border backdrop-blur-xl z-[100] transition-all animate-in fade-in slide-in-from-bottom-5",
            toast.type === "success" ? "bg-emerald-600/90 border-emerald-500/50 text-white" : "bg-red-600/90 border-red-500/50 text-white"
        )}>
          <div className="flex items-center gap-4">
            <div className={`w-6 h-6 rounded-full flex items-center justify-center bg-white/20`}>
                {toast.type === "success" ? <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg> : "!"}
            </div>
            <p className="text-sm font-bold tracking-tight">{toast.message}</p>
          </div>
        </div>
      )}
    </div>
  );
}

import { cn } from "@/components/lib/utils";
import { Loader2 } from "lucide-react";
