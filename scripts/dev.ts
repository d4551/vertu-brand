#!/usr/bin/env bun

import { watch, type FSWatcher } from "node:fs";
import { basename, relative, resolve } from "node:path";

import {
  GUIDE_BUILD_WATCH_PATHS,
  GUIDE_PATHS,
  type GuideDevBuildTarget,
  resolveGuideBuildCommand,
  resolveGuideDevBuildTarget,
  resolveGuideServerCommand,
} from "../src/server/runtime-config";
import { writeStructuredLog } from "../src/shared/logger";
import { GUIDE_RUNTIME_SETTINGS, logGuideRuntimeSettingWarnings } from "../src/shared/runtime-settings";

const BUILD_DEBOUNCE_MS = GUIDE_RUNTIME_SETTINGS.devBuildDebounceMs;
const WATCHER_WARMUP_MS = GUIDE_RUNTIME_SETTINGS.devWatcherWarmupMs;
const initialBuildCommand = resolveGuideBuildCommand("full", GUIDE_PATHS.projectRoot);

let buildInFlight = false;
let buildQueuedTarget: GuideDevBuildTarget | null = null;
let buildTimer: ReturnType<typeof setTimeout> | null = null;
let ignoreWatchEventsUntil = Date.now() + WATCHER_WARMUP_MS;
let serverProcess: ReturnType<typeof Bun.spawn> | null = null;
let shuttingDown = false;
let watchersReady = false;
const watchers: FSWatcher[] = [];

const initialBuild = Bun.spawnSync({
  cmd: initialBuildCommand.cmd,
  cwd: initialBuildCommand.cwd,
  stderr: "inherit",
  stdout: "inherit",
});

if (initialBuild.exitCode !== 0) {
  process.exit(initialBuild.exitCode ?? 1);
}

process.on("SIGINT", () => shutdown(0));
process.on("SIGTERM", () => shutdown(0));

logGuideRuntimeSettingWarnings("dev");

writeStructuredLog({
  component: "dev",
  level: "INFO",
  message: "Guide development orchestrator running",
  context: {
    buildDebounceMs: BUILD_DEBOUNCE_MS,
    watchedDirectories: GUIDE_BUILD_WATCH_PATHS.directories.length,
    watchedFiles: GUIDE_BUILD_WATCH_PATHS.files.length,
    watcherWarmupMs: WATCHER_WARMUP_MS,
  },
});

const mergeQueuedBuildTarget = (
  current: GuideDevBuildTarget | null,
  next: GuideDevBuildTarget
): GuideDevBuildTarget => (current === "full" || next === "full" ? "full" : next);

const scheduleBuild = (reason: string, changedPath: string): void => {
  if (!watchersReady || Date.now() < ignoreWatchEventsUntil) {
    return;
  }

  if (buildTimer) {
    clearTimeout(buildTimer);
    buildTimer = null;
  }

  buildTimer = setTimeout(() => {
    void runBuild(reason, resolveGuideDevBuildTarget(changedPath));
  }, BUILD_DEBOUNCE_MS);
};

function createWatchers(): FSWatcher[] {
  return [
    ...GUIDE_BUILD_WATCH_PATHS.directories.map((directory) =>
      watch(directory, { recursive: true }, (_eventType, fileName) => {
        const changedPath = typeof fileName === "string" && fileName ? resolve(directory, fileName) : directory;
        const reason = relative(GUIDE_PATHS.projectRoot, changedPath) || basename(directory);
        scheduleBuild(reason, changedPath);
      })
    ),
    ...GUIDE_BUILD_WATCH_PATHS.files.map((filePath) =>
      watch(filePath, () => {
        scheduleBuild(relative(GUIDE_PATHS.projectRoot, filePath) || basename(filePath), filePath);
      })
    ),
  ];
}

function startServer(): void {
  serverProcess?.kill();
  const serverCommand = resolveGuideServerCommand("dev", GUIDE_PATHS.projectRoot);
  const nextServerProcess = Bun.spawn({
    cmd: serverCommand.cmd,
    cwd: serverCommand.cwd,
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

startServer();
watchers.push(...createWatchers());
setTimeout(() => {
  watchersReady = true;
}, WATCHER_WARMUP_MS);

const runBuild = async (reason: string, target: GuideDevBuildTarget): Promise<void> => {
  if (buildInFlight) {
    buildQueuedTarget = mergeQueuedBuildTarget(buildQueuedTarget, target);
    return;
  }

  buildInFlight = true;
  writeStructuredLog({
    component: "dev",
    level: "INFO",
    message: target === "full" ? "Rebuilding guide assets and templates" : "Rebuilding guide app assets",
    context: { reason, target },
  });

  const buildCommand = resolveGuideBuildCommand(target, GUIDE_PATHS.projectRoot);
  const buildProcess = Bun.spawn({
    cmd: buildCommand.cmd,
    cwd: buildCommand.cwd,
    stderr: "inherit",
    stdout: "inherit",
  });

  const exitCode = await buildProcess.exited;
  buildInFlight = false;
  ignoreWatchEventsUntil = Date.now() + WATCHER_WARMUP_MS;
  if (exitCode === 0) {
    startServer();
  }

  writeStructuredLog({
    component: "dev",
    level: exitCode === 0 ? "INFO" : "ERROR",
    message: exitCode === 0 ? "Guide rebuild completed" : "Guide rebuild failed",
    context: { exitCode, reason, target },
  });

  if (buildQueuedTarget) {
    const nextTarget = buildQueuedTarget;
    buildQueuedTarget = null;
    void runBuild("queued change", nextTarget);
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

  watchers.forEach((watcher) => {
    watcher.close();
  });
  serverProcess?.kill();

  writeStructuredLog({
    component: "dev",
    level: "INFO",
    message: "Guide development orchestrator stopped",
    context: { exitCode },
  });

  process.exit(exitCode);
};
