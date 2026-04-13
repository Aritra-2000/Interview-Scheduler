"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession, signOut } from "next-auth/react";
import { useEffect, useMemo, useState } from "react";
import { cn } from "@/components/lib/utils";
import { 
  Calendar, 
  ListOrdered, 
  Users, 
  BarChart3, 
  Settings, 
  LogOut, 
  LayoutDashboard,
  Timer
} from "lucide-react";

export default function Sidebar() {
  const pathname = usePathname();
  const { data: session } = useSession();
  const role = (session as any)?.role ?? "candidate";
  const isRecruiter = role === "recruiter";
  const [events, setEvents] = useState<Array<{ id: string; title: string; start: string; end?: string; candidateEmail?: string }>>([]);

  useEffect(() => {
    if (!isRecruiter) return;
    fetch("/api/events")
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then((data) => setEvents(Array.isArray(data) ? data : []))
      .catch(() => setEvents([]));
  }, [isRecruiter]);

  const upcoming = useMemo(() => {
    if (!isRecruiter) return [];
    const now = Date.now();
    return events
      .filter((e) => Date.parse(e.start) >= now)
      .sort((a, b) => Date.parse(a.start) - Date.parse(b.start))
      .slice(0, 5);
  }, [events, isRecruiter]);

  const items = isRecruiter
    ? [
        { href: "/dashboard/admin", label: "Overview", icon: LayoutDashboard },
        { href: "/dashboard/admin/interviews", label: "Interviews", icon: ListOrdered },
        { href: "/dashboard/admin/candidates", label: "talent Pool", icon: Users },
        { href: "/dashboard/admin/analytics", label: "Insights", icon: BarChart3 },
        { href: "/dashboard/admin/settings", label: "Settings", icon: Settings },
      ]
    : [
        { href: "/dashboard/candidate", label: "My Sessions", icon: Calendar },
      ];

  return (
    <div className="flex flex-col h-full bg-transparent pt-4">

      <nav className="flex-1 space-y-8">
        <div className="space-y-1">
          <p className="text-[10px] font-black tracking-widest text-slate-600 uppercase mb-4 px-2">Navigation</p>
          {items.map((item) => {
            const active = pathname === item.href;
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                    "flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all font-bold text-sm group",
                    active 
                        ? "bg-blue-600/10 text-blue-400 border border-blue-500/20 shadow-[0_0_15px_rgba(37,99,235,0.1)] shadow-inner" 
                        : "text-slate-400 hover:text-white hover:bg-white/[0.03]"
                )}
              >
                <Icon className={cn("w-4.5 h-4.5 transition-transform group-hover:scale-110", active ? "text-blue-500" : "text-slate-500 group-hover:text-slate-200")} />
                <span className={active ? "text-white" : ""}>{item.label}</span>
                {active && <span className="ml-auto w-1.5 h-1.5 rounded-full bg-blue-500 shadow-[0_0_10px_rgba(59,130,246,0.8)]" />}
              </Link>
            );
          })}
        </div>

        {isRecruiter && (
          <div className="space-y-4">
             <p className="text-[10px] font-black tracking-widest text-slate-600 uppercase px-2">Next up</p>
             <div className="space-y-3 px-2">
                {upcoming.length > 0 ? upcoming.map((u) => (
                  <Link key={u.id} href={`/dashboard/admin/candidates/${encodeURIComponent(u.candidateEmail||"")}`} className="flex items-center gap-3 group cursor-pointer hover:translate-x-1 transition-transform">
                    <div className="w-8 h-8 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center text-[10px] font-black text-slate-500 group-hover:text-amber-400 group-hover:border-amber-400/20 transition-all">
                        {u.candidateEmail?.[0] || "?"}
                    </div>
                    <div className="flex flex-col min-w-0">
                        <span className="text-xs font-bold text-slate-300 truncate w-24 group-hover:text-white">{u.candidateEmail}</span>
                        <div className="flex items-center gap-1 mt-0.5">
                             <Timer className="w-3 h-3 text-slate-600" />
                             <span className="text-[10px] text-slate-600 font-black uppercase">{new Date(u.start).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                        </div>
                    </div>
                  </Link>
                )) : (
                    <p className="text-[10px] font-bold text-slate-600 italic">Queue is empty</p>
                )}
             </div>
          </div>
        )}
      </nav>

      <div className="mt-auto pt-6 border-t border-white/5 space-y-2">
        <button
          onClick={() => signOut({ callbackUrl: "/login", redirect: true })}
          className="flex items-center gap-3 w-full px-3 py-3 rounded-xl bg-white/[0.02] hover:bg-red-600/10 text-slate-400 hover:text-red-400 border border-white/5 hover:border-red-500/20 transition-all group font-bold text-sm"
        >
          <LogOut className="w-4.5 h-4.5" />
          <span>Exit Session</span>
        </button>
        <p className="text-[10px] text-center text-slate-700 font-bold uppercase tracking-widest mt-4">SYNAPSE v1.0.2</p>
      </div>
    </div>
  );
}
