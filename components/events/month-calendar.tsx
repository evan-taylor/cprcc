"use client";

import {
  formatDateInput,
  getCalendarGridDates,
  getMonthStart,
  WEEKDAY_LABELS,
} from "@/lib/recurrence";

type MonthCalendarProps = {
  eventCountsByDate?: Record<string, number>;
  onMonthChange: (month: Date) => void;
  onSelectDate: (date: string) => void;
  selectedDate?: string;
  visibleMonth: Date;
};

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
    return "border-transparent bg-transparent text-slate-400 hover:border-slate-200 hover:bg-slate-50";
  }

  if (isToday) {
    return "border-red-300 bg-red-50 text-red-700";
  }

  return "border-transparent bg-white text-slate-900 hover:border-slate-200 hover:bg-slate-50";
}

export function MonthCalendar({
  eventCountsByDate = {},
  onMonthChange,
  onSelectDate,
  selectedDate,
  visibleMonth,
}: MonthCalendarProps) {
  const monthStart = getMonthStart(visibleMonth);
  const gridDates = getCalendarGridDates(monthStart);
  const today = formatDateInput(new Date());

  const goToPreviousMonth = () => {
    onMonthChange(new Date(monthStart.getFullYear(), monthStart.getMonth() - 1, 1));
  };

  const goToNextMonth = () => {
    onMonthChange(new Date(monthStart.getFullYear(), monthStart.getMonth() + 1, 1));
  };

  return (
    <div className="rounded-3xl border border-[color:var(--color-border)] bg-white p-4 shadow-sm">
      <div className="mb-4 flex items-center justify-between gap-3">
        <div>
          <p className="font-semibold text-[color:var(--color-text-emphasis)] text-lg">
            {monthStart.toLocaleDateString("en-US", {
              month: "long",
              year: "numeric",
            })}
          </p>
          <p className="text-[color:var(--color-text-muted)] text-sm">
            Click a day to set your event date.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-[color:var(--color-border)] bg-white text-slate-900 transition hover:-translate-y-0.5 hover:border-[color:var(--color-border-hover)] hover:bg-[color:var(--color-bg-subtle)]"
            onClick={goToPreviousMonth}
            type="button"
          >
            <span aria-hidden="true">&larr;</span>
            <span className="sr-only">Previous month</span>
          </button>
          <button
            className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-[color:var(--color-border)] bg-white text-slate-900 transition hover:-translate-y-0.5 hover:border-[color:var(--color-border-hover)] hover:bg-[color:var(--color-bg-subtle)]"
            onClick={goToNextMonth}
            type="button"
          >
            <span aria-hidden="true">&rarr;</span>
            <span className="sr-only">Next month</span>
          </button>
        </div>
      </div>

      <div className="mb-2 grid grid-cols-7 gap-2">
        {WEEKDAY_LABELS.map((day) => (
          <p
            className="px-1 text-center font-semibold text-[11px] text-[color:var(--color-text-muted)] uppercase tracking-[0.16em]"
            key={day}
          >
            {day}
          </p>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-2">
        {gridDates.map((date) => {
          const dateValue = formatDateInput(date);
          const isSelected = selectedDate === dateValue;
          const isToday = dateValue === today;
          const isCurrentMonth = date.getMonth() === monthStart.getMonth();
          const eventCount = eventCountsByDate[dateValue] ?? 0;
          const hasEvents = eventCount > 0;

          return (
            <button
              aria-pressed={isSelected}
              className={`min-h-20 rounded-2xl border px-2 py-2 text-left transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500 ${getDayButtonClass({
                isCurrentMonth,
                isSelected,
                isToday,
              })}`}
              key={dateValue}
              onClick={() => onSelectDate(dateValue)}
              type="button"
            >
              <div className="flex items-start justify-between gap-2">
                <span
                  className="font-semibold text-sm"
                  style={{ fontVariantNumeric: "tabular-nums" }}
                >
                  {date.getDate()}
                </span>
                {hasEvents ? (
                  <span
                    className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                      isSelected
                        ? "bg-white/20 text-white"
                        : "bg-slate-100 text-slate-600"
                    }`}
                  >
                    {eventCount}
                  </span>
                ) : null}
              </div>

              <div className="mt-6">
                {hasEvents ? (
                  <div
                    className={`h-1.5 w-8 rounded-full ${
                      isSelected ? "bg-white/80" : "bg-red-200"
                    }`}
                  />
                ) : (
                  <div className="h-1.5 w-8 rounded-full bg-transparent" />
                )}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
