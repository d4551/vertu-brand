#!/usr/bin/env bun

import { existsSync, lstatSync, readdirSync, watch, type FSWatcher } from "node:fs";
import { basename, relative, resolve } from "node:path";

import { GUIDE_BUILD_WATCH_PATHS, GUIDE_PATHS } from "../src/server/runtime-config";
import { writeStructuredLog } from "../src/shared/logger";

const BUILD_DEBOUNCE_MS = 150;
const WATCHER_WARMUP_MS = 1000;
const buildCommand = [process.execPath, "run", "build"] as const;
const serverCommand = [process.execPath, "./src/server/index.ts"] as const;

let buildInFlight = false;
let buildQueued = false;
let buildTimer: ReturnType<typeof setTimeout> | null = null;
let ignoreWatchEventsUntil = Date.now() + WATCHER_WARMUP_MS;
let serverProcess: ReturnType<typeof Bun.spawn> | null = null;
let shuttingDown = false;
let watchersReady = false;
const watchedPathSignatures = new Map<string, string>();
const watchers: FSWatcher[] = [];

const initialBuild = Bun.spawnSync({
  cmd: [...buildCommand],
  cwd: GUIDE_PATHS.projectRoot,
  stderr: "inherit",
  stdout: "inherit",
});

if (initialBuild.exitCode !== 0) {
  process.exit(initialBuild.exitCode ?? 1);
}

process.on("SIGINT", () => shutdown(0));
process.on("SIGTERM", () => shutdown(0));

writeStructuredLog({
  component: "dev",
  level: "INFO",
  message: "Guide development orchestrator running",
  context: {
    watchedDirectories: GUIDE_BUILD_WATCH_PATHS.directories.length,
    watchedFiles: GUIDE_BUILD_WATCH_PATHS.files.length,
  },
});

const readPathSignature = (path: string): string => {
  if (!existsSync(path)) {
    return "missing";
  }

  const stats = lstatSync(path);

  if (!stats.isDirectory()) {
    return `${stats.isFile() ? "file" : "other"}:${stats.size}:${stats.mtimeMs}`;
  }

  const entries = readdirSync(path, { withFileTypes: true }).sort((left, right) => left.name.localeCompare(right.name));
  return [
    `dir:${entries.length}`,
    ...entries.map((entry) => `${entry.name}:${readPathSignature(resolve(path, entry.name))}`),
  ].join("|");
};

const seedWatchState = (path: string): void => {
  watchedPathSignatures.set(path, readPathSignature(path));

  if (!existsSync(path) || !lstatSync(path).isDirectory()) {
    return;
  }

  readdirSync(path, { withFileTypes: true }).forEach((entry) => {
    seedWatchState(resolve(path, entry.name));
  });
};

function refreshWatchState(): void {
  watchedPathSignatures.clear();
  GUIDE_BUILD_WATCH_PATHS.directories.forEach(seedWatchState);
  GUIDE_BUILD_WATCH_PATHS.files.forEach(seedWatchState);
}

const hasSourceChanged = (path: string): boolean => {
  const previousSignature = watchedPathSignatures.get(path);
  const nextSignature = readPathSignature(path);

  if (previousSignature === nextSignature) {
    return false;
  }

  watchedPathSignatures.set(path, nextSignature);
  return true;
};

const scheduleBuild = (path: string, reason: string): void => {
  if (!watchersReady || Date.now() < ignoreWatchEventsUntil) {
    return;
  }

  if (!hasSourceChanged(path)) {
    return;
  }

  if (buildTimer) {
    clearTimeout(buildTimer);
    buildTimer = null;
  }

  buildTimer = setTimeout(() => {
    void runBuild(reason);
  }, BUILD_DEBOUNCE_MS);
};

function createWatchers(): FSWatcher[] {
  return [
    ...GUIDE_BUILD_WATCH_PATHS.directories.map((directory) =>
      watch(directory, { recursive: true }, (_eventType, fileName) => {
        const changedPath = typeof fileName === "string" && fileName ? resolve(directory, fileName) : directory;
        const reason = relative(GUIDE_PATHS.projectRoot, changedPath) || basename(directory);
        scheduleBuild(changedPath, reason);
      })
    ),
    ...GUIDE_BUILD_WATCH_PATHS.files.map((filePath) =>
      watch(filePath, () => {
        scheduleBuild(filePath, relative(GUIDE_PATHS.projectRoot, filePath) || basename(filePath));
      })
    ),
  ];
}

function startServer(): void {
  serverProcess?.kill();
  const nextServerProcess = Bun.spawn({
    cmd: [...serverCommand],
    cwd: GUIDE_PATHS.projectRoot,
    stderr: "inherit",
    stdout: "inherit",
  });
  serverProcess = nextServerProcess;

  nextServerProcess.exited.then((exitCode) => {
    if (!shuttingDown && serverProcess === nextServerProcess && exitCode !== 0) {
      shutdown(exitCode);
    }
  });
}

refreshWatchState();
startServer();
watchers.push(...createWatchers());
setTimeout(() => {
  watchersReady = true;
}, WATCHER_WARMUP_MS);

const runBuild = async (reason: string): Promise<void> => {
  if (buildInFlight) {
    buildQueued = true;
    return;
  }

  buildInFlight = true;
  writeStructuredLog({
    component: "dev",
    level: "INFO",
    message: "Rebuilding guide assets",
    context: { reason },
  });

  const buildProcess = Bun.spawn({
    cmd: [...buildCommand],
    cwd: GUIDE_PATHS.projectRoot,
    stderr: "inherit",
    stdout: "inherit",
  });

  const exitCode = await buildProcess.exited;
  buildInFlight = false;
  ignoreWatchEventsUntil = Date.now() + WATCHER_WARMUP_MS;
  if (exitCode === 0) {
    refreshWatchState();
    startServer();
  }

  writeStructuredLog({
    component: "dev",
    level: exitCode === 0 ? "INFO" : "ERROR",
    message: exitCode === 0 ? "Guide rebuild completed" : "Guide rebuild failed",
    context: { exitCode, reason },
  });

  if (buildQueued) {
    buildQueued = false;
    void runBuild("queued change");
  }
};

const shutdown = (exitCode: number): void => {
  if (shuttingDown) {
    return;
  }

  shuttingDown = true;
  if (buildTimer) {
    clearTimeout(buildTimer);
    buildTimer = null;
  }

  watchers.forEach((watcher) => watcher.close());
  serverProcess?.kill();

  writeStructuredLog({
    component: "dev",
    level: "INFO",
    message: "Guide development orchestrator stopped",
    context: { exitCode },
  });

  process.exit(exitCode);
};
