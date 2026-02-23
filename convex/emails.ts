"use node";

import { v } from "convex/values";
import { Resend } from "resend";
import { api } from "./_generated/api";
import { action } from "./_generated/server";
import {
  generateDriverEmailHtml,
  generateDriverEmailSubject,
} from "./emails/carpool_driver_email";
import {
  generateRiderEmailHtml,
  generateRiderEmailSubject,
} from "./emails/carpool_rider_email";

export const sendCarpoolEmails = action({
  args: {
    eventId: v.id("events"),
  },
  returns: v.object({
    emailsSent: v.number(),
    emailsFailed: v.number(),
    carpoolsProcessed: v.number(),
  }),
  handler: async (
    ctx,
    args
  ): Promise<{
    emailsSent: number;
    emailsFailed: number;
    carpoolsProcessed: number;
  }> => {
    const currentUser = await ctx.runQuery(api.users.getCurrentUser);
    if (!currentUser || currentUser.role !== "board") {
      throw new Error("Only board members can send carpool emails");
    }

    const event = await ctx.runQuery(api.events.getEvent, {
      eventId: args.eventId,
    });

    if (!event) {
      throw new Error("Event not found");
    }

    const carpools = await ctx.runQuery(api.carpools.getCarpools, {
      eventId: args.eventId,
    });

    const resendApiKey = process.env.RESEND_API_KEY;
    if (!resendApiKey) {
      throw new Error("RESEND_API_KEY not configured");
    }

    const resend = new Resend(resendApiKey);

    const emailsSent: string[] = [];
    const emailsFailed: string[] = [];

    const eventDate = new Date(event.startTime).toLocaleDateString("en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });

    const eventTime = new Date(event.startTime).toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
    });

    for (const carpool of carpools) {
      if (carpool.status !== "finalized") {
        continue;
      }

      const driverEmail = carpool.driver.email;

      const driverEmailHtml = generateDriverEmailHtml({
        eventTitle: event.title,
        eventDate,
        eventTime,
        eventLocation: event.location,
        driverName: carpool.driver.name,
        carColor: carpool.driver.carColor,
        carType: carpool.driver.carType,
        capacity: carpool.driver.capacity,
        riders: carpool.riders.map((r) => ({
          name: r.name,
          email: r.email,
          phoneNumber: r.phoneNumber,
        })),
      });

      try {
        await resend.emails.send({
          from: "Cal Poly Red Cross Club <notifications@calpolyredcross.org>",
          to: [driverEmail],
          replyTo: "redcrossclub@calpoly.edu",
          subject: generateDriverEmailSubject(event.title),
          html: driverEmailHtml,
        });
        emailsSent.push(driverEmail);
      } catch (_error) {
        emailsFailed.push(driverEmail);
      }

      for (const rider of carpool.riders) {
        const otherRiders = carpool.riders
          .filter((r) => r.email !== rider.email)
          .map((r) => ({ name: r.name, phoneNumber: r.phoneNumber }));

        const riderEmailHtml = generateRiderEmailHtml({
          eventTitle: event.title,
          eventDate,
          eventTime,
          eventLocation: event.location,
          riderName: rider.name,
          driverName: carpool.driver.name,
          driverEmail: carpool.driver.email,
          driverPhoneNumber: carpool.driver.phoneNumber,
          carColor: carpool.driver.carColor,
          carType: carpool.driver.carType,
          otherRiders,
        });

        try {
          await resend.emails.send({
            from: "Cal Poly Red Cross Club <notifications@calpolyredcross.org>",
            to: [rider.email],
            replyTo: "redcrossclub@calpoly.edu",
            subject: generateRiderEmailSubject(event.title),
            html: riderEmailHtml,
          });
          emailsSent.push(rider.email);
        } catch (_error) {
          emailsFailed.push(rider.email);
        }
      }
    }

    return {
      emailsSent: emailsSent.length,
      emailsFailed: emailsFailed.length,
      carpoolsProcessed: carpools.filter((c) => c.status === "finalized")
        .length,
    };
  },
});
