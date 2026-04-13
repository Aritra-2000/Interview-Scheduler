"use client";
import { useSession } from "next-auth/react";
import { ChevronDown } from "lucide-react";

export default function Navbar() {
  const { data: session } = useSession();
  
  return (
    <nav className="flex items-center justify-between py-4 mb-8">
      <div className="flex flex-col">
        <h2 className="text-[10px] font-black uppercase tracking-[0.4em] text-slate-500 mb-1">Perspective</h2>
        <div className="flex items-center gap-2">
            <span className="text-2xl font-black text-white tracking-tight">SYNAPSE</span>
            <div className="w-1.5 h-1.5 rounded-full bg-indigo-500 shadow-[0_0_15px_rgba(99,102,241,0.8)]" />
        </div>
      </div>

      <div className="flex items-center gap-4 cursor-pointer group px-4 py-2 rounded-2xl border border-white/5 bg-white/[0.02] hover:bg-white/[0.05] transition-all">
         <div className="flex flex-col text-right hidden sm:flex mr-1">
             <span className="text-xs font-black text-white leading-none capitalize">{session?.user?.name || "Member"}</span>
             <span className="text-[10px] font-bold text-slate-500 mt-1">{session?.user?.email?.split('@')[0]}</span>
         </div>
         <div className="w-10 h-10 rounded-xl bg-indigo-600 border border-white/10 flex items-center justify-center text-white font-black text-sm shadow-xl group-hover:scale-105 transition-transform">
             {session?.user?.email?.[0].toUpperCase() || "A"}
         </div>
         <ChevronDown className="w-4 h-4 text-slate-600 group-hover:text-slate-300 transition-colors" />
      </div>
    </nav>
  );
}
