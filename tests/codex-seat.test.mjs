import { expect, test } from "bun:test";
import { spawnSync } from "node:child_process";
import { chmodSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

const seatScript = fileURLToPath(
  new URL("../plugins/pstack/skills/poteto-mode/scripts/codex-seat.sh", import.meta.url),
);

// A stand-in `codex` that records its argv and stdin, then behaves as the
// test asks: write a final message, write none, or fail.
function fakeCodex(dir, behavior) {
  const bin = join(dir, "bin");
  mkdirSync(bin);
  const script = [
    "#!/usr/bin/env bash",
    `printf '%s\\n' "$@" > "${join(dir, "argv")}"`,
    `cat > "${join(dir, "stdin")}"`,
    'out=""',
    'while [ "$#" -gt 0 ]; do [ "$1" = "--output-last-message" ] && out="$2"; shift; done',
    behavior === "message" ? 'printf "finding one\\n" > "$out"' : "",
    behavior === "fail" ? 'echo "auth expired" >&2; exit 9' : "",
    "exit 0",
  ].join("\n");
  writeFileSync(join(bin, "codex"), script);
  chmodSync(join(bin, "codex"), 0o755);
  return bin;
}

function run(args, pathDirs) {
  return spawnSync("bash", [seatScript, ...args], {
    encoding: "utf8",
    env: { ...process.env, PATH: [...pathDirs, "/usr/bin", "/bin"].join(":") },
  });
}

function withDir(fn) {
  const dir = mkdtempSync(join(tmpdir(), "pstack-codex-seat-"));
  try {
    writeFileSync(join(dir, "prompt.md"), "review this diff\n");
    mkdirSync(join(dir, "repo"));
    return fn(dir);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
}

test("a seat runs read-only on gpt-6.1-sol at xhigh by default and prints the result path", () =>
  withDir((dir) => {
    const bin = fakeCodex(dir, "message");
    const out = join(dir, "seat", "result.md");
    const result = run(["--prompt", join(dir, "prompt.md"), "--out", out, "--cwd", join(dir, "repo")], [bin]);
    expect(result.status).toBe(0);
    expect(result.stdout.trim()).toBe(out);
    expect(readFileSync(out, "utf8")).toBe("finding one\n");
    expect(readFileSync(join(dir, "stdin"), "utf8")).toBe("review this diff\n");
    const argv = readFileSync(join(dir, "argv"), "utf8").trimEnd().split("\n");
    expect(argv).toEqual([
      "exec",
      "--model",
      "gpt-6.1-sol",
      "--config",
      'model_reasoning_effort="xhigh"',
      "--sandbox",
      "read-only",
      "--cd",
      join(dir, "repo"),
      "--skip-git-repo-check",
      "--color",
      "never",
      "--output-last-message",
      out,
      "-",
    ]);
  }));

test("--write, --model and --effort reach codex", () =>
  withDir((dir) => {
    const bin = fakeCodex(dir, "message");
    const out = join(dir, "result.md");
    const args = ["--prompt", join(dir, "prompt.md"), "--out", out, "--cwd", join(dir, "repo")];
    const result = run([...args, "--write", "--model", "gpt-6-astra", "--effort", "max"], [bin]);
    expect(result.status).toBe(0);
    const argv = readFileSync(join(dir, "argv"), "utf8").trimEnd().split("\n");
    expect(argv.slice(1, 7)).toEqual([
      "--model",
      "gpt-6-astra",
      "--config",
      'model_reasoning_effort="max"',
      "--sandbox",
      "workspace-write",
    ]);
  }));

test("a missing codex exits 3 and names the dropout", () =>
  withDir((dir) => {
    const empty = join(dir, "empty-bin");
    mkdirSync(empty);
    const result = run(
      ["--prompt", join(dir, "prompt.md"), "--out", join(dir, "r.md"), "--cwd", join(dir, "repo")],
      [empty],
    );
    expect(result.status).toBe(3);
    expect(result.stderr).toContain("dropout");
  }));

test("a codex failure passes its exit code through and keeps its output", () =>
  withDir((dir) => {
    const bin = fakeCodex(dir, "fail");
    const out = join(dir, "r.md");
    const result = run(["--prompt", join(dir, "prompt.md"), "--out", out, "--cwd", join(dir, "repo")], [bin]);
    expect(result.status).toBe(9);
    expect(readFileSync(`${out}.log`, "utf8")).toContain("auth expired");
  }));

test("a run that writes no final message exits 4", () =>
  withDir((dir) => {
    const bin = fakeCodex(dir, "silent");
    const result = run(
      ["--prompt", join(dir, "prompt.md"), "--out", join(dir, "r.md"), "--cwd", join(dir, "repo")],
      [bin],
    );
    expect(result.status).toBe(4);
  }));

test("missing arguments and unknown flags exit 2", () =>
  withDir((dir) => {
    const bin = fakeCodex(dir, "message");
    expect(run(["--prompt", join(dir, "prompt.md")], [bin]).status).toBe(2);
    expect(run(["--bogus"], [bin]).status).toBe(2);
    const missingPrompt = ["--prompt", join(dir, "nope.md"), "--out", join(dir, "r.md"), "--cwd", join(dir, "repo")];
    expect(run(missingPrompt, [bin]).status).toBe(2);
  }));
