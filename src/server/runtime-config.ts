import { resolve } from "node:path";

import { GUIDE_DOWNLOADS } from "../shared/config";

const PROJECT_ROOT = resolve(import.meta.dir, "../..");
const DEFAULT_BUILD_DIRECTORY = resolve(PROJECT_ROOT, ".generated");

/**
 * Optional overrides accepted by the shared path resolver.
 */
export interface GuidePathResolutionInput {
  buildDirectory?: string;
  projectRoot?: string;
}

/**
 * Resolves the canonical guide filesystem paths for a given project/build root.
 */
export const resolveGuidePaths = ({ buildDirectory, projectRoot = PROJECT_ROOT }: GuidePathResolutionInput = {}) => {
  const resolvedBuildDirectory = buildDirectory ?? resolve(projectRoot, ".generated");
  const publicRoot = resolve(resolvedBuildDirectory, "public");

  return {
    buildDirectory: resolvedBuildDirectory,
    clientScriptEntry: resolve(projectRoot, "src/client/progressive-enhancements.ts"),
    clientScriptOutput: resolve(publicRoot, "assets/guide.js"),
    downloadGuideHtmlOutput: resolve(resolvedBuildDirectory, "downloads/vertu-brand-guide.html"),
    downloadGuideHtmlSource: resolve(projectRoot, "index.html"),
    projectRoot,
    publicRoot,
    socialBuildFingerprintOutput: resolve(resolvedBuildDirectory, "social-build.sha256"),
    socialManifestOutputRoot: resolve(publicRoot, "assets/social/manifests"),
    socialPublicOutputRoot: resolve(publicRoot, "assets/social"),
    sectionNavigationOutput: resolve(resolvedBuildDirectory, "content/navigation.generated.ts"),
    sectionRegistryOutput: resolve(resolvedBuildDirectory, "content/sections.generated.ts"),
    stylesheetEntry: resolve(projectRoot, "src/client/styles/guide.css"),
    stylesheetOutput: resolve(publicRoot, "assets/guide.css"),
  } as const;
};

/**
 * Shared path contract used across build, serve, and audit flows.
 */
export type GuidePaths = ReturnType<typeof resolveGuidePaths>;

/**
 * Resolves canonical brand-owned file paths for a given project root.
 */
export const resolveGuideBrandFilePaths = (projectRoot = PROJECT_ROOT) =>
  ({
    letterheadTemplate: resolve(projectRoot, GUIDE_DOWNLOADS["dl-docx"].fileName),
    logoBlack: resolve(projectRoot, GUIDE_DOWNLOADS["dl-logo-black"].fileName),
    logoGold: resolve(projectRoot, GUIDE_DOWNLOADS["dl-logo-gold"].fileName),
    logoWhite: resolve(projectRoot, GUIDE_DOWNLOADS["dl-logo-white"].fileName),
    presentationTemplate: resolve(projectRoot, GUIDE_DOWNLOADS["dl-pptx"].fileName),
  }) as const;

/**
 * Resolves a project-root absolute path for a public-facing asset href.
 */
export const resolveGuidePublicAssetSourcePath = (publicAssetPath: string, projectRoot = PROJECT_ROOT): string =>
  resolve(projectRoot, publicAssetPath.startsWith("/") ? publicAssetPath.slice(1) : publicAssetPath);

/**
 * Filesystem paths used by the guide build and server runtime.
 */
export const GUIDE_PATHS = resolveGuidePaths({ buildDirectory: DEFAULT_BUILD_DIRECTORY });

/**
 * Canonical brand-owned files stored at the repository root.
 */
export const GUIDE_BRAND_FILE_PATHS = resolveGuideBrandFilePaths(PROJECT_ROOT);

/**
 * Canonical local font files used by server-side social rendering.
 */
export const resolveGuideFontFilePaths = (projectRoot = PROJECT_ROOT) =>
  ({
    dmSans400: resolve(projectRoot, "node_modules/@fontsource/dm-sans/files/dm-sans-latin-400-normal.woff"),
    dmSans700: resolve(projectRoot, "node_modules/@fontsource/dm-sans/files/dm-sans-latin-700-normal.woff"),
    ibmPlexMono400: resolve(
      projectRoot,
      "node_modules/@fontsource/ibm-plex-mono/files/ibm-plex-mono-latin-400-normal.woff"
    ),
    instrumentSerif400: resolve(
      projectRoot,
      "node_modules/@fontsource/instrument-serif/files/instrument-serif-latin-400-normal.woff"
    ),
    playfairDisplay700: resolve(
      projectRoot,
      "node_modules/@fontsource/playfair-display/files/playfair-display-latin-700-normal.woff"
    ),
  }) as const;

