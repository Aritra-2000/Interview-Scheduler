"use client"
import { useEffect, useMemo, useState } from "react"
import { ChevronLeft, ChevronRight, Plus, Edit2, Trash2, Clock, Calendar as CalendarIcon } from "lucide-react"
// Note: shadcn files were generated under src/components/components/ui/*
import { Button } from "@/components/ui/button"
import { cn } from "@/components/lib/utils"
import EventModal, { type EventForm } from "@/components/EventModal"
import { useSession } from "next-auth/react"


const daysOfWeek = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]
const months = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
]

type EventItem = {
  id: string
  title: string
  start: string
  end?: string
  candidateEmail?: string
  candidateName?: string
  notes?: string
  rating?: number
  stage?: string
}

export default function Calendar() {

  const [currentDate, setCurrentDate] = useState(new Date())
  const [selectedDate, setSelectedDate] = useState<number | null>(null)
  const [events, setEvents] = useState<EventItem[]>([])
  const [loading, setLoading] = useState<boolean>(false)
  const [error, setError] = useState<string | null>(null)
  const [modalOpen, setModalOpen] = useState(false)
  const [modalInitial, setModalInitial] = useState<Partial<EventForm>>({})
  const [modalMode, setModalMode] = useState<"create" | "edit">("create")
  const [activeId, setActiveId] = useState<string | null>(null)
  const [toast, setToast] = useState<{ type: "success" | "error" | "info"; message: string } | null>(null)
  const { data: session } = useSession()
  const isRecruiter = (session as any)?.role === "recruiter"

  const year = currentDate.getFullYear()
  const month = currentDate.getMonth()

  const firstDayOfMonth = new Date(year, month, 1).getDay()
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const today = new Date().getDate()
  const isCurrentMonth = new Date().getMonth() === month && new Date().getFullYear() === year

  const navigateMonth = (direction: "prev" | "next") => {
    setCurrentDate((prev) => {
      const newDate = new Date(prev)
      if (direction === "prev") {
        newDate.setMonth(prev.getMonth() - 1)
      } else {
        newDate.setMonth(prev.getMonth() + 1)
      }
      return newDate
    })
  }

  // Fetch events once; the backend already enforces permissions/filters
  useEffect(() => {
    let aborted = false
    setLoading(true)
    fetch("/api/events", { cache: "no-store" })
      .then(async (r) => {
        if (!r.ok) throw new Error(`Failed to load events: ${r.status}`)
        return r.json()
      })
      .then((json: EventItem[]) => {
        if (!aborted) setEvents(Array.isArray(json) ? json : [])
      })
      .catch((e: any) => !aborted && setError(e?.message || "Failed to load events"))
      .finally(() => !aborted && setLoading(false))
    return () => {
      aborted = true
    }
  }, [])

  // Group by day for the current view month in local time
  type DayEvent = { id: string; title: string; time: string; type: string; candidateName?: string; candidateEmail?: string; startISO: string; endISO?: string; notes?: string; rating?: number; stage?: string }
  const eventsByDay = useMemo(() => {
    const map = new Map<number, DayEvent[]>()
    for (const ev of events) {
      const d = new Date(ev.start)
      if (d.getFullYear() !== year || d.getMonth() !== month) continue
      const day = d.getDate()
      const time = d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
      // naive type inference based on title keywords
      const t = /interview/i.test(ev.title) ? "interview" : /review/i.test(ev.title) ? "review" : /meet/i.test(ev.title) ? "meeting" : "event"
      const arr = map.get(day) || []
      arr.push({
        id: ev.id,
        title: ev.title,
        time,
        type: t,
        candidateName: ev.candidateName,
        candidateEmail: ev.candidateEmail,
        startISO: ev.start,
        endISO: ev.end,
        notes: ev.notes,
        rating: ev.rating,
        stage: ev.stage
      })
      map.set(day, arr)
    }
    return map
  }, [events, year, month])

  const getEventsForDate = (date: number) => {
    return eventsByDay.get(date) || []
  }

  const getEventTypeColor = (type: string) => {
    switch (type) {
      case "interview":
        return "bg-blue-100 text-blue-800"
      case "meeting":
        return "bg-green-100 text-green-800"
      case "review":
        return "bg-purple-100 text-purple-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  // Generate calendar days
  const calendarDays = []

  // Empty cells for days before the first day of the month
  for (let i = 0; i < firstDayOfMonth; i++) {
    calendarDays.push(null)
  }

  // Days of the month
  for (let day = 1; day <= daysInMonth; day++) {
    calendarDays.push(day)
  }

  return (
    <div className="w-full rounded-[2.5rem] p-8 bg-[#09090b]/40 backdrop-blur-xl text-white shadow-2xl border border-white/5 relative overflow-hidden">
      <div className="absolute -top-24 -left-24 w-64 h-64 bg-indigo-600/5 blur-[80px] pointer-events-none" />

      {/* Calendar Header */}
      <div className="flex items-center justify-between mb-8 relative z-10">
        <div className="flex items-center gap-6">
          <div className="flex flex-col">
            <span className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-500 mb-1">Timeline</span>
            <h2 className="text-3xl font-black text-white tracking-tighter">
              {months[month]} {year}
            </h2>
          </div>
          <div className="flex items-center gap-2 mt-4">
            <Button variant="outline" size="icon" onClick={() => navigateMonth("prev")} className="h-10 w-10 rounded-xl bg-white/[0.03] border-white/10 hover:bg-white/10 hover:text-white transition-all">
              <ChevronLeft className="h-5 w-5" />
            </Button>
            <Button variant="outline" size="icon" onClick={() => navigateMonth("next")} className="h-10 w-10 rounded-xl bg-white/[0.03] border-white/10 hover:bg-white/10 hover:text-white transition-all">
              <ChevronRight className="h-5 w-5" />
            </Button>
          </div>
        </div>
        {isRecruiter && (
          <Button
            size="lg"
            className="gap-3 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold shadow-xl shadow-indigo-600/20 px-8 h-12"
            onClick={() => {
              let start = new Date()
              if (selectedDate) {
                start = new Date(year, month, selectedDate, 10, 0, 0, 0)
              } else {
                const mins = start.getMinutes()
                start.setMinutes(mins + (30 - (mins % 30)) % 30, 0, 0)
              }
              setModalMode("create")
              setActiveId(null)
              setModalInitial({ title: "", candidateEmail: "", candidateName: "", start: start.toISOString() })
              setModalOpen(true)
            }}
          >
            <Plus className="h-5 w-5" />
            Add Event
          </Button>
        )}
      </div>

      {/* Tan Calendar Grid */}
      <div className="rounded-[2rem] overflow-hidden border-4 border-[#c2b59b] shadow-2xl relative z-10 bg-[#c2b59b]">
        <div className="grid grid-cols-7 border-b border-white/20">
          {/* Day headers */}
          {daysOfWeek.map((day) => (
            <div key={day} className="p-4 text-center text-[10px] font-black tracking-[0.2em] text-[#5e503f]/60 uppercase border-r border-white/20 last:border-r-0">
              {day}
            </div>
          ))}
        </div>

        <div className="grid grid-cols-7">
          {calendarDays.map((day, index) => {
            if (day === null) {
              return <div key={index} className="h-32 border-r border-b border-white/20 last:border-r-0"></div>
            }

            const events = getEventsForDate(day)
            const isToday = isCurrentMonth && day === today
            const isSelected = selectedDate === day

            return (
              <div
                key={day}
                className={cn(
                  "h-32 border-r border-b border-white/20 last:border-r-0 p-2 transition-all cursor-pointer relative group",
                  isSelected ? "bg-[#b0a184] shadow-inner" : "hover:bg-[#b0a184]/50",
                  isToday && "bg-blue-400/10"
                )}
                onClick={() => setSelectedDate(day)}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className={cn(
                    "text-xs font-black p-1.5 rounded-lg transition-colors",
                    isToday ? "bg-white text-blue-600 shadow-md" : "text-[#5e503f]"
                  )}>
                    {day}
                  </span>
                  {events.length > 0 && (
                    <div className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                  )}
                </div>

                <div className="space-y-1 overflow-y-auto max-h-[80px] p-0.5 custom-scrollbar">
                  {events.slice(0, 2).map((event, eventIndex) => (
                    <button
                      key={eventIndex}
                      className={cn(
                        "text-left w-full px-2 py-1.5 rounded-xl border border-white/30 shadow-sm transition-all hover:scale-[1.03] active:scale-95 bg-white text-[#5e503f] font-bold text-[10px] group/btn",
                        isRecruiter ? "cursor-pointer" : "cursor-default"
                      )}
                      title={`${event.candidateName} at ${event.time}`}
                      onClick={(e) => {
                        e.stopPropagation()
                        if (!isRecruiter) return
                        setModalMode("edit")
                        setActiveId(event.id)
                        setModalInitial({
                          title: event.title,
                          candidateName: event.candidateName,
                          candidateEmail: event.candidateEmail || "",
                          start: event.startISO,
                          end: event.endISO,
                        })
                        setModalOpen(true)
                      }}
                    >
                      <div className="truncate">{event.candidateName?.split(' ')[0] || "No Name"}</div>
                      <div className="opacity-60 truncate font-medium text-[9px] uppercase tracking-tighter">{event.title}</div>
                    </button>
                  ))}
                  {events.length > 2 && <div className="text-[10px] font-black text-white px-2 py-1 bg-black/10 rounded-lg inline-block mt-1">+{events.length - 2}</div>}
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Selected Date Events */}
      {selectedDate && (
        <div className="mt-12 p-8 bg-white/[0.03] rounded-[2.5rem] border border-white/5 shadow-2xl backdrop-blur-md animate-in slide-in-from-bottom-5">
          <h3 className="text-xl font-black text-white mb-6 flex items-center gap-3">
            <div className="w-1.5 h-6 bg-indigo-500 rounded-full" />
            Events for {months[month]} {selectedDate}, {year}
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {getEventsForDate(selectedDate).map((event, index) => (
              <div
                key={index}
                className={cn(
                  "group flex items-center justify-between p-6 bg-[#09090b]/40 backdrop-blur-md rounded-3xl border border-white/5 transition-all",
                  isRecruiter ? "hover:border-indigo-500/30 hover:bg-white/[0.03] cursor-pointer" : "cursor-default"
                )}
                onClick={() => {
                  if (!isRecruiter) return;
                  setModalMode("edit");
                  setActiveId(event.id);
                  setModalInitial({
                    title: event.title,
                    candidateName: event.candidateName,
                    candidateEmail: event.candidateEmail || "",
                    start: event.startISO,
                    end: event.endISO,
                    notes: event.notes,
                    rating: event.rating,
                    stage: event.stage,
                  });
                  setModalOpen(true);
                }}
              >
                <div className="flex items-center gap-5">
                  <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 font-black">
                    {event.candidateName?.[0] || "?"}
                  </div>
                  <div className="flex flex-col">
                    <div className="font-black text-white tracking-tight group-hover:text-indigo-400 transition-colors uppercase text-sm">
                      {event.candidateName || event.title}
                    </div>
                    <div className="flex items-center gap-3 mt-1">
                      <div className="text-xs font-bold text-slate-500 flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {event.time}
                      </div>
                      <span className="text-[10px] font-black uppercase tracking-widest text-indigo-500/50 bg-indigo-500/5 px-2 py-0.5 rounded-md border border-indigo-500/10">
                        {event.type}
                      </span>
                    </div>
                  </div>
                </div>

                {isRecruiter && (
                  <div className="flex items-center gap-2">
                    <button
                      className="p-3 rounded-xl bg-white/5 text-slate-400 hover:text-white hover:bg-indigo-600 transition-all shadow-sm"
                      title="Edit Session"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={async (e) => {
                        e.stopPropagation();
                        if (!confirm("Are you sure you want to cancel this interview?")) return;
                        const res = await fetch(`/api/events/${event.id}`, { method: "DELETE" });
                        if (res.ok) {
                          setToast({ type: "success", message: "Interview cancelled." });
                          fetch("/api/events").then(r => r.json()).then(json => setEvents(Array.isArray(json) ? json : []));
                          setTimeout(() => setToast(null), 3000);
                        }
                      }}
                      className="p-3 rounded-xl bg-white/5 text-slate-400 hover:text-red-400 hover:bg-red-600/10 transition-all"
                      title="Cancel Booking"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                )}
              </div>
            ))}
            {getEventsForDate(selectedDate).length === 0 && (
              <div className="col-span-2 py-12 flex flex-col items-center justify-center opacity-40">
                <CalendarIcon className="w-12 h-12 text-slate-500 mb-4 stroke-1" />
                <p className="text-sm font-black uppercase tracking-widest text-slate-500">No sessions scheduled for today</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Schedule/Edit Modal */}
      <EventModal
        open={modalOpen}
        mode={modalMode}
        initial={modalInitial}
        onClose={() => setModalOpen(false)}
        onSubmit={async (data) => {
          if (modalMode === "create") {
            const res = await fetch("/api/events", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify(data),
            })
            const payload = await res.json().catch(() => null as any)
            if (!res.ok) {
              const msg = payload?.error || `Failed to create (${res.status})`
              throw new Error(msg)
            }
            if (payload.emailSent === false) {
              const reason = payload.skipReason === "candidate_muted" ? "Candidate has emails disabled." : payload.skipReason === "disabled_by_settings" ? "Global interview notifications are off." : "Email delivery failed.";
              setToast({ type: "info", message: `Event created, but: ${reason}` });
            } else {
              setToast({ type: "success", message: "Interview scheduled and email sent!" });
            }
            setTimeout(() => setToast(null), 4000);
          } else if (modalMode === "edit" && activeId) {
            const res = await fetch(`/api/events/${activeId}`, {
              method: "PATCH",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                title: data.title,
                start: data.start,
                end: data.end,
                candidateEmail: data.candidateEmail,
                candidateName: data.candidateName,
              }),
            })
            const payload = await res.json().catch(() => null as any)
            if (!res.ok) {
              const msg = payload?.error || `Failed to update (${res.status})`
              throw new Error(msg)
            }
            if (payload.emailSent) {
              setToast({ type: "success", message: "Interview updated and email sent!" });
            } else if (payload.emailSent === false) {
              setToast({ type: "info", message: `Updated, but email skipped: ${payload.skipReason}` });
            } else {
              setToast({ type: "success", message: "Event updated successfully." });
            }
            setTimeout(() => setToast(null), 4000);
          }
          // Refresh
          try {
            const list = await fetch("/api/events", { cache: "no-store" }).then((r) => r.json())
            setEvents(Array.isArray(list) ? list : [])
          } catch { }
        }}
        onDelete={modalMode === "edit" && activeId ? async () => {
          const res = await fetch(`/api/events/${activeId}`, { method: "DELETE" })
          const payload = await res.json().catch(() => null as any)
          if (!res.ok) return

          if (payload.emailSent) {
            setToast({ type: "success", message: "Interview cancelled and email sent!" });
          } else {
            setToast({ type: "success", message: "Event deleted." });
          }
          setTimeout(() => setToast(null), 4000);

          try {
            const list = await fetch("/api/events", { cache: "no-store" }).then((r) => r.json())
            setEvents(Array.isArray(list) ? list : [])
          } catch { }
          setModalOpen(false)
        } : undefined}
      />

      {toast && (
        <div className={cn(
          "fixed bottom-6 right-6 px-5 py-3 rounded-xl shadow-2xl border backdrop-blur-md z-[100] transition-all animate-in fade-in slide-in-from-bottom-5",
          toast.type === "success" ? "bg-green-600/90 border-green-500 text-white" :
            toast.type === "error" ? "bg-red-600/90 border-red-500 text-white" :
              "bg-blue-600/90 border-blue-500 text-white"
        )}>
          <div className="flex items-center gap-3">
            {toast.type === "success" && <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>}
            <p className="text-sm font-medium">{toast.message}</p>
          </div>
        </div>
      )}
    </div>
  )
}
