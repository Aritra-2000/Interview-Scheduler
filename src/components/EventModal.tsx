"use client";
import { useEffect, useMemo, useState } from "react";

export type EventForm = {
  title: string;
  candidateName?: string;
  candidateEmail: string;
  start: string; // ISO
  end?: string;  // ISO
  notes?: string;
  rating?: number;
  stage?: string;
};

function cn(...classes: string[]) {
  return classes.filter(Boolean).join(" ");
}

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
  const [notes, setNotes] = useState(initial.notes || "");
  const [rating, setRating] = useState(initial.rating || 0);
  const [stage, setStage] = useState(initial.stage || "screening");
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
      setNotes(initial.notes || "");
      setRating(initial.rating || 0);
      setStage(initial.stage || "screening");
      setError("");
      setSubmitting(false);
      setDoNotEmail(false);
    }
  }, [open, initial]);

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
      await onSubmit({ 
        title: title.trim(), 
        candidateName: candidateName.trim() || undefined, 
        candidateEmail: candidateEmail.trim(), 
        start, 
        end: end || undefined,
        notes,
        rating: rating || undefined,
        stage
      });
      onClose();
    } catch (e: any) {
      setError(e?.message || "Something went wrong");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity" onClick={onClose} />
      <div className="relative w-full max-w-lg rounded-2xl border border-gray-700/60 bg-gradient-to-br from-gray-900 to-gray-800 p-6 text-white shadow-2xl transition-all max-h-[90vh] overflow-y-auto overflow-x-hidden">
        <div className="mb-6 flex items-center justify-between pointer-events-auto">
          <h2 className="text-xl font-bold tracking-tight text-white/90">
            {mode === "create" ? "Schedule Interview" : "Interview Details"}
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-white transition-colors">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-300 mb-1.5">Interview Title</label>
              <input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full px-4 py-2.5 rounded-lg bg-gray-950/50 border border-gray-700/50 focus:border-blue-500 focus:ring-1 focus:ring-blue-500/50 outline-none transition-all placeholder-gray-600"
                placeholder="e.g. Technical Round 1"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1.5">Candidate Name</label>
              <input
                value={candidateName}
                onChange={(e) => setCandidateName(e.target.value)}
                className="w-full px-4 py-2.5 rounded-lg bg-gray-950/50 border border-gray-700/50 focus:border-blue-500 focus:ring-1 focus:ring-blue-500/50 outline-none transition-all placeholder-gray-600"
                placeholder="e.g., Priya Sharma"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1.5">Candidate Email</label>
              <input
                type="email"
                value={candidateEmail}
                onChange={(e) => setCandidateEmail(e.target.value)}
                className="w-full px-4 py-2.5 rounded-lg bg-gray-950/50 border border-gray-700/50 focus:border-blue-500 focus:ring-1 focus:ring-blue-500/50 outline-none transition-all placeholder-gray-600"
                placeholder="candidate@example.com"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1.5">Start Time</label>
              <input
                type="datetime-local"
                value={toLocalInput(start)}
                onChange={(e) => setStart(new Date(e.target.value).toISOString())}
                className="w-full px-4 py-2.5 rounded-lg bg-gray-950/50 border border-gray-700/50 focus:border-blue-500 focus:ring-1 focus:ring-blue-500/50 outline-none transition-all text-sm color-scheme-dark"
                style={{ colorScheme: 'dark' }}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1.5">End Time (Optional)</label>
              <input
                type="datetime-local"
                value={toLocalInput(end)}
                onChange={(e) => setEnd(e.target.value ? new Date(e.target.value).toISOString() : "")}
                className="w-full px-4 py-2.5 rounded-lg bg-gray-950/50 border border-gray-700/50 focus:border-blue-500 focus:ring-1 focus:ring-blue-500/50 outline-none transition-all text-sm color-scheme-dark"
                style={{ colorScheme: 'dark' }}
              />
            </div>
          </div>

          {mode === "edit" && (
            <div className="pt-4 border-t border-gray-700/50 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold uppercase tracking-wider text-blue-400">Interview Feedback</h3>
                <div className="flex items-center gap-1">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      onClick={() => setRating(star)}
                      className={cn(
                        "transition-all duration-200",
                        rating >= star ? "text-yellow-400 scale-110" : "text-gray-600 hover:text-gray-500"
                      )}
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill={rating >= star ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                      </svg>
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1.5">Pipeline Stage</label>
                  <select
                    value={stage}
                    onChange={(e) => setStage(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-lg bg-gray-950/50 border border-gray-700/50 focus:border-blue-500 outline-none appearance-none cursor-pointer"
                  >
                    <option value="screening">Initial Screening</option>
                    <option value="technical">Technical Interview</option>
                    <option value="managerial">Managerial Round</option>
                    <option value="final">Final Round</option>
                    <option value="offered">Offered</option>
                    <option value="rejected">Rejected</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1.5">Internal Notes</label>
                  <textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-lg bg-gray-950/50 border border-gray-700/50 focus:border-blue-500 outline-none min-h-[100px] resize-none text-sm"
                    placeholder="Candidate showed strong system design skills..."
                  />
                </div>
              </div>
            </div>
          )}

          <div className="pt-2">
            <label className="inline-flex items-center gap-2 text-sm text-gray-400 hover:text-gray-300 transition-colors cursor-pointer">
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
                className="rounded border-gray-600 bg-gray-800 text-blue-500 focus:ring-blue-500/50 w-4 h-4 cursor-pointer"
              />
              Do not whisper email notifications to this candidate
            </label>
          </div>
        </div>

        {error && <div className="mt-4 rounded-lg bg-red-900/40 border border-red-500/50 p-3 text-sm text-red-300">{error}</div>}
        
        <div className="mt-8 flex items-center justify-end gap-3 pt-4 border-t border-gray-700/50 sticky bottom-0 bg-gradient-to-br from-gray-900 to-gray-800">
          {mode === "edit" && onDelete && (
            <button disabled={submitting} onClick={() => onDelete()} className="px-4 py-2 rounded-lg font-medium text-red-400 hover:bg-red-950/50 focus:ring-2 focus:ring-red-900 transition-colors mr-auto">
              Delete
            </button>
          )}
          <button disabled={submitting} onClick={onClose} className="px-4 py-2 rounded-lg font-medium text-gray-300 hover:bg-gray-700/50 transition-colors focus:ring-2 focus:ring-gray-700">
            Cancel
          </button>
          <button 
            disabled={submitting || !valid} 
            onClick={handleSubmit} 
            className="px-5 py-2 rounded-lg font-medium bg-blue-600 hover:bg-blue-500 shadow-lg shadow-blue-900/20 disabled:shadow-none disabled:bg-gray-700 disabled:text-gray-500 disabled:cursor-not-allowed transition-all focus:ring-2 focus:ring-blue-500"
          >
            {submitting ? (
              <span className="flex items-center gap-2 text-white">
                <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                Saving...
              </span>
            ) : mode === "create" ? "Schedule Event" : "Save Changes"}
          </button>
        </div>
      </div>
    </div>
  );
}
