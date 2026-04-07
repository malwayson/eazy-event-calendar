import {
  addDays,
  addMonths,
  addWeeks,
  addYears,
  format,
  setDay,
  setHours,
  setMilliseconds,
  setMinutes,
  setSeconds,
  startOfWeek,
} from "date-fns";

import type {
  CalendarDateRange,
  CalendarEvent,
  CalendarOccurrence,
  CalendarRecurrenceRule,
} from "../types/calendar";
import { toDate, unique } from "./utils";

function overlapsRange(
  start: Date,
  end: Date,
  range: CalendarDateRange,
): boolean {
  return start <= range.end && end >= range.start;
}

function withTime(target: Date, source: Date): Date {
  return setMilliseconds(
    setSeconds(
      setMinutes(setHours(target, source.getHours()), source.getMinutes()),
      source.getSeconds(),
    ),
    source.getMilliseconds(),
  );
}

function advanceDate(date: Date, rule: CalendarRecurrenceRule): Date {
  const interval = rule.interval ?? 1;

  switch (rule.frequency) {
    case "daily":
      return addDays(date, interval);
    case "weekly":
      return addWeeks(date, interval);
    case "yearly":
      return addYears(date, interval);
    case "monthly":
    default:
      return addMonths(date, interval);
  }
}

function createOccurrence(
  event: CalendarEvent,
  start: Date,
  end: Date,
  index: number,
): CalendarOccurrence {
  return {
    ...event,
    occurrenceId: `${event.id}:${start.toISOString()}:${index}`,
    sourceEventId: event.id,
    start,
    end,
  };
}

function sortOccurrences(events: CalendarOccurrence[]): CalendarOccurrence[] {
  return [...events].sort(
    (left, right) => left.start.getTime() - right.start.getTime(),
  );
}

function expandWeeklyByWeekday(
  event: CalendarEvent,
  range: CalendarDateRange,
  rule: CalendarRecurrenceRule,
  baseStart: Date,
  baseEnd: Date,
): CalendarOccurrence[] {
  const duration = Math.max(baseEnd.getTime() - baseStart.getTime(), 0);
  const until = rule.until ? toDate(rule.until) : undefined;
  const weekdays = unique(
    (rule.byWeekday ?? []).slice().sort((left, right) => left - right),
  );
  const results: CalendarOccurrence[] = [];
  let generated = 0;
  let weekCursor = startOfWeek(baseStart, { weekStartsOn: 0 });

  while (weekCursor <= range.end) {
    for (const weekday of weekdays) {
      const occurrenceStart = withTime(
        setDay(weekCursor, weekday, { weekStartsOn: 0 }),
        baseStart,
      );

      if (occurrenceStart < baseStart) {
        continue;
      }

      if (until && occurrenceStart > until) {
        return sortOccurrences(results);
      }

      generated += 1;

      if (rule.count && generated > rule.count) {
        return sortOccurrences(results);
      }

      const occurrenceEnd = new Date(occurrenceStart.getTime() + duration);

      if (overlapsRange(occurrenceStart, occurrenceEnd, range)) {
        results.push(
          createOccurrence(event, occurrenceStart, occurrenceEnd, generated),
        );
      }
    }

    weekCursor = addWeeks(weekCursor, rule.interval ?? 1);
  }

  return sortOccurrences(results);
}

function expandRecurringEvent(
  event: CalendarEvent,
  range: CalendarDateRange,
): CalendarOccurrence[] {
  const baseStart = toDate(event.start);
  const baseEnd = toDate(event.end);
  const safeEnd = baseEnd >= baseStart ? baseEnd : baseStart;
  const rule = event.recurrence;

  if (!rule) {
    return overlapsRange(baseStart, safeEnd, range)
      ? [createOccurrence(event, baseStart, safeEnd, 0)]
      : [];
  }

  if (rule.frequency === "weekly" && rule.byWeekday?.length) {
    return expandWeeklyByWeekday(event, range, rule, baseStart, safeEnd);
  }

  const results: CalendarOccurrence[] = [];
  const duration = Math.max(safeEnd.getTime() - baseStart.getTime(), 0);
  const until = rule.until ? toDate(rule.until) : undefined;
  let occurrenceStart = baseStart;
  let generated = 0;

  while (occurrenceStart <= range.end) {
    if (until && occurrenceStart > until) {
      break;
    }

    generated += 1;

    if (rule.count && generated > rule.count) {
      break;
    }

    const occurrenceEnd = new Date(occurrenceStart.getTime() + duration);

    if (overlapsRange(occurrenceStart, occurrenceEnd, range)) {
      results.push(
        createOccurrence(event, occurrenceStart, occurrenceEnd, generated),
      );
    }

    occurrenceStart = advanceDate(occurrenceStart, rule);
  }

  return sortOccurrences(results);
}

export function expandEventsForRange(
  events: CalendarEvent[],
  range: CalendarDateRange,
): CalendarOccurrence[] {
  return sortOccurrences(
    events.flatMap((event) => expandRecurringEvent(event, range)),
  );
}

export function filterOccurrences(
  events: CalendarOccurrence[],
  searchValue: string,
  activeColors: string[],
): CalendarOccurrence[] {
  const query = searchValue.trim().toLowerCase();
  const colorSet = new Set(activeColors);

  return events.filter((event) => {
    const matchesSearch =
      query.length === 0 ||
      [event.title, event.description, event.location]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(query));

    const matchesColor =
      colorSet.size === 0 || (!!event.color && colorSet.has(event.color));
    return matchesSearch && matchesColor;
  });
}

export function mergeEvents(
  localEvents: CalendarEvent[],
  remoteEvents: CalendarEvent[],
): CalendarEvent[] {
  const byId = new Map<string, CalendarEvent>();

  for (const event of remoteEvents) {
    byId.set(event.id, event);
  }

  for (const event of localEvents) {
    byId.set(event.id, event);
  }

  return Array.from(byId.values()).sort(
    (left, right) =>
      toDate(left.start).getTime() - toDate(right.start).getTime(),
  );
}

export function deriveColorFilters(events: CalendarEvent[]): string[] {
  return unique(
    events
      .map((event) => event.color)
      .filter((color): color is string => Boolean(color)),
  ).sort();
}

export function getDayKey(date: Date): string {
  return format(date, "yyyy-MM-dd");
}
