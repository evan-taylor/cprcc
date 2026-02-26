import { v } from "convex/values";
import type { Id } from "./_generated/dataModel";
import type { MutationCtx } from "./_generated/server";
import { mutation, query } from "./_generated/server";
import { requireBoardMember } from "./lib/auth";

function deduplicateByUser<
  T extends { userProfileId: string; createdAt: number },
>(rsvps: T[]): T[] {
  const byUser = new Map<string, T>();
  for (const rsvp of rsvps) {
    const existing = byUser.get(rsvp.userProfileId);
    if (!existing || rsvp.createdAt > existing.createdAt) {
      byUser.set(rsvp.userProfileId, rsvp);
    }
  }
  return Array.from(byUser.values());
}

async function deleteExistingCarpools(ctx: MutationCtx, eventId: Id<"events">) {
  const existingCarpools = await ctx.db
    .query("carpools")
    .withIndex("by_event", (q) => q.eq("eventId", eventId))
    .collect();

  for (const carpool of existingCarpools) {
    const members = await ctx.db
      .query("carpoolMembers")
      .withIndex("by_carpool", (q) => q.eq("carpoolId", carpool._id))
      .collect();
    for (const member of members) {
      await ctx.db.delete(member._id);
    }
    await ctx.db.delete(carpool._id);
  }
}

function assignRidersToDrivers<
  D extends { _id: string; driverInfo?: { capacity: number } | undefined },
  R extends { _id: string },
>(drivers: D[], riders: R[]) {
  const unassigned = [...riders];
  const assignments: Array<{
    driverRsvpId: D["_id"];
    riderRsvpIds: R["_id"][];
  }> = [];

  for (const driver of drivers) {
    const capacity = driver.driverInfo?.capacity ?? 0;
    const assigned: R["_id"][] = [];

    for (let i = 0; i < capacity && unassigned.length > 0; i++) {
      const rider = unassigned.shift();
      if (rider) {
        assigned.push(rider._id);
      }
    }

    assignments.push({ driverRsvpId: driver._id, riderRsvpIds: assigned });
  }

  return { assignments, unassignedCount: unassigned.length };
}

export const generateCarpools = mutation({
  args: {
    eventId: v.id("events"),
  },
  returns: v.object({
    carpoolsCreated: v.number(),
    ridersAssigned: v.number(),
    ridersUnassigned: v.number(),
  }),
  handler: async (ctx, args) => {
    await requireBoardMember(ctx);

    const event = await ctx.db.get(args.eventId);
    if (!event) {
      throw new Error("Event not found");
    }

    if (!event.isOffsite) {
      throw new Error("Can only generate carpools for offsite events");
    }

    const rsvps = await ctx.db
      .query("rsvps")
      .withIndex("by_event", (q) => q.eq("eventId", args.eventId))
      .collect();

    const drivers = deduplicateByUser(
      rsvps.filter(
        (rsvp) => rsvp.canDrive && rsvp.driverInfo && !rsvp.selfTransport
      )
    );
    const riders = deduplicateByUser(
      rsvps.filter((rsvp) => rsvp.needsRide && !rsvp.selfTransport)
    );

    if (riders.length > 0 && drivers.length === 0) {
      throw new Error("No drivers available for riders");
    }

    await deleteExistingCarpools(ctx, args.eventId);

    const { assignments, unassignedCount } = assignRidersToDrivers(
      drivers,
      riders
    );

    for (const assignment of assignments) {
      const carpoolId = await ctx.db.insert("carpools", {
        eventId: args.eventId,
        driverRsvpId: assignment.driverRsvpId,
        status: "draft",
        createdAt: Date.now(),
      });

      for (const riderRsvpId of assignment.riderRsvpIds) {
        await ctx.db.insert("carpoolMembers", {
          carpoolId,
          rsvpId: riderRsvpId,
        });
      }
    }

    return {
      carpoolsCreated: assignments.length,
      ridersAssigned: riders.length - unassignedCount,
      ridersUnassigned: unassignedCount,
    };
  },
});

