import assert from "node:assert/strict";
import test from "node:test";
import { existsSync, readFileSync, readdirSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");

function sourceFiles(directory) {
  const result = [];
  for (const entry of readdirSync(directory, { withFileTypes: true })) {
    if (entry.name === "node_modules" || entry.name === ".next") continue;
    const path = join(directory, entry.name);
    if (entry.isDirectory()) result.push(...sourceFiles(path));
    else if (/\.(?:[cm]?js|tsx?)$/.test(entry.name)) result.push(path);
  }
  return result;
}

function readSources(directory) {
  return sourceFiles(directory)
    .map((path) => ({ path, source: readFileSync(path, "utf8") }))
    .sort((a, b) => a.path.localeCompare(b.path));
}

test("client code never persists the authentication token in browser storage", () => {
  const clientSource = readSources(join(root, "app"))
    .concat(readSources(join(root, "components")))
    .map(({ source }) => source)
    .join("\n");

  assert.doesNotMatch(
    clientSource,
    /useLocalStorage(?:<[^>]+>)?\s*\(\s*["'`]token["'`]/,
    "authentication tokens must stay in the HttpOnly session cookie",
  );
  assert.doesNotMatch(
    clientSource,
    /localStorage\.(?:getItem|setItem)\s*\(\s*["'`]token["'`]/,
    "authentication tokens must not be read or newly persisted by client JavaScript",
  );

  const cleanupPath = join(root, "components", "LegacyStorageCleanup.tsx");
  assert.equal(
    existsSync(cleanupPath),
    true,
    "the client must remove authentication data left by the old localStorage flow",
  );
  const cleanupSource = readFileSync(cleanupPath, "utf8");
  assert.match(cleanupSource, /\buseEffect\s*\(/);
  assert.match(cleanupSource, /localStorage\.removeItem\s*\(/);
  for (const key of ["token", "user", "syncToken"]) {
    assert.match(
      cleanupSource,
      new RegExp(`["']${key}["']`),
      `legacy localStorage key ${key} must be removed once on the client`,
    );
  }
});

test("API routes and documentation do not place bearer tokens in URL paths or queries", () => {
  const apiDirectory = join(root, "app", "api");
  const routeSources = readSources(apiDirectory);
  const routeSource = routeSources.map(({ source }) => source).join("\n");

  assert.doesNotMatch(
    routeSource,
    /searchParams\.get\(\s*["'`]token["'`]\s*\)/,
    "API tokens must be read from an authorization header or request body",
  );

  // Existing Shortcut clients still use the legacy token-in-path endpoint.
  // Keep that route for compatibility, but require the handler to make the
  // migration explicit and avoid redirecting or reflecting the credential.
  const legacyRoutes = routeSources.filter(({ path }) =>
    /(?:^|[\\/])sync[\\/]\[token\][\\/]route\.(?:[cm]?js|tsx?)$/.test(path),
  );
  for (const { source, path } of legacyRoutes) {
    const executableSource = source.replace(/\/\*[\s\S]*?\*\/|\/\/[^\n]*/g, "");
    assert.doesNotMatch(
      executableSource,
      /\bredirect\s*\(/,
      `${path} must not redirect a URL containing a credential`,
    );
    assert.doesNotMatch(
      executableSource,
      /(?:new\s+Response|Response\.json|JSON\.stringify)\s*\([\s\S]{0,240}\btoken\b/i,
      `${path} must not reflect the legacy token in its response`,
    );
    assert.match(
      executableSource,
      /syncHealthData\([\s\S]{0,180}legacy\s*:\s*true/i,
      `${path} must mark compatibility requests as legacy`,
    );
  }

  if (legacyRoutes.length > 0) {
    const syncApi = readFileSync(join(root, "services", "sync-api.ts"), "utf8");
    assert.match(
      syncApi,
      /Cache-Control["'`]?[\s\S]{0,120}no-store/i,
      "legacy sync responses must be marked non-cacheable",
    );
    assert.match(
      syncApi,
      /(?:deprecation|sunset)/i,
      "legacy sync responses must advertise endpoint deprecation",
    );
  }

  const readme = readFileSync(join(root, "README.md"), "utf8");
  assert.doesNotMatch(readme, /\/api\/v1\/[^\s`)]*\?[^\s`)]*token=/i);
  assert.doesNotMatch(
    readme,
    /curl[^\n]*\/api\/v1\/sync\/(?:<|\[)?token/i,
    "documentation must not show a token-bearing sync URL as a request example",
  );
  assert.match(readme, /舊版[^\n]*同步[^\n]*(?:deprecated|風險)/i);
});

test("server actions do not use password blanking as a substitute for public user serialization", () => {
  const syncAction = readFileSync(
    join(root, "services", "actions", "sync.ts"),
    "utf8",
  );
  assert.doesNotMatch(syncAction, /user\.password\s*=/);

  const authAction = readFileSync(
    join(root, "services", "actions", "auth.ts"),
    "utf8",
  );
  assert.doesNotMatch(
    authAction,
    /return\s*\{\s*success:\s*true\s*,\s*user\s*,\s*token\s*:/s,
    "login and refresh must never return a raw User row with its password",
  );
});
