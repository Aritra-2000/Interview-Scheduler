"use client";
import { useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";

export default function Dashboard() {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === "loading") return;
    const role = (session as any)?.role ?? "candidate";
    router.replace(role === "recruiter" ? "/dashboard/admin" : "/dashboard/candidate");
  }, [status, session, router]);

  return null;
}
