"use client";

import { useQuery } from "convex/react";
import Link from "next/link";
import { useEffect } from "react";
import SiteHeader from "@/components/site-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { api } from "@/convex/_generated/api";

export default function EventsPage() {
  useEffect(() => {
    document.title = "Events & RSVP | Cal Poly Red Cross Club";
    const metaDescription = document.querySelector('meta[name="description"]');
    if (metaDescription) {
      metaDescription.setAttribute(
        "content",
        "Browse upcoming Cal Poly Red Cross Club volunteer opportunities and events. RSVP to blood drives, disaster relief training, and community service events at Cal Poly SLO."
      );
    }
  }, []);
  const events = useQuery(api.events.listUpcomingEvents);
  const currentUser = useQuery(api.users.getCurrentUser);
  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white text-slate-900">
      <SiteHeader />
      <main className="mx-auto w-full max-w-7xl px-4 pt-24 pb-20 sm:px-6 lg:px-8">
        <header className="mb-12 space-y-4">
          <p className="font-display font-semibold text-red-600 text-sm uppercase tracking-wider">
            Events & RSVP
          </p>
          <h1 className="font-bold font-display text-4xl text-slate-900 tracking-tight sm:text-5xl">
            See where we&apos;re serving next
          </h1>
          <p className="max-w-2xl text-lg text-slate-900 leading-relaxed">
            Browse upcoming volunteer opportunities, RSVP to events, and manage
            your participation in Red Cross activities.
          </p>
        </header>

        {currentUser?.role === "board" && (
          <div className="mb-8 flex justify-end">
            <Link href="/events/create">
              <Button size="lg">
                <svg
                  className="h-4 w-4"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={2}
                  viewBox="0 0 24 24"
                >
                  <title>Plus icon</title>
                  <path
                    d="M12 4v16m8-8H4"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
                Create Event
              </Button>
            </Link>
          </div>
        )}

        {events === undefined && (
          <Card className="p-12 text-center">
            <div className="flex items-center justify-center gap-3">
              <div className="h-5 w-5 animate-spin rounded-full border-2 border-slate-300 border-t-red-600" />
              <p className="text-slate-900">Loading events...</p>
            </div>
          </Card>
        )}

        {events !== undefined && events.length === 0 && (
          <Card className="border-2 border-red-200 border-dashed bg-red-50/30 p-12 text-center">
            <div className="mx-auto max-w-md space-y-4">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-red-100">
                <svg
                  className="h-8 w-8 text-red-600"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={2}
                  viewBox="0 0 24 24"
                >
                  <path
                    d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </div>
              <h2 className="font-display font-semibold text-2xl text-slate-900">
                No upcoming events
              </h2>
              <p className="text-slate-900">
                Check back soon for new volunteer opportunities, or follow us on
                Instagram and GroupMe for updates.
              </p>
              <div className="flex flex-wrap justify-center gap-3 pt-2">
                <a
                  className="inline-flex items-center gap-2 rounded-full border-2 border-red-200 bg-white px-5 py-2.5 font-semibold text-red-700 text-sm transition hover:border-red-300 hover:bg-red-50"
                  href="https://www.instagram.com/calpolyredcrossclub"
                  rel="noopener noreferrer"
                  target="_blank"
                >
                  <svg
                    className="h-4 w-4"
                    fill="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
                  </svg>
                  Instagram
                </a>
                <a
                  className="inline-flex items-center gap-2 rounded-full border-2 border-red-200 bg-white px-5 py-2.5 font-semibold text-red-700 text-sm transition hover:border-red-300 hover:bg-red-50"
                  href="https://groupme.com/join_group/103395902/FeigA9Y5"
                  rel="noopener noreferrer"
                  target="_blank"
                >
                  <svg
                    className="h-4 w-4"
                    fill="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm0 22C6.486 22 2 17.514 2 12S6.486 2 12 2s10 4.486 10 10-4.486 10-10 10zm1-17h-2v8h2V5zm0 10h-2v2h2v-2z" />
                  </svg>
                  GroupMe
                </a>
              </div>
            </div>
          </Card>
        )}

        {events !== undefined && events.length > 0 && (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {events.map((event) => {
              const eventDate = new Date(event.startTime);
              const endDate = new Date(event.endTime);

              return (
                <Link
                  className="group block transition-transform hover:scale-[1.02]"
                  href={`/events/${event.slug ?? event._id}`}
                  key={event._id}
                >
                  <Card className="h-full overflow-hidden transition-all group-hover:border-red-300 group-hover:shadow-lg">
                    <CardContent className="p-6">
                      <div className="mb-3 flex items-start justify-between gap-2">
                        <div className="flex flex-wrap gap-2">
                          {event.eventType === "boothing" && (
                            <Badge variant="primary">Shifts</Badge>
                          )}
                          {event.isOffsite && (
                            <Badge variant="secondary">Offsite</Badge>
                          )}
                        </div>
                        <div className="flex-shrink-0 rounded-lg bg-red-50 px-3 py-1.5 text-center">
                          <div className="font-bold font-display text-2xl text-red-600 leading-none">
                            {eventDate.getDate()}
                          </div>
                          <div className="font-semibold text-red-600 text-xs uppercase">
                            {eventDate.toLocaleDateString("en-US", {
                              month: "short",
                            })}
                          </div>
                        </div>
                      </div>
                      <h2 className="mb-2 font-display font-semibold text-slate-900 text-xl leading-tight transition-colors group-hover:text-red-600">
                        {event.title}
                      </h2>
                      <p className="mb-4 line-clamp-2 text-slate-900 text-sm leading-relaxed">
                        {event.description}
                      </p>
                      <div className="space-y-2 border-slate-100 border-t pt-4 text-sm">
                        <div className="flex items-center gap-2 text-slate-900">
                          <svg
                            className="h-4 w-4 flex-shrink-0 text-slate-900"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth={2}
                            viewBox="0 0 24 24"
                          >
                            <path
                              d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            />
                          </svg>
                          <span>
                            {eventDate.toLocaleTimeString("en-US", {
                              hour: "numeric",
                              minute: "2-digit",
                            })}{" "}
                            -{" "}
                            {endDate.toLocaleTimeString("en-US", {
                              hour: "numeric",
                              minute: "2-digit",
                            })}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 text-slate-900">
                          <svg
                            className="h-4 w-4 flex-shrink-0 text-slate-900"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth={2}
                            viewBox="0 0 24 24"
                          >
                            <path
                              d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            />
                            <path
                              d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            />
                          </svg>
                          <span className="line-clamp-1">{event.location}</span>
                        </div>
                      </div>
                      <div className="mt-4 flex items-center justify-between border-slate-100 border-t pt-4">
                        <span className="font-semibold text-red-600 text-sm group-hover:underline">
                          View Details →
                        </span>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}
