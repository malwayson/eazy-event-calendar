import { cva } from "class-variance-authority";
import {
  eachDayOfInterval,
  eachMonthOfInterval,
  endOfMonth,
  format,
  isSameDay,
  isSameMonth,
  startOfDay,
  startOfYear,
} from "date-fns";
import { useEffect, useMemo, useState } from "react";

import { useCalendarNavigation } from "../hooks/useCalendarNavigation";
import { useControllableState } from "../hooks/useControllableState";
import { getRangeForView, getViewLabel } from "../lib/date";
import {
  deriveColorFilters,
  expandEventsForRange,
  filterOccurrences,
  getDayKey,
  mergeEvents,
} from "../lib/events";
import { cn } from "../lib/utils";
import type {
  CalendarEvent,
  CalendarOccurrence,
  CalendarView,
  EventCalendarProps,
} from "../types/calendar";
import { DayView } from "./DayView";
import { EventEditorDialog } from "./EventEditorDialog";
import { MonthView } from "./MonthView";
import { WeekView } from "./WeekView";

const toolbarButton = cva("eec-button", {
  variants: {
    emphasis: {
      default: "",
      ghost: "eec-button--ghost",
      selected: "eec-button--selected",
    },
  },
  defaultVariants: {
    emphasis: "default",
  },
});

const viewOptions: CalendarView[] = ["month", "week", "day", "year", "list"];

interface DialogState {
  open: boolean;
  mode: "create" | "edit";
  event?: CalendarEvent;
  defaultStartDate?: Date;
}

function upsertEvent(
  events: CalendarEvent[],
  nextEvent: CalendarEvent,
): CalendarEvent[] {
  const exists = events.some((event) => event.id === nextEvent.id);
  return exists
    ? events.map((event) => (event.id === nextEvent.id ? nextEvent : event))
    : [...events, nextEvent];
}

function removeEvent(
  events: CalendarEvent[],
  eventId: string,
): CalendarEvent[] {
  return events.filter((event) => event.id !== eventId);
}

function findSourceEvent(
  events: CalendarEvent[],
  occurrence: CalendarOccurrence,
): CalendarEvent | undefined {
  return events.find((event) => event.id === occurrence.sourceEventId);
}

function groupEventsByDay(
  events: CalendarOccurrence[],
): Map<string, CalendarOccurrence[]> {
  const groups = new Map<string, CalendarOccurrence[]>();

  for (const event of events) {
    const key = getDayKey(event.start);
    groups.set(key, [...(groups.get(key) ?? []), event]);
  }

  return groups;
}

function YearSummary({
  date,
  events,
}: {
  date: Date;
  events: CalendarOccurrence[];
}) {
  const yearStart = startOfYear(date);
  const months = eachMonthOfInterval({
    start: yearStart,
    end: endOfMonth(new Date(yearStart.getFullYear(), 11, 1)),
  });

  return (
    <div className="eec-year-grid">
      {months.map((month) => {
        const monthEvents = events.filter((event) =>
          isSameMonth(event.start, month),
        );

        return (
          <section key={month.toISOString()} className="eec-summary-card">
            <header className="eec-summary-card-header">
              <h3>{format(month, "MMMM")}</h3>
              <span>{monthEvents.length} events</span>
            </header>
            <ul className="eec-summary-list">
              {monthEvents.slice(0, 4).map((event) => (
                <li key={event.occurrenceId}>{event.title}</li>
              ))}
              {monthEvents.length === 0 ? <li>No events</li> : null}
            </ul>
          </section>
        );
      })}
    </div>
  );
}

function AgendaSection({
  title,
  events,
}: {
  title: string;
  events: CalendarOccurrence[];
}) {
  return (
    <section className="eec-summary-card">
      <header className="eec-summary-card-header">
        <h3>{title}</h3>
        <span>{events.length} events</span>
      </header>

      <ul className="eec-summary-list">
        {events.map((event) => (
          <li key={event.occurrenceId} className="eec-summary-list-item">
            <strong>{event.title}</strong>
            <span>
              {format(event.start, event.allDay ? "MMM d" : "MMM d, p")}
            </span>
          </li>
        ))}

        {events.length === 0 ? <li>No events scheduled.</li> : null}
      </ul>
    </section>
  );
}

