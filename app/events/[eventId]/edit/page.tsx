"use client";

import { useMutation, useQuery } from "convex/react";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import SiteHeader from "@/components/site-header";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";

export default function EditEventPage() {
  const params = useParams();
  const router = useRouter();
  const eventId = params.eventId as Id<"events">;

  const event = useQuery(api.events.getEvent, { eventId });
  const currentUser = useQuery(api.users.getCurrentUser);
  const updateEvent = useMutation(api.events.updateEvent);
  const deleteEvent = useMutation(api.events.deleteEvent);

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [location, setLocation] = useState("");
  const [startDate, setStartDate] = useState("");
  const [startTime, setStartTime] = useState("");
  const [endDate, setEndDate] = useState("");
  const [endTime, setEndTime] = useState("");
  const [isOffsite, setIsOffsite] = useState(false);
  const [slug, setSlug] = useState("");
  const [slugTouched, setSlugTouched] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);

  const suggestedSlug = useQuery(
    api.events.generateSlugSuggestion,
    title && slugTouched ? { title, excludeEventId: eventId } : "skip"
  );

  useEffect(() => {
    if (event && !isLoaded) {
      setTitle(event.title);
      setDescription(event.description);
      setLocation(event.location);
      setSlug(event.slug);

      const startDateTime = new Date(event.startTime);
      const endDateTime = new Date(event.endTime);

      const formatDate = (date: Date) => {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, "0");
        const day = String(date.getDate()).padStart(2, "0");
        return `${year}-${month}-${day}`;
      };

      const formatTime = (date: Date) => {
        const hours = String(date.getHours()).padStart(2, "0");
        const minutes = String(date.getMinutes()).padStart(2, "0");
        return `${hours}:${minutes}`;
      };

      setStartDate(formatDate(startDateTime));
      setStartTime(formatTime(startDateTime));
      setEndDate(formatDate(endDateTime));
      setEndTime(formatTime(endDateTime));
      setIsOffsite(event.isOffsite);
      setIsLoaded(true);
    }
  }, [event, isLoaded]);

  if (event === undefined || currentUser === undefined) {
    return (
      <div className="min-h-screen bg-slate-50">
        <SiteHeader />
        <div className="flex items-center justify-center pt-20">
          <p className="text-slate-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!event) {
    return (
      <div className="min-h-screen bg-slate-50">
        <SiteHeader />
        <div className="flex items-center justify-center pt-20">
          <div className="rounded-3xl border border-rose-300 bg-white p-10 text-center shadow-sm">
            <h1 className="font-semibold text-2xl text-slate-900">
              Event Not Found
            </h1>
            <p className="mt-3 text-slate-600">
              This event does not exist or has been deleted.
            </p>
          </div>
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
              Only board members can edit events.
            </p>
          </div>
        </div>
      </div>
    );
  }

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

      await updateEvent({
        eventId,
        title,
        description,
        location,
        startTime: startDateTime,
        endTime: endDateTime,
        isOffsite,
        slug: slugTouched ? slug : undefined,
      });

      router.push(`/events/${slugTouched ? slug : (event.slug ?? event._id)}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update event");
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    setIsDeleting(true);
    setError(null);

    try {
      await deleteEvent({ eventId });
      router.push("/events");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete event");
      setIsDeleting(false);
      setShowDeleteConfirm(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <SiteHeader />
      <main className="mx-auto w-full max-w-3xl px-4 pt-10 pb-16 sm:px-8">
        <div className="mb-6">
          <button
            className="text-rose-600 text-sm hover:text-rose-700"
            onClick={() => router.push(`/events/${event.slug ?? event._id}`)}
            type="button"
          >
            ← Back to Event
          </button>
        </div>

        <header className="mb-8">
          <h1 className="font-semibold text-4xl text-slate-900">Edit Event</h1>
          <p className="mt-2 text-slate-600">
            Update event details. Note: Event type and shifts cannot be changed
            after creation.
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
                  placeholder={suggestedSlug || slug}
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
                <p className="mb-2 block font-semibold text-slate-700 text-sm">
                  Event Type
                </p>
                <div className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-3">
                  <p className="text-slate-600 text-sm">
                    {event.eventType === "boothing"
                      ? "Boothing (with shifts)"
                      : "Regular Event"}
                  </p>
                  <p className="mt-1 text-slate-500 text-xs">
                    Event type cannot be changed after creation
                  </p>
                </div>
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

          {event.eventType === "boothing" && event.shifts.length > 0 && (
            <div className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
              <h2 className="mb-4 font-semibold text-slate-900 text-xl">
                Shifts
              </h2>
              <p className="mb-4 text-slate-600 text-sm">
                Shifts cannot be edited from this page. To manage shifts, please
                contact a system administrator or delete and recreate the event.
              </p>
              <div className="space-y-3">
                {event.shifts.map((shift, index) => {
                  const shiftStart = new Date(shift.startTime);
                  const shiftEnd = new Date(shift.endTime);
                  return (
                    <div
                      className="rounded-lg border border-slate-200 bg-slate-50 p-4"
                      key={shift._id}
                    >
                      <h3 className="font-semibold text-slate-900">
                        Shift {index + 1}
                      </h3>
                      <p className="mt-1 text-slate-600 text-sm">
                        {shiftStart.toLocaleTimeString("en-US", {
                          hour: "numeric",
                          minute: "2-digit",
                        })}{" "}
                        -{" "}
                        {shiftEnd.toLocaleTimeString("en-US", {
                          hour: "numeric",
                          minute: "2-digit",
                        })}{" "}
                        ({shift.requiredPeople} people needed)
                      </p>
                    </div>
                  );
                })}
              </div>
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
              onClick={() => router.push(`/events/${event.slug ?? event._id}`)}
              type="button"
            >
              Cancel
            </button>
            <button
              className="flex-1 rounded-full bg-rose-600 px-6 py-3 font-semibold text-white transition hover:bg-rose-700 disabled:bg-slate-400"
              disabled={isSubmitting}
              type="submit"
            >
              {isSubmitting ? "Saving..." : "Save Changes"}
            </button>
          </div>
        </form>

        <div className="mt-8 rounded-3xl border border-rose-300 bg-white p-8 shadow-sm">
          <h2 className="mb-4 font-semibold text-rose-900 text-xl">
            Danger Zone
          </h2>
          <p className="mb-4 text-slate-600 text-sm">
            Deleting this event will permanently remove it along with all RSVPs,
            shifts, and carpool assignments. This action cannot be undone.
          </p>

          {showDeleteConfirm ? (
            <div className="space-y-4">
              <div className="rounded-lg border border-rose-300 bg-rose-50 p-4">
                <p className="font-semibold text-rose-900 text-sm">
                  Are you sure you want to delete this event?
                </p>
                <p className="mt-2 text-rose-800 text-xs">
                  This will delete {event.rsvps.length} RSVP(s) and cannot be
                  undone.
                </p>
              </div>
              <div className="flex gap-3">
                <button
                  className="flex-1 rounded-full border border-slate-300 px-4 py-2 font-semibold text-slate-700 transition hover:bg-slate-50"
                  onClick={() => setShowDeleteConfirm(false)}
                  type="button"
                >
                  Cancel
                </button>
                <button
                  className="flex-1 rounded-full bg-rose-600 px-4 py-2 font-semibold text-white transition hover:bg-rose-700 disabled:bg-rose-400"
                  disabled={isDeleting}
                  onClick={handleDelete}
                  type="button"
                >
                  {isDeleting ? "Deleting..." : "Yes, Delete Event"}
                </button>
              </div>
            </div>
          ) : (
            <button
              className="rounded-full border-2 border-rose-600 px-6 py-3 font-semibold text-rose-600 transition hover:bg-rose-50"
              onClick={() => setShowDeleteConfirm(true)}
              type="button"
            >
              Delete Event
            </button>
          )}
        </div>
      </main>
    </div>
  );
}
