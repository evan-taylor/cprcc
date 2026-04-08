export const RECURRENCE_OPTIONS = [
  { label: "Does not repeat", value: "none" },
  { label: "Daily", value: "daily" },
  { label: "Weekly", value: "weekly" },
  { label: "Every 2 weeks", value: "biweekly" },
  { label: "Monthly", value: "monthly" },
] as const;

export const STORED_RECURRENCE_OPTIONS = RECURRENCE_OPTIONS.filter(
  (option) => option.value !== "none"
);

export type RecurrencePattern = (typeof RECURRENCE_OPTIONS)[number]["value"];
export type StoredRecurrencePattern = Exclude<RecurrencePattern, "none">;

export interface ScheduledOccurrence {
  endTime: number;
  startTime: number;
}

export const MAX_RECURRING_OCCURRENCES = 60;

export const WEEKDAY_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export function formatDateInput(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function combineDateAndTime(date: string, time: string): Date {
  return new Date(`${date}T${time}`);
}

export function isValidDateValue(value: string): boolean {
  if (!value) {
    return false;
  }

  return !Number.isNaN(new Date(`${value}T00:00:00`).getTime());
}

export function getMonthStart(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

export function addDays(date: Date, days: number): Date {
  const nextDate = new Date(date);
  nextDate.setDate(nextDate.getDate() + days);
  return nextDate;
}

export function addMonthsClamped(date: Date, months: number): Date {
  const originalDay = date.getDate();
  const nextDate = new Date(date);

  nextDate.setDate(1);
  nextDate.setMonth(nextDate.getMonth() + months);

  const lastDayOfTargetMonth = new Date(
    nextDate.getFullYear(),
    nextDate.getMonth() + 1,
    0
  ).getDate();

  nextDate.setDate(Math.min(originalDay, lastDayOfTargetMonth));
  nextDate.setHours(
    date.getHours(),
    date.getMinutes(),
    date.getSeconds(),
    date.getMilliseconds()
  );

  return nextDate;
}

export function advanceRecurrence(
  date: Date,
  pattern: StoredRecurrencePattern
): Date {
  switch (pattern) {
    case "daily":
      return addDays(date, 1);
    case "weekly":
      return addDays(date, 7);
    case "biweekly":
      return addDays(date, 14);
    case "monthly":
      return addMonthsClamped(date, 1);
    default: {
      const exhaustivePattern: never = pattern;
      return exhaustivePattern;
    }
  }
}

export function getDefaultRecurrenceEndDate(
  startDate: string,
  pattern: StoredRecurrencePattern
): string {
  const start = combineDateAndTime(startDate, "09:00");

  switch (pattern) {
    case "daily":
      return formatDateInput(addDays(start, 6));
    case "weekly":
      return formatDateInput(addDays(start, 56));
    case "biweekly":
      return formatDateInput(addDays(start, 112));
    case "monthly":
      return formatDateInput(addMonthsClamped(start, 5));
    default: {
      const exhaustivePattern: never = pattern;
      return exhaustivePattern;
    }
  }
}

export function describeRecurrence(pattern: StoredRecurrencePattern): string {
  switch (pattern) {
    case "daily":
      return "Daily";
    case "weekly":
      return "Weekly";
    case "biweekly":
      return "Every 2 weeks";
    case "monthly":
      return "Monthly";
    default: {
      const exhaustivePattern: never = pattern;
      return exhaustivePattern;
    }
  }
}

export function buildScheduledOccurrences({
  endDate,
  endTime,
  recurrenceEndDate,
  recurrencePattern,
  startDate,
  startTime,
}: {
  endDate: string;
  endTime: string;
  recurrenceEndDate?: string;
  recurrencePattern: RecurrencePattern;
  startDate: string;
  startTime: string;
}): {
  exceedsLimit: boolean;
  occurrences: ScheduledOccurrence[];
} {
  const firstStart = combineDateAndTime(startDate, startTime);
  const firstEnd = combineDateAndTime(endDate, endTime);

  if (recurrencePattern === "none") {
    return {
      exceedsLimit: false,
      occurrences: [
        {
          startTime: firstStart.getTime(),
          endTime: firstEnd.getTime(),
        },
      ],
    };
  }

  if (!recurrenceEndDate) {
    return { exceedsLimit: false, occurrences: [] };
  }

  const until = combineDateAndTime(recurrenceEndDate, "23:59");
  const occurrences: ScheduledOccurrence[] = [];

  let currentStart = firstStart;
  let currentEnd = firstEnd;
  let exceedsLimit = false;

  while (currentStart.getTime() <= until.getTime()) {
    occurrences.push({
      startTime: currentStart.getTime(),
      endTime: currentEnd.getTime(),
    });

    if (occurrences.length >= MAX_RECURRING_OCCURRENCES) {
      const nextStart = advanceRecurrence(currentStart, recurrencePattern);
      if (nextStart.getTime() <= until.getTime()) {
        exceedsLimit = true;
      }
      break;
    }

    currentStart = advanceRecurrence(currentStart, recurrencePattern);
    currentEnd = advanceRecurrence(currentEnd, recurrencePattern);
  }

  return { exceedsLimit, occurrences };
}

export function getCalendarGridDates(month: Date): Date[] {
  const monthStart = getMonthStart(month);
  const gridStart = addDays(monthStart, -monthStart.getDay());
  const dates: Date[] = [];

  for (let index = 0; index < 42; index += 1) {
    dates.push(addDays(gridStart, index));
  }

  return dates;
}
