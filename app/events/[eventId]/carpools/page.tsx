"use client";

import { useAction, useMutation, useQuery } from "convex/react";
import { useParams, useRouter } from "next/navigation";
import { useState } from "react";
import SiteHeader from "@/components/site-header";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";

export default function CarpoolManagementPage() {
  const params = useParams();
  const router = useRouter();
  const eventId = params.eventId as Id<"events">;

  const event = useQuery(api.events.getEvent, { eventId });
  const currentUser = useQuery(api.users.getCurrentUser);
  const carpools = useQuery(api.events.getCarpools, { eventId });
  const generateCarpools = useMutation(api.events.generateCarpools);
  const finalizeCarpools = useMutation(api.events.finalizeCarpools);
  const sendCarpoolEmails = useAction(api.emails.sendCarpoolEmails);

  const [isGenerating, setIsGenerating] = useState(false);
  const [isFinalizing, setIsFinalizing] = useState(false);
  const [isSendingEmails, setIsSendingEmails] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

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

  const drivers = event.rsvps.filter((rsvp) => rsvp.canDrive);
  const riders = event.rsvps.filter((rsvp) => rsvp.needsRide);
  const allFinalized =
    carpools.length > 0 && carpools.every((c) => c.status === "finalized");

  return (
    <div className="min-h-screen bg-slate-50">
      <SiteHeader />
      <main className="mx-auto w-full max-w-5xl px-4 pt-10 pb-16 sm:px-8">
        <div className="mb-6">
          <button
            className="text-rose-600 text-sm hover:text-rose-700"
            onClick={() => router.push(`/events/${eventId}`)}
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
          <div className="space-y-6">
            <h2 className="font-semibold text-2xl text-slate-900">
              Carpool Assignments ({carpools.length})
            </h2>
            {carpools.map((carpool, index) => (
              <div
                className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm"
                key={carpool.carpoolId}
              >
                <div className="mb-4 flex items-center justify-between">
                  <h3 className="font-semibold text-slate-900 text-xl">
                    Carpool {index + 1}
                  </h3>
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
                    Vehicle: {carpool.driver.carColor} {carpool.driver.carType}
                  </p>
                  <p className="text-blue-700 text-sm">
                    Capacity: {carpool.driver.capacity} passengers
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
                          className="rounded-lg border border-slate-200 bg-slate-50 p-3"
                          key={rider.rsvpId}
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
            ))}
          </div>
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
