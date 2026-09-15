import { build } from "esbuild";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { resolve, join } from "node:path";
import { spawnSync } from "node:child_process";

const directory = await mkdtemp(join(tmpdir(), "stepstep-passkey-tests-"));
try {
  const outfile = join(directory, "passkey.test.cjs");
  await build({
    entryPoints: ["tests/passkey.test.ts"],
    outfile,
    bundle: true,
    platform: "node",
    format: "cjs",
    target: "node24",
    alias: {
      "server-only": resolve("tests/mocks/server-only.ts"),
      "next/headers": resolve("tests/mocks/headers.ts"),
    },
    logLevel: "warning",
  });
  const result = spawnSync(process.execPath, ["--test", outfile], {
    stdio: "inherit",
  });
  process.exitCode = result.status ?? 1;
} finally {
  await rm(directory, { recursive: true, force: true });
}
