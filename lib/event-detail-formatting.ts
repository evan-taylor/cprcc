export const CONVEX_ID_PATTERN = /^[a-z0-9]{32}$/;

export type CampusLocation = "onCampus" | "offCampus";

export const formatCampusLocation = (campusLocation: CampusLocation) => {
  if (campusLocation === "onCampus") {
    return "On campus";
  }
  return "Off campus";
};

export const formatShiftTime = (startTime: number, endTime?: number) => {
  const start = new Date(startTime).toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
  });

  if (endTime === undefined) {
    return start;
  }

  const end = new Date(endTime).toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
  });

  return `${start} - ${end}`;
};

export const getShiftCoverageStatus = (
  signupCount: number,
  requiredPeople: number
): string => {
  if (signupCount === 0) {
    return "Open";
  }
  if (signupCount >= requiredPeople) {
    return "Filled";
  }
  return "Partially filled";
};

export const shiftLabelClass = (isDisabled: boolean, isSelected: boolean) => {
  if (isDisabled) {
    return "cursor-not-allowed opacity-60";
  }
  if (isSelected) {
    return "border-rose-400 bg-rose-50 ring-2 ring-rose-400";
  }
  return "border-[color:var(--color-border)] bg-[color:var(--color-bg-subtle)] hover:border-rose-200";
};
