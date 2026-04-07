import { addDays, format, getHours, getMinutes, startOfWeek } from "date-fns";

import type { CalendarOccurrence, MonthViewProps } from "../types/calendar";

const HOUR_HEIGHT = 60;
const HOURS = Array.from({ length: 24 }, (_, i) => i);

interface TimeGridEvent extends CalendarOccurrence {
  top: number;
  height: number;
  column: number;
  columnSpan: number;
}

function calculateEventPosition(
  event: CalendarOccurrence,
  weekStart: Date,
  weekEnd: Date,
): TimeGridEvent | null {
  const eventStart = new Date(event.start);
  const eventEnd = new Date(event.end);

  // Skip events outside the week
  if (eventStart > weekEnd || eventEnd < weekStart) {
    return null;
  }

  // Get the day index (0-6)
  const dayDiff = eventStart.getTime() - weekStart.getTime();
  const column = Math.floor(dayDiff / (1000 * 60 * 60 * 24));

  if (column < 0 || column >= 7) {
    return null;
  }

  // Calculate position within the day
  const startHours = getHours(eventStart) + getMinutes(eventStart) / 60;
  const endHours = getHours(eventEnd) + getMinutes(eventEnd) / 60;
  const height = Math.max((endHours - startHours) * HOUR_HEIGHT, 20);
  const top = startHours * HOUR_HEIGHT;

  return {
    ...event,
    top,
    height,
    column,
    columnSpan: 1,
  };
}

export function WeekView({
  date,
  events,
  locale,
  onEventSelect,
}: Omit<
  MonthViewProps,
  | "weekStartsOn"
  | "selectedDate"
  | "maxVisibleEvents"
  | "renderDayHeader"
  | "renderEvent"
  | "onDateSelect"
  | "onDayCreate"
> & {
  weekStartsOn?: 0 | 1 | 2 | 3 | 4 | 5 | 6;
}) {
  const weekStart = startOfWeek(date, { weekStartsOn: 0 });
  const weekEnd = addDays(weekStart, 6);
  const days = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));

  const timeGridEvents: TimeGridEvent[] = events
    .map((event) =>
      calculateEventPosition(event, weekStart, addDays(weekEnd, 1)),
    )
    .filter((event): event is TimeGridEvent => event !== null);

  // Group events by column to handle overlaps
  const eventsByColumn = new Map<number, TimeGridEvent[]>();
  for (const event of timeGridEvents) {
    if (!eventsByColumn.has(event.column)) {
      eventsByColumn.set(event.column, []);
    }
    eventsByColumn.get(event.column)!.push(event);
  }

  return (
    <div className="eec-week-view">
      <div className="eec-week-header">
        <div className="eec-week-time-cell" />
        {days.map((day) => (
          <div key={day.toISOString()} className="eec-week-day-header">
            <div className="eec-week-day-label">
              {format(day, "EEE").toUpperCase()}
            </div>
            <div className="eec-week-date">{format(day, "d")}</div>
          </div>
        ))}
      </div>

      <div className="eec-week-grid">
        <div className="eec-week-times">
          {HOURS.map((hour) => (
            <div key={hour} className="eec-week-time-slot">
              <div className="eec-week-time-label">
                {format(new Date(2000, 0, 1, hour), "ha")}
              </div>
            </div>
          ))}
        </div>

        <div className="eec-week-days">
          {days.map((day, dayIndex) => (
            <div key={day.toISOString()} className="eec-week-day-column">
              {HOURS.map((hour) => (
                <div
                  key={`${dayIndex}-${hour}`}
                  className="eec-week-hour-cell"
                  style={{ height: `${HOUR_HEIGHT}px` }}
                />
              ))}

              <div className="eec-week-events">
                {(eventsByColumn.get(dayIndex) || []).map((event) => (
                  <button
                    key={event.occurrenceId}
                    className="eec-week-event"
                    style={
                      {
                        top: `${event.top}px`,
                        height: `${event.height}px`,
                        backgroundColor: event.color
                          ? `color-mix(in srgb, ${event.color} 30%, var(--eec-background))`
                          : undefined,
                        borderColor: event.color || undefined,
                        "--eec-event-accent":
                          event.color || "var(--eec-accent)",
                      } as React.CSSProperties
                    }
                    onClick={() => onEventSelect?.(event)}
                    type="button"
                  >
                    <div className="eec-week-event-time">
                      {format(event.start, "h:mm a")}
                    </div>
                    <div className="eec-week-event-title">{event.title}</div>
                    {event.location && (
                      <div className="eec-week-event-location">
                        {event.location}
                      </div>
                    )}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
