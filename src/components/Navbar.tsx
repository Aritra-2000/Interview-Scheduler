"use client";
import { useSession } from "next-auth/react";

export default function Navbar() {
  const { data: session } = useSession();
  return (
    <nav className="flex items-center justify-between">
        <h2 className="text-2xl font-semibold">Dashboard</h2>
      <div className="flex items-center gap-4">
        <span className="opacity-80">{session?.user?.email}</span>
      </div>
    </nav>
  );
}
