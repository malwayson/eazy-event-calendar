import type { Locale } from "date-fns";
import type { ReactNode } from "react";

export type DateLike = Date | string | number;
export type MaybePromise<T> = T | Promise<T>;
export type CalendarView = "month" | "week" | "day" | "year" | "list";
export type RecurrenceFrequency = "daily" | "weekly" | "monthly" | "yearly";

export interface CalendarDateRange {
  start: Date;
  end: Date;
}

export interface CalendarRecurrenceRule {
  frequency: RecurrenceFrequency;
  interval?: number;
  count?: number;
  until?: DateLike;
  byWeekday?: number[];
}

export interface CalendarEvent {
  id: string;
  title: string;
  start: DateLike;
  end: DateLike;
  description?: string;
  location?: string;
  color?: string;
  allDay?: boolean;
  disabled?: boolean;
  metadata?: Record<string, unknown>;
  recurrence?: CalendarRecurrenceRule;
}

export interface CalendarOccurrence extends Omit<
  CalendarEvent,
  "start" | "end"
> {
  occurrenceId: string;
  sourceEventId: string;
  start: Date;
  end: Date;
}

export interface CalendarFetchEventsContext {
  range: CalendarDateRange;
  view: CalendarView;
}

export interface UseCalendarNavigationOptions {
  date: Date;
  view: CalendarView;
  weekStartsOn?: 0 | 1 | 2 | 3 | 4 | 5 | 6;
  onDateChange: (date: Date) => void;
  onViewChange?: (view: CalendarView) => void;
}

export interface MonthViewProps {
  date: Date;
  selectedDate?: Date;
  events: CalendarOccurrence[];
  weekStartsOn?: 0 | 1 | 2 | 3 | 4 | 5 | 6;
  locale?: Locale;
  maxVisibleEvents?: number;
  className?: string;
  renderDayHeader?: (date: Date) => ReactNode;
  renderEvent?: (event: CalendarOccurrence) => ReactNode;
  onDateSelect?: (date: Date) => void;
  onDayCreate?: (date: Date) => void;
  onEventSelect?: (event: CalendarOccurrence) => void;
}

export interface EventEditorDialogProps {
  open: boolean;
  mode: "create" | "edit";
  event?: CalendarEvent;
  defaultStartDate?: Date;
  canDelete?: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (event: CalendarEvent) => MaybePromise<void>;
  onDelete?: (event: CalendarEvent) => MaybePromise<void>;
}

export interface EventCalendarMessages {
  todayLabel?: string;
  previousLabel?: string;
  nextLabel?: string;
  createLabel?: string;
  searchPlaceholder?: string;
  emptyStateTitle?: string;
  emptyStateDescription?: string;
}

export interface EventCalendarProps {
  events?: CalendarEvent[];
  defaultEvents?: CalendarEvent[];
  currentDate?: Date;
  defaultDate?: Date;
  view?: CalendarView;
  defaultView?: CalendarView;
  searchValue?: string;
  defaultSearchValue?: string;
  activeColorFilters?: string[];
  defaultColorFilters?: string[];
  weekStartsOn?: 0 | 1 | 2 | 3 | 4 | 5 | 6;
  locale?: Locale;
  className?: string;
  animated?: boolean;
  showToolbar?: boolean;
  showSearch?: boolean;
  showFilters?: boolean;
  showEventDialog?: boolean;
  allowEventCreation?: boolean;
  allowEventEditing?: boolean;
  allowEventDeletion?: boolean;
  messages?: EventCalendarMessages;
  onDateChange?: (date: Date) => void;
  onViewChange?: (view: CalendarView) => void;
  onSearchValueChange?: (value: string) => void;
  onActiveColorFiltersChange?: (colors: string[]) => void;
  onEventsChange?: (events: CalendarEvent[]) => void;
  fetchEvents?: (
    context: CalendarFetchEventsContext,
  ) => MaybePromise<CalendarEvent[]>;
  onCreate?: (event: CalendarEvent) => MaybePromise<CalendarEvent | void>;
  onUpdate?: (event: CalendarEvent) => MaybePromise<CalendarEvent | void>;
  onDelete?: (event: CalendarEvent) => MaybePromise<void>;
}
