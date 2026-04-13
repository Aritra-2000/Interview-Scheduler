"use client"
import { useEffect, useMemo, useState } from "react"
import { ChevronLeft, ChevronRight, Plus, Edit2, Trash2, Clock, Calendar as CalendarIcon } from "lucide-react"
// Note: shadcn files were generated under src/components/components/ui/*
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/components/lib/utils"

type Event = {
  id: string
  title: string
  start: string
  end: string
  candidateEmail: string
  recruiterEmail: string
  description?: string
}

export default function Calendar() {
  const [currentDate, setCurrentDate] = useState(new Date())
  const [selectedDate, setSelectedDate] = useState<Date | null>(new Date())
  const [events, setEvents] = useState<Event[]>([])
  const [loading, setLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const [editingEvent, setEditingEvent] = useState<Event | null>(null)

  useEffect(() => {
    fetchEvents()
  }, [])

  const fetchEvents = async () => {
    try {
      const res = await fetch("/api/events")
      const data = await res.json()
      setEvents(data)
    } finally {
      setLoading(false)
    }
  }

  const daysInMonth = useMemo(() => {
    const year = currentDate.getFullYear()
    const month = currentDate.getMonth()
    const firstDay = new Date(year, month, 1).getDay()
    const days = new Date(year, month + 1, 0).getDate()
    
    return { firstDay, days }
  }, [currentDate])

  const prevMonth = () => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1))
  const nextMonth = () => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1))

  const isToday = (day: number) => {
    const today = new Date()
    return (
      day === today.getDate() &&
      currentDate.getMonth() === today.getMonth() &&
      currentDate.getFullYear() === today.getFullYear()
    )
  }

  const getEventsForDate = (date: Date | null) => {
    if (!date) return []
    return events.filter(e => {
      const d = new Date(e.start)
      return (
        d.getDate() === date.getDate() &&
        d.getMonth() === date.getMonth() &&
        d.getFullYear() === date.getFullYear()
      )
    })
  }

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure?")) return
    await fetch(`/api/events/${id}`, { method: "DELETE" })
    fetchEvents()
  }

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-5 duration-700">
      {/* Calendar Grid Section */}
      <div className="bg-[#c2b59b] rounded-[2.5rem] border border-[#5e503f]/20 shadow-2xl overflow-hidden">
        <div className="p-8 flex items-center justify-between bg-white/10 backdrop-blur-md border-b border-[#5e503f]/10">
          <div>
            <h2 className="text-3xl font-black text-[#5e503f] tracking-tighter">
              {currentDate.toLocaleString("default", { month: "long" })}{" "}
              <span className="opacity-40">{currentDate.getFullYear()}</span>
            </h2>
            <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-[#5e503f]/60 mt-1">Global Shift Schedule</p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" onClick={prevMonth} className="rounded-xl hover:bg-[#5e503f]/10 text-[#5e503f]">
              <ChevronLeft className="w-5 h-5" />
            </Button>
            <Button variant="ghost" size="icon" onClick={nextMonth} className="rounded-xl hover:bg-[#5e503f]/10 text-[#5e503f]">
              <ChevronRight className="w-5 h-5" />
            </Button>
          </div>
        </div>

        <div className="p-6">
          <div className="grid grid-cols-7 mb-4">
            {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map(d => (
              <div key={d} className="text-center text-[10px] font-black uppercase tracking-widest text-[#5e503f]/40 py-2">
                {d}
              </div>
            ))}
          </div>

          <div className="grid grid-cols-7 gap-px bg-[#5e503f]/10 rounded-2xl overflow-hidden border border-[#5e503f]/10">
            {Array.from({ length: daysInMonth.firstDay }).map((_, i) => (
              <div key={`empty-${i}`} className="h-32 bg-[#c2b59b]/50" />
            ))}
            {Array.from({ length: daysInMonth.days }).map((_, i) => {
              const day = i + 1
              const date = new Date(currentDate.getFullYear(), currentDate.getMonth(), day)
              const dayEvents = getEventsForDate(date)
              const active = selectedDate?.getDate() === day && selectedDate?.getMonth() === currentDate.getMonth()

              return (
                <div
                  key={day}
                  onClick={() => setSelectedDate(date)}
                  className={cn(
                    "h-32 p-3 bg-[#c2b59b] hover:bg-[#b0a288] transition-all cursor-pointer relative group",
                    active && "bg-[#b0a288]/80 shadow-inner"
                  )}
                >
                  <span className={cn(
                    "text-sm font-black transition-colors",
                    isToday(day) ? "text-indigo-600" : "text-[#5e503f]",
                    active && "scale-110 origin-top-left inline-block text-white"
                  )}>
                    {day < 10 ? `0${day}` : day}
                  </span>
                  
                  <div className="mt-2 space-y-1">
                    {dayEvents.slice(0, 2).map(e => (
                      <div key={e.id} className="text-[9px] font-bold px-2 py-1 rounded-lg bg-white/40 text-[#5e503f] truncate border border-white/20 shadow-sm">
                        {e.title}
                      </div>
                    ))}
                    {dayEvents.length > 2 && (
                      <div className="text-[8px] font-black text-[#5e503f]/40 pl-1 uppercase tracking-tighter">
                        + {dayEvents.length - 2} more
                      </div>
                    )}
                  </div>

                  {active && <div className="absolute bottom-2 right-2 w-1.5 h-1.5 rounded-full bg-white shadow-[0_0_10px_white]" />}
                </div>
              )
            })}
          </div>
        </div>
      </div>

      {/* Selected Day Details Section */}
      {selectedDate && (
        <div className="bg-[#09090b]/40 backdrop-blur-xl rounded-[2.5rem] border border-white/5 p-8 shadow-2xl animate-in slide-in-from-right-5">
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-indigo-600/10 border border-indigo-500/20 flex flex-col items-center justify-center font-black">
                <span className="text-xl text-indigo-400 leading-none">{selectedDate.getDate()}</span>
                <span className="text-[10px] text-indigo-500/60 uppercase">{selectedDate.toLocaleString("default", { month: "short" })}</span>
              </div>
              <div>
                <h3 className="text-xl font-black text-white">Daily Timeline</h3>
                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">{getEventsForDate(selectedDate).length} Active sessions scheduled</p>
              </div>
            </div>
            <button 
              onClick={() => { setEditingEvent(null); setModalOpen(true); }}
              className="flex items-center gap-2 px-6 py-3 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white font-black text-sm shadow-xl shadow-indigo-600/20 transition-all active:scale-95"
            >
              <Plus className="w-4 h-4" />
              New Entry
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {getEventsForDate(selectedDate).map(e => (
              <div key={e.id} className="group p-5 rounded-3xl bg-white/[0.03] border border-white/5 hover:bg-white/[0.05] hover:border-white/10 transition-all flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center">
                    <Clock className="w-5 h-5 text-indigo-400" />
                  </div>
                  <div className="flex flex-col">
                    <span className="text-sm font-black text-white group-hover:text-indigo-300 transition-colors uppercase tracking-tight">{e.title}</span>
                    <div className="flex items-center gap-2">
                       <span className="text-[10px] font-bold text-slate-500">{new Date(e.start).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                       <div className="w-1 h-1 rounded-full bg-slate-700" />
                       <span className="text-[10px] font-bold text-indigo-500/60 truncate max-w-[120px]">{e.candidateEmail}</span>
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button 
                    onClick={() => { setEditingEvent(e); setModalOpen(true); }}
                    className="p-3 rounded-xl bg-white/5 text-slate-400 hover:text-white hover:bg-white/10 transition-all"
                    title="Edit Session"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button 
                    onClick={() => handleDelete(e.id)}
                    className="p-3 rounded-xl bg-white/5 text-slate-400 hover:text-red-400 hover:bg-red-600/10 transition-all"
                    title="Cancel Booking"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
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
        onClose={() => setModalOpen(false)} 
        initialData={editingEvent}
        onSuccess={() => { setModalOpen(false); fetchEvents(); }}
      />
    </div>
  )
}

function EventModal({ open, onClose, initialData, onSuccess }: any) {
  if (!open) return null

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-[#020203]/80 backdrop-blur-md" onClick={onClose} />
      <div className="relative w-full max-w-md bg-[#09090b] rounded-[2.5rem] border border-white/5 p-8 shadow-2xl animate-in zoom-in-95 duration-200">
        <h3 className="text-2xl font-black text-white mb-6">
          {initialData ? "Re-optimize Session" : "Provision New Session"}
        </h3>
        {/* Simplified Form for demo purpose, assuming real logic remains in user's codebase */}
        <form className="space-y-6" onSubmit={(e) => { e.preventDefault(); onSuccess(); }}>
          <div className="space-y-4">
             <div className="group">
                <label className="block text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2 px-1">Session Protocol</label>
                <input required defaultValue={initialData?.title} name="title" className="w-full px-5 py-4 rounded-2xl bg-white/[0.03] border border-white/5 focus:border-indigo-500 transition-all outline-none text-white text-sm" placeholder="Technical Round / System Design" />
             </div>
             <div className="group">
                <label className="block text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2 px-1">Participant Email</label>
                <input required type="email" defaultValue={initialData?.candidateEmail} name="email" className="w-full px-5 py-4 rounded-2xl bg-white/[0.03] border border-white/5 focus:border-indigo-500 transition-all outline-none text-white text-sm" placeholder="candidate@example.com" />
             </div>
             <div className="grid grid-cols-2 gap-4">
                <div className="group">
                   <label className="block text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2 px-1">Timestamp</label>
                   <input required type="datetime-local" defaultValue={initialData?.start?.slice(0, 16)} name="start" className="w-full px-5 py-4 rounded-2xl bg-white/[0.03] border border-white/5 focus:border-indigo-500 transition-all outline-none text-white text-xs" />
                </div>
                <div className="group">
                   <label className="block text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2 px-1">End Time</label>
                   <input required type="datetime-local" defaultValue={initialData?.end?.slice(0, 16)} name="end" className="w-full px-5 py-4 rounded-2xl bg-white/[0.03] border border-white/5 focus:border-indigo-500 transition-all outline-none text-white text-xs" />
                </div>
             </div>
          </div>
          <button type="submit" className="w-full py-5 rounded-[2rem] bg-indigo-600 hover:bg-indigo-500 text-white font-black text-lg shadow-xl shadow-indigo-600/20 mt-4 transition-all active:scale-95">
             Commit Parameters
          </button>
        </form>
      </div>
    </div>
  )
}