/**
 * Canonical local font files used by server-side social rendering.
 */
export const GUIDE_FONT_FILE_PATHS = resolveGuideFontFilePaths(PROJECT_ROOT);

/**
 * Directories copied into the generated public surface before the server boots.
 */
export const resolveGuidePublicDirectories = (paths: GuidePaths) =>
  [
    {
      outputPath: resolve(paths.publicRoot, "assets/images"),
      sourcePath: resolve(paths.projectRoot, "assets/images"),
    },
    {
      outputPath: resolve(paths.publicRoot, "fonts"),
      sourcePath: resolve(paths.projectRoot, "fonts"),
    },
  ] as const;

/**
 * Directories copied into the generated public surface before the server boots.
 */
export const GUIDE_PUBLIC_DIRECTORIES = resolveGuidePublicDirectories(GUIDE_PATHS);

/**
 * Individual files copied into the generated public surface.
 */
export const resolveGuidePublicFiles = (paths: GuidePaths) =>
  [
    {
      outputPath: resolve(paths.publicRoot, GUIDE_DOWNLOADS["dl-docx"].fileName),
      sourcePath: GUIDE_BRAND_FILE_PATHS.letterheadTemplate,
    },
    {
      outputPath: resolve(paths.publicRoot, GUIDE_DOWNLOADS["dl-logo-black"].fileName),
      sourcePath: GUIDE_BRAND_FILE_PATHS.logoBlack,
    },
    {
      outputPath: resolve(paths.publicRoot, GUIDE_DOWNLOADS["dl-logo-gold"].fileName),
      sourcePath: GUIDE_BRAND_FILE_PATHS.logoGold,
    },
    {
      outputPath: resolve(paths.publicRoot, GUIDE_DOWNLOADS["dl-logo-white"].fileName),
      sourcePath: GUIDE_BRAND_FILE_PATHS.logoWhite,
    },
    {
      outputPath: resolve(paths.publicRoot, GUIDE_DOWNLOADS["dl-pptx"].fileName),
      sourcePath: GUIDE_BRAND_FILE_PATHS.presentationTemplate,
    },
  ] as const;

/**
 * Individual files copied into the generated public surface.
 */
export const GUIDE_PUBLIC_FILES = resolveGuidePublicFiles(GUIDE_PATHS);

/**
 * Input accepted by the shared server-port resolver.
 */
export interface GuidePortResolutionInput {
  args: readonly string[];
  defaultPort: number;
  env: Readonly<Record<string, string | undefined>>;
  includeLegacyPort?: boolean;
}

/**
 * Build scopes used by the local development orchestrator.
 */
export type GuideDevBuildTarget = "app" | "full";

/**
 * Server entry targets launched by repository-owned Bun processes.
 */
export type GuideServerCommandTarget = "dev" | "serve";

/**
 * Typed Bun command contract reused across build and server scripts.
 */
export interface GuideCommandContract {
  cmd: string[];
  cwd: string;
  label: string;
}

const normalizeGuidePort = (value: string | undefined): number | null => {
  const port = Number(value ?? "");
  return Number.isInteger(port) && port > 0 ? port : null;
};

const resolveFlagPort = (args: readonly string[]): number | null => {
  const portFlagIndex = args.findIndex((value) => value === "-l" || value === "--listen");
  return portFlagIndex >= 0 ? normalizeGuidePort(args[portFlagIndex + 1]) : null;
};

/**
 * Resolves the listen port from CLI flags and the shared env contract.
 */
export const resolveGuideServerPort = ({
  args,
  defaultPort,
  env,
  includeLegacyPort = false,
}: GuidePortResolutionInput): number =>
  resolveFlagPort(args) ??
  normalizeGuidePort(env.GUIDE_PORT) ??
  (includeLegacyPort ? normalizeGuidePort(env.PORT) : null) ??
  defaultPort;

/**
 * Files and directories that should trigger a rebuild during local development.
 */
export const GUIDE_BUILD_WATCH_PATHS = {
  directories: [
    resolve(PROJECT_ROOT, "assets"),
    resolve(PROJECT_ROOT, "fonts"),
    resolve(PROJECT_ROOT, "src"),
    resolve(PROJECT_ROOT, "styles"),
  ],
  files: [
    resolve(PROJECT_ROOT, "bun.lock"),
    resolve(PROJECT_ROOT, "index.html"),
    resolve(PROJECT_ROOT, "package.json"),
    resolve(PROJECT_ROOT, "scripts/build-app.ts"),
    resolve(PROJECT_ROOT, "scripts/generate-templates.mjs"),
    resolve(PROJECT_ROOT, "tsconfig.json"),
  ],
} as const;

