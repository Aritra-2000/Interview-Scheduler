import Link from "next/link"
import { Calendar, Clock, Users, Shield, Sparkles, Zap, ArrowRight } from "lucide-react"

export default function Home() {
  return (
    <main className="min-h-screen bg-[#020203] text-slate-200 selection:bg-indigo-500/30 overflow-hidden relative">
      {/* Background Decor */}
      <div className="absolute top-0 left-0 w-full h-full bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 pointer-events-none" />
      <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-indigo-600/10 blur-[120px] rounded-full pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-blue-600/10 blur-[120px] rounded-full pointer-events-none" />
      
      {/* Grid Pattern */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff05_1px,transparent_1px),linear-gradient(to_bottom,#ffffff05_1px,transparent_1px)] bg-[size:40px_40px] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)]" />

      {/* Navigation */}
      <nav className="container mx-auto px-6 py-8 flex items-center justify-between relative z-10">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-indigo-500 to-blue-600 flex items-center justify-center text-white shadow-xl">
             <Calendar className="w-5 h-5 fill-white/10" strokeWidth={3} />
          </div>
          <div className="flex flex-col">
            <span className="font-black text-white text-lg tracking-tighter leading-none">SYNAPSE</span>
            <span className="text-[10px] font-black tracking-[0.3em] uppercase text-indigo-400 opacity-60">Operations</span>
          </div>
        </div>
        <div className="hidden md:flex items-center gap-8">
           <a href="#" className="text-sm font-bold text-slate-400 hover:text-white transition-colors">Features</a>
           <a href="#" className="text-sm font-bold text-slate-400 hover:text-white transition-colors">Pricing</a>
           <a href="#" className="text-sm font-bold text-slate-400 hover:text-white transition-colors">Enterprise</a>
        </div>
        <Link href="/login" className="px-5 py-2 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 text-white font-bold text-sm transition-all backdrop-blur-md">
           Sign In
        </Link>
      </nav>

      {/* Hero Section */}
      <section className="container mx-auto px-6 pt-24 pb-32 relative z-10">
        <div className="max-w-5xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-[10px] font-black tracking-widest uppercase mb-8">
             <Sparkles className="w-3 h-3" />
             AI-Powered Recruitment v1.0
          </div>
          
          <h1 className="text-6xl md:text-8xl font-black text-white tracking-tighter leading-[0.9] mb-8">
             Hiring at the <br />
             <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 via-blue-400 to-emerald-400">Speed of Thought.</span>
          </h1>
          
          <p className="text-lg md:text-xl text-slate-400 max-w-2xl mx-auto leading-relaxed mb-12 font-medium">
            The world's most advanced interview orchestration platform. 
            Automate scheduling, track candidate sentiment, and scale your talent pool with zero friction.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-6">
            <Link
              href="/login"
              className="group relative px-8 py-4 rounded-2xl bg-indigo-600 text-white font-bold text-lg shadow-[0_20px_50px_-10px_rgba(79,70,229,0.5)] hover:scale-105 active:scale-95 transition-all flex items-center gap-3 overflow-hidden"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-indigo-400 to-blue-400 opacity-0 group-hover:opacity-100 transition-opacity" />
              <span className="relative z-10">Start Scheduling Free</span>
              <ArrowRight className="w-5 h-5 relative z-10 group-hover:translate-x-1 transition-transform" />
            </Link>
            <button className="px-8 py-4 rounded-2xl bg-white/5 border border-white/10 text-white font-bold text-lg hover:bg-white/10 transition-all backdrop-blur-xl">
               Book a Demo
            </button>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="container mx-auto px-6 py-20 relative z-10 bg-gradient-to-b from-transparent to-[#050507]">
        <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          <FeatureCard 
            icon={<Zap className="w-6 h-6 text-indigo-400" />}
            title="Instant Scheduling"
            description="Smart calendar conflict resolution. Find the perfect slot in milliseconds with cross-timezone support."
          />
          <FeatureCard 
            icon={<Shield className="w-6 h-6 text-blue-400" />}
            title="ICS Integration"
            description="Automatic .ics attachments for all invites. One-click calendar sync for candidates and managers."
          />
          <FeatureCard 
            icon={<Users className="w-6 h-6 text-emerald-400" />}
            title="Sentiment Tracking"
            description="Record feedback rounds, candidate ratings, and pipeline stages in one unified recruitment command center."
          />
        </div>
      </section>

      {/* Footer */}
      <footer className="container mx-auto px-6 py-12 border-t border-white/5 relative z-10 flex flex-col md:flex-row items-center justify-between gap-6">
        <p className="text-slate-500 text-xs font-bold uppercase tracking-widest">© 2026 SYNAPSE HUB. ALL RIGHTS RESERVED.</p>
        <div className="flex items-center gap-8">
           <a href="#" className="text-xs font-black text-slate-600 hover:text-white uppercase tracking-widest transition-colors">Privacy</a>
           <a href="#" className="text-xs font-black text-slate-600 hover:text-white uppercase tracking-widest transition-colors">Terms</a>
           <a href="#" className="text-xs font-black text-slate-600 hover:text-white uppercase tracking-widest transition-colors">Security</a>
        </div>
      </footer>
    </main>
  )
}

function FeatureCard({ icon, title, description }: any) {
  return (
    <div className="p-8 rounded-[2rem] bg-white/[0.02] border border-white/5 hover:bg-white/[0.04] hover:border-white/10 transition-all group">
      <div className="w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
        {icon}
      </div>
      <h3 className="text-xl font-bold text-white mb-3">{title}</h3>
      <p className="text-slate-500 text-sm leading-relaxed">{description}</p>
    </div>
  )
}
