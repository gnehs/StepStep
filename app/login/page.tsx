"use client";

import { useState, useSyncExternalStore } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Container from "@/components/Container";
import Input from "@/components/Input";
import Button from "@/components/Button";
import { login } from "@/services/actions/auth";
import {
  getPasskeyAuthenticationOptions,
  verifyPasskeyAuthentication,
} from "@/services/actions/passkey";
import {
  getPasskeyErrorMessage,
  getPasskeySupport,
  subscribeToPasskeySupport,
  startAuthentication,
} from "@/services/passkey-browser";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isPasskeyLoggingIn, setIsPasskeyLoggingIn] = useState(false);
  const [error, setError] = useState("");
  const passkeySupport = useSyncExternalStore(
    subscribeToPasskeySupport,
    getPasskeySupport,
    () => null,
  );

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (isSubmitting || isPasskeyLoggingIn) return;

    setError("");
    setIsSubmitting(true);
    try {
      const res = await login({ email, password });
      if (!res.success) {
        setError(res.message || "登入失敗，請確認 Email 與密碼。");
        return;
      }
      router.push("/");
    } catch {
      setError("登入失敗，請稍後再試。");
    } finally {
      setIsSubmitting(false);
      setPassword("");
    }
  }

  async function onPasskeyLogin() {
    if (isPasskeyLoggingIn || isSubmitting || !passkeySupport?.supported) {
      return;
    }

    setError("");
    setIsPasskeyLoggingIn(true);
    try {
      const optionsResult = await getPasskeyAuthenticationOptions();
      if (!optionsResult.success) {
        setError(
          optionsResult.message || "目前無法使用 Passkey，請改用密碼登入。",
        );
        return;
      }

      const response = await startAuthentication({
        optionsJSON: optionsResult.options,
      });
      const verificationResult = await verifyPasskeyAuthentication(response);
      if (!verificationResult.success) {
        setError(
          verificationResult.message || "Passkey 登入失敗，請稍後再試。",
        );
        return;
      }
      router.push("/");
    } catch (passkeyError) {
      setError(
        getPasskeyErrorMessage(passkeyError, "Passkey 登入失敗，請稍後再試。"),
      );
    } finally {
      setIsPasskeyLoggingIn(false);
    }
  }

  const isBusy = isSubmitting || isPasskeyLoggingIn;

  return (
    <Container>
      <main className="mx-auto max-w-md py-8 pb-10">
        <header className="flex items-center justify-between">
          <Link href="/" className="ios-link pressable text-sm font-medium">
            餅餅踏踏
          </Link>
          <Link href="/register" className="ios-link pressable text-sm">
            註冊
          </Link>
        </header>

        <h1 className="ios-title mt-10 text-3xl font-semibold tracking-[-0.04em] text-primary-950 dark:text-white">
          登入
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

        <form onSubmit={onSubmit} className="mt-6">
          <div className="space-y-4">
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
                autoComplete="username"
                disabled={isBusy}
                className="w-full min-w-0 bg-[var(--ios-surface)]"
              />
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
                autoComplete="current-password"
                disabled={isBusy}
                className="w-full min-w-0 bg-[var(--ios-surface)]"
              />
            </div>
          </div>
          <Button
            className="pressable mt-6 w-full"
            type="submit"
            disabled={isBusy}
          >
            {isSubmitting ? "登入中⋯⋯" : "使用密碼登入"}
          </Button>
        </form>

        <div className="mt-6">
          <p className="ios-secondary mb-3 text-center text-sm">或</p>
          {passkeySupport === null ? (
            <p className="ios-secondary text-center text-sm">
              正在檢查 Passkey 支援⋯⋯
            </p>
          ) : passkeySupport.supported ? (
            <Button
              className="pressable w-full border border-primary-300 bg-transparent text-primary-800 hover:bg-primary-100 dark:border-primary-700 dark:text-primary-100 dark:hover:bg-primary-800"
              type="button"
              onClick={() => void onPasskeyLogin()}
              disabled={isBusy}
            >
              {isPasskeyLoggingIn ? "等待裝置確認⋯⋯" : "使用 Passkey 登入"}
            </Button>
          ) : (
            <p className="ios-secondary text-center text-sm leading-6">
              {passkeySupport.message ||
                "目前無法使用 Passkey，請改用密碼登入。"}
            </p>
          )}
        </div>
      </main>
    </Container>
  );
}
