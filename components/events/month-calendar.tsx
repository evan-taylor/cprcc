"use client";

import {
  formatDateInput,
  getCalendarGridDates,
  getMonthStart,
  WEEKDAY_LABELS,
} from "@/lib/event-dates";

interface MonthCalendarProps {
  eventCountsByDate?: Record<string, number>;
  onMonthChange: (month: Date) => void;
  onToggleDate: (date: string) => void;
  selectedDates: string[];
  visibleMonth: Date;
}

function getDayButtonClass({
  isCurrentMonth,
  isSelected,
  isToday,
}: {
  isCurrentMonth: boolean;
  isSelected: boolean;
  isToday: boolean;
}): string {
  if (isSelected) {
    return "border-red-600 bg-red-600 text-white shadow-sm";
  }

  if (!isCurrentMonth) {
    return "border-transparent bg-transparent text-slate-300 hover:border-slate-200 hover:bg-slate-50 hover:text-slate-500";
  }

  if (isToday) {
    return "border-red-200 bg-red-50 text-red-700";
  }

  return "border-transparent bg-white text-slate-900 hover:border-slate-200 hover:bg-slate-50";
}

export function MonthCalendar({
  eventCountsByDate = {},
  onMonthChange,
  onToggleDate,
  selectedDates,
  visibleMonth,
}: MonthCalendarProps) {
  const monthStart = getMonthStart(visibleMonth);
  const gridDates = getCalendarGridDates(monthStart);
  const today = formatDateInput(new Date());

  const goToPreviousMonth = () => {
    onMonthChange(
      new Date(monthStart.getFullYear(), monthStart.getMonth() - 1, 1)
    );
  };

  const goToNextMonth = () => {
    onMonthChange(
      new Date(monthStart.getFullYear(), monthStart.getMonth() + 1, 1)
    );
  };

  return (
    <div className="w-full max-w-md rounded-2xl border border-[color:var(--color-border)] bg-white p-4 shadow-sm">
      <div className="mb-3 flex items-center justify-between gap-3">
        <div>
          <p className="font-semibold text-[color:var(--color-text-emphasis)] text-base">
            {monthStart.toLocaleDateString("en-US", {
              month: "long",
              year: "numeric",
            })}
          </p>
          <p className="text-[color:var(--color-text-muted)] text-xs">
            Click multiple days to add multiple events.
          </p>
        </div>

        <div className="flex items-center gap-1.5">
          <button
            aria-label="Previous month"
            className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-[color:var(--color-border)] bg-white text-slate-700 transition hover:border-[color:var(--color-border-hover)] hover:bg-[color:var(--color-bg-subtle)]"
            onClick={goToPreviousMonth}
            type="button"
          >
            <span aria-hidden="true">&larr;</span>
          </button>
          <button
            aria-label="Next month"
            className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-[color:var(--color-border)] bg-white text-slate-700 transition hover:border-[color:var(--color-border-hover)] hover:bg-[color:var(--color-bg-subtle)]"
            onClick={goToNextMonth}
            type="button"
          >
            <span aria-hidden="true">&rarr;</span>
          </button>
        </div>
      </div>

      <div className="mb-1 grid grid-cols-7 gap-1">
        {WEEKDAY_LABELS.map((day) => (
          <p
            className="px-1 py-1 text-center font-semibold text-[10px] text-[color:var(--color-text-muted)] uppercase tracking-[0.16em]"
            key={day}
          >
            {day}
          </p>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-1.5">
        {gridDates.map((date) => {
          const dateValue = formatDateInput(date);
          const isSelected = selectedDates.includes(dateValue);
          const isToday = dateValue === today;
          const isCurrentMonth = date.getMonth() === monthStart.getMonth();
          const eventCount = eventCountsByDate[dateValue] ?? 0;
          const hasEvents = eventCount > 0;

          return (
            <button
              aria-pressed={isSelected}
              className={`relative flex aspect-square min-h-11 items-center justify-center rounded-xl border text-sm transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500 ${getDayButtonClass(
                {
                  isCurrentMonth,
                  isSelected,
                  isToday,
                }
              )}`}
              key={dateValue}
              onClick={() => onToggleDate(dateValue)}
              type="button"
            >
              <span style={{ fontVariantNumeric: "tabular-nums" }}>
                {date.getDate()}
              </span>
              {hasEvents ? (
                <span
                  className={`absolute top-1 right-1 inline-flex min-h-4 min-w-4 items-center justify-center rounded-full px-1 text-[9px] ${
                    isSelected
                      ? "bg-white/20 text-white"
                      : "bg-slate-100 text-slate-500"
                  }`}
                >
                  {eventCount}
                </span>
              ) : null}
              {isSelected ? (
                <span className="absolute bottom-1 h-1 w-4 rounded-full bg-white/80" />
              ) : null}
            </button>
          );
        })}
      </div>
    </div>
  );
}
