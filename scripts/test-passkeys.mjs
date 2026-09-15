import { build } from "esbuild";
import { mkdtemp, readdir, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { dirname, extname, join, relative, resolve } from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");

async function findTestFiles(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    if (entry.name === "node_modules" || entry.name === ".next") continue;
    const path = join(directory, entry.name);
    if (entry.isDirectory()) {
      files.push(...(await findTestFiles(path)));
    } else if (/\.test\.(?:[cm]?js|tsx?)$/.test(entry.name)) {
      files.push(path);
    }
  }
  return files.sort();
}

function runTest(outfile) {
  const result = spawnSync(process.execPath, ["--test", outfile], {
    stdio: "inherit",
    cwd: root,
  });
  return result.status ?? 1;
}

const directory = await mkdtemp(join(tmpdir(), "stepstep-passkey-tests-"));
try {
  const requested = process.argv.slice(2);
  const allTests = await findTestFiles(root);
  const testFiles = requested.includes("--all")
    ? allTests
    : allTests.filter((path) => path === join(root, "tests/passkey.test.ts"));

  if (testFiles.length === 0) {
    throw new Error("No test files found");
  }

  for (const [index, entryPoint] of testFiles.entries()) {
    if (extname(entryPoint) === ".mjs") {
      process.exitCode = runTest(entryPoint);
    } else {
      const outfile = join(
        directory,
        `${String(index).padStart(3, "0")}-${relative(root, entryPoint)
          .replaceAll(/[\\/]/g, "-")
          .replace(/\.tsx?$/, "")}.test.cjs`,
      );
      await build({
        absWorkingDir: root,
        entryPoints: [entryPoint],
        outfile,
        bundle: true,
        platform: "node",
        format: "cjs",
        target: "node24",
        alias: {
          "server-only": resolve(root, "tests/mocks/server-only.ts"),
          "next/headers": resolve(root, "tests/mocks/headers.ts"),
        },
        logLevel: "warning",
      });
      process.exitCode = runTest(outfile);
    }
    if (process.exitCode !== 0) break;
  }
} finally {
  await rm(directory, { recursive: true, force: true });
}
