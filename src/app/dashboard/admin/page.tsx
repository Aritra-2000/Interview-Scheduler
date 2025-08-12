"use client";
import Navbar from "@/components/Navbar";
import Sidebar from "@/components/Sidebar";
import Calendar from "@/components/Calendar";
import { useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";

export default function AdminDashboard() {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === "loading") return;
    const role = (session as any)?.role ?? "candidate";
    if (role !== "recruiter") {
      router.replace("/dashboard/candidate");
    }
  }, [status, session, router]);

  return (
    <div className="min-h-screen text-white grid grid-cols-12">
      <aside className="col-span-2 bg-gray-900 p-4">
        <Sidebar />
      </aside>
      <main className="col-span-10 p-6 space-y-6">
        <Navbar />
        <h1 className="text-2xl font-semibold">Admin Dashboard</h1>
        <Calendar />
      </main>
    </div>
  );
}
