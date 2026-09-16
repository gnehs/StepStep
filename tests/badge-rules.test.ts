import assert from "node:assert/strict";
import test from "node:test";
import badges from "../data/badges";
import { getEarnedCookieBadgeIds } from "../services/badge-rules";

const NOW = new Date("2025-01-01T23:59:00+08:00");

function at(day: string, time = "12:00", steps = 0, distance = 0) {
  return {
    timestamp: new Date(`${day}T${time}:00+08:00`),
    steps,
    distance,
  };
}

function dayAfter(day: string, amount: number) {
  const date = new Date(`${day}T12:00:00+08:00`);
  date.setUTCDate(date.getUTCDate() + amount);
  return date.toISOString().slice(0, 10);
}

function daysBetween(start: string, amount: number, steps = 3000) {
  return Array.from({ length: amount }, (_, index) =>
    at(dayAfter(start, index), "12:00", steps),
  );
}

function hasBadge(
  records: readonly ReturnType<typeof at>[],
  id: string,
  now = NOW,
) {
  return getEarnedCookieBadgeIds(records, now).includes(id);
}

const COOKIE_BADGE_IDS = [
  "cookie-crumbs",
  "cookie-bite",
  "cookie-jar",
  "cookie-million",
  "cookie-half-marathon",
  "cookie-three-days",
  "cookie-five-days",
  "cookie-thirty-days",
  "cookie-three-months",
  "cookie-four-seasons",
  "cookie-breakfast",
  "cookie-lunch",
  "cookie-evening",
  "cookie-weekend",
  "cookie-lucky",
  "cookie-new-year",
  "cookie-leap-day",
  "cookie-more",
] as const;

test("all cookie IDs are present in the badge catalog", () => {
  const catalogIds = new Set(badges.map((badge) => badge.id));
  for (const id of COOKIE_BADGE_IDS) assert.ok(catalogIds.has(id), id);
});

test("cumulative step and distance thresholds use inclusive boundaries", () => {
  const records = [
    at("2024-01-01", "12:00", 1000, 21.1),
    at("2024-01-02", "12:00", 87888),
  ];
  const earned = getEarnedCookieBadgeIds(records, NOW);
  for (const id of [
    "cookie-crumbs",
    "cookie-bite",
    "cookie-jar",
    "cookie-half-marathon",
    "cookie-lucky",
  ]) {
    assert.ok(earned.includes(id), id);
  }
  assert.ok(!earned.includes("cookie-million"));
  assert.ok(
    getEarnedCookieBadgeIds(
      [...records, at("2024-01-03", "12:00", 911_112)],
      NOW,
    ).includes("cookie-million"),
  );
});

test("each cumulative milestone requires its threshold and allows overshooting", () => {
  for (const [id, threshold] of [
    ["cookie-crumbs", 1000],
    ["cookie-bite", 10000],
    ["cookie-jar", 50000],
    ["cookie-million", 1_000_000],
    ["cookie-lucky", 88888],
  ] as const) {
    for (const offset of [-1, 0, 1]) {
      assert.equal(
        hasBadge([at("2024-01-01", "12:00", threshold + offset)], id),
        offset >= 0,
        `${id}: ${threshold + offset}`,
      );
    }
  }
  assert.ok(
    !hasBadge([at("2024-01-01", "12:00", 0, 21.09)], "cookie-half-marathon"),
  );
  assert.ok(
    hasBadge(
      [at("2024-01-01", "12:00", 0, 10), at("2024-01-02", "12:00", 0, 11.2)],
      "cookie-half-marathon",
    ),
  );
  assert.deepEqual(getEarnedCookieBadgeIds([], NOW), []);
});

test("three and five qualifying days must fit inside one seven-day window", () => {
  const threeDays = [
    at("2024-01-30", "12:00", 3000),
    at("2024-02-02", "12:00", 3000),
    at("2024-02-05", "12:00", 3000),
  ];
  assert.ok(hasBadge(threeDays, "cookie-three-days"));
  assert.ok(
    !hasBadge(
      [...threeDays.slice(0, 2), at("2024-02-06", "12:00", 3000)],
      "cookie-three-days",
    ),
  );
  assert.ok(!hasBadge(threeDays, "cookie-five-days"));

  const fiveDays = [
    at("2024-03-30", "12:00", 3000),
    at("2024-03-31", "12:00", 3000),
    at("2024-04-01", "12:00", 3000),
    at("2024-04-02", "12:00", 3000),
    at("2024-04-03", "12:00", 3000),
  ];
  assert.ok(hasBadge(fiveDays, "cookie-three-days"));
  assert.ok(hasBadge(fiveDays, "cookie-five-days"));
  assert.ok(
    hasBadge(
      [...fiveDays.slice(0, 4), at("2024-04-05", "12:00", 3000)],
      "cookie-five-days",
    ),
  );
  assert.ok(
    !hasBadge(
      [...fiveDays.slice(0, 4), at("2024-04-06", "12:00", 3000)],
      "cookie-five-days",
    ),
  );
  assert.ok(
    !hasBadge(
      ["2024-01-01", "2024-01-09", "2024-01-17"].map((day) =>
        at(day, "12:00", 3000),
      ),
      "cookie-three-days",
    ),
  );
});

