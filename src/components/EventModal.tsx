"use client";
import { useEffect, useMemo, useState } from "react";

export type EventForm = {
  title: string;
  candidateName?: string;
  candidateEmail: string;
  start: string; // ISO
  end?: string;  // ISO
};

export default function EventModal({
  open,
  mode = "create",
  initial,
  onClose,
  onSubmit,
  onDelete,
}: {
  open: boolean;
  mode?: "create" | "edit";
  initial: Partial<EventForm>;
  onClose: () => void;
  onSubmit: (data: EventForm) => Promise<void> | void;
  onDelete?: () => Promise<void> | void;
}) {
  const [title, setTitle] = useState(initial.title || "");
  const [candidateName, setCandidateName] = useState((initial as any)?.candidateName || "");
  const [candidateEmail, setCandidateEmail] = useState(initial.candidateEmail || "");
  const [start, setStart] = useState(initial.start || "");
  const [end, setEnd] = useState(initial.end || "");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string>("");
  const [doNotEmail, setDoNotEmail] = useState(false);

  // Convert stored ISO (UTC) to a local datetime-local string
  const toLocalInput = (iso?: string) => {
    if (!iso) return "";
    const d = new Date(iso);
    if (isNaN(d.getTime())) return "";
    const tzOffset = d.getTimezoneOffset();
    const local = new Date(d.getTime() - tzOffset * 60000);
    return local.toISOString().slice(0, 16); // YYYY-MM-DDTHH:mm
  };

  useEffect(() => {
    if (open) {
      setTitle(initial.title || "");
      setCandidateName((initial as any)?.candidateName || "");
      setCandidateEmail(initial.candidateEmail || "");
      setStart(initial.start || "");
      setEnd(initial.end || "");
      setError("");
      setSubmitting(false);
      setDoNotEmail(false);
    }
  }, [open, initial.title, (initial as any)?.candidateName, initial.candidateEmail, initial.start, initial.end]);

  const valid = useMemo(() => {
    if (!title.trim()) return false;
    if (!candidateEmail.trim()) return false;
    if (!start) return false;
    return true;
  }, [title, candidateEmail, start]);

  if (!open) return null;

  const handleSubmit = async () => {
    setError("");
    if (!valid) return;
    try {
      setSubmitting(true);
      await onSubmit({ title: title.trim(), candidateName: candidateName.trim() || undefined, candidateEmail: candidateEmail.trim(), start, end: end || undefined });
      onClose();
    } catch (e: any) {
      setError(e?.message || "Something went wrong");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/60" onClick={onClose} />
      <div className="relative w-full max-w-md rounded-lg border border-gray-800 bg-gray-900 p-5 text-white shadow-xl">
        <div className="mb-4">
          <h2 className="text-xl font-semibold">{mode === "create" ? "Schedule Interview" : "Edit Interview"}</h2>
        </div>
        <div className="space-y-3">
          <div>
            <label className="block text-sm text-gray-300 mb-1">Title</label>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-3 py-2 rounded bg-gray-950 border border-gray-800"
              placeholder="Interview Title"
            />
          </div>
          <div>
            <label className="block text-sm text-gray-300 mb-1">Candidate Name</label>
            <input
              value={candidateName}
              onChange={(e) => setCandidateName(e.target.value)}
              className="w-full px-3 py-2 rounded bg-gray-950 border border-gray-800"
              placeholder="e.g., Priya Sharma"
            />
          </div>
          <div>
            <label className="block text-sm text-gray-300 mb-1">Candidate Email</label>
            <input
              type="email"
              value={candidateEmail}
              onChange={(e) => setCandidateEmail(e.target.value)}
              className="w-full px-3 py-2 rounded bg-gray-950 border border-gray-800"
              placeholder="candidate@example.com"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm text-gray-300 mb-1">Start</label>
              <input
                type="datetime-local"
                value={toLocalInput(start)}
                onChange={(e) => setStart(new Date(e.target.value).toISOString())}
                className="w-full px-3 py-2 rounded bg-gray-950 border border-gray-800"
              />
            </div>
            <div>
              <label className="block text-sm text-gray-300 mb-1">End (optional)</label>
              <input
                type="datetime-local"
                value={toLocalInput(end)}
                onChange={(e) => setEnd(e.target.value ? new Date(e.target.value).toISOString() : "")}
                className="w-full px-3 py-2 rounded bg-gray-950 border border-gray-800"
              />
            </div>
          </div>
          <div className="pt-1">
            <label className="inline-flex items-center gap-2 text-sm text-gray-300">
              <input
                type="checkbox"
                checked={doNotEmail}
                onChange={async (e) => {
                  const next = e.target.checked;
                  setDoNotEmail(next);
                  const email = (candidateEmail || "").trim();
                  if (!email) return;
                  try {
                    await fetch("/api/candidates", {
                      method: "PUT",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({ candidateEmail: email, doNotEmail: next }),
                    });
                  } catch {}
                }}
              />
              Do not email this candidate
            </label>
          </div>
        </div>
        {error && <div className="mt-3 text-sm text-red-400">{error}</div>}
        <div className="mt-5 flex items-center justify-end gap-2">
          {mode === "edit" && onDelete && (
            <button disabled={submitting} onClick={() => onDelete()} className="px-3 py-2 rounded bg-red-700/80 hover:bg-red-700">
              Delete
            </button>
          )}
          <button disabled={submitting} onClick={onClose} className="px-3 py-2 rounded bg-gray-800 hover:bg-gray-700">Cancel</button>
          <button disabled={submitting || !valid} onClick={handleSubmit} className="px-3 py-2 rounded bg-blue-700 hover:bg-blue-600 disabled:opacity-50">
            {submitting ? "Saving..." : mode === "create" ? "Schedule" : "Save"}
          </button>
        </div>
      </div>
    </div>
  );
}
