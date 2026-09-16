import assert from "node:assert/strict";
import { after, test } from "node:test";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { randomBytes } from "node:crypto";
import { createUserRow, findBadges, getDb, upsertRecord } from "../services/db";
import { checkAndGiveBadge } from "../services/actions/badge";
import badges from "../data/badges";

const directory = mkdtempSync(join(tmpdir(), "stepstep-badge-test-"));
const previousPath = process.env.SQLITE_PATH;
process.env.SQLITE_PATH = join(directory, "test.db");
after(() => {
  getDb().close();
  rmSync(directory, { recursive: true, force: true });
  if (previousPath === undefined) delete process.env.SQLITE_PATH;
  else process.env.SQLITE_PATH = previousPath;
});

test("historical activity awards cookies once and preserves existing milestones", async () => {
  const user = createUserRow(
    "Cookie Test",
    "cookie@example.invalid",
    randomBytes(24).toString("hex"),
  );
  const other = createUserRow(
    "Other Test",
    "other@example.invalid",
    randomBytes(24).toString("hex"),
  );
  await checkAndGiveBadge({ id: user.id });
  assert.deepEqual(findBadges(user.id), []);
  const timestamp = new Date("2024-02-29T12:00:00+08:00");
  upsertRecord(user.id, timestamp, 100_000, 352.3, 0);
  await checkAndGiveBadge({ id: user.id });
  const earned = findBadges(user.id);
  for (const id of [
    "first-step",
    "first-100000-steps",
    "tpe-to-khh",
    "cookie-crumbs",
    "cookie-bite",
    "cookie-jar",
    "cookie-lucky",
    "cookie-leap-day",
    "cookie-half-marathon",
  ]) {
    assert.ok(
      earned.some((badge) => badge.badgeId === id),
      id,
    );
  }
  assert.ok(
    earned.every((badge) => badges.some((info) => info.id === badge.badgeId)),
  );
  upsertRecord(user.id, timestamp, 100_000, 352.3, 0);
  await checkAndGiveBadge({ id: user.id });
  assert.deepEqual(findBadges(user.id), earned);
  await checkAndGiveBadge({ id: other.id });
  assert.deepEqual(findBadges(other.id), []);
});

test("badge catalog has unique identifiers", () => {
  assert.equal(new Set(badges.map((badge) => badge.id)).size, badges.length);
});

test("backfilled hours unlock historical habits without counting repeated syncs as days", async () => {
  const user = createUserRow(
    "Backfill Test",
    "backfill@example.invalid",
    randomBytes(24).toString("hex"),
  );
  for (const day of ["2024-01-07", "2024-01-01"]) {
    upsertRecord(user.id, new Date(`${day}T12:00:00+08:00`), 3000, 0, 0);
  }
  for (let sync = 0; sync < 3; sync += 1) {
    await checkAndGiveBadge({ id: user.id });
  }
  assert.ok(
    !findBadges(user.id).some((badge) => badge.badgeId === "cookie-three-days"),
  );

  const timestamp = new Date("2024-01-04T12:00:00+08:00");
  upsertRecord(user.id, timestamp, 2000, 0, 0);
  await checkAndGiveBadge({ id: user.id });
  assert.ok(
    !findBadges(user.id).some((badge) => badge.badgeId === "cookie-three-days"),
  );

  upsertRecord(user.id, timestamp, 3000, 0, 0);
  await checkAndGiveBadge({ id: user.id });
  const earned = findBadges(user.id);
  assert.ok(earned.some((badge) => badge.badgeId === "cookie-three-days"));
  await checkAndGiveBadge({ id: user.id });
  assert.deepEqual(findBadges(user.id), earned);
});
