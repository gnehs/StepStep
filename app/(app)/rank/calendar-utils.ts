export type CalendarDate = {
  current: boolean;
  text: number;
  date: Date;
};

const DAYS_IN_CALENDAR = 42;

function assertValidDate(date: Date): void {
  if (Number.isNaN(date.getTime())) {
    throw new RangeError("Invalid date");
  }
}

/**
 * Move a local date by whole calendar months without overflowing into the
 * following month. For example, January 31 moved forward one month becomes
 * February 28 (or February 29 in a leap year).
 */
export function shiftMonth(date: Date, offset: number): Date {
  assertValidDate(date);

  const result = new Date(date);
  const originalDay = result.getDate();

  // Setting the day to one first avoids Date#setMonth overflowing a long
  // source month into the following month before we can clamp the day.
  result.setDate(1);
  result.setMonth(result.getMonth() + offset);

  const daysInTargetMonth = new Date(
    result.getFullYear(),
    result.getMonth() + 1,
    0,
  ).getDate();
  result.setDate(Math.min(originalDay, daysInTargetMonth));

  return result;
}

/** Move a local date by calendar days without mutating the input Date. */
export function shiftDay(date: Date, offset: number): Date {
  assertValidDate(date);

  const result = new Date(date);
  result.setDate(result.getDate() + offset);
  return result;
}

/** Format a Date as a local YYYY-MM-DD key. */
export function dateKey(date: Date): string {
  assertValidDate(date);

  const year = String(date.getFullYear()).padStart(4, "0");
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

/**
 * Build the Sunday-first, six-week calendar grid for the given local month.
 * Every returned date is a fresh local-midnight Date and the input is not
 * mutated.
 */
export function getCalendarDates(date: Date): CalendarDate[] {
  assertValidDate(date);

  const year = date.getFullYear();
  const month = date.getMonth();
  const firstOfMonth = new Date(year, month, 1);
  const firstGridDate = shiftDay(firstOfMonth, -firstOfMonth.getDay());

  return Array.from({ length: DAYS_IN_CALENDAR }, (_, index) => {
    const cellDate = shiftDay(firstGridDate, index);
    return {
      current: cellDate.getFullYear() === year && cellDate.getMonth() === month,
      text: cellDate.getDate(),
      date: cellDate,
    };
  });
}