export const getCarpools = query({
  args: {
    eventId: v.id("events"),
  },
  returns: v.array(
    v.object({
      carpoolId: v.id("carpools"),
      status: v.union(v.literal("draft"), v.literal("finalized")),
      driver: v.object({
        rsvpId: v.id("rsvps"),
        name: v.string(),
        email: v.string(),
        phoneNumber: v.optional(v.string()),
        campusLocation: v.optional(
          v.union(v.literal("onCampus"), v.literal("offCampus"))
        ),
        carType: v.string(),
        carColor: v.string(),
        capacity: v.number(),
      }),
      riders: v.array(
        v.object({
          rsvpId: v.id("rsvps"),
          name: v.string(),
          email: v.string(),
          phoneNumber: v.optional(v.string()),
          campusLocation: v.optional(
            v.union(v.literal("onCampus"), v.literal("offCampus"))
          ),
        })
      ),
    })
  ),
  handler: async (ctx, args) => {
    await requireBoardMember(ctx);

    const carpools = await ctx.db
      .query("carpools")
      .withIndex("by_event", (q) => q.eq("eventId", args.eventId))
      .collect();

    const carpoolDetails = await Promise.all(
      carpools.map(async (carpool) => {
        const driverRsvp = await ctx.db.get(carpool.driverRsvpId);
        const driverProfile = driverRsvp
          ? await ctx.db.get(driverRsvp.userProfileId)
          : null;

        const members = await ctx.db
          .query("carpoolMembers")
          .withIndex("by_carpool", (q) => q.eq("carpoolId", carpool._id))
          .collect();

        const allRiderDetails = await Promise.all(
          members.map(async (member) => {
            const rsvp = await ctx.db.get(member.rsvpId);
            const profile = rsvp ? await ctx.db.get(rsvp.userProfileId) : null;
            return {
              rsvpId: member.rsvpId,
              userProfileId: rsvp?.userProfileId,
              createdAt: rsvp?.createdAt ?? 0,
              name: profile?.name ?? "Unknown",
              email: profile?.email ?? "",
              phoneNumber: profile?.phoneNumber,
              campusLocation: rsvp?.campusLocation,
            };
          })
        );

        const ridersByUser = new Map<
          Id<"userProfiles">,
          {
            rsvpId: Id<"rsvps">;
            name: string;
            email: string;
            phoneNumber?: string;
            campusLocation?: "onCampus" | "offCampus";
            createdAt: number;
          }
        >();
        for (const rider of allRiderDetails) {
          if (!rider.userProfileId) {
            continue;
          }
          const existing = ridersByUser.get(rider.userProfileId);
          if (!existing || rider.createdAt > existing.createdAt) {
            ridersByUser.set(rider.userProfileId, {
              rsvpId: rider.rsvpId,
              name: rider.name,
              email: rider.email,
              phoneNumber: rider.phoneNumber,
              campusLocation: rider.campusLocation,
              createdAt: rider.createdAt,
            });
          }
        }

        const riderDetails = Array.from(ridersByUser.values()).map((rider) => ({
          rsvpId: rider.rsvpId,
          name: rider.name,
          email: rider.email,
          phoneNumber: rider.phoneNumber,
          campusLocation: rider.campusLocation,
        }));

        return {
          carpoolId: carpool._id,
          status: carpool.status,
          driver: {
            rsvpId: carpool.driverRsvpId,
            name: driverProfile?.name ?? "Unknown",
            email: driverProfile?.email ?? "",
            phoneNumber: driverProfile?.phoneNumber,
            campusLocation: driverRsvp?.campusLocation,
            carType: driverRsvp?.driverInfo?.carType ?? "",
            carColor: driverRsvp?.driverInfo?.carColor ?? "",
            capacity: driverRsvp?.driverInfo?.capacity ?? 0,
          },
          riders: riderDetails,
        };
      })
    );

    return carpoolDetails;
  },
});

async function removeMembersFromCarpool(
  ctx: MutationCtx,
  carpoolId: Id<"carpools">,
  rsvpIds: Id<"rsvps">[]
) {
  for (const rsvpId of rsvpIds) {
    const member = await ctx.db
      .query("carpoolMembers")
      .withIndex("by_rsvp", (q) => q.eq("rsvpId", rsvpId))
      .first();

    if (member && member.carpoolId === carpoolId) {
      await ctx.db.delete(member._id);
    }
  }
}

async function addMembersToCarpool(
  ctx: MutationCtx,
  carpoolId: Id<"carpools">,
  rsvpIds: Id<"rsvps">[],
  capacity: number,
  removedIds: Set<Id<"rsvps">>
) {
  const currentMembers = await ctx.db
    .query("carpoolMembers")
    .withIndex("by_carpool", (q) => q.eq("carpoolId", carpoolId))
    .collect();

  const currentCount = currentMembers.filter(
    (m) => !removedIds.has(m.rsvpId)
  ).length;

  if (currentCount + rsvpIds.length > capacity) {
    throw new Error("Adding these riders would exceed carpool capacity");
  }

  for (const rsvpId of rsvpIds) {
    const existingMember = await ctx.db
      .query("carpoolMembers")
      .withIndex("by_rsvp", (q) => q.eq("rsvpId", rsvpId))
      .first();

    if (existingMember) {
      if (existingMember.carpoolId !== carpoolId) {
        throw new Error(
          "Rider is assigned to another carpool. Use reassignRider to move them explicitly."
        );
      }
      continue;
    }

    await ctx.db.insert("carpoolMembers", { carpoolId, rsvpId });
  }
}

