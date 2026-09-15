import Nav from "@/components/Nav";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/services/session";

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const user = await getCurrentUser();
  // Reading the HttpOnly session in the server layout keeps protected routes
  // from rendering before auth is checked. Server Actions still authenticate
  // independently because layouts are not an authorization boundary.
  if (!user) redirect("/login");

  return (
    <div className="flex h-[100svh] flex-col" vaul-drawer-wrapper="">
      <div className="h-full grow overflow-hidden overflow-y-scroll pb-2">
        {children}
      </div>
      <Nav />
    </div>
  );
}
