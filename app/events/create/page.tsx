"use client";

import { useMutation, useQuery } from "convex/react";
import { useRouter } from "next/navigation";
import posthog from "posthog-js";
import { useMemo, useState } from "react";
import { MonthCalendar } from "@/components/events/month-calendar";
import SiteHeader from "@/components/site-header";
import { PageLoader } from "@/components/ui/page-loader";
import { api } from "@/convex/_generated/api";
import {
  buildScheduledOccurrences,
  combineDateAndTime,
  describeRecurrence,
  formatDateInput,
  getDefaultRecurrenceEndDate,
  getMonthStart,
  isValidDateValue,
  MAX_RECURRING_OCCURRENCES,
  RECURRENCE_OPTIONS,
  type RecurrencePattern,
  type StoredRecurrencePattern,
} from "@/lib/recurrence";

interface ShiftDraft {
  endTime: string;
  id: string;
  requiredPeople: number;
  startTime: string;
}

export default function CreateEventPage() {
  const router = useRouter();
  const currentUser = useQuery(api.users.getCurrentUser);
  const createEvent = useMutation(api.events.createEvent);
  const eventsForCalendar = useQuery(api.events.listEvents);

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [location, setLocation] = useState("");
  const [startDate, setStartDate] = useState("");
  const [startTime, setStartTime] = useState("");
  const [endDate, setEndDate] = useState("");
  const [endTime, setEndTime] = useState("");
  const [eventType, setEventType] = useState<"regular" | "boothing">("regular");
  const [isOffsite, setIsOffsite] = useState(false);
  const [slug, setSlug] = useState("");
  const [slugTouched, setSlugTouched] = useState(false);
  const [shifts, setShifts] = useState<ShiftDraft[]>([]);
  const [recurrencePattern, setRecurrencePattern] =
    useState<RecurrencePattern>("none");
  const [recurrenceEndDate, setRecurrenceEndDate] = useState("");
  const [calendarMonth, setCalendarMonth] = useState(() =>
    getMonthStart(new Date())
  );
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const suggestedSlug = useQuery(
    api.events.generateSlugSuggestion,
    title ? { title } : "skip"
  );

  const selectedRecurrencePattern =
    recurrencePattern === "none" ? undefined : recurrencePattern;

  const selectedDateLabel = startDate
    ? new Date(`${startDate}T00:00:00`).toLocaleDateString("en-US", {
        weekday: "long",
        month: "long",
        day: "numeric",
        year: "numeric",
      })
    : "No date selected yet";

  const eventCountsByDate = useMemo(() => {
    if (!eventsForCalendar) {
      return {};
    }

    const counts: Record<string, number> = {};

    for (const event of eventsForCalendar) {
      const dateKey = formatDateInput(new Date(event.startTime));
      counts[dateKey] = (counts[dateKey] ?? 0) + 1;
    }

    return counts;
  }, [eventsForCalendar]);

  const occurrencePreview = useMemo(() => {
    if (!(startDate && startTime && endDate && endTime)) {
      return null;
    }

    return buildScheduledOccurrences({
      startDate,
      startTime,
      endDate,
      endTime,
      recurrencePattern,
      recurrenceEndDate:
        recurrencePattern === "none" ? undefined : recurrenceEndDate,
    });
  }, [
    endDate,
    endTime,
    recurrenceEndDate,
    recurrencePattern,
    startDate,
    startTime,
  ]);

  const recurrenceSummary = useMemo(() => {
    if (!startDate) {
      return "Pick a date on the calendar to start scheduling.";
    }

    if (recurrencePattern === "none") {
      return "This will create one event on the selected date.";
    }

    if (!recurrenceEndDate) {
      return "Choose the last date in the series to preview recurring events.";
    }

    if (!occurrencePreview || occurrencePreview.occurrences.length === 0) {
      return "Add valid start and end times to preview the recurring series.";
    }

    if (occurrencePreview.exceedsLimit) {
      return `This series exceeds the ${MAX_RECURRING_OCCURRENCES} occurrence limit.`;
    }

    return `This will create ${
      occurrencePreview.occurrences.length
    } ${describeRecurrence(recurrencePattern).toLowerCase()} event${
      occurrencePreview.occurrences.length === 1 ? "" : "s"
    } through ${new Date(`${recurrenceEndDate}T00:00:00`).toLocaleDateString(
      "en-US",
      {
        month: "long",
        day: "numeric",
        year: "numeric",
      }
    )}.`;
  }, [occurrencePreview, recurrenceEndDate, recurrencePattern, startDate]);

  let submitLabel = "Create Event";
  if (selectedRecurrencePattern) {
    submitLabel = "Create Recurring Events";
  }
  if (isSubmitting) {
    submitLabel = "Creating...";
  }

  if (currentUser === undefined) {
    return (
      <div className="min-h-screen bg-[color:var(--color-bg-subtle)]">
        <SiteHeader />
        <PageLoader
          detail="Loading your board permissions and event tools."
          fullScreen={false}
          message="Loading event creator..."
        />
      </div>
    );
  }

  if (!currentUser || currentUser.role !== "board") {
    return (
      <div className="min-h-screen bg-[color:var(--color-bg-subtle)]">
        <SiteHeader />
        <div className="flex items-center justify-center pt-20">
          <div className="rounded-3xl border border-rose-300 bg-white p-10 text-center shadow-sm">
            <h1 className="font-semibold text-2xl text-slate-900">
              Access Denied
            </h1>
            <p className="mt-3 text-slate-900">
              Only board members can create events.
            </p>
          </div>
        </div>
      </div>
    );
  }

  const applySelectedDate = (nextDate: string) => {
    setStartDate(nextDate);

    if (!isValidDateValue(nextDate)) {
      return;
    }

    setCalendarMonth(getMonthStart(new Date(`${nextDate}T00:00:00`)));
    setEndDate((currentEndDate) =>
      !currentEndDate || currentEndDate < nextDate ? nextDate : currentEndDate
    );

    if (!selectedRecurrencePattern) {
      return;
    }

    setRecurrenceEndDate((currentRecurrenceEndDate) =>
      currentRecurrenceEndDate && currentRecurrenceEndDate >= nextDate
        ? currentRecurrenceEndDate
        : getDefaultRecurrenceEndDate(nextDate, selectedRecurrencePattern)
    );
  };

  const handleRecurrencePatternChange = (nextPattern: RecurrencePattern) => {
    setRecurrencePattern(nextPattern);

    if (nextPattern === "none") {
      setRecurrenceEndDate("");
      return;
    }

    if (!startDate) {
      return;
    }

    setRecurrenceEndDate((currentRecurrenceEndDate) =>
      currentRecurrenceEndDate && currentRecurrenceEndDate >= startDate
        ? currentRecurrenceEndDate
        : getDefaultRecurrenceEndDate(
            startDate,
            nextPattern as StoredRecurrencePattern
          )
    );
  };

  const addShift = () => {
    setShifts((currentShifts) => [
      ...currentShifts,
      {
        id: crypto.randomUUID(),
        startTime: "",
        endTime: "",
        requiredPeople: 3,
      },
    ]);
  };

  const removeShift = (index: number) => {
    setShifts((currentShifts) =>
      currentShifts.filter((_, shiftIndex) => shiftIndex !== index)
    );
  };

  const updateShift = <K extends keyof Omit<ShiftDraft, "id">>(
    index: number,
    field: K,
    value: ShiftDraft[K]
  ) => {
    setShifts((currentShifts) =>
      currentShifts.map((shift, shiftIndex) =>
        shiftIndex === index ? { ...shift, [field]: value } : shift
      )
    );
  };

  // biome-ignore lint/complexity/noExcessiveCognitiveComplexity: event scheduling includes recurrence validation, occurrence generation, and analytics
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      const startDateTime = combineDateAndTime(startDate, startTime).getTime();
      const endDateTime = combineDateAndTime(endDate, endTime).getTime();

      if (startDateTime >= endDateTime) {
        setError("End time must be after start time");
        setIsSubmitting(false);
        return;
      }

      if (recurrencePattern !== "none" && !recurrenceEndDate) {
        setError("Choose when the recurring series should end");
        setIsSubmitting(false);
        return;
      }

      if (recurrencePattern !== "none" && recurrenceEndDate < startDate) {
        setError("Recurring series must end on or after the start date");
        setIsSubmitting(false);
        return;
      }

      for (const shift of shifts) {
        if (!(shift.startTime && shift.endTime)) {
          setError("Each shift needs a start and end time");
          setIsSubmitting(false);
          return;
        }

        const shiftStartTime = combineDateAndTime(startDate, shift.startTime);
        const shiftEndTime = combineDateAndTime(startDate, shift.endTime);
        if (shiftStartTime.getTime() >= shiftEndTime.getTime()) {
          setError("Each shift must end after it starts");
          setIsSubmitting(false);
          return;
        }
      }

      const scheduledOccurrences = buildScheduledOccurrences({
        startDate,
        startTime,
        endDate,
        endTime,
        recurrencePattern,
        recurrenceEndDate:
          recurrencePattern === "none" ? undefined : recurrenceEndDate,
      });

      if (scheduledOccurrences.occurrences.length === 0) {
        setError("Please choose a valid event schedule");
        setIsSubmitting(false);
        return;
      }

      if (scheduledOccurrences.exceedsLimit) {
        setError(
          `Recurring events are limited to ${MAX_RECURRING_OCCURRENCES} occurrences`
        );
        setIsSubmitting(false);
        return;
      }

      const occurrences = scheduledOccurrences.occurrences.map((occurrence) => {
        const occurrenceDate = formatDateInput(new Date(occurrence.startTime));

        return {
          startTime: occurrence.startTime,
          endTime: occurrence.endTime,
          shifts:
            eventType === "boothing"
              ? shifts.map((shift) => ({
                  startTime: combineDateAndTime(
                    occurrenceDate,
                    shift.startTime
                  ).getTime(),
                  endTime: combineDateAndTime(
                    occurrenceDate,
                    shift.endTime
                  ).getTime(),
                  requiredPeople: shift.requiredPeople,
                }))
              : undefined,
        };
      });

      await createEvent({
        title,
        description,
        location,
        eventType,
        isOffsite,
        slug: slugTouched ? slug : undefined,
        occurrences,
        recurrence:
          recurrencePattern === "none"
            ? undefined
            : {
                pattern: recurrencePattern,
                endsOn: combineDateAndTime(
                  recurrenceEndDate,
                  "23:59"
                ).getTime(),
              },
      });

      posthog.capture("event_created", {
        event_type: eventType,
        is_offsite: isOffsite,
        has_shifts: eventType === "boothing" && shifts.length > 0,
        shifts_count: shifts.length,
        has_custom_slug: slugTouched && !!slug,
        has_recurrence: recurrencePattern !== "none",
        recurrence_pattern:
          recurrencePattern === "none" ? "one_time" : recurrencePattern,
        occurrence_count: occurrences.length,
      });

      router.push("/events");
    } catch (err) {
      posthog.captureException(
        err instanceof Error ? err : new Error("Event creation failed")
      );
      posthog.capture("event_creation_failed", {
        event_type: eventType,
        is_offsite: isOffsite,
        recurrence_pattern:
          recurrencePattern === "none" ? "one_time" : recurrencePattern,
        error: err instanceof Error ? err.message : "Unknown error",
      });
      setError(err instanceof Error ? err.message : "Failed to create event");
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[color:var(--color-bg-subtle)]">
      <SiteHeader />
      <main className="mx-auto w-full max-w-3xl px-4 pt-24 pb-16 sm:px-8">
        <header className="mb-8">
          <h1 className="font-display font-semibold text-4xl text-[color:var(--color-text-emphasis)]">
            Create Event
          </h1>
          <p className="mt-2 text-slate-900">
            Create a new volunteer opportunity for members to RSVP to.
          </p>
        </header>

        <form className="space-y-6" onSubmit={handleSubmit}>
          <div className="editorial-card rounded-3xl p-8">
            <h2 className="mb-6 font-semibold text-slate-900 text-xl">
              Event Details
            </h2>

            <div className="space-y-4">
              <div>
                <label
                  className="block font-semibold text-slate-900 text-sm"
                  htmlFor="title"
                >
                  Event Title
                </label>
                <input
                  className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-4 py-2 text-slate-900 placeholder:text-slate-900 focus:border-rose-500 focus:outline-none focus:ring-2 focus:ring-rose-500"
                  id="title"
                  onChange={(e) => setTitle(e.target.value)}
                  required
                  type="text"
                  value={title}
                />
              </div>

              <div>
                <label
                  className="block font-semibold text-slate-900 text-sm"
                  htmlFor="description"
                >
                  Description
                </label>
                <textarea
                  className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-4 py-2 text-slate-900 placeholder:text-slate-900 focus:border-rose-500 focus:outline-none focus:ring-2 focus:ring-rose-500"
                  id="description"
                  onChange={(e) => setDescription(e.target.value)}
                  required
                  rows={4}
                  value={description}
                />
              </div>

              <div>
                <label
                  className="block font-semibold text-slate-900 text-sm"
                  htmlFor="slug"
                >
                  URL Slug
                </label>
                <input
                  className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-4 py-2 text-slate-900 placeholder:text-slate-900 focus:border-rose-500 focus:outline-none focus:ring-2 focus:ring-rose-500"
                  id="slug"
                  onChange={(e) => {
                    setSlug(e.target.value);
                    setSlugTouched(true);
                  }}
                  placeholder={suggestedSlug || "auto-generated-from-title"}
                  type="text"
                  value={slug}
                />
                <p className="mt-1 text-slate-900 text-xs">
                  The URL will be: /events/
                  {slug || suggestedSlug || "your-event-slug"}
                </p>
              </div>

              <div>
                <label
                  className="block font-semibold text-slate-900 text-sm"
                  htmlFor="location"
                >
                  Location
                </label>
                <input
                  className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-4 py-2 text-slate-900 placeholder:text-slate-900 focus:border-rose-500 focus:outline-none focus:ring-2 focus:ring-rose-500"
                  id="location"
                  onChange={(e) => setLocation(e.target.value)}
                  required
                  type="text"
                  value={location}
                />
              </div>

              <div className="space-y-4 rounded-3xl border border-[color:var(--color-border)] bg-[color:var(--color-bg-subtle)] p-5">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="font-semibold text-slate-900 text-sm">
                      Calendar Date Picker
                    </p>
                    <p className="mt-1 text-slate-900 text-sm">
                      Selected date: {selectedDateLabel}
                    </p>
                  </div>
                  <div className="rounded-full bg-white px-4 py-2 text-slate-900 text-sm shadow-sm">
                    {eventsForCalendar === undefined
                      ? "Loading event dates..."
                      : `${Object.keys(eventCountsByDate).length} dates with events`}
                  </div>
                </div>

                <MonthCalendar
                  eventCountsByDate={eventCountsByDate}
                  onMonthChange={setCalendarMonth}
                  onSelectDate={applySelectedDate}
                  selectedDate={startDate}
                  visibleMonth={calendarMonth}
                />
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label
                    className="block font-semibold text-slate-900 text-sm"
                    htmlFor="startDate"
                  >
                    Start Date
                  </label>
                  <input
                    className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-4 py-2 text-slate-900 placeholder:text-slate-900 focus:border-rose-500 focus:outline-none focus:ring-2 focus:ring-rose-500"
                    id="startDate"
                    onChange={(e) => applySelectedDate(e.target.value)}
                    required
                    type="date"
                    value={startDate}
                  />
                </div>

                <div>
                  <label
                    className="block font-semibold text-slate-900 text-sm"
                    htmlFor="startTime"
                  >
                    Start Time
                  </label>
                  <input
                    className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-4 py-2 text-slate-900 placeholder:text-slate-900 focus:border-rose-500 focus:outline-none focus:ring-2 focus:ring-rose-500"
                    id="startTime"
                    onChange={(e) => setStartTime(e.target.value)}
                    required
                    type="time"
                    value={startTime}
                  />
                </div>

                <div>
                  <label
                    className="block font-semibold text-slate-900 text-sm"
                    htmlFor="endDate"
                  >
                    End Date
                  </label>
                  <input
                    className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-4 py-2 text-slate-900 placeholder:text-slate-900 focus:border-rose-500 focus:outline-none focus:ring-2 focus:ring-rose-500"
                    id="endDate"
                    onChange={(e) => setEndDate(e.target.value)}
                    required
                    type="date"
                    value={endDate}
                  />
                </div>

                <div>
                  <label
                    className="block font-semibold text-slate-900 text-sm"
                    htmlFor="endTime"
                  >
                    End Time
                  </label>
                  <input
                    className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-4 py-2 text-slate-900 placeholder:text-slate-900 focus:border-rose-500 focus:outline-none focus:ring-2 focus:ring-rose-500"
                    id="endTime"
                    onChange={(e) => setEndTime(e.target.value)}
                    required
                    type="time"
                    value={endTime}
                  />
                </div>
              </div>

              <div className="space-y-4 rounded-3xl border border-[color:var(--color-border)] bg-[color:var(--color-bg-subtle)] p-5">
                <div>
                  <label
                    className="block font-semibold text-slate-900 text-sm"
                    htmlFor="recurrencePattern"
                  >
                    Repeat
                  </label>
                  <select
                    className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-4 py-2 text-slate-900 focus:border-rose-500 focus:outline-none focus:ring-2 focus:ring-rose-500"
                    id="recurrencePattern"
                    onChange={(e) =>
                      handleRecurrencePatternChange(
                        e.target.value as RecurrencePattern
                      )
                    }
                    value={recurrencePattern}
                  >
                    {RECURRENCE_OPTIONS.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>

                {selectedRecurrencePattern && (
                  <div>
                    <label
                      className="block font-semibold text-slate-900 text-sm"
                      htmlFor="recurrenceEndDate"
                    >
                      Repeat Until
                    </label>
                    <input
                      className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-4 py-2 text-slate-900 placeholder:text-slate-900 focus:border-rose-500 focus:outline-none focus:ring-2 focus:ring-rose-500"
                      id="recurrenceEndDate"
                      min={startDate || undefined}
                      onChange={(e) => setRecurrenceEndDate(e.target.value)}
                      required
                      type="date"
                      value={recurrenceEndDate}
                    />
                  </div>
                )}

                <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3">
                  <p className="font-semibold text-slate-900 text-sm">
                    Recurrence Preview
                  </p>
                  <p className="mt-1 text-slate-900 text-sm">
                    {recurrenceSummary}
                  </p>
                  <p className="mt-2 text-slate-900 text-xs">
                    Recurring events are saved as separate event entries so each
                    occurrence can be edited later without affecting the rest of
                    the series.
                  </p>
                </div>
              </div>

              <div>
                <label
                  className="block font-semibold text-slate-900 text-sm"
                  htmlFor="eventType"
                >
                  Event Type
                </label>
                <select
                  className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-4 py-2 text-slate-900 focus:border-rose-500 focus:outline-none focus:ring-2 focus:ring-rose-500"
                  id="eventType"
                  onChange={(e) =>
                    setEventType(e.target.value as "regular" | "boothing")
                  }
                  value={eventType}
                >
                  <option value="regular">Regular Event</option>
                  <option value="boothing">Boothing (with shifts)</option>
                </select>
              </div>

              <div className="flex items-center gap-2">
                <input
                  checked={isOffsite}
                  className="h-4 w-4 rounded border-slate-300 text-rose-600 focus:ring-rose-500"
                  id="isOffsite"
                  onChange={(e) => setIsOffsite(e.target.checked)}
                  type="checkbox"
                />
                <label
                  className="font-semibold text-slate-900 text-sm"
                  htmlFor="isOffsite"
                >
                  Offsite event (requires carpools)
                </label>
              </div>
            </div>
          </div>

          {eventType === "boothing" && (
            <div className="editorial-card rounded-3xl p-8">
              <div className="mb-6 flex items-center justify-between">
                <div>
                  <h2 className="font-semibold text-slate-900 text-xl">
                    Shifts
                  </h2>
                  {selectedRecurrencePattern && (
                    <p className="mt-1 text-slate-900 text-sm">
                      These shift times will repeat for every{" "}
                      {describeRecurrence(
                        selectedRecurrencePattern
                      ).toLowerCase()}{" "}
                      occurrence in the series.
                    </p>
                  )}
                </div>
                <button
                  className="rounded-full bg-rose-600 px-4 py-2 font-semibold text-sm text-white transition hover:bg-rose-700"
                  onClick={addShift}
                  type="button"
                >
                  Add Shift
                </button>
              </div>

              {shifts.length === 0 ? (
                <p className="text-center text-slate-900 text-sm">
                  No shifts added yet. Click &quot;Add Shift&quot; to create
                  time slots.
                </p>
              ) : (
                <div className="space-y-4">
                  {shifts.map((shift, index) => (
                    <div
                      className="editorial-card-soft rounded-lg p-4"
                      key={shift.id}
                    >
                      <div className="mb-3 flex items-center justify-between">
                        <h3 className="font-semibold text-slate-900">
                          Shift {index + 1}
                        </h3>
                        <button
                          className="text-rose-600 text-sm hover:text-rose-700"
                          onClick={() => removeShift(index)}
                          type="button"
                        >
                          Remove
                        </button>
                      </div>
                      <div className="grid gap-3 sm:grid-cols-3">
                        <div>
                          <label
                            className="block text-slate-900 text-sm"
                            htmlFor={`shift-${shift.id}-start`}
                          >
                            Start Time
                          </label>
                          <input
                            className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-slate-900 text-sm placeholder:text-slate-900 focus:border-rose-500 focus:outline-none focus:ring-2 focus:ring-rose-500"
                            id={`shift-${shift.id}-start`}
                            onChange={(e) =>
                              updateShift(index, "startTime", e.target.value)
                            }
                            required
                            type="time"
                            value={shift.startTime}
                          />
                        </div>
                        <div>
                          <label
                            className="block text-slate-900 text-sm"
                            htmlFor={`shift-${shift.id}-end`}
                          >
                            End Time
                          </label>
                          <input
                            className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-slate-900 text-sm placeholder:text-slate-900 focus:border-rose-500 focus:outline-none focus:ring-2 focus:ring-rose-500"
                            id={`shift-${shift.id}-end`}
                            onChange={(e) =>
                              updateShift(index, "endTime", e.target.value)
                            }
                            required
                            type="time"
                            value={shift.endTime}
                          />
                        </div>
                        <div>
                          <label
                            className="block text-slate-900 text-sm"
                            htmlFor={`shift-${shift.id}-people`}
                          >
                            People Needed
                          </label>
                          <input
                            className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-slate-900 text-sm placeholder:text-slate-900 focus:border-rose-500 focus:outline-none focus:ring-2 focus:ring-rose-500"
                            id={`shift-${shift.id}-people`}
                            min="1"
                            onChange={(e) =>
                              updateShift(
                                index,
                                "requiredPeople",
                                Number.parseInt(e.target.value, 10)
                              )
                            }
                            required
                            type="number"
                            value={shift.requiredPeople}
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {error && (
            <div className="rounded-lg border border-rose-300 bg-rose-50 p-4 text-rose-700">
              {error}
            </div>
          )}

          <div className="flex gap-4">
            <button
              className="flex-1 rounded-full border border-slate-300 px-6 py-3 font-semibold text-slate-900 transition hover:bg-slate-50"
              onClick={() => router.push("/events")}
              type="button"
            >
              Cancel
            </button>
            <button
              className="flex-1 rounded-full bg-rose-600 px-6 py-3 font-semibold text-white transition hover:bg-rose-700 disabled:bg-slate-400"
              disabled={isSubmitting}
              type="submit"
            >
              {submitLabel}
            </button>
          </div>
        </form>
      </main>
    </div>
  );
}