test("thirty qualifying days count distinct calendar days and do not fill gaps", () => {
  assert.ok(hasBadge(daysBetween("2024-01-01", 30), "cookie-thirty-days"));
  assert.ok(!hasBadge(daysBetween("2024-01-01", 29), "cookie-thirty-days"));
  assert.ok(
    !hasBadge(
      [...daysBetween("2024-01-01", 29), at("2024-01-01", "18:00", 3000)],
      "cookie-thirty-days",
    ),
  );
  assert.ok(
    hasBadge(
      Array.from({ length: 30 }, (_, index) =>
        at(dayAfter("2024-01-01", index * 3), "12:00", 3000),
      ),
      "cookie-thirty-days",
    ),
  );
  assert.ok(
    !hasBadge(
      daysBetween("2024-01-01", 29).concat(at("2024-03-01", "12:00", 2999)),
      "cookie-thirty-days",
    ),
  );
});

test("three consecutive calendar months need four qualifying days each", () => {
  const records = [
    ...[1, 5, 10, 15].map((day) =>
      at(`2024-01-${String(day).padStart(2, "0")}`, "12:00", 3000),
    ),
    ...[1, 5, 10, 15].map((day) =>
      at(`2024-02-${String(day).padStart(2, "0")}`, "12:00", 3000),
    ),
    ...[1, 5, 10, 15].map((day) =>
      at(`2024-03-${String(day).padStart(2, "0")}`, "12:00", 3000),
    ),
  ];
  assert.ok(hasBadge(records, "cookie-three-months"));
  assert.ok(!hasBadge(records.slice(1), "cookie-three-months"));
  assert.ok(
    hasBadge(
      [
        ...daysBetween("2023-11-01", 4),
        ...daysBetween("2023-12-01", 4),
        ...daysBetween("2024-01-01", 4),
      ],
      "cookie-three-months",
    ),
  );
  assert.ok(
    !hasBadge(
      records.filter(
        (record) => !record.timestamp.toISOString().startsWith("2024-02"),
      ),
      "cookie-three-months",
    ),
  );
});

test("four seasons must occur in the same year", () => {
  const records = [
    at("2024-01-15", "12:00", 3000),
    at("2024-04-15", "12:00", 3000),
    at("2024-07-15", "12:00", 3000),
    at("2024-10-15", "12:00", 3000),
  ];
  assert.ok(hasBadge(records, "cookie-four-seasons"));
  assert.ok(
    !hasBadge(
      [
        at("2023-01-15", "12:00", 3000),
        at("2024-04-15", "12:00", 3000),
        at("2024-07-15", "12:00", 3000),
        at("2024-10-15", "12:00", 3000),
      ],
      "cookie-four-seasons",
    ),
  );
});

test("breakfast, lunch, and evening windows use Taipei local hours and exclusive ends", () => {
  const breakfast = daysBetween("2024-05-01", 5, 0).map((record, index) => ({
    ...record,
    timestamp: new Date(`${dayAfter("2024-05-01", index)}T08:59:00+08:00`),
    steps: 1000,
  }));
  const lunch = daysBetween("2024-06-01", 5, 0).map((record, index) => ({
    ...record,
    timestamp: new Date(`${dayAfter("2024-06-01", index)}T13:59:00+08:00`),
    steps: 1000,
  }));
  const evening = daysBetween("2024-07-01", 5, 0).map((record, index) => ({
    ...record,
    timestamp: new Date(`${dayAfter("2024-07-01", index)}T20:59:00+08:00`),
    steps: 1000,
  }));
  const earned = getEarnedCookieBadgeIds(
    [...breakfast, ...lunch, ...evening],
    NOW,
  );
  assert.ok(earned.includes("cookie-breakfast"));
  assert.ok(earned.includes("cookie-lunch"));
  assert.ok(earned.includes("cookie-evening"));

  const atExclusiveEnds = [
    ...daysBetween("2024-08-01", 5, 0).map((record, index) => ({
      ...record,
      timestamp: new Date(`${dayAfter("2024-08-01", index)}T09:00:00+08:00`),
      steps: 1000,
    })),
    ...daysBetween("2024-09-01", 5, 0).map((record, index) => ({
      ...record,
      timestamp: new Date(`${dayAfter("2024-09-01", index)}T14:00:00+08:00`),
      steps: 1000,
    })),
    ...daysBetween("2024-10-01", 5, 0).map((record, index) => ({
      ...record,
      timestamp: new Date(`${dayAfter("2024-10-01", index)}T21:00:00+08:00`),
      steps: 1000,
    })),
  ];
  const notEarned = getEarnedCookieBadgeIds(atExclusiveEnds, NOW);
  assert.ok(!notEarned.includes("cookie-breakfast"));
  assert.ok(!notEarned.includes("cookie-lunch"));
  assert.ok(!notEarned.includes("cookie-evening"));
});

