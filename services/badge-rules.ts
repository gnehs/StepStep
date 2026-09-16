const TAIPEI_TIME_ZONE = "Asia/Taipei";
const DAY_MS = 24 * 60 * 60 * 1000;

export type CookieBadgeRecord = Readonly<{
  timestamp: Date;
  steps: number;
  distance: number;
}>;

type TaipeiDateParts = {
  year: number;
  month: number;
  day: number;
  hour: number;
  weekday: number;
  dateKey: string;
};

type DaySummary = TaipeiDateParts & {
  steps: number;
  distance: number;
  slotSteps: {
    breakfast: number;
    lunch: number;
    evening: number;
  };
};

const taipeiDateTimeFormatter = new Intl.DateTimeFormat("en-US", {
  timeZone: TAIPEI_TIME_ZONE,
  calendar: "gregory",
  numberingSystem: "latn",
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
  hour: "2-digit",
  hourCycle: "h23",
  weekday: "short",
});

const WEEKDAY_BY_NAME: Record<string, number> = {
  Sun: 0,
  Mon: 1,
  Tue: 2,
  Wed: 3,
  Thu: 4,
  Fri: 5,
  Sat: 6,
};

const getPart = (parts: Intl.DateTimeFormatPart[], type: string) =>
  parts.find((part) => part.type === type)?.value;

function taipeiDateParts(timestamp: Date): TaipeiDateParts | null {
  const time = timestamp.getTime();
  if (!Number.isFinite(time)) return null;

  const parts = taipeiDateTimeFormatter.formatToParts(timestamp);
  const year = Number(getPart(parts, "year"));
  const month = Number(getPart(parts, "month"));
  const day = Number(getPart(parts, "day"));
  const hour = Number(getPart(parts, "hour"));
  const weekdayName = getPart(parts, "weekday");
  const weekday =
    weekdayName === undefined ? undefined : WEEKDAY_BY_NAME[weekdayName];

  if (
    !Number.isInteger(year) ||
    !Number.isInteger(month) ||
    !Number.isInteger(day) ||
    !Number.isInteger(hour) ||
    weekday === undefined
  ) {
    return null;
  }

  return {
    year,
    month,
    day,
    hour,
    weekday,
    dateKey: `${String(year).padStart(4, "0")}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`,
  };
}

function utcDateForKey(dateKey: string) {
  const [year, month, day] = dateKey.split("-").map(Number);
  const date = new Date(0);
  date.setUTCFullYear(year, month - 1, day);
  date.setUTCHours(0, 0, 0, 0);
  return date;
}

function dateKeyFromUtcDate(date: Date) {
  return `${String(date.getUTCFullYear()).padStart(4, "0")}-${String(
    date.getUTCMonth() + 1,
  ).padStart(2, "0")}-${String(date.getUTCDate()).padStart(2, "0")}`;
}

function shiftDateKey(dateKey: string, days: number) {
  const date = utcDateForKey(dateKey);
  date.setUTCDate(date.getUTCDate() + days);
  return dateKeyFromUtcDate(date);
}

function dayOrdinal(dateKey: string) {
  return utcDateForKey(dateKey).getTime() / DAY_MS;
}

function finiteOrZero(value: number) {
  return Number.isFinite(value) ? value : 0;
}

function addRecordToDay(
  days: Map<string, DaySummary>,
  record: CookieBadgeRecord,
) {
  const parts = taipeiDateParts(record.timestamp);
  if (!parts) return;

  let summary = days.get(parts.dateKey);
  if (!summary) {
    summary = {
      ...parts,
      steps: 0,
      distance: 0,
      slotSteps: { breakfast: 0, lunch: 0, evening: 0 },
    };
    days.set(parts.dateKey, summary);
  }

  summary.steps += finiteOrZero(record.steps);
  summary.distance += finiteOrZero(record.distance);

  if (parts.hour >= 6 && parts.hour < 9) {
    summary.slotSteps.breakfast += finiteOrZero(record.steps);
  } else if (parts.hour >= 12 && parts.hour < 14) {
    summary.slotSteps.lunch += finiteOrZero(record.steps);
  } else if (parts.hour >= 18 && parts.hour < 21) {
    summary.slotSteps.evening += finiteOrZero(record.steps);
  }
}

function hasAtLeastDaysInWindow(
  qualifyingDays: readonly string[],
  required: number,
) {
  if (qualifyingDays.length < required) return false;

  const ordinals = qualifyingDays
    .map(dayOrdinal)
    .sort((left, right) => left - right);
  for (let start = 0; start <= ordinals.length - required; start += 1) {
    if (ordinals[start + required - 1] - ordinals[start] < 7) return true;
  }
  return false;
}

function hasThreeConsecutiveMonths(monthCounts: ReadonlyMap<number, number>) {
  const months = [...monthCounts.keys()].sort((left, right) => left - right);
  for (const month of months) {
    if (
      (monthCounts.get(month) ?? 0) >= 4 &&
      (monthCounts.get(month + 1) ?? 0) >= 4 &&
      (monthCounts.get(month + 2) ?? 0) >= 4
    ) {
      return true;
    }
  }
  return false;
}

