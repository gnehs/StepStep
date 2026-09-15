"use client";

import {
  FormEvent,
  useCallback,
  useEffect,
  useState,
  useSyncExternalStore,
} from "react";
import { LoaderCircle, RefreshCw, Trash2 } from "lucide-react";
import Button from "@/components/Button";
import Input from "@/components/Input";
import SectionTitle from "@/components/SectionTitle";
import {
  getPasskeyRegistrationOptions,
  listPasskeys,
  removePasskey,
  verifyPasskeyRegistration,
} from "@/services/actions/passkey";
import {
  getPasskeyErrorMessage,
  getPasskeySupport,
  subscribeToPasskeySupport,
  startRegistration,
} from "@/services/passkey-browser";

type Passkey = {
  id: string;
  name: string;
  createdAt: number;
  lastUsedAt: number | null;
};

function formatPasskeyDate(timestamp: number | null): string {
  if (timestamp === null) {
    return "尚未使用";
  }

  return new Intl.DateTimeFormat("zh-TW", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(timestamp));
}

export default function PasskeySettings() {
  const [passkeys, setPasskeys] = useState<Passkey[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRegistering, setIsRegistering] = useState(false);
  const [removingId, setRemovingId] = useState<string | null>(null);
  const [passkeyName, setPasskeyName] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const support = useSyncExternalStore(
    subscribeToPasskeySupport,
    getPasskeySupport,
    () => null,
  );

  const loadPasskeys = useCallback(async () => {
    setIsLoading(true);
    setError("");
    try {
      const result = await listPasskeys();
      if (!result.success) {
        setError(result.message || "無法載入 Passkey，請稍後再試。");
        return;
      }
      setPasskeys(result.passkeys);
    } catch {
      setError("無法載入 Passkey，請稍後再試。");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    let active = true;

    async function loadInitialPasskeys() {
      const result = await listPasskeys();
      if (!active) {
        return;
      }

      setIsLoading(false);
      if (!result.success) {
        setError(result.message || "無法載入 Passkey，請稍後再試。");
        return;
      }
      setError("");
      setPasskeys(result.passkeys);
    }

    void loadInitialPasskeys().catch(() => {
      if (active) {
        setIsLoading(false);
        setError("無法載入 Passkey，請稍後再試。");
      }
    });

    return () => {
      active = false;
    };
  }, []);

  async function handleRegister(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (isRegistering || removingId || !support?.supported) {
      return;
    }

    const trimmedName = passkeyName.trim();
    if (!trimmedName) {
      setError("請輸入 Passkey 名稱。");
      return;
    }

    setIsRegistering(true);
    setError("");
    setNotice("");
    try {
      const optionsResult = await getPasskeyRegistrationOptions(password);
      if (!optionsResult.success) {
        setError(optionsResult.message || "無法開始註冊 Passkey，請稍後再試。");
        return;
      }

      const response = await startRegistration({
        optionsJSON: optionsResult.options,
      });
      const verificationResult = await verifyPasskeyRegistration(
        response,
        trimmedName,
      );
      if (!verificationResult.success) {
        setError(
          verificationResult.message || "Passkey 註冊失敗，請稍後再試。",
        );
        return;
      }

      setPasskeyName("");
      setPassword("");
      setNotice("Passkey 已新增。");
      await loadPasskeys();
    } catch (registrationError) {
      setError(
        getPasskeyErrorMessage(
          registrationError,
          "Passkey 註冊失敗，請稍後再試。",
        ),
      );
    } finally {
      setIsRegistering(false);
      setPassword("");
    }
  }

  async function handleRemove(passkey: Passkey) {
    if (removingId || isRegistering) {
      return;
    }

    if (!window.confirm(`確定要移除「${passkey.name}」嗎？`)) {
      return;
    }

    setRemovingId(passkey.id);
    setError("");
    setNotice("");
    try {
      const result = await removePasskey(passkey.id);
      if (!result.success) {
        setError(result.message || "無法移除 Passkey，請稍後再試。");
        return;
      }

      setPasskeys((current) => current.filter(({ id }) => id !== passkey.id));
      setNotice("Passkey 已移除。");
    } catch {
      setError("無法移除 Passkey，請稍後再試。");
    } finally {
      setRemovingId(null);
    }
  }

  return (
    <section aria-label="Passkey 管理">
      <p className="mb-3 text-sm opacity-75">
        使用 Face ID、Touch ID 或裝置螢幕鎖定快速登入，不必輸入密碼。
      </p>

      {error ? (
        <p
          className="mb-3 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700 dark:bg-red-950/30 dark:text-red-200"
          role="alert"
        >
          {error}
        </p>
      ) : null}
      {notice ? (
        <p
          className="mb-3 rounded-lg bg-green-50 px-3 py-2 text-sm text-green-700 dark:bg-green-950/30 dark:text-green-200"
          role="status"
        >
          {notice}
        </p>
      ) : null}

      {support === null ? (
        <p className="mb-3 text-sm opacity-75">正在檢查 Passkey 支援⋯⋯</p>
      ) : support.supported ? (
        <form
          onSubmit={handleRegister}
          className="dark:glass-effect mb-4 rounded-lg bg-white p-3 shadow-sm dark:bg-black/5"
        >
          <div className="mb-2 font-medium">新增 Passkey</div>
          <SectionTitle className="mb-1">名稱</SectionTitle>
          <Input
            id="passkey-name"
            aria-label="Passkey 名稱"
            value={passkeyName}
            onChange={(event) => setPasskeyName(event.target.value)}
            placeholder="例如：我的 iPhone"
            autoComplete="off"
            maxLength={64}
            required
            disabled={isRegistering || Boolean(removingId)}
          />
          <SectionTitle className="mt-2 mb-1">目前密碼</SectionTitle>
          <Input
            id="passkey-password"
            aria-label="目前密碼"
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            autoComplete="current-password"
            required
            disabled={isRegistering || Boolean(removingId)}
          />
          <Button
            className="mt-3 w-full disabled:cursor-not-allowed disabled:opacity-50"
            type="submit"
            disabled={isRegistering || Boolean(removingId)}
          >
            {isRegistering ? (
              <span className="flex items-center justify-center gap-2">
                <LoaderCircle
                  size={16}
                  className="animate-spin"
                  aria-hidden="true"
                />
                等待裝置確認⋯⋯
              </span>
            ) : (
              "新增 Passkey"
            )}
          </Button>
        </form>
      ) : (
        <p className="bg-primary-100 dark:bg-primary-900 mb-4 rounded-lg px-3 py-2 text-sm">
          {support.message || "目前無法使用 Passkey，請改用密碼登入。"}
        </p>
      )}

      <div className="dark:glass-effect rounded-lg bg-white p-3 shadow-sm dark:bg-black/5">
        <div className="mb-2 flex items-center justify-between gap-2">
          <div className="font-medium">已註冊的 Passkey</div>
          <button
            type="button"
            className="flex items-center gap-1 text-sm text-blue-500 disabled:cursor-not-allowed disabled:opacity-50 dark:text-blue-300"
            onClick={() => void loadPasskeys()}
            disabled={isLoading || isRegistering || Boolean(removingId)}
          >
            <RefreshCw size={14} aria-hidden="true" />
            重新整理
          </button>
        </div>
        {isLoading ? (
          <p className="flex items-center gap-2 text-sm opacity-75">
            <LoaderCircle
              size={16}
              className="animate-spin"
              aria-hidden="true"
            />
            載入中⋯⋯
          </p>
        ) : passkeys.length === 0 ? (
          <p className="text-sm opacity-75">目前尚未新增 Passkey。</p>
        ) : (
          <ul className="divide-primary-100 dark:divide-primary-800 divide-y">
            {passkeys.map((passkey) => (
              <li
                key={passkey.id}
                className="flex items-start justify-between gap-3 py-3 first:pt-1 last:pb-1"
              >
                <div className="min-w-0">
                  <div className="truncate font-medium">{passkey.name}</div>
                  <div className="text-xs opacity-75">
                    新增於 {formatPasskeyDate(passkey.createdAt)} · 最近使用：
                    {formatPasskeyDate(passkey.lastUsedAt)}
                  </div>
                </div>
                <button
                  type="button"
                  className="flex shrink-0 items-center gap-1 rounded px-1 text-sm text-red-600 disabled:cursor-not-allowed disabled:opacity-50 dark:text-red-300"
                  onClick={() => void handleRemove(passkey)}
                  disabled={Boolean(removingId) || isRegistering}
                  aria-label={`移除 ${passkey.name}`}
                >
                  <Trash2 size={16} aria-hidden="true" />
                  {removingId === passkey.id ? "移除中⋯⋯" : "移除"}
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}
