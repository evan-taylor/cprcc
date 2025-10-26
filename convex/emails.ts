import { getAuthUserId } from "@convex-dev/auth/server";
import { v } from "convex/values";
import { api } from "./_generated/api";
import { action } from "./_generated/server";

export const sendCarpoolEmails = action({
  args: {
    eventId: v.id("events"),
  },
  handler: async (ctx, args): Promise<{
    emailsSent: number;
    emailsFailed: number;
    carpoolsProcessed: number;
  }> => {
    const authUserId = await getAuthUserId(ctx);
    if (!authUserId) {
      throw new Error("Not authenticated");
    }

    const userProfile = await ctx.runQuery(api.users.getCurrentUser);
    if (!userProfile || userProfile.role !== "board") {
      throw new Error("Only board members can send carpool emails");
    }

    const event = await ctx.runQuery(api.events.getEvent, {
      eventId: args.eventId,
    });

    if (!event) {
      throw new Error("Event not found");
    }

    const carpools = await ctx.runQuery(api.events.getCarpools, {
      eventId: args.eventId,
    });

    const resendApiKey = process.env.RESEND_API_KEY;
    if (!resendApiKey) {
      throw new Error("RESEND_API_KEY not configured");
    }

    const emailsSent: string[] = [];
    const emailsFailed: string[] = [];

    for (const carpool of carpools) {
      if (carpool.status !== "finalized") {
        continue;
      }

      const driverEmail = carpool.driver.email;
      const riderEmails = carpool.riders.map((r) => r.email);
      const _allEmails = [driverEmail, ...riderEmails];

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

      const driverEmailBody = `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background-color: #dc2626; color: white; padding: 20px; text-align: center; }
    .content { padding: 20px; background-color: #f9f9f9; }
    .carpool-info { background-color: white; padding: 15px; margin: 15px 0; border-left: 4px solid #dc2626; }
    .rider-list { list-style: none; padding: 0; }
    .rider-list li { padding: 8px; background-color: #f3f4f6; margin: 5px 0; border-radius: 4px; }
    .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>Cal Poly Red Cross Club</h1>
      <h2>Carpool Assignment - Driver</h2>
    </div>
    <div class="content">
      <h3>Event: ${event.title}</h3>
      <p><strong>Date:</strong> ${eventDate}</p>
      <p><strong>Time:</strong> ${eventTime}</p>
      <p><strong>Location:</strong> ${event.location}</p>
      
      <div class="carpool-info">
        <h4>Your Carpool Assignment</h4>
        <p><strong>Role:</strong> Driver</p>
        <p><strong>Your Vehicle:</strong> ${carpool.driver.carColor} ${carpool.driver.carType}</p>
        <p><strong>Capacity:</strong> ${carpool.driver.capacity} passengers</p>
        
        <h4>Your Passengers:</h4>
        ${
          carpool.riders.length > 0
            ? `
        <ul class="rider-list">
          ${carpool.riders.map((rider) => `<li>${rider.name} (${rider.email})</li>`).join("")}
        </ul>
        `
            : "<p>No passengers assigned to your vehicle.</p>"
        }
      </div>
      
      <p>Please coordinate with your passengers about pickup times and locations. If you have any questions or need to make changes, please contact the board.</p>
    </div>
    <div class="footer">
      <p>Cal Poly Red Cross Club</p>
      <p>Questions? Reply to this email or contact us at redcrossclub@calpoly.edu</p>
    </div>
  </div>
</body>
</html>
      `.trim();

      try {
        const driverResponse = await fetch("https://api.resend.com/emails", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${resendApiKey}`,
          },
          body: JSON.stringify({
            from: "Cal Poly Red Cross Club <noreply@resend.dev>",
            to: [driverEmail],
            reply_to: "redcrossclub@calpoly.edu",
            subject: `Carpool Assignment: ${event.title} - Driver`,
            html: driverEmailBody,
          }),
        });

        if (driverResponse.ok) {
          emailsSent.push(driverEmail);
        } else {
          emailsFailed.push(driverEmail);
        }
      } catch (_error) {
        emailsFailed.push(driverEmail);
      }

      for (const rider of carpool.riders) {
        const riderEmailBody = `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background-color: #dc2626; color: white; padding: 20px; text-align: center; }
    .content { padding: 20px; background-color: #f9f9f9; }
    .carpool-info { background-color: white; padding: 15px; margin: 15px 0; border-left: 4px solid #dc2626; }
    .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>Cal Poly Red Cross Club</h1>
      <h2>Carpool Assignment - Rider</h2>
    </div>
    <div class="content">
      <h3>Event: ${event.title}</h3>
      <p><strong>Date:</strong> ${eventDate}</p>
      <p><strong>Time:</strong> ${eventTime}</p>
      <p><strong>Location:</strong> ${event.location}</p>
      
      <div class="carpool-info">
        <h4>Your Carpool Assignment</h4>
        <p><strong>Role:</strong> Passenger</p>
        <p><strong>Driver:</strong> ${carpool.driver.name} (${carpool.driver.email})</p>
        <p><strong>Vehicle:</strong> ${carpool.driver.carColor} ${carpool.driver.carType}</p>
        
        <h4>Other Passengers:</h4>
        ${
          carpool.riders.filter((r) => r.email !== rider.email).length > 0
            ? `
        <ul class="rider-list">
          ${carpool.riders
            .filter((r) => r.email !== rider.email)
            .map((r) => `<li>${r.name}</li>`)
            .join("")}
        </ul>
        `
            : "<p>You are the only passenger in this carpool.</p>"
        }
      </div>
      
      <p>Please coordinate with your driver about pickup times and locations. Make sure to be ready on time!</p>
    </div>
    <div class="footer">
      <p>Cal Poly Red Cross Club</p>
      <p>Questions? Reply to this email or contact us at redcrossclub@calpoly.edu</p>
    </div>
  </div>
</body>
</html>
        `.trim();

        try {
          const riderResponse = await fetch("https://api.resend.com/emails", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${resendApiKey}`,
            },
            body: JSON.stringify({
              from: "Cal Poly Red Cross Club <noreply@resend.dev>",
              to: [rider.email],
              reply_to: "redcrossclub@calpoly.edu",
              subject: `Carpool Assignment: ${event.title} - Passenger`,
              html: riderEmailBody,
            }),
          });

          if (riderResponse.ok) {
            emailsSent.push(rider.email);
          } else {
            emailsFailed.push(rider.email);
          }
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
