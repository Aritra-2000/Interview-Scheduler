"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession, signOut } from "next-auth/react";
import { useEffect, useMemo, useState } from "react";

export default function Sidebar() {
  const pathname = usePathname();
  const { data: session } = useSession();
  const role = (session as any)?.role ?? "candidate";
  const isRecruiter = role === "recruiter";
  const [events, setEvents] = useState<Array<{ id: string; title: string; start: string; end?: string; candidateEmail?: string }>>([]);

  // Load events only for recruiters to build upcoming candidates list
  useEffect(() => {
    if (!isRecruiter) return;
    fetch("/api/events")
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then((data) => setEvents(Array.isArray(data) ? data : []))
      .catch(() => setEvents([]));
  }, [isRecruiter]);

  const upcoming = useMemo(() => {
    if (!isRecruiter) return [] as Array<{ candidateEmail: string; start: string; title: string; id: string }>;
    const now = Date.now();
    return events
      .filter((e) => {
        const t = Date.parse(e.start);
        return !isNaN(t) && t >= now;
      })
      .sort((a, b) => Date.parse(a.start) - Date.parse(b.start))
      .slice(0, 10)
      .map((e) => ({ id: e.id, candidateEmail: e.candidateEmail || "", start: e.start, title: e.title }));
  }, [events, isRecruiter]);

  const items = isRecruiter
    ? [
        { href: "/dashboard/admin", label: "Schedule" },
        { href: "/dashboard/admin/interviews", label: "All Interviews" },
        { href: "/dashboard/admin/candidates", label: "Candidates" },
        { href: "/dashboard/admin/settings", label: "Settings" },
      ]
    : [
        { href: "/dashboard/candidate", label: "My Interviews" },
      ];

  return (
    <nav className="space-y-4">
      <div className="text-lg font-semibold flex items-center justify-between">
        <span>Menu</span>
        <span className="text-xs px-2 py-0.5 rounded bg-gray-800/60 border border-gray-700">
          {isRecruiter ? "Admin" : "Candidate"}
        </span>
      </div>
      <ul className="space-y-1">
        {items.map((item) => {
          const active = pathname === item.href;
          return (
            <li key={item.href}>
              <Link
                href={item.href}
                className={
                  "block px-3 py-2 rounded transition-colors " +
                  (active
                    ? "bg-gray-800 text-white"
                    : "text-gray-300 hover:text-white hover:bg-gray-800/60")
                }
              >
                {item.label}
              </Link>
            </li>
          );
        })}
      </ul>
      {isRecruiter && (
        <div className="pt-4 border-t border-gray-800/70">
          <div className="text-sm uppercase tracking-wider text-gray-400 mb-2">Upcoming Candidates</div>
          {upcoming.length === 0 ? (
            <div className="text-xs text-gray-500">No upcoming interviews</div>
          ) : (
            <ul className="space-y-1">
              {upcoming.map((u) => (
                <li key={u.id} className="text-sm text-gray-300 flex flex-col">
                  <span className="truncate">{u.candidateEmail || "(unknown)"}</span>
                  <span className="text-xs text-gray-500">{new Date(u.start).toLocaleString()}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
      <div className="pt-4 border-t border-gray-800/70">
        <button
          onClick={() => signOut({ callbackUrl: "/login", redirect: true })}
          className="w-full px-3 py-2 rounded bg-gray-800 hover:bg-gray-700 text-left text-gray-200"
        >
          Logout
        </button>
      </div>
    </nav>
  );
}
