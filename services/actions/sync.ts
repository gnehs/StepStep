"use server";
import { getCurrentUserRecord, toPublicUser } from "@/services/session";

/** Return the authenticated user's sync status without exposing the database row. */
export async function getSyncStatus() {
  const user = await getCurrentUserRecord();
  if (!user) {
    return { success: false as const, message: "登入已失效，請重新登入。" };
  }

  return {
    success: true as const,
    user: toPublicUser(user),
    // User.token is the external sync credential. Keep it separate from the
    // normal public user DTO and expose it only to this settings action.
    syncToken: user.token,
    lastSync: user.lastSync,
  };
}
