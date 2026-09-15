import assert from "node:assert/strict";
import test from "node:test";
import {
  getBearerToken,
  unauthorizedBearerResponse,
} from "../services/api-auth";

test("only a strict Authorization Bearer header supplies an API credential", () => {
  const valid = new Request("https://steps.example.test/api/v1/sync", {
    headers: { Authorization: "Bearer sync-token_123" },
  });
  assert.equal(getBearerToken(valid), "sync-token_123");

  for (const authorization of [
    undefined,
    "",
    "Basic sync-token_123",
    "Bearer",
    "Bearer ",
    "Bearer sync-token-123 extra",
    "Bearer sync token",
    "Bearer sync.token/123%",
  ]) {
    const request = new Request("https://steps.example.test/api/v1/sync", {
      headers: authorization === undefined ? {} : { Authorization: authorization },
    });
    assert.equal(getBearerToken(request), null, authorization ?? "missing");
  }
});

test("query-string credentials are never accepted as API credentials", () => {
  const request = new Request(
    "https://steps.example.test/api/v1/sync?token=sync-token_123",
  );
  assert.equal(getBearerToken(request), null);
});

test("unauthorized API responses prevent caching and advertise Bearer auth", async () => {
  const response = unauthorizedBearerResponse("令牌無效", true);

  assert.equal(response.status, 401);
  assert.equal(response.headers.get("cache-control"), "no-store");
  assert.equal(
    response.headers.get("www-authenticate"),
    'Bearer realm="StepStep API", error="invalid_token"',
  );
  assert.deepEqual(await response.json(), {
    success: false,
    message: "令牌無效",
  });
});
