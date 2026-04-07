import type { Locale } from "date-fns";
import {
  addDays,
  addMonths,
  addWeeks,
  addYears,
  endOfDay,
  endOfMonth,
  endOfWeek,
  endOfYear,
  format,
  startOfDay,
  startOfMonth,
  startOfWeek,
  startOfYear,
} from "date-fns";

import type { CalendarDateRange, CalendarView } from "../types/calendar";

export function getRangeForView(
  date: Date,
  view: CalendarView,
  weekStartsOn: 0 | 1 | 2 | 3 | 4 | 5 | 6 = 0,
): CalendarDateRange {
  switch (view) {
    case "day":
      return {
        start: startOfDay(date),
        end: endOfDay(date),
      };
    case "week":
      return {
        start: startOfWeek(date, { weekStartsOn }),
        end: endOfWeek(date, { weekStartsOn }),
      };
    case "year":
      return {
        start: startOfYear(date),
        end: endOfYear(date),
      };
    case "list":
      return {
        start: startOfDay(date),
        end: endOfDay(addDays(date, 30)),
      };
    case "month":
    default:
      return {
        start: startOfWeek(startOfMonth(date), { weekStartsOn }),
        end: endOfWeek(endOfMonth(date), { weekStartsOn }),
      };
  }
}

export function moveDate(date: Date, view: CalendarView, amount: number): Date {
  switch (view) {
    case "day":
      return addDays(date, amount);
    case "week":
      return addWeeks(date, amount);
    case "year":
      return addYears(date, amount);
    case "list":
      return addDays(date, amount * 7);
    case "month":
    default:
      return addMonths(date, amount);
  }
}

export function getViewLabel(
  date: Date,
  view: CalendarView,
  locale?: Locale,
): string {
  switch (view) {
    case "day":
      return format(date, "EEEE, MMMM d, yyyy", { locale });
    case "week":
      return `Week of ${format(date, "MMM d, yyyy", { locale })}`;
    case "year":
      return format(date, "yyyy", { locale });
    case "list":
      return `Agenda from ${format(date, "MMM d, yyyy", { locale })}`;
    case "month":
    default:
      return format(date, "MMMM yyyy", { locale });
  }
}

export function getMonthGrid(
  date: Date,
  weekStartsOn: 0 | 1 | 2 | 3 | 4 | 5 | 6 = 0,
): Date[] {
  const start = startOfWeek(startOfMonth(date), { weekStartsOn });
  const days = Array.from({ length: 42 }, (_, index) => addDays(start, index));
  return days;
}

export function getWeekdayLabels(
  weekStartsOn: 0 | 1 | 2 | 3 | 4 | 5 | 6 = 0,
  locale?: Locale,
): string[] {
  const start = startOfWeek(new Date(), { weekStartsOn });
  return Array.from({ length: 7 }, (_, index) =>
    format(addDays(start, index), "EEE", { locale }),
  );
}
