import type { Id } from "@/convex/_generated/dataModel";
import {
  type CampusLocation,
  formatCampusLocation,
} from "@/lib/event-detail-formatting";

interface AdminRsvpCardProps {
  rsvp: {
    _id: Id<"rsvps">;
    canDrive: boolean;
    campusLocation?: CampusLocation;
    driverInfo?: { carColor: string; carType: string };
    needsRide: boolean;
    selfTransport?: boolean;
    shiftId?: Id<"shifts">;
    userEmail?: string;
    userName: string;
    userPhoneNumber?: string;
  };
  shiftLabel?: string;
}

export function AdminRsvpCard({ rsvp, shiftLabel }: AdminRsvpCardProps) {
  return (
    <div className="flex items-center justify-between rounded-lg border border-[color:var(--color-border)] bg-[color:var(--color-bg-subtle)] p-3">
      <div>
        <p className="font-semibold text-[color:var(--color-text-emphasis)] text-sm">
          {rsvp.userName}
        </p>
        <p className="text-[color:var(--color-text-emphasis)] text-xs">
          {rsvp.userEmail}
        </p>
        {rsvp.userPhoneNumber && (
          <p className="text-[color:var(--color-text-emphasis)] text-xs">
            <a
              className="hover:text-rose-600"
              href={`tel:${rsvp.userPhoneNumber}`}
            >
              {rsvp.userPhoneNumber}
            </a>
          </p>
        )}
        {rsvp.canDrive && (
          <p className="mt-1 text-blue-700 text-xs">
            Driver: {rsvp.driverInfo?.carColor} {rsvp.driverInfo?.carType}
          </p>
        )}
        {rsvp.needsRide && (
          <p className="mt-1 text-orange-700 text-xs">Needs ride</p>
        )}
        {rsvp.selfTransport && (
          <p className="mt-1 text-green-700 text-xs">Self-transport</p>
        )}
        {rsvp.campusLocation && (
          <p className="mt-1 text-indigo-700 text-xs">
            Pickup area: {formatCampusLocation(rsvp.campusLocation)}
          </p>
        )}
      </div>
      {shiftLabel && (
        <p className="text-[color:var(--color-text-emphasis)] text-xs">
          {shiftLabel}
        </p>
      )}
    </div>
  );
}
