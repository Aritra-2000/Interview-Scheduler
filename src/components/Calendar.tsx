"use client"
import { useEffect, useMemo, useState } from "react"
import { ChevronLeft, ChevronRight, Plus } from "lucide-react"
// Note: shadcn files were generated under src/components/components/ui/*
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/components/lib/utils"
import EventModal, { type EventForm } from "@/components/EventModal"


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
  type DayEvent = { id: string; title: string; time: string; type: string; candidateName?: string; candidateEmail?: string; startISO: string; endISO?: string }
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
      arr.push({ id: ev.id, title: ev.title, time, type: t, candidateName: ev.candidateName, candidateEmail: ev.candidateEmail, startISO: ev.start, endISO: ev.end })
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
    <div className="w-full rounded-lg p-4 text-white" style={{ backgroundColor: '#CABA9C' }}>
      {/* Calendar Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <h2 className="text-xl font-semibold text-white">
            {months[month]} {year}
          </h2>
          <div className="flex items-center gap-1">
            <Button variant="secondary" size="sm" onClick={() => navigateMonth("prev")} className="h-8 w-8 p-0">
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button variant="secondary" size="sm" onClick={() => navigateMonth("next")} className="h-8 w-8 p-0">
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
        <Button
          size="sm"
          className="gap-2"
          onClick={() => {
            // Prefill with selected date at 10:00 local, else now rounded to next 30m
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
          variant="secondary"
        >
          <Plus className="h-4 w-4" />
          Add Event
        </Button>
      </div>

      {/* Calendar Grid */}
      <div className="grid grid-cols-7 gap-1 mb-4">
        {/* Day headers */}
        {daysOfWeek.map((day) => (
          <div key={day} className="p-2 text-center text-sm font-medium text-gray-500">
            {day}
          </div>
        ))}

        {/* Calendar days */}
        {calendarDays.map((day, index) => {
          if (day === null) {
            return <div key={index} className="p-2 h-24"></div>
          }

          const events = getEventsForDate(day)
          const isToday = isCurrentMonth && day === today
          const isSelected = selectedDate === day

          return (
            <div
              key={day}
              className={cn(
                "p-2 h-24 border border-gray-200 cursor-pointer hover:bg-gray-50 transition-colors",
                isToday && "bg-blue-50 border-blue-200",
                isSelected && "bg-blue-100 border-blue-300",
              )}
              onClick={() => setSelectedDate(day)}
            >
              <div className={cn("text-sm font-medium mb-1", isToday ? "text-blue-600" : "text-gray-900")}>{day}</div>
              <div className="space-y-1">
                {events.slice(0, 2).map((event, eventIndex) => (
                  <button
                    key={eventIndex}
                    className={cn("text-left w-full text-xs px-1 py-0.5 rounded truncate", getEventTypeColor(event.type))}
                    title={`${event.candidateName ? event.candidateName + " — " : ""}${event.title} at ${event.time}`}
                    onClick={(e) => {
                      e.stopPropagation()
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
                    <div className="font-medium leading-tight text-center">
                      {event.candidateName}
                    </div>
                    <div className="text-[12px] opacity-80 leading-tight mt-0.5 text-center">
                      {event.title}
                    </div>
                </button>
                ))}
                {events.length > 2 && <div className="text-xs text-gray-500">+{events.length - 2} more</div>}
              </div>
            </div>
          )
        })}
      </div>

      {/* Selected Date Events */}
      {selectedDate && (
        <div className="mt-6 p-4 bg-gray-50 rounded-lg">
          <h3 className="font-medium text-gray-900 mb-3">
            Events for {months[month]} {selectedDate}, {year}
          </h3>
          <div className="space-y-2">
            {getEventsForDate(selectedDate).map((event, index) => (
              <button
                key={index}
                className="w-full flex items-center justify-between p-2 bg-white rounded border text-left hover:bg-gray-50"
                title={`${event.candidateName ? event.candidateName + " — " : ""}${event.title} at ${event.time}`}
                onClick={() => {
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
                <div>
                  <div className="font-medium text-sm text-gray-900">{event.candidateName ? event.candidateName : event.title}</div>
                  <div className="text-xs text-gray-500">{event.time}</div>
                </div>
                <Badge variant="secondary" className={getEventTypeColor(event.type)}>
                  {event.type}
                </Badge>
              </button>
            ))}
            {getEventsForDate(selectedDate).length === 0 && (
              <p className="text-sm text-gray-500">No events scheduled for this date.</p>
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
            if (!res.ok) {
              const payload = await res.json().catch(() => null as any)
              const msg = payload?.error || `Failed to create (${res.status})`
              throw new Error(msg)
            }
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
            if (!res.ok) {
              const payload = await res.json().catch(() => null as any)
              const msg = payload?.error || `Failed to update (${res.status})`
              throw new Error(msg)
            }
          }
          // Refresh
          try {
            const list = await fetch("/api/events", { cache: "no-store" }).then((r) => r.json())
            setEvents(Array.isArray(list) ? list : [])
          } catch {}
        }}
        onDelete={modalMode === "edit" && activeId ? async () => {
          const res = await fetch(`/api/events/${activeId}`, { method: "DELETE" })
          if (!res.ok) return
          try {
            const list = await fetch("/api/events", { cache: "no-store" }).then((r) => r.json())
            setEvents(Array.isArray(list) ? list : [])
          } catch {}
          setModalOpen(false)
        } : undefined}
      />
    </div>
  )
}
             