/**
 * Shared package-script names used by the development orchestrator.
 */
export const GUIDE_DEV_BUILD_SCRIPTS = {
  app: "build:app",
  full: "build",
} as const satisfies Record<GuideDevBuildTarget, string>;

/**
 * Shared server entrypoint files launched by local Bun processes.
 */
export const GUIDE_SERVER_ENTRYPOINT_FILES = {
  dev: resolve(PROJECT_ROOT, "src/server/index.ts"),
  serve: resolve(PROJECT_ROOT, "src/server/serve.ts"),
} as const satisfies Record<GuideServerCommandTarget, string>;

/**
 * Resolves the Bun command used to run one package script from the repository root.
 */
export const resolveGuidePackageScriptCommand = (
  scriptName: string,
  projectRoot = PROJECT_ROOT
): GuideCommandContract => ({
  cmd: [process.execPath, "run", scriptName],
  cwd: projectRoot,
  label: `bun run ${scriptName}`,
});

/**
 * Resolves the Bun command for one of the canonical guide build targets.
 */
export const resolveGuideBuildCommand = (
  target: GuideDevBuildTarget,
  projectRoot = PROJECT_ROOT
): GuideCommandContract => resolveGuidePackageScriptCommand(GUIDE_DEV_BUILD_SCRIPTS[target], projectRoot);

/**
 * Resolves the Bun command used to launch one of the guide server entrypoints.
 */
export const resolveGuideServerCommand = (
  target: GuideServerCommandTarget,
  projectRoot = PROJECT_ROOT
): GuideCommandContract => ({
  cmd: [process.execPath, GUIDE_SERVER_ENTRYPOINT_FILES[target]],
  cwd: projectRoot,
  label: `bun ${GUIDE_SERVER_ENTRYPOINT_FILES[target]}`,
});

/**
 * Resolves the Tailwind CLI command that compiles the generated guide stylesheet.
 */
export const resolveGuideStylesheetBuildCommand = (paths: GuidePaths): GuideCommandContract => ({
  cmd: [process.execPath, "x", "tailwindcss", "-i", paths.stylesheetEntry, "-o", paths.stylesheetOutput, "--minify"],
  cwd: paths.projectRoot,
  label: "bunx tailwindcss",
});

/**
 * Resolves canonical source files that contribute to the social-build fingerprint.
 */
export const resolveGuideSocialBuildInputFiles = (projectRoot = PROJECT_ROOT) =>
  [
    resolve(projectRoot, "scripts/build-app.ts"),
    resolve(projectRoot, "src/server/social-renderer.ts"),
    resolve(projectRoot, "src/shared/brand-tokens.ts"),
    resolve(projectRoot, "src/shared/config.ts"),
    resolve(projectRoot, "src/shared/i18n.ts"),
    resolve(projectRoot, "src/shared/social-toolkit.ts"),
    resolve(projectRoot, "src/shared/view-state.ts"),
    ...Object.values(resolveGuideFontFilePaths(projectRoot)),
  ] as const;

/**
 * Canonical source files that contribute to the social-build fingerprint.
 */
export const GUIDE_SOCIAL_BUILD_INPUT_FILES = resolveGuideSocialBuildInputFiles(PROJECT_ROOT);

/**
 * Resolves full-build trigger paths for a given project root.
 */
export const resolveGuideFullBuildTriggerPaths = (projectRoot = PROJECT_ROOT) =>
  [
    resolve(projectRoot, "bun.lock"),
    resolve(projectRoot, "package.json"),
    resolve(projectRoot, "scripts/generate-templates.mjs"),
    resolve(projectRoot, "src/server/runtime-config.ts"),
    resolve(projectRoot, "src/shared/brand-tokens.ts"),
    resolve(projectRoot, "src/shared/template-catalog.ts"),
    resolve(projectRoot, "tsconfig.json"),
  ] as const;

/**
 * Source files that require a full rebuild because they affect generated template
 * outputs in addition to the app bundle.
 */
export const GUIDE_FULL_BUILD_TRIGGER_PATHS = resolveGuideFullBuildTriggerPaths(PROJECT_ROOT);

/**
 * Resolves which build scope should run for a changed path in local development.
 */
export const resolveGuideDevBuildTarget = (changedPath: string): GuideDevBuildTarget =>
  GUIDE_FULL_BUILD_TRIGGER_PATHS.some((filePath) => filePath === changedPath) ? "full" : "app";
