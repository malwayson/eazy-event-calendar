import { format, isSameDay, isSameMonth, isToday, startOfDay } from "date-fns";

import { getMonthGrid, getWeekdayLabels } from "../lib/date";
import { getDayKey } from "../lib/events";
import { cn } from "../lib/utils";
import type { CalendarOccurrence, MonthViewProps } from "../types/calendar";

function getEventsForDay(
  events: CalendarOccurrence[],
  date: Date,
): CalendarOccurrence[] {
  const dayStart = startOfDay(date).getTime();
  return events.filter(
    (event) =>
      event.start.getTime() <= dayStart + 86_399_999 &&
      event.end.getTime() >= dayStart,
  );
}

export function MonthView({
  date,
  selectedDate,
  events,
  weekStartsOn = 0,
  locale,
  maxVisibleEvents = 3,
  className,
  renderDayHeader,
  renderEvent,
  onDateSelect,
  onDayCreate,
  onEventSelect,
}: MonthViewProps) {
  const days = getMonthGrid(date, weekStartsOn);
  const weekdayLabels = getWeekdayLabels(weekStartsOn, locale);
  const dayEvents = new Map<string, CalendarOccurrence[]>();

  for (const day of days) {
    dayEvents.set(getDayKey(day), getEventsForDay(events, day));
  }

  return (
    <div className={cn("eec-month-view", className)}>
      <div className="eec-month-header" role="row">
        {weekdayLabels.map((label) => (
          <div
            key={label}
            className="eec-month-header-cell"
            role="columnheader"
          >
            {label}
          </div>
        ))}
      </div>

      <div
        className="eec-month-grid"
        role="grid"
        aria-label={format(date, "MMMM yyyy", { locale })}
      >
        {days.map((day) => {
          const key = getDayKey(day);
          const eventsForDay = dayEvents.get(key) ?? [];
          const isCurrentMonth = isSameMonth(day, date);
          const isSelected = selectedDate
            ? isSameDay(day, selectedDate)
            : false;

          return (
            <div
              key={key}
              role="gridcell"
              aria-selected={isSelected}
              className={cn(
                "eec-day-cell",
                !isCurrentMonth && "eec-day-cell--outside",
                isToday(day) && "eec-day-cell--today",
                isSelected && "eec-day-cell--selected",
              )}
              onDoubleClick={() => onDayCreate?.(day)}
            >
              <button
                type="button"
                className="eec-day-trigger"
                onClick={() => onDateSelect?.(day)}
                aria-pressed={isSelected}
              >
                <span className="eec-day-number">
                  {renderDayHeader ? renderDayHeader(day) : format(day, "d")}
                </span>
              </button>

              <ul
                className="eec-day-events"
                aria-label={`Events for ${format(day, "PPP", { locale })}`}
              >
                {eventsForDay.slice(0, maxVisibleEvents).map((event) => (
                  <li key={event.occurrenceId}>
                    <button
                      type="button"
                      className="eec-event-chip"
                      style={
                        event.color
                          ? ({
                              "--eec-event-accent": event.color,
                            } as React.CSSProperties)
                          : undefined
                      }
                      onClick={() => onEventSelect?.(event)}
                    >
                      {renderEvent ? renderEvent(event) : event.title}
                    </button>
                  </li>
                ))}

                {eventsForDay.length > maxVisibleEvents ? (
                  <li className="eec-event-overflow">
                    +{eventsForDay.length - maxVisibleEvents} more
                  </li>
                ) : null}
              </ul>
            </div>
          );
        })}
      </div>
    </div>
  );
}
