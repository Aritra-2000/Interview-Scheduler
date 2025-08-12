"use client";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import Link from "next/link";

type Settings = {
  timezone: string;
  workDays: number[];
  workStart: string;
  workEnd: string;
  defaultDurationMinutes: number;
  bufferMinutes: number;
  notifications: {
    scheduled: boolean;
    rescheduled: boolean;
    cancelled: boolean;
    reminders: boolean;
    reminderMinutes: number;
  };
  emailFromName?: string;
  emailReplyTo?: string;
};

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export default function SettingsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const role = (session as any)?.role;
  const isRecruiter = role === "recruiter";

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState<string>("");
  const [data, setData] = useState<Settings | null>(null);
  const [savedOk, setSavedOk] = useState(false);
  const [toast, setToast] = useState<{ type: "success" | "error"; message: string } | null>(null);

  useEffect(() => {
    if (status === "loading") return;
    if (!session || !isRecruiter) {
      router.push("/dashboard");
      return;
    }
    (async () => {
      try {
        const res = await fetch("/api/settings", { cache: "no-store" });
        const json = await res.json();
        // Ensure IST (Asia/Kolkata)
        if (!json?.timezone || json.timezone !== "Asia/Kolkata") {
          const updated = { ...json, timezone: "Asia/Kolkata" };
          setData(updated);
          try {
            await fetch("/api/settings", {
              method: "PUT",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify(updated),
            });
            setToast({ type: "success", message: "Timezone set to Asia/Kolkata (IST)" });
            setTimeout(() => setToast(null), 2000);
          } catch {
            // non-blocking
          }
        } else {
          setData(json);
        }
      } catch (e) {
        setErr("Failed to load settings");
      } finally {
        setLoading(false);
      }
    })();
  }, [status, session, isRecruiter, router]);

  const toggleWorkDay = (idx: number) => {
    if (!data) return;
    const set = new Set(data.workDays);
    if (set.has(idx)) set.delete(idx); else set.add(idx);
    setData({ ...data, workDays: Array.from(set).sort((a, b) => a - b) });
  };

  const canSave = useMemo(() => {
    if (!data) return false;
    if (!data.workStart || !data.workEnd) return false;
    if (!Array.isArray(data.workDays) || data.workDays.length === 0) return false;
    if (data.notifications.reminders && (!data.notifications.reminderMinutes || data.notifications.reminderMinutes <= 0)) return false;
    return true;
  }, [data]);

  const save = async () => {
    if (!data) return;
    setSaving(true);
    setErr("");
    setSavedOk(false);
    try {
      const res = await fetch("/api/settings", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) });
      if (!res.ok) throw new Error("Failed to save");
      const saved = await res.json();
      setData(saved);
      setSavedOk(true);
      setToast({ type: "success", message: "Settings saved" });
      setTimeout(() => { setSavedOk(false); setToast(null); }, 2000);
    } catch (e: any) {
      setErr(e?.message || "Save failed");
      setToast({ type: "error", message: e?.message || "Save failed" });
      setTimeout(() => setToast(null), 2500);
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="p-6 text-white">Loading settings...</div>;
  if (err) return <div className="p-6 text-red-400">{err}</div>;
  if (!data) return <div className="p-6 text-white">No data</div>;

  return (
    <div className="p-6 text-white relative">
      <div className="mb-4 flex items-center justify-between gap-3">
        <h1 className="text-2xl font-semibold">Settings</h1>
        <Link href="/dashboard/admin" className="px-3 py-2 rounded bg-gray-800 hover:bg-gray-700 border border-gray-700">
          ← Back to Dashboard
        </Link>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-4">
          <div>
            <label className="block text-sm text-gray-300 mb-1">Timezone</label>
            <input value={data.timezone}
              onChange={(e) => setData({ ...data, timezone: e.target.value })}
              className="w-full px-3 py-2 rounded bg-gray-900 border border-gray-800" placeholder="e.g., Asia/Kolkata" />
          </div>
          <div>
            <label className="block text-sm text-gray-300 mb-1">Working Days</label>
            <div className="flex flex-wrap gap-2">
              {WEEKDAYS.map((d, i) => (
                <button key={i} type="button" onClick={() => toggleWorkDay(i)}
                  className={`px-3 py-1 rounded border ${data.workDays.includes(i) ? "bg-blue-700 border-blue-600" : "bg-gray-800 border-gray-700"}`}>
                  {d}
                </button>
              ))}
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm text-gray-300 mb-1">Work Start</label>
              <input type="time" value={data.workStart} onChange={(e) => setData({ ...data, workStart: e.target.value })}
                className="w-full px-3 py-2 rounded bg-gray-900 border border-gray-800" />
            </div>
            <div>
              <label className="block text-sm text-gray-300 mb-1">Work End</label>
              <input type="time" value={data.workEnd} onChange={(e) => setData({ ...data, workEnd: e.target.value })}
                className="w-full px-3 py-2 rounded bg-gray-900 border border-gray-800" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm text-gray-300 mb-1">Default Duration (mins)</label>
              <input type="number" min={0} value={data.defaultDurationMinutes}
                onChange={(e) => setData({ ...data, defaultDurationMinutes: Number(e.target.value) })}
                className="w-full px-3 py-2 rounded bg-gray-900 border border-gray-800" />
            </div>
            <div>
              <label className="block text-sm text-gray-300 mb-1">Buffer (mins)</label>
              <input type="number" min={0} value={data.bufferMinutes}
                onChange={(e) => setData({ ...data, bufferMinutes: Number(e.target.value) })}
                className="w-full px-3 py-2 rounded bg-gray-900 border border-gray-800" />
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <div className="border border-gray-800 rounded p-4">
            <div className="font-medium mb-2">Email</div>
            <div className="grid grid-cols-1 gap-3">
              <div>
                <label className="block text-sm text-gray-300 mb-1">From Name</label>
                <input value={data.emailFromName || ""}
                  onChange={(e) => setData({ ...data, emailFromName: e.target.value })}
                  className="w-full px-3 py-2 rounded bg-gray-900 border border-gray-800" />
              </div>
              <div>
                <label className="block text-sm text-gray-300 mb-1">Reply-To</label>
                <input value={data.emailReplyTo || ""}
                  onChange={(e) => setData({ ...data, emailReplyTo: e.target.value })}
                  className="w-full px-3 py-2 rounded bg-gray-900 border border-gray-800" />
              </div>
            </div>
          </div>

          <div className="border border-gray-800 rounded p-4">
            <div className="font-medium mb-2">Notifications</div>
            <div className="space-y-3">
              <label className="flex items-center gap-2"><input type="checkbox" checked={data.notifications.scheduled} onChange={(e)=>setData({ ...data, notifications: { ...data.notifications, scheduled: e.target.checked } })}/> Scheduled</label>
              <label className="flex items-center gap-2"><input type="checkbox" checked={data.notifications.rescheduled} onChange={(e)=>setData({ ...data, notifications: { ...data.notifications, rescheduled: e.target.checked } })}/> Rescheduled</label>
              <label className="flex items-center gap-2"><input type="checkbox" checked={data.notifications.cancelled} onChange={(e)=>setData({ ...data, notifications: { ...data.notifications, cancelled: e.target.checked } })}/> Cancelled</label>
              <div className="flex items-center gap-3">
                <label className="flex items-center gap-2"><input type="checkbox" checked={data.notifications.reminders} onChange={(e)=>setData({ ...data, notifications: { ...data.notifications, reminders: e.target.checked } })}/> Reminders</label>
                <input type="number" min={1} value={data.notifications.reminderMinutes}
                  onChange={(e)=>setData({ ...data, notifications: { ...data.notifications, reminderMinutes: Number(e.target.value) } })}
                  className="w-32 px-3 py-2 rounded bg-gray-900 border border-gray-800" />
                <span className="text-sm text-gray-400">minutes before</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-6 flex items-center gap-3">
        <button onClick={save} disabled={!canSave || saving} className="px-4 py-2 rounded bg-blue-700 hover:bg-blue-600 disabled:opacity-50">{saving ? "Saving..." : "Save Settings"}</button>
        {savedOk && <span className="text-green-400 text-sm">Saved</span>}
        {err && <span className="text-red-400 text-sm">{err}</span>}
      </div>

      {toast && (
        <div className={`fixed bottom-6 right-6 px-4 py-3 rounded shadow-lg border ${toast.type === "success" ? "bg-green-700/90 border-green-600" : "bg-red-700/90 border-red-600"}`}>
          <div className="text-white text-sm">{toast.message}</div>
        </div>
      )}
    </div>
  );
}
