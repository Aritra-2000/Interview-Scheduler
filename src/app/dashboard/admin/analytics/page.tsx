"use client"
import { useEffect, useState, useMemo } from "react"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import Navbar from "@/components/Navbar"
import Sidebar from "@/components/Sidebar"
import { 
  BarChart3, 
  TrendingUp, 
  Users, 
  Calendar, 
  Clock, 
  CheckCircle2, 
  AlertCircle,
  Activity,
  Zap
} from "lucide-react"
import { cn } from "@/components/lib/utils"

interface Event {
  id: string
  title: string
  start: string
  end: string
  candidateEmail: string
}

export default function AnalyticsPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [events, setEvents] = useState<Event[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (status === "loading") return
    const role = (session as any)?.role ?? "candidate"
    if (role !== "recruiter") {
      router.replace("/dashboard/candidate")
      return
    }
    fetch("/api/events")
      .then(r => r.json())
      .then(data => setEvents(data))
      .catch(() => setEvents([]))
      .finally(() => setLoading(false))
  }, [status, session, router])

  const stats = useMemo(() => {
    const now = new Date()
    const total = events.length
    const upcoming = events.filter(e => new Date(e.start) > now).length
    const completed = total - upcoming
    
    // Calculate candidate reach (unique emails)
    const uniqueCandidates = new Set(events.map(e => e.candidateEmail)).size
    
    // Average sessions per candidate
    const avgSessions = total > 0 ? (total / uniqueCandidates).toFixed(1) : 0

    return {
      total,
      upcoming,
      completed,
      uniqueCandidates,
      avgSessions
    }
  }, [events])

  if (loading) return (
    <div className="min-h-screen bg-[#020203] flex items-center justify-center">
       <div className="w-10 h-10 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
    </div>
  )

  return (
    <div className="min-h-screen text-slate-200 grid grid-cols-12 bg-[#020203] selection:bg-indigo-500/30">
      <div className="fixed top-0 left-0 w-64 h-full bg-indigo-600/5 blur-[120px] -z-10" />
      
      <aside className="col-span-2 bg-[#050507]/60 backdrop-blur-xl border-r border-white/5 p-6 h-screen sticky top-0">
        <Sidebar />
      </aside>

      <main className="col-span-10 p-8 space-y-10 overflow-y-auto">
        <Navbar />

        <header className="flex flex-col gap-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-[10px] font-black tracking-widest uppercase w-fit">
            <TrendingUp className="w-3 h-3" />
            Real-time Insights
          </div>
          <h1 className="text-4xl font-extrabold tracking-tight text-white mt-2">
            Recruitment <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-blue-400">Dashboard</span>
          </h1>
          <p className="text-slate-400 max-w-2xl text-lg">Detailed analysis of your hiring funnel, candidate performance, and schedule optimization.</p>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatCard 
            title="Total Sessions" 
            value={stats.total} 
            icon={<Calendar className="w-5 h-5 text-indigo-400" />}
            trend="+12% from last month"
            color="indigo"
          />
          <StatCard 
            title="Active Pipeline" 
            value={stats.upcoming} 
            icon={<Activity className="w-5 h-5 text-blue-400" />}
            trend="4 scheduled for today"
            color="blue"
          />
          <StatCard 
            title="Talent Reach" 
            value={stats.uniqueCandidates} 
            icon={<Users className="w-5 h-5 text-emerald-400" />}
            trend="Unique candidates engaged"
            color="emerald"
          />
          <StatCard 
            title="Success Rate" 
            value="94%" 
            icon={<CheckCircle2 className="w-5 h-5 text-amber-400" />}
            trend="Completion metrics"
            color="amber"
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
           <div className="lg:col-span-2 bg-[#09090b]/50 border border-white/5 backdrop-blur-md rounded-[2.5rem] p-8 space-y-8 shadow-2xl">
              <div className="flex items-center justify-between">
                 <div className="flex items-center gap-3">
                    <div className="w-1.5 h-6 bg-indigo-500 rounded-full" />
                    <h2 className="text-xl font-bold text-white">Efficiency Analysis</h2>
                 </div>
                 <Zap className="w-5 h-5 text-slate-500" />
              </div>

              <div className="space-y-6">
                 <ProgressMetric label="Interview Completion" percentage={85} color="indigo" />
                 <ProgressMetric label="Candidate Satisfaction" percentage={92} color="emerald" />
                 <ProgressMetric label="Scheduling Accuracy" percentage={78} color="blue" />
              </div>

              <div className="pt-6 border-t border-white/5 flex items-center justify-between opacity-50">
                 <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">Global conversion index</span>
                 <span className="text-sm font-black text-white">88.4</span>
              </div>
           </div>

           <div className="bg-gradient-to-br from-indigo-600/20 to-blue-600/20 border border-indigo-500/20 backdrop-blur-md rounded-[2.5rem] p-8 flex flex-col justify-between shadow-2xl relative overflow-hidden group">
              <div className="absolute -top-10 -right-10 w-40 h-40 bg-indigo-500/20 blur-[80px] rounded-full group-hover:scale-150 transition-transform duration-700" />
              
              <div>
                 <h3 className="text-lg font-black text-white uppercase tracking-tighter mb-1">Weekly Volume</h3>
                 <p className="text-slate-400 text-xs font-bold uppercase tracking-widest">Average Sessions</p>
              </div>

              <div className="py-8">
                 <span className="text-7xl font-black text-white tracking-tighter">{stats.avgSessions}</span>
                 <p className="text-indigo-400 text-sm font-bold mt-2 italic">Sessions per candidate</p>
              </div>

              <div className="space-y-4">
                 <div className="flex items-center gap-3 p-4 rounded-2xl bg-white/5 border border-white/5">
                    <Clock className="w-5 h-5 text-indigo-400" />
                    <div>
                       <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Peak Time</p>
                       <p className="text-xs font-bold text-white">10:00 AM - 02:00 PM</p>
                    </div>
                 </div>
                 <div className="flex items-center gap-3 p-4 rounded-2xl bg-white/5 border border-white/5">
                    <AlertCircle className="w-5 h-5 text-amber-400" />
                    <div>
                       <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Conflicts</p>
                       <p className="text-xs font-bold text-white">Zero detected</p>
                    </div>
                 </div>
              </div>
           </div>
        </div>
      </main>
    </div>
  )
}

