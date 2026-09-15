"use server";
import { findBadges, giveBadge, sumRecords } from "@/services/db";
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
