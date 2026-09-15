"use client";

import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import Container from "@/components/Container";
import PasskeySettings from "@/components/PasskeySettings";

export default function PasskeySettingsPage() {
  return (
    <Container>
      <div className="mb-3 grid grid-cols-3 items-center gap-2 py-2">
        <Link
          href="/settings"
          aria-label="返回設定"
          className="flex items-center gap-1 text-blue-500 dark:text-blue-300"
        >
          <ChevronLeft size={24} aria-hidden="true" />
          返回
        </Link>
        <h1 className="text-center font-semibold">Passkey</h1>
      </div>
      <PasskeySettings />
    </Container>
  );
}