export const updateCarpoolAssignment = mutation({
  args: {
    carpoolId: v.id("carpools"),
    addRsvpIds: v.optional(v.array(v.id("rsvps"))),
    removeRsvpIds: v.optional(v.array(v.id("rsvps"))),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    await requireBoardMember(ctx);

    const carpool = await ctx.db.get(args.carpoolId);
    if (!carpool) {
      throw new Error("Carpool not found");
    }

    if (carpool.status !== "draft") {
      throw new Error("Cannot modify finalized carpools");
    }

    if (args.removeRsvpIds) {
      await removeMembersFromCarpool(ctx, args.carpoolId, args.removeRsvpIds);
    }

    if (args.addRsvpIds) {
      const driverRsvp = await ctx.db.get(carpool.driverRsvpId);
      const capacity = driverRsvp?.driverInfo?.capacity ?? 0;
      const removedIds = new Set<Id<"rsvps">>(args.removeRsvpIds ?? []);
      await addMembersToCarpool(
        ctx,
        args.carpoolId,
        args.addRsvpIds,
        capacity,
        removedIds
      );
    }
  },
});

export const reassignRider = mutation({
  args: {
    eventId: v.id("events"),
    riderRsvpId: v.id("rsvps"),
    fromCarpoolId: v.optional(v.id("carpools")),
    toCarpoolId: v.optional(v.id("carpools")),
  },
  returns: v.object({
    success: v.boolean(),
    riderRsvpId: v.id("rsvps"),
    fromCarpoolId: v.optional(v.id("carpools")),
    toCarpoolId: v.optional(v.id("carpools")),
  }),
  handler: async (ctx, args) => {
    await requireBoardMember(ctx);

    const event = await ctx.db.get(args.eventId);
    if (!event) {
      throw new Error("Event not found");
    }

    if (args.toCarpoolId) {
      const toCarpool = await ctx.db.get(args.toCarpoolId);
      if (!toCarpool) {
        throw new Error("Target carpool not found");
      }

      if (toCarpool.eventId !== args.eventId) {
        throw new Error("Target carpool does not belong to this event");
      }

      if (toCarpool.status !== "draft") {
        throw new Error("Cannot reassign riders to finalized carpools");
      }

      const driverRsvp = await ctx.db.get(toCarpool.driverRsvpId);
      const capacity = driverRsvp?.driverInfo?.capacity ?? 0;

      const existingMembers = await ctx.db
        .query("carpoolMembers")
        .withIndex("by_carpool", (q) => q.eq("carpoolId", toCarpool._id))
        .collect();

      if (existingMembers.length >= capacity) {
        throw new Error("Target carpool is at capacity");
      }
    }

    const existingMember = await ctx.db
      .query("carpoolMembers")
      .withIndex("by_rsvp", (q) => q.eq("rsvpId", args.riderRsvpId))
      .first();

    if (existingMember) {
      const fromCarpool = await ctx.db.get(existingMember.carpoolId);
      if (fromCarpool && fromCarpool.status !== "draft") {
        throw new Error("Cannot reassign riders from finalized carpools");
      }
      await ctx.db.delete(existingMember._id);
    }

    if (args.toCarpoolId) {
      await ctx.db.insert("carpoolMembers", {
        carpoolId: args.toCarpoolId,
        rsvpId: args.riderRsvpId,
      });
    }

    return {
      success: true,
      riderRsvpId: args.riderRsvpId,
      fromCarpoolId: existingMember?.carpoolId,
      toCarpoolId: args.toCarpoolId,
    };
  },
});

export const finalizeCarpools = mutation({
  args: {
    eventId: v.id("events"),
  },
  returns: v.object({
    carpoolsFinalized: v.number(),
  }),
  handler: async (ctx, args) => {
    await requireBoardMember(ctx);

    const carpools = await ctx.db
      .query("carpools")
      .withIndex("by_event", (q) => q.eq("eventId", args.eventId))
      .collect();

    for (const carpool of carpools) {
      await ctx.db.patch(carpool._id, { status: "finalized" });
    }

    return { carpoolsFinalized: carpools.length };
  },
});
