"use client";
import { useState, useSyncExternalStore } from "react";
import { useRouter } from "next/navigation";
import Container from "@/components/Container";
import PageTitle from "@/components/PageTitle";
import SectionTitle from "@/components/SectionTitle";
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

  return (
    <Container>
      <PageTitle>登入</PageTitle>
      {error ? (
        <p
          className="mb-3 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700 dark:bg-red-950/30 dark:text-red-200"
          role="alert"
        >
          {error}
        </p>
      ) : null}
      <form onSubmit={onSubmit}>
        <SectionTitle className="mt-2 mb-1">Email</SectionTitle>
        <Input
          id="email"
          aria-label="Email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          autoComplete="username"
          disabled={isSubmitting || isPasskeyLoggingIn}
        />
        <SectionTitle className="mt-2 mb-1">密碼</SectionTitle>
        <Input
          id="password"
          aria-label="密碼"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          autoComplete="current-password"
          disabled={isSubmitting || isPasskeyLoggingIn}
        />
        <Button
          className="mt-4 w-full disabled:cursor-not-allowed disabled:opacity-50"
          type="submit"
          disabled={isSubmitting || isPasskeyLoggingIn}
        >
          {isSubmitting ? "登入中⋯⋯" : "使用密碼登入"}
        </Button>
      </form>
      <div className="my-4 flex items-center gap-3 text-sm opacity-60">
        <div className="h-px grow bg-current" />
        <span>或</span>
        <div className="h-px grow bg-current" />
      </div>
      {passkeySupport === null ? (
        <p className="text-center text-sm opacity-75">
          正在檢查 Passkey 支援⋯⋯
        </p>
      ) : passkeySupport.supported ? (
        <Button
          className="bg-primary-700 hover:bg-primary-800 dark:bg-primary-500 dark:hover:bg-primary-400 w-full disabled:cursor-not-allowed disabled:opacity-50"
          type="button"
          onClick={() => void onPasskeyLogin()}
          disabled={isSubmitting || isPasskeyLoggingIn}
        >
          {isPasskeyLoggingIn ? "等待裝置確認⋯⋯" : "使用 Passkey 登入"}
        </Button>
      ) : (
        <p className="text-center text-sm opacity-75">
          {passkeySupport.message || "目前無法使用 Passkey，請改用密碼登入。"}
        </p>
      )}
    </Container>
  );
}
