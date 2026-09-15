"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Container from "@/components/Container";
import Input from "@/components/Input";
import Button from "@/components/Button";
import { createUser } from "@/services/actions/user";

export default function Register() {
  const router = useRouter();

  const [inviteCode, setInviteCode] = useState("");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    // get invite code from query string
    const urlParams = new URLSearchParams(window.location.search);
    const inviteCode = urlParams.get("rel");
    if (inviteCode) {
      // The query string is only available after the client has mounted.
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setInviteCode(inviteCode);
    }
  }, []);

  async function onFormSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (isSubmitting) return;

    setError("");
    if (password !== confirmPassword) {
      setError("兩次輸入的密碼不一致，請重新確認。");
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await createUser({ inviteCode, name, email, password });
      if (!res.success) {
        setError(res.message || "註冊失敗，請確認邀請碼與帳號資料。");
        return;
      }
      router.push("/login");
    } catch {
      setError("註冊失敗，請稍後再試。");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Container>
      <main className="mx-auto max-w-md py-8 pb-10">
        <header className="flex items-center justify-between">
          <Link href="/login" className="ios-link pressable text-sm">
            登入
          </Link>
          <span className="ios-secondary text-sm">餅餅踏踏</span>
        </header>

        <h1 className="ios-title mt-10 text-3xl font-semibold tracking-[-0.04em] text-primary-950 dark:text-white">
          建立帳號
        </h1>

        {error ? (
          <p
            className="mt-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm leading-6 text-red-700 dark:border-red-300/30 dark:bg-red-950/30 dark:text-red-200"
            role="alert"
            aria-live="polite"
          >
            {error}
          </p>
        ) : null}

        <form onSubmit={onFormSubmit} className="mt-6">
          <div className="space-y-4">
            <div className="flex flex-col gap-2">
              <label
                htmlFor="invite-code"
                className="text-sm font-medium text-primary-950 dark:text-primary-50"
              >
                邀請碼
              </label>
              <Input
                id="invite-code"
                value={inviteCode}
                onChange={(e) => setInviteCode(e.target.value)}
                required
                autoComplete="off"
                disabled={isSubmitting}
                className="w-full min-w-0 bg-[var(--ios-surface)]"
              />
            </div>
            <div className="flex flex-col gap-2">
              <label
                htmlFor="name"
                className="text-sm font-medium text-primary-950 dark:text-primary-50"
              >
                暱稱
              </label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                autoComplete="nickname"
                disabled={isSubmitting}
                className="w-full min-w-0 bg-[var(--ios-surface)]"
              />
            </div>
            <div className="flex flex-col gap-2">
              <label
                htmlFor="email"
                className="text-sm font-medium text-primary-950 dark:text-primary-50"
              >
                Email
              </label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
                disabled={isSubmitting}
                aria-describedby="email-hint"
                className="w-full min-w-0 bg-[var(--ios-surface)]"
              />
              <p id="email-hint" className="ios-secondary text-xs">
                Email 會用於顯示 Gravatar 大頭貼。
              </p>
            </div>
            <div className="flex flex-col gap-2">
              <label
                htmlFor="password"
                className="text-sm font-medium text-primary-950 dark:text-primary-50"
              >
                密碼
              </label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoComplete="new-password"
                disabled={isSubmitting}
                className="w-full min-w-0 bg-[var(--ios-surface)]"
              />
            </div>
            <div className="flex flex-col gap-2">
              <label
                htmlFor="confirm-password"
                className="text-sm font-medium text-primary-950 dark:text-primary-50"
              >
                確認密碼
              </label>
              <Input
                id="confirm-password"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                autoComplete="new-password"
                disabled={isSubmitting}
                className="w-full min-w-0 bg-[var(--ios-surface)]"
              />
            </div>
          </div>
          <Button
            className="pressable mt-6 w-full"
            type="submit"
            disabled={isSubmitting}
          >
            {isSubmitting ? "建立中⋯⋯" : "建立帳號"}
          </Button>
        </form>

        <p className="ios-secondary mt-5 text-center text-xs leading-5">
          如果你弄丟了密碼，目前將無法找回你的帳號。
        </p>
      </main>
    </Container>
  );
}
