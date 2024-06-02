"use server";
import { getUserFromJWT } from "@/services/actions/auth";
export async function getSyncStatus(token: string) {
  let user = await getUserFromJWT(token);
  if (!user) {
    return { success: false, message: "無效的 token" };
  }
  user.password = "";
  return { success: true, user, lastSync: user.lastSync };
}
