"use client";

import { useQuery } from "convex/react";
import Link from "next/link";
import SiteHeader from "@/components/site-header";
import { api } from "@/convex/_generated/api";

export default function EventsPage() {
  const events = useQuery(api.events.listUpcomingEvents);
  const currentUser = useQuery(api.users.getCurrentUser);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <SiteHeader />
      <main className="mx-auto flex w-full max-w-5xl flex-col gap-16 px-4 pt-10 pb-16 sm:px-8 md:px-12">
        <header className="space-y-6">
          <p className="text-rose-700 text-sm uppercase tracking-[0.2em]">
            Events & RSVP
          </p>
          <h1 className="font-semibold text-4xl text-slate-900">
            See where we&apos;re serving next
          </h1>
          <p className="text-lg text-slate-700">
            Browse upcoming volunteer opportunities, RSVP to events, and manage
            your participation in Red Cross activities.
          </p>
        </header>

        {currentUser?.role === "board" && (
          <div className="flex justify-end">
            <Link
              className="rounded-full bg-rose-600 px-6 py-3 font-semibold text-sm text-white transition hover:bg-rose-700"
              href="/events/create"
            >
              Create Event
            </Link>
          </div>
        )}

        {events === undefined ? (
          <div className="rounded-3xl border border-slate-200 bg-white p-10 text-center shadow-sm">
            <p className="text-slate-600">Loading events...</p>
          </div>
        ) : events.length === 0 ? (
          <section className="rounded-3xl border border-rose-300 border-dashed bg-white p-10 text-center shadow-sm">
            <h2 className="font-semibold text-2xl text-slate-900">
              No upcoming events
            </h2>
            <p className="mt-3 text-slate-600 text-sm">
              Check back soon for new volunteer opportunities, or follow us on
              Instagram and GroupMe for updates.
            </p>
            <div className="mt-6 flex flex-wrap justify-center gap-3 font-semibold text-sm">
              <a
                className="rounded-full border border-rose-200 px-5 py-2 text-rose-700 transition hover:border-rose-400"
                href="https://www.instagram.com/calpolyredcrossclub"
                rel="noopener noreferrer"
                target="_blank"
              >
                Instagram updates
              </a>
              <a
                className="rounded-full border border-rose-200 px-5 py-2 text-rose-700 transition hover:border-rose-400"
                href="https://groupme.com/join_group/103395902/FeigA9Y5"
                rel="noopener noreferrer"
                target="_blank"
              >
                Join the GroupMe
              </a>
            </div>
          </section>
        ) : (
          <section className="space-y-6">
            {events.map((event) => {
              const eventDate = new Date(event.startTime);
              const endDate = new Date(event.endTime);

              return (
                <Link
                  className="block rounded-3xl border border-slate-200 bg-white p-8 shadow-sm transition hover:border-rose-300 hover:shadow-md"
                  href={`/events/${event.slug ?? event._id}`}
                  key={event._id}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3">
                        <h2 className="font-semibold text-2xl text-slate-900">
                          {event.title}
                        </h2>
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
                      <p className="mt-3 text-slate-600">{event.description}</p>
                      <div className="mt-4 flex flex-wrap gap-4 text-slate-700 text-sm">
                        <div>
                          <span className="font-semibold">Date:</span>{" "}
                          {eventDate.toLocaleDateString("en-US", {
                            weekday: "long",
                            year: "numeric",
                            month: "long",
                            day: "numeric",
                          })}
                        </div>
                        <div>
                          <span className="font-semibold">Time:</span>{" "}
                          {eventDate.toLocaleTimeString("en-US", {
                            hour: "numeric",
                            minute: "2-digit",
                          })}{" "}
                          -{" "}
                          {endDate.toLocaleTimeString("en-US", {
                            hour: "numeric",
                            minute: "2-digit",
                          })}
                        </div>
                        <div>
                          <span className="font-semibold">Location:</span>{" "}
                          {event.location}
                        </div>
                      </div>
                    </div>
                    <div className="flex-shrink-0">
                      <span className="inline-block rounded-full bg-rose-600 px-4 py-2 font-semibold text-sm text-white">
                        View Details
                      </span>
                    </div>
                  </div>
                </Link>
              );
            })}
          </section>
        )}
      </main>
    </div>
  );
}