export function EventCalendar({
  events,
  defaultEvents = [],
  currentDate,
  defaultDate = new Date(),
  view,
  defaultView = "month",
  searchValue,
  defaultSearchValue = "",
  activeColorFilters,
  defaultColorFilters = [],
  weekStartsOn = 0,
  locale,
  className,
  animated = true,
  showToolbar = true,
  showSearch = true,
  showFilters = true,
  showEventDialog = true,
  allowEventCreation = true,
  allowEventEditing = true,
  allowEventDeletion = true,
  messages,
  onDateChange,
  onViewChange,
  onSearchValueChange,
  onActiveColorFiltersChange,
  onEventsChange,
  fetchEvents,
  onCreate,
  onUpdate,
  onDelete,
}: EventCalendarProps) {
  const [calendarDate, setCalendarDate] = useControllableState({
    value: currentDate,
    defaultValue: defaultDate,
    onChange: onDateChange,
  });
  const [calendarView, setCalendarView] = useControllableState({
    value: view,
    defaultValue: defaultView,
    onChange: onViewChange,
  });
  const [managedEvents, setManagedEvents] = useControllableState({
    value: events,
    defaultValue: defaultEvents,
    onChange: onEventsChange,
  });
  const [search, setSearch] = useControllableState({
    value: searchValue,
    defaultValue: defaultSearchValue,
    onChange: onSearchValueChange,
  });
  const [colorFilters, setColorFilters] = useControllableState({
    value: activeColorFilters,
    defaultValue: defaultColorFilters,
    onChange: onActiveColorFiltersChange,
  });
  const [remoteEvents, setRemoteEvents] = useState<CalendarEvent[]>([]);
  const [dialogState, setDialogState] = useState<DialogState>({
    open: false,
    mode: "create",
  });

  const range = useMemo(
    () => getRangeForView(calendarDate, calendarView, weekStartsOn),
    [calendarDate, calendarView, weekStartsOn],
  );

  useEffect(() => {
    let mounted = true;

    async function loadEvents() {
      if (!fetchEvents) {
        return;
      }

      const nextEvents = await fetchEvents({
        range,
        view: calendarView,
      });

      if (mounted) {
        setRemoteEvents(nextEvents);
      }
    }

    void loadEvents();

    return () => {
      mounted = false;
    };
  }, [calendarView, fetchEvents, range]);

  const navigation = useCalendarNavigation({
    date: calendarDate,
    view: calendarView,
    weekStartsOn,
    onDateChange: setCalendarDate,
    onViewChange: setCalendarView,
  });

  const allEvents = useMemo(
    () => mergeEvents(managedEvents, remoteEvents),
    [managedEvents, remoteEvents],
  );
  const palette = useMemo(() => deriveColorFilters(allEvents), [allEvents]);
  const visibleEvents = useMemo(() => {
    const expanded = expandEventsForRange(allEvents, range);
    return filterOccurrences(expanded, search, colorFilters);
  }, [allEvents, colorFilters, range, search]);

  const groupedVisibleEvents = useMemo(
    () => groupEventsByDay(visibleEvents),
    [visibleEvents],
  );

  async function commitCreate(nextEvent: CalendarEvent) {
    const createdEvent = (await onCreate?.(nextEvent)) ?? nextEvent;
    setManagedEvents((previousEvents) =>
      upsertEvent(previousEvents, createdEvent),
    );
  }

  async function commitUpdate(nextEvent: CalendarEvent) {
    const updatedEvent = (await onUpdate?.(nextEvent)) ?? nextEvent;
    setManagedEvents((previousEvents) =>
      upsertEvent(previousEvents, updatedEvent),
    );
  }

  async function commitDelete(nextEvent: CalendarEvent) {
    await onDelete?.(nextEvent);
    setManagedEvents((previousEvents) =>
      removeEvent(previousEvents, nextEvent.id),
    );
  }

  const summaryContent = useMemo(() => {
    if (calendarView === "year") {
      return <YearSummary date={calendarDate} events={visibleEvents} />;
    }

    if (calendarView === "day") {
      const title = format(calendarDate, "EEEE, MMMM d", { locale });
      return (
        <AgendaSection
          title={title}
          events={visibleEvents.filter((event) =>
            isSameDay(event.start, calendarDate),
          )}
        />
      );
    }

    const days = eachDayOfInterval({ start: range.start, end: range.end });

    return (
      <div className="eec-agenda-grid">
        {days.map((day) => {
          const dayEvents = groupedVisibleEvents.get(getDayKey(day)) ?? [];
          return (
            <AgendaSection
              key={day.toISOString()}
              title={format(day, "EEE, MMM d", { locale })}
              events={dayEvents}
            />
          );
        })}
      </div>
    );
  }, [
    calendarDate,
    calendarView,
    groupedVisibleEvents,
    locale,
    range.end,
    range.start,
    visibleEvents,
  ]);

  return (
    <section
      className={cn(
        "eec-calendar",
        animated && "eec-calendar--animated",
        className,
      )}
      onKeyDown={navigation.handleKeyDown}
      tabIndex={0}
      aria-label="Event calendar"
    >
      {showToolbar ? (
        <header className="eec-toolbar eec-toolbar--new">
          <div className="eec-toolbar-left">
            <button
              type="button"
              className={toolbarButton({ emphasis: "ghost" })}
              onClick={navigation.goToToday}
              title="Go to today"
            >
              {messages?.todayLabel ?? "Today"}
            </button>

            <div className="eec-toolbar-nav">
              <button
                type="button"
                className="eec-toolbar-icon-button"
                onClick={navigation.goToPrevious}
                aria-label="Previous"
              >
                ‹
              </button>
              <button
                type="button"
                className="eec-toolbar-icon-button"
                onClick={navigation.goToNext}
                aria-label="Next"
              >
                ›
              </button>
            </div>
          </div>

          <div className="eec-toolbar-heading">
            <h2>{getViewLabel(calendarDate, calendarView, locale)}</h2>
          </div>

          <div className="eec-toolbar-right">
            <select
              className="eec-toolbar-select"
              value={calendarView}
              onChange={(e) => setCalendarView(e.target.value as CalendarView)}
              aria-label="Calendar view"
            >
              {viewOptions.map((option) => (
                <option key={option} value={option}>
                  {option.charAt(0).toUpperCase() + option.slice(1)}
                </option>
              ))}
            </select>

            <input
              type="date"
              className="eec-toolbar-date-input"
              value={format(calendarDate, "yyyy-MM-dd")}
              onChange={(e) => {
                const date = new Date(e.target.value);
                if (!isNaN(date.getTime())) {
                  setCalendarDate(date);
                }
              }}
              aria-label="Select date"
            />

            {allowEventCreation && showEventDialog ? (
              <button
                type="button"
                className={toolbarButton({ emphasis: "default" })}
                onClick={() =>
                  setDialogState({
                    open: true,
                    mode: "create",
                    defaultStartDate: calendarDate,
                  })
                }
              >
                {messages?.createLabel ?? "New event"}
              </button>
            ) : null}
          </div>
        </header>
      ) : null}

      {(showSearch || showFilters) && (
        <div className="eec-toolbar eec-toolbar--secondary">
          {showSearch ? (
            <label className="eec-search">
              <span className="eec-search-label">Search events</span>
              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                className="eec-input"
                placeholder={
                  messages?.searchPlaceholder ??
                  "Search by title, location, or notes"
                }
              />
            </label>
          ) : null}

          {showFilters && palette.length > 0 ? (
            <div
              className="eec-filter-group"
              aria-label="Filter events by color"
            >
              {palette.map((color) => {
                const active = colorFilters.includes(color);

                return (
                  <button
                    key={color}
                    type="button"
                    className={toolbarButton({
                      emphasis: active ? "selected" : "ghost",
                    })}
                    onClick={() => {
                      setColorFilters((previousColors) =>
                        previousColors.includes(color)
                          ? previousColors.filter((value) => value !== color)
                          : [...previousColors, color],
                      );
                    }}
                  >
                    <span
                      className="eec-color-dot"
                      style={{ backgroundColor: color }}
                    />
                    {color}
                  </button>
                );
              })}
            </div>
          ) : null}
        </div>
      )}

      <div className="eec-content">
        {calendarView === "month" ? (
          <MonthView
            date={calendarDate}
            selectedDate={calendarDate}
            events={visibleEvents}
            weekStartsOn={weekStartsOn}
            locale={locale}
            onDateSelect={setCalendarDate}
            onDayCreate={
              allowEventCreation && showEventDialog
                ? (date) =>
                    setDialogState({
                      open: true,
                      mode: "create",
                      defaultStartDate: startOfDay(date),
                    })
                : undefined
            }
            onEventSelect={
              allowEventEditing && showEventDialog
                ? (occurrence) => {
                    const sourceEvent = findSourceEvent(allEvents, occurrence);

                    if (sourceEvent) {
                      setDialogState({
                        open: true,
                        mode: "edit",
                        event: sourceEvent,
                      });
                    }
                  }
                : undefined
            }
          />
        ) : calendarView === "week" ? (
          <WeekView
            date={calendarDate}
            events={visibleEvents}
            locale={locale}
            onEventSelect={
              allowEventEditing && showEventDialog
                ? (occurrence) => {
                    const sourceEvent = findSourceEvent(allEvents, occurrence);

                    if (sourceEvent) {
                      setDialogState({
                        open: true,
                        mode: "edit",
                        event: sourceEvent,
                      });
                    }
                  }
                : undefined
            }
          />
        ) : calendarView === "day" ? (
          <DayView
            date={calendarDate}
            events={visibleEvents}
            locale={locale}
            onEventSelect={
              allowEventEditing && showEventDialog
                ? (occurrence) => {
                    const sourceEvent = findSourceEvent(allEvents, occurrence);

                    if (sourceEvent) {
                      setDialogState({
                        open: true,
                        mode: "edit",
                        event: sourceEvent,
                      });
                    }
                  }
                : undefined
            }
          />
        ) : (
          summaryContent
        )}

        {visibleEvents.length === 0 ? (
          <div className="eec-empty-state">
            <h3>{messages?.emptyStateTitle ?? "No matching events"}</h3>
            <p>
              {messages?.emptyStateDescription ??
                "Adjust your date range, search query, or filters to reveal upcoming events."}
            </p>
          </div>
        ) : null}
      </div>

      {showEventDialog ? (
        <EventEditorDialog
          open={dialogState.open}
          mode={dialogState.mode}
          event={dialogState.event}
          defaultStartDate={dialogState.defaultStartDate}
          canDelete={allowEventDeletion}
          onOpenChange={(open) =>
            setDialogState((previousState) => ({ ...previousState, open }))
          }
          onSubmit={async (event) => {
            if (dialogState.mode === "create") {
              await commitCreate(event);
              return;
            }

            await commitUpdate(event);
          }}
          onDelete={
            allowEventDeletion
              ? async (event) => {
                  await commitDelete(event);
                }
              : undefined
          }
        />
      ) : null}
    </section>
  );
}
