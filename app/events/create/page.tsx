"use client";

import { useMutation, useQuery } from "convex/react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import SiteHeader from "@/components/site-header";
import { api } from "@/convex/_generated/api";

export default function CreateEventPage() {
  const router = useRouter();
  const currentUser = useQuery(api.users.getCurrentUser);
  const createEvent = useMutation(api.events.createEvent);

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
  const [shifts, setShifts] = useState<
    Array<{
      id: string;
      startTime: string;
      endTime: string;
      requiredPeople: number;
    }>
  >([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const suggestedSlug = useQuery(
    api.events.generateSlugSuggestion,
    title ? { title } : "skip"
  );

  if (currentUser === undefined) {
    return (
      <div className="min-h-screen bg-slate-50">
        <SiteHeader />
        <div className="flex items-center justify-center pt-20">
          <p className="text-slate-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!currentUser || currentUser.role !== "board") {
    return (
      <div className="min-h-screen bg-slate-50">
        <SiteHeader />
        <div className="flex items-center justify-center pt-20">
          <div className="rounded-3xl border border-rose-300 bg-white p-10 text-center shadow-sm">
            <h1 className="font-semibold text-2xl text-slate-900">
              Access Denied
            </h1>
            <p className="mt-3 text-slate-600">
              Only board members can create events.
            </p>
          </div>
        </div>
      </div>
    );
  }

  const addShift = () => {
    setShifts([
      ...shifts,
      {
        id: `shift-${Date.now()}-${Math.random()}`,
        startTime: "",
        endTime: "",
        requiredPeople: 3,
      },
    ]);
  };

  const removeShift = (index: number) => {
    setShifts(shifts.filter((_, i) => i !== index));
  };

  const updateShift = (
    index: number,
    field: string,
    value: string | number
  ) => {
    const newShifts = [...shifts];
    newShifts[index] = { ...newShifts[index], [field]: value };
    setShifts(newShifts);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      const startDateTime = new Date(`${startDate}T${startTime}`).getTime();
      const endDateTime = new Date(`${endDate}T${endTime}`).getTime();

      if (startDateTime >= endDateTime) {
        setError("End time must be after start time");
        setIsSubmitting(false);
        return;
      }

      const eventShifts =
        eventType === "boothing"
          ? shifts.map((shift) => ({
              startTime: new Date(`${startDate}T${shift.startTime}`).getTime(),
              endTime: new Date(`${startDate}T${shift.endTime}`).getTime(),
              requiredPeople: shift.requiredPeople,
            }))
          : undefined;

      const eventId = await createEvent({
        title,
        description,
        location,
        startTime: startDateTime,
        endTime: endDateTime,
        eventType,
        isOffsite,
        slug: slugTouched ? slug : undefined,
        shifts: eventShifts,
      });

      router.push("/events");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create event");
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <SiteHeader />
      <main className="mx-auto w-full max-w-3xl px-4 pt-10 pb-16 sm:px-8">
        <header className="mb-8">
          <h1 className="font-semibold text-4xl text-slate-900">
            Create Event
          </h1>
          <p className="mt-2 text-slate-600">
            Create a new volunteer opportunity for members to RSVP to.
          </p>
        </header>

        <form className="space-y-6" onSubmit={handleSubmit}>
          <div className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
            <h2 className="mb-6 font-semibold text-slate-900 text-xl">
              Event Details
            </h2>

            <div className="space-y-4">
              <div>
                <label
                  className="block font-semibold text-slate-700 text-sm"
                  htmlFor="title"
                >
                  Event Title
                </label>
                <input
                  className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-4 py-2 text-slate-900 placeholder:text-slate-500 focus:border-rose-500 focus:outline-none focus:ring-2 focus:ring-rose-500"
                  id="title"
                  onChange={(e) => setTitle(e.target.value)}
                  required
                  type="text"
                  value={title}
                />
              </div>

              <div>
                <label
                  className="block font-semibold text-slate-700 text-sm"
                  htmlFor="description"
                >
                  Description
                </label>
                <textarea
                  className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-4 py-2 text-slate-900 placeholder:text-slate-500 focus:border-rose-500 focus:outline-none focus:ring-2 focus:ring-rose-500"
                  id="description"
                  onChange={(e) => setDescription(e.target.value)}
                  required
                  rows={4}
                  value={description}
                />
              </div>

              <div>
                <label
                  className="block font-semibold text-slate-700 text-sm"
                  htmlFor="slug"
                >
                  URL Slug
                </label>
                <input
                  className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-4 py-2 text-slate-900 placeholder:text-slate-500 focus:border-rose-500 focus:outline-none focus:ring-2 focus:ring-rose-500"
                  id="slug"
                  onChange={(e) => {
                    setSlug(e.target.value);
                    setSlugTouched(true);
                  }}
                  placeholder={suggestedSlug || "auto-generated-from-title"}
                  type="text"
                  value={slug}
                />
                <p className="mt-1 text-slate-500 text-xs">
                  The URL will be: /events/
                  {slug || suggestedSlug || "your-event-slug"}
                </p>
              </div>

              <div>
                <label
                  className="block font-semibold text-slate-700 text-sm"
                  htmlFor="location"
                >
                  Location
                </label>
                <input
                  className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-4 py-2 text-slate-900 placeholder:text-slate-500 focus:border-rose-500 focus:outline-none focus:ring-2 focus:ring-rose-500"
                  id="location"
                  onChange={(e) => setLocation(e.target.value)}
                  required
                  type="text"
                  value={location}
                />
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label
                    className="block font-semibold text-slate-700 text-sm"
                    htmlFor="startDate"
                  >
                    Start Date
                  </label>
                  <input
                    className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-4 py-2 text-slate-900 placeholder:text-slate-500 focus:border-rose-500 focus:outline-none focus:ring-2 focus:ring-rose-500"
                    id="startDate"
                    onChange={(e) => setStartDate(e.target.value)}
                    required
                    type="date"
                    value={startDate}
                  />
                </div>

                <div>
                  <label
                    className="block font-semibold text-slate-700 text-sm"
                    htmlFor="startTime"
                  >
                    Start Time
                  </label>
                  <input
                    className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-4 py-2 text-slate-900 placeholder:text-slate-500 focus:border-rose-500 focus:outline-none focus:ring-2 focus:ring-rose-500"
                    id="startTime"
                    onChange={(e) => setStartTime(e.target.value)}
                    required
                    type="time"
                    value={startTime}
                  />
                </div>

                <div>
                  <label
                    className="block font-semibold text-slate-700 text-sm"
                    htmlFor="endDate"
                  >
                    End Date
                  </label>
                  <input
                    className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-4 py-2 text-slate-900 placeholder:text-slate-500 focus:border-rose-500 focus:outline-none focus:ring-2 focus:ring-rose-500"
                    id="endDate"
                    onChange={(e) => setEndDate(e.target.value)}
                    required
                    type="date"
                    value={endDate}
                  />
                </div>

                <div>
                  <label
                    className="block font-semibold text-slate-700 text-sm"
                    htmlFor="endTime"
                  >
                    End Time
                  </label>
                  <input
                    className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-4 py-2 text-slate-900 placeholder:text-slate-500 focus:border-rose-500 focus:outline-none focus:ring-2 focus:ring-rose-500"
                    id="endTime"
                    onChange={(e) => setEndTime(e.target.value)}
                    required
                    type="time"
                    value={endTime}
                  />
                </div>
              </div>

              <div>
                <label
                  className="block font-semibold text-slate-700 text-sm"
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
                  className="font-semibold text-slate-700 text-sm"
                  htmlFor="isOffsite"
                >
                  Offsite event (requires carpools)
                </label>
              </div>
            </div>
          </div>

          {eventType === "boothing" && (
            <div className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
              <div className="mb-6 flex items-center justify-between">
                <h2 className="font-semibold text-slate-900 text-xl">Shifts</h2>
                <button
                  className="rounded-full bg-rose-600 px-4 py-2 font-semibold text-sm text-white transition hover:bg-rose-700"
                  onClick={addShift}
                  type="button"
                >
                  Add Shift
                </button>
              </div>

              {shifts.length === 0 ? (
                <p className="text-center text-slate-600 text-sm">
                  No shifts added yet. Click &quot;Add Shift&quot; to create
                  time slots.
                </p>
              ) : (
                <div className="space-y-4">
                  {shifts.map((shift, index) => (
                    <div
                      className="rounded-lg border border-slate-200 bg-slate-50 p-4"
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
                            className="block text-slate-700 text-sm"
                            htmlFor={`shift-${shift.id}-start`}
                          >
                            Start Time
                          </label>
                          <input
                            className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-slate-900 text-sm placeholder:text-slate-500 focus:border-rose-500 focus:outline-none focus:ring-2 focus:ring-rose-500"
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
                            className="block text-slate-700 text-sm"
                            htmlFor={`shift-${shift.id}-end`}
                          >
                            End Time
                          </label>
                          <input
                            className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-slate-900 text-sm placeholder:text-slate-500 focus:border-rose-500 focus:outline-none focus:ring-2 focus:ring-rose-500"
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
                            className="block text-slate-700 text-sm"
                            htmlFor={`shift-${shift.id}-people`}
                          >
                            People Needed
                          </label>
                          <input
                            className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-slate-900 text-sm placeholder:text-slate-500 focus:border-rose-500 focus:outline-none focus:ring-2 focus:ring-rose-500"
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
              className="flex-1 rounded-full border border-slate-300 px-6 py-3 font-semibold text-slate-700 transition hover:bg-slate-50"
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
              {isSubmitting ? "Creating..." : "Create Event"}
            </button>
          </div>
        </form>
      </main>
    </div>
  );
}
