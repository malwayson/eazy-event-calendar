import type { KeyboardEvent as ReactKeyboardEvent } from "react";
import { useCallback } from "react";

import { moveDate } from "../lib/date";
import type {
  CalendarView,
  UseCalendarNavigationOptions,
} from "../types/calendar";

function isInteractiveElement(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) {
    return false;
  }

  return (
    ["INPUT", "TEXTAREA", "SELECT", "BUTTON"].includes(target.tagName) ||
    target.isContentEditable
  );
}

export function useCalendarNavigation({
  date,
  view,
  onDateChange,
  onViewChange,
}: UseCalendarNavigationOptions) {
  const goToPrevious = useCallback(() => {
    onDateChange(moveDate(date, view, -1));
  }, [date, onDateChange, view]);

  const goToNext = useCallback(() => {
    onDateChange(moveDate(date, view, 1));
  }, [date, onDateChange, view]);

  const goToToday = useCallback(() => {
    onDateChange(new Date());
  }, [onDateChange]);

  const setView = useCallback(
    (nextView: CalendarView) => {
      onViewChange?.(nextView);
    },
    [onViewChange],
  );

  const handleKeyDown = useCallback(
    (event: ReactKeyboardEvent<HTMLElement>) => {
      if (
        event.altKey ||
        event.ctrlKey ||
        event.metaKey ||
        isInteractiveElement(event.target)
      ) {
        return;
      }

      const key = event.key.toLowerCase();

      if (key === "arrowleft") {
        event.preventDefault();
        goToPrevious();
        return;
      }

      if (key === "arrowright") {
        event.preventDefault();
        goToNext();
        return;
      }

      if (key === "t") {
        event.preventDefault();
        goToToday();
        return;
      }

      const viewShortcuts: Record<string, CalendarView> = {
        d: "day",
        l: "list",
        m: "month",
        w: "week",
        y: "year",
      };

      const nextView = viewShortcuts[key];

      if (nextView) {
        event.preventDefault();
        setView(nextView);
      }
    },
    [goToNext, goToPrevious, goToToday, setView],
  );

  return {
    goToNext,
    goToPrevious,
    goToToday,
    setView,
    handleKeyDown,
  };
}
