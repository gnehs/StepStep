"use server";
import { findBadges, findRecords, giveBadge, sumRecords } from "@/services/db";
import { getEarnedCookieBadgeIds } from "@/services/badge-rules";
import { getCurrentUser } from "@/services/session";

export async function getBadgeData() {
  const user = await getCurrentUser();
  if (!user) {
    return [];
  }

  return findBadges(user.id);
}

async function giveUserBadge(
  userId: string,
  badgeId: string,
  allowMultiple = false,
) {
  giveBadge(userId, badgeId, allowMultiple);
}

export async function checkAndGiveBadge({ id }: { id: string }) {
  const sums = sumRecords(null, null, id);

  for (const badgeId of getEarnedCookieBadgeIds(findRecords(id))) {
    await giveUserBadge(id, badgeId);
  }

  if ((sums.steps ?? 0) >= 1) {
    await giveUserBadge(id, "first-step");
  }
  if ((sums.steps ?? 0) >= 100_000) {
    await giveUserBadge(id, "first-100000-steps");
  }
  if ((sums.distance ?? 0) >= 352.3) {
    await giveUserBadge(id, "tpe-to-khh");
  }
  if ((sums.distance ?? 0) >= 100_000) {
    await giveUserBadge(id, "first-100000-km");
  }
  if ((sums.distance ?? 0) >= 384400) {
    await giveUserBadge(id, "to-the-moon");
  }
}
