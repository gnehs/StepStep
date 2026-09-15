"use client";

import {
  browserSupportsWebAuthn,
  startAuthentication,
  startRegistration,
  WebAuthnError,
} from "@simplewebauthn/browser";

export type PasskeySupport = {
  supported: boolean;
  message?: string;
};

const serverSupport: PasskeySupport = { supported: false };
const insecureContextSupport: PasskeySupport = {
  supported: false,
  message: "Passkey 需要在安全連線（HTTPS）中使用。",
};
const unsupportedSupport: PasskeySupport = {
  supported: false,
  message: "這個瀏覽器或裝置不支援 Passkey，請改用密碼登入。",
};
const supportedSupport: PasskeySupport = { supported: true };

/**
 * WebAuthn requires a secure context. Keep this check in one place so the
 * login and settings screens give the same explanation when a browser cannot
 * use passkeys.
 */
export function getPasskeySupport(): PasskeySupport {
  if (typeof window === "undefined") {
    return serverSupport;
  }

  if (!window.isSecureContext) {
    return insecureContextSupport;
  }

  if (!browserSupportsWebAuthn()) {
    return unsupportedSupport;
  }

  return supportedSupport;
}

export function subscribeToPasskeySupport() {
  return () => undefined;
}

/**
 * Convert browser/library errors into messages that are useful to users
 * without exposing browser internals or server details.
 */
export function getPasskeyErrorMessage(
  error: unknown,
  fallback: string,
): string {
  const name =
    error instanceof WebAuthnError ||
    (typeof DOMException !== "undefined" && error instanceof DOMException) ||
    error instanceof Error
      ? error.name
      : undefined;

  switch (name) {
    case "AbortError":
    case "NotAllowedError":
      return "操作已取消或逾時，請再試一次。";
    case "InvalidStateError":
      return "這個裝置可能已註冊相同的 Passkey。";
    case "NotSupportedError":
      return "這個瀏覽器或裝置不支援 Passkey，請改用密碼登入。";
    case "SecurityError":
      return "目前連線不符合 Passkey 的安全要求，請改用 HTTPS 後再試。";
    default:
      return fallback;
  }
}

export { startAuthentication, startRegistration };
