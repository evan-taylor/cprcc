"use client";

import { useMutation, useQuery } from "convex/react";
import { useParams, useRouter } from "next/navigation";
import { useRef, useState } from "react";
import SiteHeader from "@/components/site-header";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";

export default function EventDetailPage() {
  const params = useParams();
  const router = useRouter();
  const eventId = params.eventId as Id<"events">;

  const event = useQuery(api.events.getEvent, { eventId });
  const currentUser = useQuery(api.users.getCurrentUser);
  const createRsvp = useMutation(api.events.createRsvp);
  const deleteRsvp = useMutation(api.events.deleteRsvp);

  const [showRsvpForm, setShowRsvpForm] = useState(false);
  const [selectedShiftIds, setSelectedShiftIds] = useState<
    Set<Id<"shifts">>
  >(new Set());
  const [needsRide, setNeedsRide] = useState(false);
  const [canDrive, setCanDrive] = useState(false);
  const [carType, setCarType] = useState("");
  const [carColor, setCarColor] = useState("");
  const [capacity, setCapacity] = useState(4);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const rsvpFormRef = useRef<HTMLDivElement>(null);

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

  const eventDate = new Date(event.startTime);
  const endDate = new Date(event.endTime);
  const userRsvps = event.rsvps.filter(
    (rsvp) => rsvp.userProfileId === currentUser?._id
  );
  const hasRsvped = userRsvps.length > 0;

  const toggleShiftSelection = (shiftId: Id<"shifts">) => {
    setSelectedShiftIds((prev) => {
      const next = new Set(prev);
      if (next.has(shiftId)) {
        next.delete(shiftId);
      } else {
        next.add(shiftId);
      }
      return next;
    });
  };

  const selectAllAvailableShifts = () => {
    if (event.eventType !== "boothing") return;
    
    const availableShiftIds = event.shifts
      .filter((shift) => {
        const shiftRsvps = event.rsvps.filter((r) => r.shiftId === shift._id);
        const isFull = shiftRsvps.length >= shift.requiredPeople;
        const userHasThisShift = userRsvps.some((r) => r.shiftId === shift._id);
        return !isFull && !userHasThisShift;
      })
      .map((shift) => shift._id);
    
    setSelectedShiftIds(new Set(availableShiftIds));
  };

  const clearShiftSelection = () => {
    setSelectedShiftIds(new Set());
  };

  const removeShiftFromSelection = (shiftId: Id<"shifts">) => {
    setSelectedShiftIds((prev) => {
      const next = new Set(prev);
      next.delete(shiftId);
      return next;
    });
  };

  const handleRsvpSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      if (!currentUser) {
        setError("You must be signed in to RSVP");
        setIsSubmitting(false);
        return;
      }

      if (event.eventType === "boothing" && selectedShiftIds.size === 0) {
        setError("Please select at least one shift above before confirming");
        setIsSubmitting(false);
        return;
      }

      if (event.isOffsite && !needsRide && !canDrive) {
        setError(
          "For offsite events, please indicate if you need a ride or can drive"
        );
        setIsSubmitting(false);
        return;
      }

      if (canDrive && !(carType && carColor)) {
        setError("Please provide your car information");
        setIsSubmitting(false);
        return;
      }

      const shiftsToRsvp = event.eventType === "boothing" 
        ? Array.from(selectedShiftIds)
        : [undefined];

      const results: Array<{ shiftId?: Id<"shifts">; success: boolean; error?: string }> = [];

      for (const shiftId of shiftsToRsvp) {
        try {
          await createRsvp({
            eventId,
            shiftId,
            needsRide: event.isOffsite ? needsRide : false,
            canDrive: event.isOffsite ? canDrive : false,
            driverInfo: canDrive ? { carType, carColor, capacity } : undefined,
          });
          results.push({ shiftId, success: true });
        } catch (err) {
          results.push({
            shiftId,
            success: false,
            error: err instanceof Error ? err.message : "Failed to RSVP",
          });
        }
      }

      const successCount = results.filter((r) => r.success).length;
      const failureCount = results.filter((r) => !r.success).length;

      if (failureCount === 0) {
        setShowRsvpForm(false);
        setNeedsRide(false);
        setCanDrive(false);
        setCarType("");
        setCarColor("");
        setCapacity(4);
        setSelectedShiftIds(new Set());
      } else if (successCount > 0) {
        const failedShifts = results
          .filter((r) => !r.success)
          .map((r) => {
            const shift = event.shifts.find((s) => s._id === r.shiftId);
            return shift
              ? `${new Date(shift.startTime).toLocaleTimeString("en-US", {
                  hour: "numeric",
                  minute: "2-digit",
                })}`
              : "Unknown shift";
          });
        setError(
          `${successCount} shift(s) confirmed. Failed to reserve: ${failedShifts.join(", ")}. ${results.find((r) => !r.success)?.error || ""}`
        );
        const failedShiftIds = results
          .filter((r) => !r.success && r.shiftId)
          .map((r) => r.shiftId as Id<"shifts">);
        setSelectedShiftIds(new Set(failedShiftIds));
      } else {
        setError(results[0]?.error || "Failed to RSVP");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to RSVP");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancelRsvp = async (rsvpId: Id<"rsvps">) => {
    try {
      await deleteRsvp({ rsvpId });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to cancel RSVP");
    }
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <SiteHeader />
      <main className="mx-auto w-full max-w-4xl px-4 pt-10 pb-16 sm:px-8">
        <div className="mb-6">
          <button type="button"
            className="text-rose-600 text-sm hover:text-rose-700"
            onClick={() => router.push("/events")}
          >
            ← Back to Events
          </button>
        </div>

        <div className="space-y-6">
          <div className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1">
                <div className="flex items-center gap-3">
                  <h1 className="font-semibold text-3xl text-slate-900">
                    {event.title}
                  </h1>
                  {event.eventType === "boothing" && (
                    <span className="rounded-full bg-rose-100 px-3 py-1 font-semibold text-rose-700 text-xs uppercase tracking-wide">
                      Shifts
                    </span>
                  )}
                  {event.isOffsite && (
                    <span className="rounded-full bg-blue-100 px-3 py-1 font-semibold text-blue-700 text-xs uppercase tracking-wide">
                      Offsite
                    </span>
                  )}
                </div>
                <p className="mt-4 text-slate-600">{event.description}</p>
              </div>
              {currentUser?.role === "board" && event.isOffsite && (
                <button type="button"
                  className="rounded-full bg-blue-600 px-4 py-2 font-semibold text-sm text-white transition hover:bg-blue-700"
                  onClick={() => router.push(`/events/${eventId}/carpools`)}
                >
                  Manage Carpools
                </button>
              )}
            </div>

            <div className="mt-6 grid gap-4 sm:grid-cols-2">
              <div>
                <p className="font-semibold text-slate-700 text-sm">Date</p>
                <p className="mt-1 text-slate-900">
                  {eventDate.toLocaleDateString("en-US", {
                    weekday: "long",
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  })}
                </p>
              </div>
              <div>
                <p className="font-semibold text-slate-700 text-sm">Time</p>
                <p className="mt-1 text-slate-900">
                  {eventDate.toLocaleTimeString("en-US", {
                    hour: "numeric",
                    minute: "2-digit",
                  })}{" "}
                  -{" "}
                  {endDate.toLocaleTimeString("en-US", {
                    hour: "numeric",
                    minute: "2-digit",
                  })}
                </p>
              </div>
              <div>
                <p className="font-semibold text-slate-700 text-sm">Location</p>
                <p className="mt-1 text-slate-900">{event.location}</p>
              </div>
              <div>
                <p className="font-semibold text-slate-700 text-sm">RSVPs</p>
                <p className="mt-1 text-slate-900">
                  {event.rsvps.length} people
                </p>
              </div>
            </div>
          </div>

          {event.eventType === "boothing" && event.shifts.length > 0 && (
            <div className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
              <div className="mb-4 flex items-center justify-between">
                <h2 className="font-semibold text-slate-900 text-xl">
                  Available Shifts
                  {selectedShiftIds.size > 0 && (
                    <span className="ml-2 rounded-full bg-rose-100 px-3 py-1 font-semibold text-rose-700 text-sm">
                      {selectedShiftIds.size} selected
                    </span>
                  )}
                </h2>
                {currentUser && (
                  <div className="flex gap-2">
                    <button
                      className="rounded-lg border border-slate-300 px-3 py-1.5 font-semibold text-slate-700 text-sm transition hover:bg-slate-50"
                      onClick={selectAllAvailableShifts}
                      type="button"
                    >
                      Select All
                    </button>
                    <button
                      className="rounded-lg border border-slate-300 px-3 py-1.5 font-semibold text-slate-700 text-sm transition hover:bg-slate-50"
                      onClick={clearShiftSelection}
                      type="button"
                    >
                      Clear
                    </button>
                  </div>
                )}
              </div>
              <div className="space-y-3">
                {event.shifts.map((shift) => {
                  const shiftStart = new Date(shift.startTime);
                  const shiftEnd = new Date(shift.endTime);
                  const shiftRsvps = event.rsvps.filter(
                    (r) => r.shiftId === shift._id
                  );
                  const isFull = shiftRsvps.length >= shift.requiredPeople;
                  const userHasThisShift = userRsvps.some(
                    (r) => r.shiftId === shift._id
                  );
                  const isSelected = selectedShiftIds.has(shift._id);
                  const isDisabled = isFull || userHasThisShift;

                  return (
                    <label
                      className={`flex cursor-pointer items-center justify-between rounded-lg border p-4 transition ${
                        isDisabled
                          ? "cursor-not-allowed opacity-60"
                          : isSelected
                            ? "border-rose-400 bg-rose-50 ring-2 ring-rose-400"
                            : "border-slate-200 bg-slate-50 hover:border-rose-200"
                      }`}
                      htmlFor={`shift-${shift._id}`}
                      key={shift._id}
                    >
                      <div className="flex flex-1 items-center gap-3">
                        {currentUser && !isDisabled && (
                          <input
                            checked={isSelected}
                            className="h-5 w-5 rounded border-slate-300 text-rose-600 focus:ring-rose-500"
                            id={`shift-${shift._id}`}
                            onChange={() => {
                              toggleShiftSelection(shift._id);
                              if (!showRsvpForm) {
                                setShowRsvpForm(true);
                                setTimeout(() => {
                                  rsvpFormRef.current?.scrollIntoView({
                                    behavior: "smooth",
                                    block: "nearest",
                                  });
                                }, 100);
                              }
                            }}
                            type="checkbox"
                          />
                        )}
                        <div className="flex-1">
                          <p className="font-semibold text-slate-900">
                            {shiftStart.toLocaleTimeString("en-US", {
                              hour: "numeric",
                              minute: "2-digit",
                            })}{" "}
                            -{" "}
                            {shiftEnd.toLocaleTimeString("en-US", {
                              hour: "numeric",
                              minute: "2-digit",
                            })}
                          </p>
                          <p className="mt-1 text-slate-600 text-sm">
                            {shiftRsvps.length} / {shift.requiredPeople}{" "}
                            volunteers
                            {isFull && " (Full)"}
                          </p>
                        </div>
                      </div>
                      {currentUser && userHasThisShift && (
                        <span className="rounded-full bg-green-100 px-3 py-1.5 font-semibold text-green-700 text-xs">
                          Already signed up
                        </span>
                      )}
                      {currentUser && isFull && !userHasThisShift && (
                        <span className="rounded-full bg-slate-100 px-3 py-1.5 font-semibold text-slate-600 text-xs">
                          Full
                        </span>
                      )}
                    </label>
                  );
                })}
              </div>
            </div>
          )}

          {currentUser && (
            <div
              className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm"
              ref={rsvpFormRef}
            >
              <h2 className="mb-4 font-semibold text-slate-900 text-xl">
                Your RSVP
              </h2>

              {showRsvpForm ? (
                <form className="space-y-4" onSubmit={handleRsvpSubmit}>
                  {event.eventType === "boothing" && selectedShiftIds.size > 0 && (
                    <div className="rounded-lg border border-rose-200 bg-rose-50 p-4">
                      <p className="mb-2 font-semibold text-rose-900 text-sm">
                        Selected Shifts ({selectedShiftIds.size})
                      </p>
                      <div className="space-y-2">
                        {Array.from(selectedShiftIds).map((shiftId) => {
                          const shift = event.shifts.find((s) => s._id === shiftId);
                          if (!shift) return null;
                          return (
                            <div
                              className="flex items-center justify-between rounded-md bg-white px-3 py-2"
                              key={shiftId}
                            >
                              <p className="text-rose-700 text-sm">
                                {new Date(shift.startTime).toLocaleTimeString(
                                  "en-US",
                                  {
                                    hour: "numeric",
                                    minute: "2-digit",
                                  }
                                )}{" "}
                                -{" "}
                                {new Date(shift.endTime).toLocaleTimeString(
                                  "en-US",
                                  {
                                    hour: "numeric",
                                    minute: "2-digit",
                                  }
                                )}
                              </p>
                              <button
                                className="text-rose-600 hover:text-rose-800"
                                onClick={() => removeShiftFromSelection(shiftId)}
                                type="button"
                              >
                                <svg
                                  className="h-4 w-4"
                                  fill="none"
                                  stroke="currentColor"
                                  viewBox="0 0 24 24"
                                >
                                  <path
                                    d="M6 18L18 6M6 6l12 12"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                  />
                                </svg>
                              </button>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {event.isOffsite && (
                    <div className="space-y-3">
                      <p className="font-semibold text-slate-700 text-sm">
                        Transportation
                      </p>
                      <div className="flex items-center gap-2">
                        <input
                          checked={needsRide}
                          className="h-4 w-4 rounded border-slate-300 text-rose-600 focus:ring-rose-500"
                          id="needsRide"
                          onChange={(e) => {
                            setNeedsRide(e.target.checked);
                            if (e.target.checked) {
                              setCanDrive(false);
                            }
                          }}
                          type="checkbox"
                        />
                        <label
                          className="text-slate-700 text-sm"
                          htmlFor="needsRide"
                        >
                          I need a ride
                        </label>
                      </div>
                      <div className="flex items-center gap-2">
                        <input
                          checked={canDrive}
                          className="h-4 w-4 rounded border-slate-300 text-rose-600 focus:ring-rose-500"
                          id="canDrive"
                          onChange={(e) => {
                            setCanDrive(e.target.checked);
                            if (e.target.checked) {
                              setNeedsRide(false);
                            }
                          }}
                          type="checkbox"
                        />
                        <label
                          className="text-slate-700 text-sm"
                          htmlFor="canDrive"
                        >
                          I can drive
                        </label>
                      </div>

                      {canDrive && (
                        <div className="mt-4 space-y-3 rounded-lg border border-slate-200 bg-slate-50 p-4">
                          <p className="font-semibold text-slate-700 text-sm">
                            Driver Information
                          </p>
                          <div>
                            <label
                              className="block text-slate-700 text-sm"
                              htmlFor="carType"
                            >
                              Car Type
                            </label>
                            <input
                              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-rose-500 focus:outline-none focus:ring-2 focus:ring-rose-500"
                              id="carType"
                              onChange={(e) => setCarType(e.target.value)}
                              placeholder="e.g., Honda Civic"
                              required
                              type="text"
                              value={carType}
                            />
                          </div>
                          <div>
                            <label
                              className="block text-slate-700 text-sm"
                              htmlFor="carColor"
                            >
                              Car Color
                            </label>
                            <input
                              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-rose-500 focus:outline-none focus:ring-2 focus:ring-rose-500"
                              id="carColor"
                              onChange={(e) => setCarColor(e.target.value)}
                              placeholder="e.g., Blue"
                              required
                              type="text"
                              value={carColor}
                            />
                          </div>
                          <div>
                            <label
                              className="block text-slate-700 text-sm"
                              htmlFor="capacity"
                            >
                              Passenger Capacity
                            </label>
                            <input
                              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-rose-500 focus:outline-none focus:ring-2 focus:ring-rose-500"
                              id="capacity"
                              max="8"
                              min="1"
                              onChange={(e) =>
                                setCapacity(Number.parseInt(e.target.value, 10))
                              }
                              required
                              type="number"
                              value={capacity}
                            />
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {error && (
                    <div className="rounded-lg border border-rose-300 bg-rose-50 p-3 text-rose-700 text-sm">
                      {error}
                    </div>
                  )}

                  <div className="flex gap-3">
                    <button
                      className="flex-1 rounded-full border border-slate-300 px-4 py-2 font-semibold text-slate-700 text-sm transition hover:bg-slate-50"
                      onClick={() => {
                        setShowRsvpForm(false);
                        setSelectedShiftIds(new Set());
                        setError(null);
                      }}
                      type="button"
                    >
                      Cancel
                    </button>
                    <button
                      className="flex-1 rounded-full bg-rose-600 px-4 py-2 font-semibold text-sm text-white transition hover:bg-rose-700 disabled:bg-slate-400"
                      disabled={isSubmitting || (event.eventType === "boothing" && selectedShiftIds.size === 0)}
                      type="submit"
                    >
                      {isSubmitting ? "Submitting..." : "Confirm RSVP"}
                    </button>
                  </div>
                </form>
              ) : hasRsvped ? (
                <div className="space-y-3">
                  {userRsvps.map((rsvp) => (
                    <div
                      className="flex items-center justify-between rounded-lg border border-green-200 bg-green-50 p-4"
                      key={rsvp._id}
                    >
                      <div>
                        <p className="font-semibold text-green-900">
                          You&apos;re signed up!
                        </p>
                        {rsvp.shiftId && (() => {
                          const shift = event.shifts.find(
                            (s) => s._id === rsvp.shiftId
                          );
                          return shift ? (
                            <p className="mt-1 text-green-700 text-sm">
                              Shift:{" "}
                              {new Date(shift.startTime).toLocaleTimeString(
                                "en-US",
                                {
                                  hour: "numeric",
                                  minute: "2-digit",
                                }
                              )}
                            </p>
                          ) : null;
                        })()}
                        {rsvp.canDrive && (
                          <p className="mt-1 text-green-700 text-sm">
                            Driving: {rsvp.driverInfo?.carColor}{" "}
                            {rsvp.driverInfo?.carType}
                          </p>
                        )}
                        {rsvp.needsRide && (
                          <p className="mt-1 text-green-700 text-sm">
                            Needs a ride
                          </p>
                        )}
                      </div>
                      <button
                        className="rounded-full border border-rose-300 px-4 py-2 font-semibold text-rose-700 text-sm transition hover:bg-rose-50"
                        onClick={() => handleCancelRsvp(rsvp._id)}
                        type="button"
                      >
                        Cancel RSVP
                      </button>
                    </div>
                  ))}
                  {event.eventType === "boothing" && (
                    <button
                      className="w-full rounded-full border-2 border-rose-600 px-6 py-3 font-semibold text-rose-600 transition hover:bg-rose-50"
                      onClick={() => setShowRsvpForm(true)}
                      type="button"
                    >
                      Sign Up for Another Shift
                    </button>
                  )}
                </div>
              ) : (
                <button
                  className="w-full rounded-full bg-rose-600 px-6 py-3 font-semibold text-white transition hover:bg-rose-700"
                  onClick={() => setShowRsvpForm(true)}
                  type="button"
                >
                  RSVP to Event
                </button>
              )}
            </div>
          )}

          {!currentUser && (
            <div className="rounded-3xl border border-rose-300 bg-white p-8 text-center shadow-sm">
              <p className="text-slate-600">
                Please{" "}
                <button
                  className="font-semibold text-rose-600 hover:text-rose-700"
                  onClick={() => router.push("/signin")}
                >
                  sign in
                </button>{" "}
                to RSVP to this event.
              </p>
            </div>
          )}

          {currentUser?.role === "board" && (
            <div className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
              <h2 className="mb-4 font-semibold text-slate-900 text-xl">
                Attendees ({event.rsvps.length})
              </h2>
              {event.rsvps.length === 0 ? (
                <p className="text-center text-slate-600 text-sm">
                  No RSVPs yet
                </p>
              ) : (
                <div className="space-y-2">
                  {event.rsvps.map((rsvp) => (
                    <div
                      className="flex items-center justify-between rounded-lg border border-slate-200 bg-slate-50 p-3"
                      key={rsvp._id}
                    >
                      <div>
                        <p className="font-semibold text-slate-900 text-sm">
                          {rsvp.userName}
                        </p>
                        <p className="text-slate-600 text-xs">
                          {rsvp.userEmail}
                        </p>
                        {rsvp.canDrive && (
                          <p className="mt-1 text-blue-700 text-xs">
                            Driver: {rsvp.driverInfo?.carColor}{" "}
                            {rsvp.driverInfo?.carType}
                          </p>
                        )}
                        {rsvp.needsRide && (
                          <p className="mt-1 text-orange-700 text-xs">
                            Needs ride
                          </p>
                        )}
                      </div>
                      {rsvp.shiftId && (() => {
                        const shift = event.shifts.find((s) => s._id === rsvp.shiftId);
                        return shift ? (
                          <p className="text-slate-600 text-xs">
                            Shift:{" "}
                            {new Date(shift.startTime).toLocaleTimeString("en-US", {
                              hour: "numeric",
                              minute: "2-digit",
                            })}
                          </p>
                        ) : null;
                      })()}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