test("a UTC timestamp is grouped by its Taipei calendar date", () => {
  const records = Array.from({ length: 5 }, (_, index) => ({
    timestamp: new Date(`${dayAfter("2024-11-01", index)}T22:30:00Z`),
    steps: 1000,
    distance: 0,
  }));
  assert.ok(hasBadge(records, "cookie-breakfast"));
  assert.ok(
    hasBadge(
      [
        {
          timestamp: new Date("2024-02-28T16:00:00Z"),
          steps: 500,
          distance: 0,
        },
        {
          timestamp: new Date("2024-02-29T15:00:00Z"),
          steps: 500,
          distance: 0,
        },
      ],
      "cookie-leap-day",
    ),
  );
  assert.ok(
    !hasBadge(
      [
        {
          timestamp: new Date("2024-02-28T15:00:00Z"),
          steps: 500,
          distance: 0,
        },
        {
          timestamp: new Date("2024-02-28T16:00:00Z"),
          steps: 500,
          distance: 0,
        },
      ],
      "cookie-leap-day",
    ),
  );
});

test("time windows include their start and sum hours within distinct days", () => {
  for (const [slot, hour] of [
    ["breakfast", 6],
    ["lunch", 12],
    ["evening", 18],
  ] as const) {
    const records = Array.from({ length: 5 }, (_, index) => {
      const day = dayAfter("2024-01-01", index * 2);
      return [
        at(day, `${String(hour).padStart(2, "0")}:00`, 400),
        at(day, `${String(hour + 1).padStart(2, "0")}:00`, 600),
      ];
    }).flat();
    assert.ok(hasBadge(records, `cookie-${slot}`));
    assert.ok(!hasBadge(records.slice(1), `cookie-${slot}`));
  }
});

test("a weekend pair needs Saturday and Sunday in the same local weekend", () => {
  assert.ok(
    hasBadge(
      [at("2024-03-30", "12:00", 5000), at("2024-03-31", "12:00", 5000)],
      "cookie-weekend",
    ),
  );
  assert.ok(!hasBadge([at("2024-03-30", "12:00", 5000)], "cookie-weekend"));
  assert.ok(
    !hasBadge(
      [at("2024-03-30", "12:00", 5000), at("2024-04-07", "12:00", 5000)],
      "cookie-weekend",
    ),
  );
});

test("new year and leap day rules cross calendar boundaries", () => {
  assert.ok(
    hasBadge(
      [at("2023-12-31", "12:00", 1000), at("2024-01-01", "12:00", 1000)],
      "cookie-new-year",
    ),
  );
  assert.ok(!hasBadge([at("2023-12-31", "12:00", 1000)], "cookie-new-year"));
  assert.ok(hasBadge([at("2024-02-29", "12:00", 1000)], "cookie-leap-day"));
  assert.ok(!hasBadge([at("2023-02-28", "12:00", 1000)], "cookie-leap-day"));
});

test("cookie-more requires a completed day and a recorded immediately preceding day", () => {
  const now = new Date("2024-04-03T12:00:00+08:00");
  assert.ok(
    hasBadge(
      [
        at("2024-04-01", "12:00", 2000),
        at("2024-04-02", "12:00", 3000),
        at("2024-04-03", "08:00", 9000),
      ],
      "cookie-more",
      now,
    ),
  );
  assert.ok(
    !hasBadge(
      [at("2024-04-01", "12:00", 2000), at("2024-04-02", "12:00", 2999)],
      "cookie-more",
      now,
    ),
  );
  assert.ok(!hasBadge([at("2024-04-02", "12:00", 3000)], "cookie-more", now));
  assert.ok(
    !hasBadge(
      [at("2024-03-31", "12:00", 1000), at("2024-04-02", "12:00", 3000)],
      "cookie-more",
      now,
    ),
  );
  const today = [
    at("2024-04-02", "12:00", 2000),
    at("2024-04-03", "08:00", 3000),
  ];
  assert.ok(!hasBadge(today, "cookie-more", new Date("2024-04-03T15:59:59Z")));
  assert.ok(hasBadge(today, "cookie-more", new Date("2024-04-03T16:00:00Z")));
});

test("future records cannot earn cookie badges", () => {
  const now = new Date("2024-01-02T12:00:00+08:00");
  const records = [at("2024-01-03", "12:00", 1_000_000, 21.1)];
  assert.deepEqual(getEarnedCookieBadgeIds(records, now), []);
});