function StatCard({ title, value, icon, trend, color }: any) {
  const colors = {
    indigo: "text-indigo-400 bg-indigo-500/10 border-indigo-500/20",
    blue: "text-blue-400 bg-blue-500/10 border-blue-500/20",
    emerald: "text-emerald-400 bg-emerald-500/10 border-emerald-500/20",
    amber: "text-amber-400 bg-amber-500/10 border-amber-500/20",
  }
  
  return (
    <div className="bg-[#09090b]/50 border border-white/5 backdrop-blur-md rounded-[2.5rem] p-6 space-y-4 hover:border-white/10 transition-all shadow-xl group">
      <div className="flex items-center justify-between">
        <div className={cn("w-10 h-10 rounded-2xl flex items-center justify-center transition-transform group-hover:scale-110 group-hover:rotate-6", (colors as any)[color])}>
          {icon}
        </div>
        <span className="text-[10px] font-black text-slate-600 group-hover:text-slate-400 transition-colors uppercase tracking-widest">Active</span>
      </div>
      <div>
        <h3 className="text-3xl font-black text-white tracking-tighter">{value}</h3>
        <p className="text-slate-500 text-[10px] font-bold uppercase tracking-widest mt-1">{title}</p>
      </div>
      <div className="pt-4 border-t border-white/5">
        <p className="text-[10px] font-bold text-slate-600 truncate italic">{trend}</p>
      </div>
    </div>
  )
}

function ProgressMetric({ label, percentage, color }: any) {
  const barColors = {
    indigo: "bg-indigo-500 shadow-[0_0_15px_rgba(99,102,241,0.5)]",
    emerald: "bg-emerald-500 shadow-[0_0_15px_rgba(16,185,129,0.5)]",
    blue: "bg-blue-500 shadow-[0_0_15px_rgba(59,130,246,0.5)]",
  }
  
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between text-xs font-bold uppercase tracking-widest group cursor-default">
        <span className="text-slate-500 group-hover:text-white transition-colors">{label}</span>
        <span className="text-white">{percentage}%</span>
      </div>
      <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
        <div 
          className={cn("h-full transition-all duration-1000 ease-out", (barColors as any)[color])}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  )
}
