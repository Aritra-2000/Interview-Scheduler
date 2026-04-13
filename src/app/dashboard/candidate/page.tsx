"use client";
import Navbar from "@/components/Navbar";
import Sidebar from "@/components/Sidebar";
import Calendar from "@/components/Calendar";
import { useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";

export default function CandidateDashboard() {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === "loading") return;
    const role = (session as any)?.role ?? "candidate";
    if (role === "recruiter") {
      router.replace("/dashboard/admin");
    }
  }, [status, session, router]);

  if (status === "loading") return (
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

        <header className="flex flex-col gap-2">
           <h1 className="text-4xl font-extrabold tracking-tight text-white">Your <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-blue-400">Interviews</span></h1>
           <p className="text-slate-400">View your upcoming sessions and track rounds status.</p>
        </header>

        <div className="bg-[#09090b]/50 border border-white/5 backdrop-blur-md rounded-3xl p-8 relative overflow-hidden shadow-2xl">
           <Calendar />
        </div>
      </main>
    </div>
  );
}
