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
    <div className="flex min-h-dvh flex-col" vaul-drawer-wrapper="">
      <a
        href="#main-content"
        className="sr-only fixed top-3 left-3 z-50 rounded-xl bg-white p-3 text-primary-950 focus:not-sr-only"
      >
        跳至主要內容
      </a>
      <main tabIndex={-1} id="main-content" className="min-w-0 flex-1 pb-32">
        {children}
      </main>
      <Nav />
    </div>
  );
}
