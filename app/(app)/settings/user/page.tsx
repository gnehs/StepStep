import { redirect } from "next/navigation";
import { getCurrentUser } from "@/services/session";
import UserProfileClient from "./UserProfileClient";

export default async function SettingsUserPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  // Pass only fields rendered by the client child. Password, sync token and
  // timestamps stay on the server.
  return (
    <UserProfileClient
      initialUser={{
        id: user.id,
        email: user.email,
        name: user.name,
      }}
    />
  );
}
