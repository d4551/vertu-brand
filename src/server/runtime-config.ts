import { resolve } from "node:path";

import { GUIDE_DOWNLOADS } from "../shared/config";

const PROJECT_ROOT = process.cwd();

/**
 * Filesystem paths used by the guide build and server runtime.
 */
export const GUIDE_PATHS = {
  buildDirectory: resolve(PROJECT_ROOT, ".generated"),
  clientScriptEntry: resolve(PROJECT_ROOT, "src/client/progressive-enhancements.ts"),
  clientScriptOutput: resolve(PROJECT_ROOT, ".generated/public/assets/guide.js"),
  downloadGuideHtmlOutput: resolve(PROJECT_ROOT, ".generated/downloads/vertu-brand-guide.html"),
  downloadGuideHtmlSource: resolve(PROJECT_ROOT, "index.html"),
  projectRoot: PROJECT_ROOT,
  publicRoot: resolve(PROJECT_ROOT, ".generated/public"),
  socialManifestOutputRoot: resolve(PROJECT_ROOT, ".generated/public/assets/social/manifests"),
  socialPublicOutputRoot: resolve(PROJECT_ROOT, ".generated/public/assets/social"),
  sectionNavigationOutput: resolve(PROJECT_ROOT, ".generated/content/navigation.generated.ts"),
  sectionRegistryOutput: resolve(PROJECT_ROOT, ".generated/content/sections.generated.ts"),
  stylesheetEntry: resolve(PROJECT_ROOT, "src/client/styles/guide.css"),
  stylesheetOutput: resolve(PROJECT_ROOT, ".generated/public/assets/guide.css"),
} as const;

/**
 * Directories copied into the generated public surface before the server boots.
 */
export const GUIDE_PUBLIC_DIRECTORIES = [
  {
    outputPath: resolve(PROJECT_ROOT, ".generated/public/assets/images"),
    sourcePath: resolve(PROJECT_ROOT, "assets/images"),
  },
  {
    outputPath: resolve(PROJECT_ROOT, ".generated/public/fonts"),
    sourcePath: resolve(PROJECT_ROOT, "fonts"),
  },
] as const;

/**
 * Individual files copied into the generated public surface.
 */
export const GUIDE_PUBLIC_FILES = [
  {
    outputPath: resolve(PROJECT_ROOT, `.generated/public/${GUIDE_DOWNLOADS["dl-docx"].fileName}`),
    sourcePath: resolve(PROJECT_ROOT, GUIDE_DOWNLOADS["dl-docx"].fileName),
  },
  {
    outputPath: resolve(PROJECT_ROOT, `.generated/public/${GUIDE_DOWNLOADS["dl-logo-black"].fileName}`),
    sourcePath: resolve(PROJECT_ROOT, GUIDE_DOWNLOADS["dl-logo-black"].fileName),
  },
  {
    outputPath: resolve(PROJECT_ROOT, `.generated/public/${GUIDE_DOWNLOADS["dl-logo-gold"].fileName}`),
    sourcePath: resolve(PROJECT_ROOT, GUIDE_DOWNLOADS["dl-logo-gold"].fileName),
  },
  {
    outputPath: resolve(PROJECT_ROOT, `.generated/public/${GUIDE_DOWNLOADS["dl-logo-white"].fileName}`),
    sourcePath: resolve(PROJECT_ROOT, GUIDE_DOWNLOADS["dl-logo-white"].fileName),
  },
  {
    outputPath: resolve(PROJECT_ROOT, `.generated/public/${GUIDE_DOWNLOADS["dl-pptx"].fileName}`),
    sourcePath: resolve(PROJECT_ROOT, GUIDE_DOWNLOADS["dl-pptx"].fileName),
  },
] as const;

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
    resolve(PROJECT_ROOT, "index.html"),
    resolve(PROJECT_ROOT, "package.json"),
    resolve(PROJECT_ROOT, "scripts/build-app.ts"),
    resolve(PROJECT_ROOT, "scripts/generate-templates.mjs"),
  ],
} as const;
