import { Dialog } from "@base-ui/react/dialog";
import { zodResolver } from "@hookform/resolvers/zod";
import { addHours } from "date-fns";
import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";

import { createId, formatDateTimeLocalValue } from "../lib/utils";
import type {
  CalendarEvent,
  EventEditorDialogProps,
  RecurrenceFrequency,
} from "../types/calendar";

const recurrenceOptions = [
  "none",
  "daily",
  "weekly",
  "monthly",
  "yearly",
] as const;

const eventFormSchema = z
  .object({
    title: z.string().trim().min(1, "Title is required."),
    description: z.string().optional(),
    location: z.string().optional(),
    color: z.string().optional(),
    allDay: z.boolean().default(false),
    start: z.string().min(1, "Start date is required."),
    end: z.string().min(1, "End date is required."),
    recurrenceFrequency: z.enum(recurrenceOptions).default("none"),
    recurrenceInterval: z.coerce.number().int().min(1).default(1),
  })
  .superRefine((value, context) => {
    if (new Date(value.end).getTime() < new Date(value.start).getTime()) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        message: "End date must be after the start date.",
        path: ["end"],
      });
    }
  });

type EventEditorValues = z.infer<typeof eventFormSchema>;

function getDefaultValues(
  event?: CalendarEvent,
  defaultStartDate?: Date,
): EventEditorValues {
  const startDate = event
    ? new Date(event.start)
    : (defaultStartDate ?? new Date());
  const endDate = event ? new Date(event.end) : addHours(startDate, 1);

  return {
    title: event?.title ?? "",
    description: event?.description ?? "",
    location: event?.location ?? "",
    color: event?.color ?? "#2563eb",
    allDay: event?.allDay ?? false,
    start: formatDateTimeLocalValue(startDate),
    end: formatDateTimeLocalValue(endDate),
    recurrenceFrequency: event?.recurrence?.frequency ?? "none",
    recurrenceInterval: event?.recurrence?.interval ?? 1,
  };
}

export function EventEditorDialog({
  open,
  mode,
  event,
  defaultStartDate,
  canDelete = false,
  onOpenChange,
  onSubmit,
  onDelete,
}: EventEditorDialogProps) {
  const form = useForm<EventEditorValues>({
    resolver: zodResolver(eventFormSchema),
    defaultValues: getDefaultValues(event, defaultStartDate),
  });

  useEffect(() => {
    form.reset(getDefaultValues(event, defaultStartDate));
  }, [defaultStartDate, event, form, open]);

  const handleSubmit = form.handleSubmit(async (values) => {
    const recurrenceFrequency =
      values.recurrenceFrequency === "none"
        ? undefined
        : values.recurrenceFrequency;
    const nextEvent: CalendarEvent = {
      id: event?.id ?? createId("event"),
      title: values.title,
      description: values.description || undefined,
      location: values.location || undefined,
      color: values.color || undefined,
      allDay: values.allDay,
      start: new Date(values.start),
      end: new Date(values.end),
      metadata: event?.metadata,
      recurrence: recurrenceFrequency
        ? {
            frequency: recurrenceFrequency as RecurrenceFrequency,
            interval: values.recurrenceInterval,
          }
        : undefined,
    };

    await onSubmit(nextEvent);
    onOpenChange(false);
  });

  return (
    <Dialog.Root
      open={open}
      onOpenChange={(nextOpen) => onOpenChange(nextOpen)}
    >
      <Dialog.Portal>
        <Dialog.Backdrop className="eec-dialog-overlay" />
        <Dialog.Popup className="eec-dialog-content">
          <Dialog.Title className="eec-dialog-title">
            {mode === "create" ? "Create event" : "Edit event"}
          </Dialog.Title>
          <Dialog.Description className="eec-dialog-description">
            Manage calendar details, recurring rules, and appearance.
          </Dialog.Description>

          <form className="eec-form" onSubmit={handleSubmit}>
            <label className="eec-field">
              <span className="eec-field-label">Title</span>
              <input className="eec-input" {...form.register("title")} />
              {form.formState.errors.title ? (
                <span className="eec-field-error">
                  {form.formState.errors.title.message}
                </span>
              ) : null}
            </label>

            <div className="eec-form-grid">
              <label className="eec-field">
                <span className="eec-field-label">Start</span>
                <input
                  type="datetime-local"
                  className="eec-input"
                  {...form.register("start")}
                />
              </label>

              <label className="eec-field">
                <span className="eec-field-label">End</span>
                <input
                  type="datetime-local"
                  className="eec-input"
                  {...form.register("end")}
                />
                {form.formState.errors.end ? (
                  <span className="eec-field-error">
                    {form.formState.errors.end.message}
                  </span>
                ) : null}
              </label>
            </div>

            <div className="eec-form-grid">
              <label className="eec-field">
                <span className="eec-field-label">Location</span>
                <input className="eec-input" {...form.register("location")} />
              </label>

              <label className="eec-field">
                <span className="eec-field-label">Color</span>
                <input
                  type="color"
                  className="eec-input eec-input--color"
                  {...form.register("color")}
                />
              </label>
            </div>

            <div className="eec-form-grid">
              <label className="eec-field">
                <span className="eec-field-label">Recurrence</span>
                <select
                  className="eec-input"
                  {...form.register("recurrenceFrequency")}
                >
                  {recurrenceOptions.map((option) => (
                    <option key={option} value={option}>
                      {option === "none"
                        ? "Does not repeat"
                        : `Repeats ${option}`}
                    </option>
                  ))}
                </select>
              </label>

              <label className="eec-field">
                <span className="eec-field-label">Interval</span>
                <input
                  type="number"
                  min={1}
                  className="eec-input"
                  {...form.register("recurrenceInterval")}
                />
              </label>
            </div>

            <label className="eec-field">
              <span className="eec-field-label">Description</span>
              <textarea
                rows={4}
                className="eec-input eec-textarea"
                {...form.register("description")}
              />
            </label>

            <label className="eec-checkbox-field">
              <input type="checkbox" {...form.register("allDay")} />
              <span>All-day event</span>
            </label>

            <div className="eec-dialog-actions">
              {mode === "edit" && canDelete && event && onDelete ? (
                <button
                  type="button"
                  className="eec-button eec-button--danger"
                  onClick={async () => {
                    await onDelete(event);
                    onOpenChange(false);
                  }}
                >
                  Delete
                </button>
              ) : null}

              <Dialog.Close
                type="button"
                className="eec-button eec-button--ghost"
              >
                Cancel
              </Dialog.Close>
              <button type="submit" className="eec-button">
                {mode === "create" ? "Save event" : "Update event"}
              </button>
            </div>
          </form>
        </Dialog.Popup>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
