"use client";
import { useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Navbar from "@/components/Navbar";
import Sidebar from "@/components/Sidebar";
import Calendar from "@/components/Calendar";

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

  return (
    <div className="min-h-screen text-slate-200 grid grid-cols-12 bg-[#020203] selection:bg-indigo-500/30">
      <div className="fixed top-0 left-0 w-64 h-full bg-indigo-600/5 blur-[120px] -z-10" />
      
      <aside className="col-span-2 bg-[#050507]/60 backdrop-blur-xl border-r border-white/5 p-6 h-screen sticky top-0">
        <Sidebar />
      </aside>

      <main className="col-span-10 p-8 space-y-10 overflow-y-auto">
        <Navbar />
        
        <header className="flex flex-col gap-2">
           <h1 className="text-4xl font-extrabold tracking-tight text-white mb-2">
             My <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-blue-400">Sessions</span>
           </h1>
           <p className="text-slate-400 max-w-2xl">Access your scheduled interview slots and manage your recruitment protocol interactions.</p>
        </header>

        <section className="bg-[#09090b]/50 border border-white/5 backdrop-blur-md rounded-[3rem] p-1 shadow-2xl overflow-hidden">
           <div className="p-8">
              <Calendar />
           </div>
        </section>
      </main>
    </div>
  );
}
