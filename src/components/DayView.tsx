import { format, getHours, getMinutes } from "date-fns";

import { cn } from "../lib/utils";
import type { CalendarOccurrence, DayViewProps } from "../types/calendar";

const HOUR_HEIGHT = 60;
const HOURS = Array.from({ length: 24 }, (_, i) => i);

interface TimeGridEvent extends CalendarOccurrence {
  top: number;
  height: number;
}

function calculateEventPosition(event: CalendarOccurrence): TimeGridEvent {
  const eventStart = new Date(event.start);
  const eventEnd = new Date(event.end);

  // Calculate position within the day
  const startHours = getHours(eventStart) + getMinutes(eventStart) / 60;
  const endHours = getHours(eventEnd) + getMinutes(eventEnd) / 60;
  const height = Math.max((endHours - startHours) * HOUR_HEIGHT, 20);
  const top = startHours * HOUR_HEIGHT;

  return {
    ...event,
    top,
    height,
  };
}

export function DayView({
  date,
  events,
  locale,
  renderEvent,
  renderTimeSlot,
  onEventSelect,
}: DayViewProps) {
  // Separate all-day events from timed events
  const allDayEvents = events.filter((event) => event.allDay);
  const timedEvents = events.filter((event) => !event.allDay);
  const timeGridEvents = timedEvents.map(calculateEventPosition);

  return (
    <div className="eec-day-view">
      <div className="eec-day-header">
        <div className="eec-day-title">
          <h2>{format(date, "EEEE", { locale })}</h2>
          <p>{format(date, "MMMM d, yyyy", { locale })}</p>
        </div>
      </div>

      {allDayEvents.length > 0 && (
        <div className="eec-day-all-day-section">
          <div className="eec-day-all-day-label">All day</div>
          <div className="eec-day-all-day-events">
            {allDayEvents.map((event) => (
              <button
                key={event.occurrenceId}
                className={cn("eec-day-all-day-event")}
                style={{
                  backgroundColor: event.color
                    ? `color-mix(in srgb, ${event.color} 30%, var(--eec-background))`
                    : undefined,
                  borderColor: event.color || undefined,
                }}
                onClick={() => onEventSelect?.(event)}
                type="button"
              >
                {renderEvent ? (
                  renderEvent(event)
                ) : (
                  <>
                    <div className="eec-day-event-title">{event.title}</div>
                    {event.location && (
                      <div className="eec-day-event-location">
                        {event.location}
                      </div>
                    )}
                  </>
                )}
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="eec-day-grid">
        <div className="eec-day-times">
          {HOURS.map((hour) => (
            <div key={hour} className="eec-day-time-slot">
              <div className="eec-day-time-label">
                {format(new Date(2000, 0, 1, hour), "ha")}
              </div>
            </div>
          ))}
        </div>

        <div className="eec-day-column">
          {HOURS.map((hour) => (
            <div
              key={hour}
              className="eec-day-hour-cell"
              style={{ height: `${HOUR_HEIGHT}px` }}
            />
          ))}

          <div className="eec-day-events">
            {timeGridEvents.map((event) => (
              <button
                key={event.occurrenceId}
                className="eec-day-event"
                style={
                  {
                    top: `${event.top}px`,
                    height: `${event.height}px`,
                    backgroundColor: event.color
                      ? `color-mix(in srgb, ${event.color} 30%, var(--eec-background))`
                      : undefined,
                    borderColor: event.color || undefined,
                    "--eec-event-accent": event.color || "var(--eec-accent)",
                  } as React.CSSProperties
                }
                onClick={() => onEventSelect?.(event)}
                type="button"
              >
                {renderEvent ? (
                  renderEvent(event)
                ) : (
                  <>
                    <div className="eec-day-event-time">
                      {format(event.start, "h:mm a")} –{" "}
                      {format(event.end, "h:mm a")}
                    </div>
                    <div className="eec-day-event-title">{event.title}</div>
                    {event.location && (
                      <div className="eec-day-event-location">
                        {event.location}
                      </div>
                    )}
                  </>
                )}
              </button>
            ))}
          </div>
        </div>
      </div>

      {allDayEvents.length === 0 && timedEvents.length === 0 && (
        <div className="eec-day-empty">
          <p>No events scheduled for this day</p>
        </div>
      )}
    </div>
  );
}
