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
  buildOccurrencesForSelectedDates,
  combineDateAndTime,
  formatDateInput,
  getMonthStart,
  MAX_SELECTED_EVENT_DATES,
  sortDateValues,
  toggleDateSelection,
} from "@/lib/event-dates";

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
  const [selectedDates, setSelectedDates] = useState<string[]>([]);
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [eventType, setEventType] = useState<"regular" | "boothing">("regular");
  const [isOffsite, setIsOffsite] = useState(false);
  const [slug, setSlug] = useState("");
  const [slugTouched, setSlugTouched] = useState(false);
  const [shifts, setShifts] = useState<ShiftDraft[]>([]);
  const [calendarMonth, setCalendarMonth] = useState(() =>
    getMonthStart(new Date())
  );
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const suggestedSlug = useQuery(
    api.events.generateSlugSuggestion,
    title ? { title } : "skip"
  );

  const selectedDatesLabel =
    selectedDates.length === 0
      ? "No dates selected yet"
      : `${selectedDates.length} date${selectedDates.length === 1 ? "" : "s"} selected`;

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

  const formattedSelectedDates = useMemo(
    () =>
      sortDateValues(selectedDates).map((dateValue) => ({
        dateValue,
        label: new Date(`${dateValue}T00:00:00`).toLocaleDateString("en-US", {
          weekday: "short",
          month: "short",
          day: "numeric",
        }),
      })),
    [selectedDates]
  );

  const dateSelectionSummary = useMemo(() => {
    if (selectedDates.length === 0) {
      return "Choose one or more calendar days for this event.";
    }

    if (selectedDates.length === 1) {
      return "This will create one event on the selected day.";
    }

    return `This will create ${selectedDates.length} separate events with the same details and time on each selected day.`;
  }, [selectedDates.length]);

  let submitLabel = "Create Event";
  if (selectedDates.length > 1) {
    submitLabel = `Create ${selectedDates.length} Events`;
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

  const handleToggleDate = (nextDate: string) => {
    setSelectedDates((currentDates) =>
      toggleDateSelection(currentDates, nextDate)
    );
    setCalendarMonth(getMonthStart(new Date(`${nextDate}T00:00:00`)));
  };

  const handleRemoveDate = (dateValue: string) => {
    setSelectedDates((currentDates) =>
      currentDates.filter((currentDate) => currentDate !== dateValue)
    );
  };

  const handleClearDates = () => {
    setSelectedDates([]);
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

  // biome-ignore lint/complexity/noExcessiveCognitiveComplexity: event scheduling includes multi-date validation, shift mapping, and analytics
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      if (selectedDates.length === 0) {
        setError("Select at least one date on the calendar");
        setIsSubmitting(false);
        return;
      }

      if (selectedDates.length > MAX_SELECTED_EVENT_DATES) {
        setError(
          `You can select up to ${MAX_SELECTED_EVENT_DATES} dates at a time`
        );
        setIsSubmitting(false);
        return;
      }

      const startTimeValue = new Date(`2000-01-01T${startTime}`).getTime();
      const endTimeValue = new Date(`2000-01-01T${endTime}`).getTime();

      if (startTimeValue >= endTimeValue) {
        setError("End time must be after start time");
        setIsSubmitting(false);
        return;
      }

      const primaryDate = sortDateValues(selectedDates)[0];

      for (const shift of shifts) {
        if (!(shift.startTime && shift.endTime)) {
          setError("Each shift needs a start and end time");
          setIsSubmitting(false);
          return;
        }

        const shiftStartTime = combineDateAndTime(primaryDate, shift.startTime);
        const shiftEndTime = combineDateAndTime(primaryDate, shift.endTime);
        if (shiftStartTime.getTime() >= shiftEndTime.getTime()) {
          setError("Each shift must end after it starts");
          setIsSubmitting(false);
          return;
        }
      }

      const occurrences = buildOccurrencesForSelectedDates({
        selectedDates,
        startTime,
        endTime,
      });

      const occurrencePayload = occurrences.map((occurrence) => {
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
        occurrences: occurrencePayload,
      });

      posthog.capture("event_created", {
        event_type: eventType,
        is_offsite: isOffsite,
        has_shifts: eventType === "boothing" && shifts.length > 0,
        shifts_count: shifts.length,
        has_custom_slug: slugTouched && !!slug,
        has_multiple_dates: selectedDates.length > 1,
        selected_date_count: selectedDates.length,
        occurrence_count: occurrencePayload.length,
      });

      router.push("/events");
    } catch (err) {
      posthog.captureException(
        err instanceof Error ? err : new Error("Event creation failed")
      );
      posthog.capture("event_creation_failed", {
        event_type: eventType,
        is_offsite: isOffsite,
        selected_date_count: selectedDates.length,
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
                      Dates
                    </p>
                    <p className="mt-1 text-slate-900 text-sm">
                      {selectedDatesLabel}
                    </p>
                  </div>
                  {selectedDates.length > 0 ? (
                    <button
                      className="rounded-full border border-slate-300 bg-white px-4 py-2 font-semibold text-slate-900 text-sm transition hover:bg-slate-50"
                      onClick={handleClearDates}
                      type="button"
                    >
                      Clear dates
                    </button>
                  ) : null}
                </div>

                <MonthCalendar
                  eventCountsByDate={eventCountsByDate}
                  onMonthChange={setCalendarMonth}
                  onToggleDate={handleToggleDate}
                  selectedDates={selectedDates}
                  visibleMonth={calendarMonth}
                />
                <div className="rounded-2xl border border-slate-200 bg-white p-4">
                  <div className="flex items-center justify-between gap-3">
                    <p className="font-semibold text-slate-900 text-sm">
                      Selected Days
                    </p>
                    <p className="text-slate-900 text-xs">
                      {eventsForCalendar === undefined
                        ? "Loading existing event markers..."
                        : `${Object.keys(eventCountsByDate).length} dates already have events`}
                    </p>
                  </div>

                  {formattedSelectedDates.length > 0 ? (
                    <div className="mt-3 flex flex-wrap gap-2">
                      {formattedSelectedDates.map((selectedDate) => (
                        <button
                          className="inline-flex min-h-11 items-center gap-2 rounded-full border border-red-200 bg-red-50 px-3 py-2 text-left text-red-700 text-sm transition hover:bg-red-100"
                          key={selectedDate.dateValue}
                          onClick={() =>
                            handleRemoveDate(selectedDate.dateValue)
                          }
                          type="button"
                        >
                          <span>{selectedDate.label}</span>
                          <span aria-hidden="true">&times;</span>
                          <span className="sr-only">
                            Remove {selectedDate.label}
                          </span>
                        </button>
                      ))}
                    </div>
                  ) : (
                    <p className="mt-3 text-slate-900 text-sm">
                      Pick one or more dates above. Each selected day will
                      create its own event entry.
                    </p>
                  )}
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
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

              <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3">
                <p className="font-semibold text-slate-900 text-sm">
                  Time Applies to Every Selected Date
                </p>
                <p className="mt-1 text-slate-900 text-sm">
                  {dateSelectionSummary}
                </p>
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
                  {selectedDates.length > 1 ? (
                    <p className="mt-1 text-slate-900 text-sm">
                      These shift times will be created on each selected date.
                    </p>
                  ) : null}
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
