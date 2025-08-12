import { useEffect, useState } from "react";

type Event = { id: string; title: string; start: string; end?: string };

export function useCalendar() {
  const [events, setEvents] = useState<Event[]>([]);
  useEffect(() => {
    fetch("/api/events").then(r => r.json()).then(setEvents).catch(() => setEvents([]));
  }, []);
  return { events, setEvents };
}
