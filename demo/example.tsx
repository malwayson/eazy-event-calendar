import { useState } from "react";

import {
  EventCalendar,
  type CalendarEvent,
} from "@malwayson/eazy-event-calendar";
import "@malwayson/eazy-event-calendar/styles.css";

const seededEvents: CalendarEvent[] = [
  {
    id: "launch-review",
    title: "Launch review",
    start: new Date(2026, 3, 8, 10, 0),
    end: new Date(2026, 3, 8, 11, 30),
    color: "#0f766e",
    location: "Studio A",
  },
  {
    id: "design-crit",
    title: "Design crit",
    start: new Date(2026, 3, 11, 15, 0),
    end: new Date(2026, 3, 11, 16, 0),
    color: "#2563eb",
    recurrence: {
      frequency: "weekly",
      interval: 1,
      byWeekday: [2],
    },
  },
];

export function CalendarDemo() {
  const [events, setEvents] = useState(seededEvents);

  return (
    <EventCalendar
      defaultView="month"
      events={events}
      onEventsChange={setEvents}
      onCreate={async (event) => {
        const nextEvent = { ...event, id: `${event.id}-${Date.now()}` };
        setEvents((previousEvents) => [...previousEvents, nextEvent]);
        return nextEvent;
      }}
      onUpdate={async (event) => {
        setEvents((previousEvents) =>
          previousEvents.map((entry) =>
            entry.id === event.id ? event : entry,
          ),
        );
        return event;
      }}
      onDelete={async (event) => {
        setEvents((previousEvents) =>
          previousEvents.filter((entry) => entry.id !== event.id),
        );
      }}
      fetchEvents={async () => events}
    />
  );
}
