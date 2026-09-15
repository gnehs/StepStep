import test from "node:test";
import assert from "node:assert/strict";

type CalendarUtils = typeof import("./calendar-utils");
let calendarUtils!: CalendarUtils;

test.before(async () => {
  calendarUtils = (await import(
    new URL("./calendar-utils.ts", import.meta.url).href
  )) as CalendarUtils;
});

function localDate(year: number, month: number, day: number): Date {
  return new Date(year, month - 1, day);
}

test("shiftMonth crosses years in both directions", () => {
  assert.equal(
    calendarUtils.dateKey(calendarUtils.shiftMonth(localDate(2024, 12, 15), 1)),
    "2025-01-15",
  );
  assert.equal(
    calendarUtils.dateKey(calendarUtils.shiftMonth(localDate(2025, 1, 15), -1)),
    "2024-12-15",
  );
});

test("shiftMonth clamps long months to February, including leap years", () => {
  assert.equal(
    calendarUtils.dateKey(calendarUtils.shiftMonth(localDate(2024, 1, 31), 1)),
    "2024-02-29",
  );
  assert.equal(
    calendarUtils.dateKey(calendarUtils.shiftMonth(localDate(2023, 1, 31), 1)),
    "2023-02-28",
  );
});

test("shiftMonth clamps a 31st into a 30-day target month", () => {
  assert.equal(
    calendarUtils.dateKey(calendarUtils.shiftMonth(localDate(2024, 3, 31), 1)),
    "2024-04-30",
  );
  assert.equal(
    calendarUtils.dateKey(calendarUtils.shiftMonth(localDate(2024, 5, 31), -1)),
    "2024-04-30",
  );
});

test("shiftDay crosses into the previous month without mutating its input", () => {
  const source = localDate(2024, 3, 1);
  const previous = calendarUtils.shiftDay(source, -1);

  assert.equal(calendarUtils.dateKey(previous), "2024-02-29");
  assert.equal(calendarUtils.dateKey(source), "2024-03-01");
});

test("dateKey uses local date components and zero-pads month and day", () => {
  assert.equal(calendarUtils.dateKey(localDate(2026, 9, 5)), "2026-09-05");
});

test("getCalendarDates returns a continuous 42-cell Sunday-first grid", () => {
  const dates = calendarUtils.getCalendarDates(localDate(2024, 3, 15));

  assert.equal(dates.length, 42);
  assert.equal(calendarUtils.dateKey(dates[0].date), "2024-02-25");
  assert.equal(calendarUtils.dateKey(dates.at(-1)!.date), "2024-04-06");

  for (let index = 1; index < dates.length; index += 1) {
    assert.equal(
      calendarUtils.dateKey(dates[index].date),
      calendarUtils.dateKey(calendarUtils.shiftDay(dates[index - 1].date, 1)),
    );
  }

  assert.equal(dates.filter((item) => item.current).length, 31);
  assert.equal(dates[0].current, false);
  assert.equal(dates[5].current, true);
  assert.equal(dates[35].current, true);
  assert.equal(dates[36].current, false);
  assert.equal(dates[5].text, 1);
  assert.equal(dates[35].text, 31);
});
