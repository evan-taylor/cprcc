"use client";

import {
  closestCenter,
  DndContext,
  type DragEndEvent,
  DragOverlay,
  type DragStartEvent,
  MouseSensor,
  TouchSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import { useAction, useMutation, useQuery } from "convex/react";
import { useParams, useRouter } from "next/navigation";
import { useState } from "react";
import SiteHeader from "@/components/site-header";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";

const CONVEX_ID_PATTERN = /^[a-z0-9]{32}$/;

export default function CarpoolManagementPage() {
  const params = useParams();
  const router = useRouter();
  const eventIdOrSlug = params.eventId as string;

  const isSlug =
    eventIdOrSlug.includes("-") || !eventIdOrSlug.match(CONVEX_ID_PATTERN);

  const eventById = useQuery(
    api.events.getEvent,
    isSlug ? undefined : { eventId: eventIdOrSlug as Id<"events"> }
  );
  const eventBySlug = useQuery(
    api.events.getEventBySlug,
    isSlug ? { slug: eventIdOrSlug } : undefined
  );

  const event = isSlug ? eventBySlug : eventById;
  const eventId = event?._id as Id<"events"> | undefined;

  const currentUser = useQuery(api.users.getCurrentUser);
  const carpools = useQuery(
    api.events.getCarpools,
    eventId ? { eventId } : undefined
  );
  const generateCarpools = useMutation(api.events.generateCarpools);
  const finalizeCarpools = useMutation(api.events.finalizeCarpools);
  const sendCarpoolEmails = useAction(api.emails.sendCarpoolEmails);
  const reassignRider = useMutation(api.events.reassignRider);

  const [isGenerating, setIsGenerating] = useState(false);
  const [isFinalizing, setIsFinalizing] = useState(false);
  const [isSendingEmails, setIsSendingEmails] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [activeRider, setActiveRider] = useState<{
    rsvpId: Id<"rsvps">;
    name: string;
    email: string;
  } | null>(null);

  const sensors = useSensors(
    useSensor(MouseSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(TouchSensor, {
      activationConstraint: {
        delay: 200,
        tolerance: 6,
      },
    })
  );

  if (
    event === undefined ||
    currentUser === undefined ||
    carpools === undefined
  ) {
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
              Only board members can manage carpools.
            </p>
          </div>
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
          </div>
        </div>
      </div>
    );
  }

  if (!event.isOffsite) {
    return (
      <div className="min-h-screen bg-slate-50">
        <SiteHeader />
        <div className="flex items-center justify-center pt-20">
          <div className="rounded-3xl border border-rose-300 bg-white p-10 text-center shadow-sm">
            <h1 className="font-semibold text-2xl text-slate-900">
              Not an Offsite Event
            </h1>
            <p className="mt-3 text-slate-600">
              Carpools are only available for offsite events.
            </p>
          </div>
        </div>
      </div>
    );
  }

  const handleGenerateCarpools = async () => {
    setError(null);
    setSuccess(null);
    setIsGenerating(true);

    try {
      const result = await generateCarpools({ eventId });
      setSuccess(
        `Generated ${result.carpoolsCreated} carpools. ${result.ridersAssigned} riders assigned, ${result.ridersUnassigned} unassigned.`
      );
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to generate carpools"
      );
    } finally {
      setIsGenerating(false);
    }
  };

  const handleFinalizeCarpools = async () => {
    setError(null);
    setSuccess(null);
    setIsFinalizing(true);

    try {
      const result = await finalizeCarpools({ eventId });
      setSuccess(`Finalized ${result.carpoolsFinalized} carpools.`);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to finalize carpools"
      );
    } finally {
      setIsFinalizing(false);
    }
  };

  const handleSendEmails = async () => {
    setError(null);
    setSuccess(null);
    setIsSendingEmails(true);

    try {
      const result = await sendCarpoolEmails({ eventId });
      setSuccess(
        `Sent ${result.emailsSent} emails successfully. ${result.emailsFailed} failed.`
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to send emails");
    } finally {
      setIsSendingEmails(false);
    }
  };

  const handleDragStart = (event: DragStartEvent) => {
    const riderId = event.active.id.toString().replace("rider:", "");
    const rider = carpools
      .flatMap((c) => c.riders)
      .find((r) => r.rsvpId === riderId);
    if (rider) {
      setActiveRider({
        rsvpId: rider.rsvpId as Id<"rsvps">,
        name: rider.name,
        email: rider.email,
      });
    }
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveRider(null);

    if (!over || active.id === over.id) {
      return;
    }

    const riderId = active.id.toString().replace("rider:", "") as Id<"rsvps">;
    const targetId = over.id.toString();

    await performReassignment(riderId, targetId);
  };

  const performReassignment = async (riderId: string, targetId: string) => {
    const fromCarpool = carpools.find((c) =>
      c.riders.some((r) => r.rsvpId === riderId)
    );

    let toCarpoolId: Id<"carpools"> | undefined;
    if (targetId !== "unassigned") {
      toCarpoolId = targetId.replace("carpool:", "") as Id<"carpools">;
      const toCarpool = carpools.find((c) => c.carpoolId === toCarpoolId);

      if (toCarpool && toCarpool.riders.length >= toCarpool.driver.capacity) {
        setError("Target carpool is at capacity");
        return;
      }
    }

    try {
      await reassignRider({
        eventId,
        riderRsvpId: riderId as Id<"rsvps">,
        fromCarpoolId: fromCarpool?.carpoolId,
        toCarpoolId,
      });
      setSuccess("Rider reassigned successfully");
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to reassign rider");
    }
  };

  const drivers = event.rsvps.filter((rsvp) => rsvp.canDrive);
  const riders = event.rsvps.filter((rsvp) => rsvp.needsRide);
  const allFinalized =
    carpools.length > 0 && carpools.every((c) => c.status === "finalized");
  const anyDraft = carpools.some((c) => c.status === "draft");

  const assignedRiderIds = new Set(
    carpools.flatMap((c) => c.riders.map((r) => r.rsvpId))
  );
  const unassignedRiders = event.rsvps.filter(
    (rsvp) => rsvp.needsRide && !assignedRiderIds.has(rsvp._id)
  );

  return (
    <div className="min-h-screen bg-slate-50">
      <SiteHeader />
      <main className="mx-auto w-full max-w-5xl px-4 pt-10 pb-16 sm:px-8">
        <div className="mb-6">
          <button
            className="text-rose-600 text-sm hover:text-rose-700"
            onClick={() => router.push(`/events/${event.slug ?? event._id}`)}
          >
            ← Back to Event
          </button>
        </div>

        <header className="mb-8">
          <h1 className="font-semibold text-4xl text-slate-900">
            Carpool Management
          </h1>
          <p className="mt-2 text-slate-600">{event.title}</p>
        </header>

        {error && (
          <div className="mb-6 rounded-lg border border-rose-300 bg-rose-50 p-4 text-rose-700">
            {error}
          </div>
        )}

        {success && (
          <div className="mb-6 rounded-lg border border-green-300 bg-green-50 p-4 text-green-700">
            {success}
          </div>
        )}

        <div className="mb-8 grid gap-6 sm:grid-cols-3">
          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <p className="font-semibold text-slate-700 text-sm">Total RSVPs</p>
            <p className="mt-2 font-bold text-3xl text-slate-900">
              {event.rsvps.length}
            </p>
          </div>
          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <p className="font-semibold text-slate-700 text-sm">Drivers</p>
            <p className="mt-2 font-bold text-3xl text-blue-600">
              {drivers.length}
            </p>
          </div>
          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <p className="font-semibold text-slate-700 text-sm">Need Rides</p>
            <p className="mt-2 font-bold text-3xl text-orange-600">
              {riders.length}
            </p>
          </div>
        </div>

        <div className="mb-8 rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
          <h2 className="mb-4 font-semibold text-slate-900 text-xl">
            Carpool Actions
          </h2>
          <div className="flex flex-wrap gap-3">
            <button
              className="rounded-full bg-rose-600 px-6 py-3 font-semibold text-sm text-white transition hover:bg-rose-700 disabled:bg-slate-400"
              disabled={isGenerating || drivers.length === 0}
              onClick={handleGenerateCarpools}
            >
              {isGenerating ? "Generating..." : "Generate Carpools"}
            </button>
            <button
              className="rounded-full bg-green-600 px-6 py-3 font-semibold text-sm text-white transition hover:bg-green-700 disabled:bg-slate-400"
              disabled={isFinalizing || carpools.length === 0 || allFinalized}
              onClick={handleFinalizeCarpools}
            >
              {isFinalizing ? "Finalizing..." : "Finalize Carpools"}
            </button>
            <button
              className="rounded-full bg-blue-600 px-6 py-3 font-semibold text-sm text-white transition hover:bg-blue-700 disabled:bg-slate-400"
              disabled={isSendingEmails || !allFinalized}
              onClick={handleSendEmails}
            >
              {isSendingEmails ? "Sending..." : "Send Email Notifications"}
            </button>
          </div>
          <p className="mt-4 text-slate-600 text-sm">
            Generate carpools to automatically assign riders to drivers.
            Finalize when you&apos;re happy with the assignments, then send
            email notifications to all participants.
          </p>
        </div>

        {carpools.length === 0 ? (
          <div className="rounded-3xl border border-slate-200 bg-white p-10 text-center shadow-sm">
            <p className="text-slate-600">
              No carpools generated yet. Click &quot;Generate Carpools&quot; to
              create assignments.
            </p>
          </div>
        ) : (
          <DndContext
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
            onDragStart={handleDragStart}
            sensors={sensors}
          >
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h2 className="font-semibold text-2xl text-slate-900">
                  Carpool Assignments ({carpools.length})
                </h2>
                {anyDraft && (
                  <p className="text-slate-600 text-sm">
                    💡 Drag passengers between carpools to reassign
                  </p>
                )}
              </div>

              {unassignedRiders.length > 0 && (
                <div
                  className="rounded-3xl border-2 border-orange-300 border-dashed bg-orange-50 p-8 shadow-sm"
                  data-droppable-id="unassigned"
                >
                  <div className="mb-4 flex items-center justify-between">
                    <h3 className="font-semibold text-orange-900 text-xl">
                      Unassigned Riders ({unassignedRiders.length})
                    </h3>
                    <span className="rounded-full bg-orange-200 px-3 py-1 font-semibold text-orange-800 text-xs uppercase tracking-wide">
                      Need Assignment
                    </span>
                  </div>
                  <div className="space-y-2">
                    {unassignedRiders.map((rsvp) => (
                      <div
                        className="cursor-move rounded-lg border border-orange-300 bg-white p-3 shadow-sm transition hover:shadow-md"
                        draggable={anyDraft}
                        key={rsvp._id}
                        onDragStart={(e) => {
                          e.dataTransfer.effectAllowed = "move";
                          e.dataTransfer.setData(
                            "text/plain",
                            `rider:${rsvp._id}`
                          );
                        }}
                      >
                        <p className="font-semibold text-slate-900 text-sm">
                          {rsvp.userName}
                        </p>
                        <p className="text-slate-600 text-xs">
                          {rsvp.userEmail}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {carpools.map((carpool, index) => {
                const isFull = carpool.riders.length >= carpool.driver.capacity;
                const isDraft = carpool.status === "draft";

                return (
                  <div
                    className={`rounded-3xl border-2 bg-white p-8 shadow-sm transition ${
                      isDraft && !isFull
                        ? "border-slate-200 hover:border-blue-300"
                        : isDraft && isFull
                          ? "border-slate-300 bg-slate-50"
                          : "border-green-200"
                    }`}
                    data-droppable-id={`carpool:${carpool.carpoolId}`}
                    key={carpool.carpoolId}
                    onDragLeave={(e) => {
                      e.currentTarget.classList.remove(
                        "ring-2",
                        "ring-blue-400"
                      );
                    }}
                    onDragOver={(e) => {
                      if (isDraft && !isFull) {
                        e.preventDefault();
                        e.currentTarget.classList.add(
                          "ring-2",
                          "ring-blue-400"
                        );
                      }
                    }}
                    onDrop={(e) => {
                      e.preventDefault();
                      e.currentTarget.classList.remove(
                        "ring-2",
                        "ring-blue-400"
                      );

                      if (!isDraft || isFull) return;

                      const riderId = e.dataTransfer
                        .getData("text/plain")
                        .replace("rider:", "");
                      performReassignment(
                        riderId,
                        `carpool:${carpool.carpoolId}`
                      );
                    }}
                  >
                    <div className="mb-4 flex items-center justify-between">
                      <h3 className="font-semibold text-slate-900 text-xl">
                        Carpool {index + 1}
                      </h3>
                      <div className="flex items-center gap-2">
                        <span
                          className={`rounded-full px-3 py-1 font-semibold text-xs ${
                            isFull
                              ? "bg-red-100 text-red-700"
                              : "bg-blue-100 text-blue-700"
                          }`}
                        >
                          {carpool.riders.length}/{carpool.driver.capacity}{" "}
                          seats
                        </span>
                        <span
                          className={`rounded-full px-3 py-1 font-semibold text-xs uppercase tracking-wide ${
                            carpool.status === "finalized"
                              ? "bg-green-100 text-green-700"
                              : "bg-yellow-100 text-yellow-700"
                          }`}
                        >
                          {carpool.status}
                        </span>
                      </div>
                    </div>

                    <div className="mb-6 rounded-lg border border-blue-200 bg-blue-50 p-4">
                      <p className="mb-2 font-semibold text-blue-900 text-sm uppercase tracking-wide">
                        Driver
                      </p>
                      <p className="font-semibold text-blue-900">
                        {carpool.driver.name}
                      </p>
                      <p className="text-blue-700 text-sm">
                        {carpool.driver.email}
                      </p>
                      <p className="mt-2 text-blue-700 text-sm">
                        Vehicle: {carpool.driver.carColor}{" "}
                        {carpool.driver.carType}
                      </p>
                    </div>

                    <div>
                      <p className="mb-3 font-semibold text-slate-900 text-sm uppercase tracking-wide">
                        Passengers ({carpool.riders.length})
                      </p>
                      {carpool.riders.length === 0 ? (
                        <p className="text-center text-slate-600 text-sm">
                          No passengers assigned
                        </p>
                      ) : (
                        <div className="space-y-2">
                          {carpool.riders.map((rider) => (
                            <div
                              className={`rounded-lg border border-slate-200 bg-slate-50 p-3 ${
                                isDraft ? "cursor-move hover:bg-slate-100" : ""
                              }`}
                              draggable={isDraft}
                              key={rider.rsvpId}
                              onDragStart={(e) => {
                                if (!isDraft) {
                                  e.preventDefault();
                                  return;
                                }
                                e.dataTransfer.effectAllowed = "move";
                                e.dataTransfer.setData(
                                  "text/plain",
                                  `rider:${rider.rsvpId}`
                                );
                              }}
                            >
                              <p className="font-semibold text-slate-900 text-sm">
                                {rider.name}
                              </p>
                              <p className="text-slate-600 text-xs">
                                {rider.email}
                              </p>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            <DragOverlay>
              {activeRider && (
                <div className="cursor-grabbing rounded-lg border-2 border-blue-400 bg-white p-3 shadow-xl">
                  <p className="font-semibold text-slate-900 text-sm">
                    {activeRider.name}
                  </p>
                  <p className="text-slate-600 text-xs">{activeRider.email}</p>
                </div>
              )}
            </DragOverlay>
          </DndContext>
        )}

        {drivers.length === 0 && riders.length > 0 && (
          <div className="mt-6 rounded-lg border border-orange-300 bg-orange-50 p-4 text-orange-700">
            <p className="font-semibold">Warning:</p>
            <p className="mt-1 text-sm">
              There are {riders.length} people who need rides but no drivers
              available. Please encourage some attendees to offer to drive.
            </p>
          </div>
        )}
      </main>
    </div>
  );
}
