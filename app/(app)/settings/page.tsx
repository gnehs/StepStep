import { redirect } from "next/navigation";
import SettingsClient from "@/components/SettingsClient";
import { getCurrentUserRecord, toPublicUser } from "@/services/session";

export default async function Settings() {
  const user = await getCurrentUserRecord();
  if (!user) redirect("/login");

  // Keep the sync secret available only to the authenticated settings UI.
  // Do not spread the database row: it also contains the password hash.
  return (
    <SettingsClient
      user={{ ...toPublicUser(user), syncToken: user.token }}
    />
  );
}
