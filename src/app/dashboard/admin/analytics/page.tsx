"use client";
import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Sidebar from "@/components/Sidebar";
import Navbar from "@/components/Navbar";
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { BarChart, Users, Star, ClipboardCheck, TrendingUp } from "lucide-react";

interface EventStats {
  id: string;
  title: string;
  stage: string;
  rating?: number;
  start: string;
  candidateEmail?: string;
}

export default function AnalyticsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [events, setEvents] = useState<EventStats[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (status === "loading") return;
    if ((session as any)?.role !== "recruiter") {
      router.replace("/dashboard/candidate");
      return;
    }

    fetch("/api/events")
      .then((r) => r.json())
      .then((data) => {
          setEvents(Array.isArray(data) ? data : []);
          setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [status, session, router]);

  const stats = {
    total: events.length,
    upcoming: events.filter(e => new Date(e.start) > new Date()).length,
    avgRating: events.filter(e => e.rating).length > 0 
        ? (events.reduce((acc, e) => acc + (e.rating || 0), 0) / events.filter(e => e.rating).length).toFixed(1)
        : "0.0",
    stages: events.reduce((acc: any, e) => {
        acc[e.stage || "screening"] = (acc[e.stage || "screening"] || 0) + 1;
        return acc;
    }, {})
  };

  if (loading) return (
    <div className="min-h-screen bg-[#020203] flex items-center justify-center">
       <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
    </div>
  );

  return (
    <div className="min-h-screen text-slate-200 grid grid-cols-12 bg-[#020203] selection:bg-indigo-500/30">
      {/* Sidebar background glow */}
      <div className="fixed top-0 left-0 w-64 h-full bg-indigo-600/5 blur-[120px] -z-10" />
      
      <aside className="col-span-2 bg-[#050507]/60 backdrop-blur-xl border-r border-white/5 p-6 h-screen sticky top-0">
        <Sidebar />
      </aside>

      <main className="col-span-10 p-8 space-y-10 overflow-y-auto relative">
        {/* Top Gradient Spot */}
        <div className="absolute top-0 right-0 w-[500px] h-[400px] bg-blue-600/10 blur-[150px] pointer-events-none -z-10" />
        
        <Navbar />
        
        <header className="flex flex-col gap-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-xs font-bold tracking-widest uppercase w-fit">
            <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-indigo-500"></span>
            </span>
            Real-time Insights
          </div>
          <h1 className="text-4xl font-extrabold tracking-tight text-white mt-2">
            Recruitment <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-blue-400">Dashboard</span>
          </h1>
          <p className="text-slate-400 max-w-2xl text-lg">Detailed analysis of your hiring funnel, candidate performance, and schedule optimization.</p>
        </header>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatCard 
            icon={<ClipboardCheck className="w-6 h-6" />} 
            title="Total Interviews" 
            value={stats.total} 
            color="indigo"
          />
          <StatCard 
            icon={<TrendingUp className="w-6 h-6" />} 
            title="Upcoming" 
            value={stats.upcoming} 
            color="emerald"
          />
          <StatCard 
            icon={<Star className="w-6 h-6" />} 
            title="Avg Rating" 
            value={stats.avgRating} 
            color="amber"
            suffix="/ 5.0"
          />
          <StatCard 
            icon={<Users className="w-6 h-6" />} 
            title="Total Candidates" 
            value={new Set(events.map(e => e.candidateEmail)).size} 
            color="violet"
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Funnel Section */}
          <Card className="lg:col-span-7 bg-[#09090b]/50 border-white/5 backdrop-blur-md rounded-3xl overflow-hidden shadow-2xl">
            <CardHeader className="p-8 border-b border-white/5">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-xl font-bold flex items-center gap-3">
                    <BarChart className="w-5 h-5 text-indigo-400" />
                    Hiring Pipeline
                  </CardTitle>
                  <CardDescription>Candidate distribution across round stages</CardDescription>
                </div>
                <div className="px-3 py-1 rounded-md bg-white/5 text-xs text-slate-400 border border-white/5">Auto-updating</div>
              </div>
            </CardHeader>
            <CardContent className="p-8">
              <div className="space-y-7">
                {Object.entries(stats.stages).length > 0 ? Object.entries(stats.stages).map(([stage, count]) => (
                  <div key={stage} className="group flex flex-col gap-2">
                    <div className="flex justify-between items-end">
                      <div className="flex flex-col">
                        <span className="text-xs uppercase tracking-widest font-bold text-slate-500 group-hover:text-indigo-400 transition-colors">{stage}</span>
                        <span className="text-sm text-slate-300 font-medium">Stage Progress</span>
                      </div>
                      <div className="flex items-baseline gap-1">
                        <span className="text-2xl font-black text-white">{count as number}</span>
                        <span className="text-xs text-slate-500">Profiles</span>
                      </div>
                    </div>
                    <div className="w-full bg-white/5 rounded-full h-3 overflow-hidden p-0.5 border border-white/5">
                      <div 
                        className="h-full rounded-full transition-all duration-1000 ease-out bg-gradient-to-r from-indigo-600 to-purple-600 shadow-[0_0_15px_-3px_rgba(99,102,241,0.5)]" 
                        style={{ width: `${((count as number) / stats.total) * 100}%` }}
                      />
                    </div>
                  </div>
                )) : (
                    <div className="text-center py-20 text-slate-500 italic">No interview data available yet</div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Activity Section */}
          <Card className="lg:col-span-5 bg-[#09090b]/50 border-white/5 backdrop-blur-md rounded-3xl overflow-hidden shadow-2xl">
            <CardHeader className="p-8 border-b border-white/5 flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-xl font-bold">Activity Feed</CardTitle>
                <CardDescription>Latest schedule updates</CardDescription>
              </div>
              <button className="text-xs text-indigo-400 hover:text-indigo-300 transition-colors font-semibold">View All</button>
            </CardHeader>
            <CardContent className="p-8">
               <div className="space-y-6">
                  {events.length > 0 ? events.slice(0, 6).map((e, i) => (
                    <div key={i} className="flex items-center gap-4 group cursor-pointer">
                      <div className="relative">
                        <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 font-black text-lg transition-transform group-hover:scale-110 group-hover:rotate-3 shadow-lg group-hover:shadow-indigo-500/10">
                            {e.candidateEmail?.[0] || "?"}
                        </div>
                        {i === 0 && <span className="absolute -top-1 -right-1 w-3 h-3 bg-indigo-500 rounded-full border-2 border-[#09090b] shadow-[0_0_10px_rgba(99,102,241,0.5)]"></span>}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-bold text-white truncate group-hover:text-indigo-400 transition-colors">{e.title}</div>
                        <div className="text-xs text-slate-500 truncate flex items-center gap-1">
                            <Users className="w-3 h-3" />
                            {e.candidateEmail || "Unassigned"}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-xs font-bold text-slate-400">{new Date(e.start).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}</div>
                        {e.rating && (
                            <div className="flex items-center gap-0.5 mt-1 justify-end text-amber-500">
                                <Star className="w-3 h-3 fill-current" />
                                <span className="text-[10px] font-black">{e.rating}</span>
                            </div>
                        )}
                      </div>
                    </div>
                  )) : (
                      <div className="text-center py-20 text-slate-500">No recent activity detected.</div>
                  )}
                  {events.length > 6 && (
                    <button className="w-full py-3 rounded-xl border border-dashed border-white/10 text-slate-500 text-xs font-bold hover:bg-white/5 hover:border-white/20 transition-all uppercase tracking-widest mt-4">
                      + Load More History
                    </button>
                  )}
               </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}

function StatCard({ icon, title, value, color, suffix }: { icon: React.ReactNode, title: string, value: string | number, color: 'indigo' | 'emerald' | 'amber' | 'violet', suffix?: string }) {
  const colors = {
      indigo: "from-indigo-500/20 text-indigo-400 border-indigo-500/30 glow-indigo-500/10",
      emerald: "from-emerald-500/20 text-emerald-400 border-emerald-500/30 glow-emerald-500/10",
      amber: "from-amber-500/20 text-amber-400 border-amber-500/30 glow-amber-500/10",
      violet: "from-violet-500/20 text-violet-400 border-violet-500/30 glow-violet-500/10"
  };

  return (
    <div className={`relative group p-6 rounded-3xl border ${colors[color].split(' ')[2]} bg-[#09090b]/40 backdrop-blur-md overflow-hidden transition-all duration-300 hover:scale-[1.02] hover:-translate-y-1 hover:shadow-2xl`}>
      <div className={`absolute top-0 right-0 w-32 h-32 bg-gradient-to-br ${colors[color].split(' ')[0]} to-transparent opacity-100 blur-[40px] -z-10 group-hover:scale-150 transition-transform duration-700`} />
      
      <div className="flex flex-col gap-4">
        <div className={`w-12 h-12 rounded-2xl bg-white/5 border border-white/5 flex items-center justify-center ${colors[color].split(' ')[1]} shadow-lg group-hover:rotate-6 transition-transform`}>
          {icon}
        </div>
        <div>
          <p className="text-xs font-black uppercase tracking-widest text-slate-500 mb-1">{title}</p>
          <div className="flex items-baseline gap-1">
            <p className="text-4xl font-black text-white tracking-tight leading-none">{value}</p>
            {suffix && <span className="text-xs font-bold text-slate-600">{suffix}</span>}
          </div>
        </div>
      </div>
    </div>
  );
}