function hasFourSeasons(days: readonly DaySummary[]) {
  const seasonsByYear = new Map<number, Set<number>>();
  for (const day of days) {
    if (day.steps < 3000) continue;
    const seasons = seasonsByYear.get(day.year) ?? new Set<number>();
    seasons.add(Math.floor((day.month - 1) / 3));
    seasonsByYear.set(day.year, seasons);
  }
  return [...seasonsByYear.values()].some((seasons) => seasons.size === 4);
}

function hasWeekendPair(days: ReadonlyMap<string, DaySummary>) {
  for (const [dateKey, day] of days) {
    if (day.weekday !== 6 || day.steps < 5000) continue;
    const sunday = days.get(shiftDateKey(dateKey, 1));
    if (sunday?.weekday === 0 && sunday.steps >= 5000) return true;
  }
  return false;
}

function hasNewYearPair(days: ReadonlyMap<string, DaySummary>) {
  for (const [dateKey, day] of days) {
    if (day.month !== 12 || day.day !== 31 || day.steps < 1000) continue;
    const nextYear = days.get(shiftDateKey(dateKey, 1));
    if (nextYear?.month === 1 && nextYear.day === 1 && nextYear.steps >= 1000) {
      return true;
    }
  }
  return false;
}

function hasMoreOnCompletedDay(
  days: ReadonlyMap<string, DaySummary>,
  currentDateKey: string,
) {
  for (const [dateKey, day] of days) {
    if (dateKey >= currentDateKey) continue;
    const previous = days.get(shiftDateKey(dateKey, -1));
    if (previous && day.steps >= previous.steps + 1000) return true;
  }
  return false;
}

/**
 * Returns all cookie badge IDs earned by the supplied step records.
 *
 * `now` is a snapshot used to ignore records from the future and to decide
 * which Taipei-local dates are complete for `cookie-more`. Supplying it makes
 * the date-based rules deterministic in tests and callers that process a
 * fixed sync snapshot.
 */
export function getEarnedCookieBadgeIds(
  records: readonly CookieBadgeRecord[],
  now: Date = new Date(),
): string[] {
  const nowTime = now.getTime();
  const referenceTime = Number.isFinite(nowTime) ? nowTime : Date.now();
  const referenceParts = taipeiDateParts(new Date(referenceTime));
  if (!referenceParts) return [];

  const days = new Map<string, DaySummary>();
  let totalSteps = 0;
  let totalDistance = 0;

  for (const record of records) {
    const timestamp = record.timestamp.getTime();
    if (!Number.isFinite(timestamp) || timestamp > referenceTime) continue;
    totalSteps += finiteOrZero(record.steps);
    totalDistance += finiteOrZero(record.distance);
    addRecordToDay(days, record);
  }

  const daySummaries = [...days.values()].sort((left, right) =>
    left.dateKey.localeCompare(right.dateKey),
  );
  const qualifyingDays = daySummaries
    .filter((day) => day.steps >= 3000)
    .map((day) => day.dateKey);
  const earned: string[] = [];

  if (totalSteps >= 1000) earned.push("cookie-crumbs");
  if (totalSteps >= 10000) earned.push("cookie-bite");
  if (totalSteps >= 50000) earned.push("cookie-jar");
  if (totalSteps >= 1_000_000) earned.push("cookie-million");
  if (totalDistance >= 21.1) earned.push("cookie-half-marathon");
  if (hasAtLeastDaysInWindow(qualifyingDays, 3))
    earned.push("cookie-three-days");
  if (hasAtLeastDaysInWindow(qualifyingDays, 5))
    earned.push("cookie-five-days");
  if (qualifyingDays.length >= 30) earned.push("cookie-thirty-days");

  const monthCounts = new Map<number, number>();
  for (const day of daySummaries) {
    if (day.steps < 3000) continue;
    const monthIndex = day.year * 12 + day.month - 1;
    monthCounts.set(monthIndex, (monthCounts.get(monthIndex) ?? 0) + 1);
  }
  if (hasThreeConsecutiveMonths(monthCounts))
    earned.push("cookie-three-months");
  if (hasFourSeasons(daySummaries)) earned.push("cookie-four-seasons");

  for (const slot of ["breakfast", "lunch", "evening"] as const) {
    const count = daySummaries.filter(
      (day) => day.slotSteps[slot] >= 1000,
    ).length;
    if (count >= 5) earned.push(`cookie-${slot}`);
  }

  if (hasWeekendPair(days)) earned.push("cookie-weekend");
  if (totalSteps >= 88888) earned.push("cookie-lucky");
  if (hasNewYearPair(days)) earned.push("cookie-new-year");
  if (
    daySummaries.some(
      (day) => day.month === 2 && day.day === 29 && day.steps >= 1000,
    )
  ) {
    earned.push("cookie-leap-day");
  }
  if (hasMoreOnCompletedDay(days, referenceParts.dateKey))
    earned.push("cookie-more");

  return earned;
}
