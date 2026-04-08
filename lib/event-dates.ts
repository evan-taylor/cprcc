export interface EventOccurrence {
  endTime: number;
  startTime: number;
}

export const MAX_SELECTED_EVENT_DATES = 60;

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

export function getCalendarGridDates(month: Date): Date[] {
  const monthStart = getMonthStart(month);
  const gridStart = addDays(monthStart, -monthStart.getDay());
  const dates: Date[] = [];

  for (let index = 0; index < 42; index += 1) {
    dates.push(addDays(gridStart, index));
  }

  return dates;
}

export function sortDateValues(dateValues: string[]): string[] {
  return [...dateValues].sort((left, right) => left.localeCompare(right));
}

export function toggleDateSelection(
  selectedDates: string[],
  nextDate: string
): string[] {
  if (selectedDates.includes(nextDate)) {
    return selectedDates.filter((dateValue) => dateValue !== nextDate);
  }

  return sortDateValues([...selectedDates, nextDate]);
}

export function buildOccurrencesForSelectedDates({
  endTime,
  selectedDates,
  startTime,
}: {
  endTime: string;
  selectedDates: string[];
  startTime: string;
}): EventOccurrence[] {
  const occurrences: EventOccurrence[] = [];

  for (const dateValue of sortDateValues(selectedDates)) {
    const startDateTime = combineDateAndTime(dateValue, startTime);
    const endDateTime = combineDateAndTime(dateValue, endTime);

    occurrences.push({
      startTime: startDateTime.getTime(),
      endTime: endDateTime.getTime(),
    });
  }

  return occurrences;
}
