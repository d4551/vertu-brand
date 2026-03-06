#!/usr/bin/env bun

import { cp, mkdir, readdir, rm, stat } from "node:fs/promises";
import { dirname, resolve } from "node:path";

import { GUIDE_PATHS, GUIDE_PUBLIC_DIRECTORIES, GUIDE_PUBLIC_FILES } from "../src/server/runtime-config";
import { extractGuideSections, normalizeAuthoringAssetUrls } from "../src/shared/authoring-guide";
import { writeStructuredLog } from "../src/shared/logger";
import {
  buildSocialStaticAssetPath,
  buildSocialStaticCarouselPath,
  resolveCanonicalSocialBuildRequests,
  resolveSocialPackManifest,
  SOCIAL_PRESET_REGISTRY,
} from "../src/shared/social-toolkit";
import { prepareSectionMarkup } from "../src/shared/section-markup";
import { GUIDE_LANGUAGES, GUIDE_SECTION_IDS } from "../src/shared/view-state";
import { renderSocialAssetPng, renderSocialCarouselFramePng } from "../src/server/social-renderer";
import { toGuideRequestUrl } from "../src/shared/config";

const decoder = new TextDecoder();
const stagingBuildDirectory = `${GUIDE_PATHS.buildDirectory}-next-${process.pid}-${crypto.randomUUID()}`;

const toStagingPath = (path: string): string => path.replace(GUIDE_PATHS.buildDirectory, stagingBuildDirectory);

const stagingPaths = {
  ...GUIDE_PATHS,
  buildDirectory: stagingBuildDirectory,
  clientScriptOutput: toStagingPath(GUIDE_PATHS.clientScriptOutput),
  downloadGuideHtmlOutput: toStagingPath(GUIDE_PATHS.downloadGuideHtmlOutput),
  publicRoot: toStagingPath(GUIDE_PATHS.publicRoot),
  socialManifestOutputRoot: toStagingPath(GUIDE_PATHS.socialManifestOutputRoot),
  socialPublicOutputRoot: toStagingPath(GUIDE_PATHS.socialPublicOutputRoot),
  sectionNavigationOutput: toStagingPath(GUIDE_PATHS.sectionNavigationOutput),
  sectionRegistryOutput: toStagingPath(GUIDE_PATHS.sectionRegistryOutput),
  stylesheetOutput: toStagingPath(GUIDE_PATHS.stylesheetOutput),
} as const;

const stagingPublicDirectories = GUIDE_PUBLIC_DIRECTORIES.map(({ outputPath, sourcePath }) => ({
  outputPath: toStagingPath(outputPath),
  sourcePath,
}));

const stagingPublicFiles = GUIDE_PUBLIC_FILES.map(({ outputPath, sourcePath }) => ({
  outputPath: toStagingPath(outputPath),
  sourcePath,
}));
const stagingDirectories = [
  ...new Set([
    dirname(stagingPaths.clientScriptOutput),
    dirname(stagingPaths.downloadGuideHtmlOutput),
    stagingPaths.socialManifestOutputRoot,
    stagingPaths.socialPublicOutputRoot,
    dirname(stagingPaths.sectionNavigationOutput),
    dirname(stagingPaths.sectionRegistryOutput),
    dirname(stagingPaths.stylesheetOutput),
    ...stagingPublicDirectories.map(({ outputPath }) => dirname(outputPath)),
    ...stagingPublicFiles.map(({ outputPath }) => dirname(outputPath)),
  ]),
];

await rm(stagingBuildDirectory, { force: true, recursive: true });

await Promise.all(stagingDirectories.map((directory) => mkdir(directory, { recursive: true })));

const syncGeneratedOutput = async (sourceDirectory: string, destinationDirectory: string): Promise<void> => {
  await mkdir(destinationDirectory, { recursive: true });

  const [sourceEntries, destinationEntries] = await Promise.all([
    readdir(sourceDirectory, { withFileTypes: true }),
    readdir(destinationDirectory, { withFileTypes: true }),
  ]);
  const sourceEntryNames = new Set(sourceEntries.map(({ name }) => name));

  await Promise.all(
    destinationEntries
      .filter(({ name }) => !sourceEntryNames.has(name))
      .map(({ name }) => rm(resolve(destinationDirectory, name), { force: true, recursive: true }))
  );

  await Promise.all(
    sourceEntries.map(async (entry) => {
      const sourcePath = resolve(sourceDirectory, entry.name);
      const destinationPath = resolve(destinationDirectory, entry.name);

      if (entry.isDirectory()) {
        await syncGeneratedOutput(sourcePath, destinationPath);
        return;
      }

      await Bun.write(destinationPath, Bun.file(sourcePath));
    })
  );
};

const authoringGuideSource = await Bun.file(GUIDE_PATHS.downloadGuideHtmlSource).text();
const runtimeGuideSource = normalizeAuthoringAssetUrls(authoringGuideSource);
const extractedSections = extractGuideSections(runtimeGuideSource);
const sectionMetadata = extractedSections.map(({ id, index, title }) => ({ id, index, title }));
const sectionRegistry = new Map(extractedSections.map(({ id, markup }) => [id, markup] as const));
const generatedSectionModule = [
  'import type { GuideLocalizedSectionRegistry } from "../../src/shared/section-markup";',
  "",
  "/**",
  " * Generated from the authoring guide source by scripts/build-app.ts.",
  " */",
  "export const SECTION_REGISTRY: GuideLocalizedSectionRegistry = new Map([",
  ...GUIDE_LANGUAGES.map(
    (language) =>
      `  [${JSON.stringify(language)}, new Map([${GUIDE_SECTION_IDS.map((sectionId) =>
        JSON.stringify([sectionId, prepareSectionMarkup(sectionRegistry.get(sectionId) ?? "", language, sectionId)])
      ).join(", ")}])],`
  ),
  "]);",
  "",
].join("\n");
const generatedNavigationModule = [
  'import type { GuideSectionMeta } from "../../src/shared/section-markup";',
  "",
  "/**",
  " * Generated from the authoring guide source by scripts/build-app.ts.",
  " */",
  `export const GUIDE_NAVIGATION: readonly GuideSectionMeta[] = ${JSON.stringify(sectionMetadata, null, 2)};`,
  "",
].join("\n");

await Promise.all([
  Bun.write(stagingPaths.sectionNavigationOutput, generatedNavigationModule),
  Bun.write(stagingPaths.sectionRegistryOutput, generatedSectionModule),
]);

const scriptBuild = await Bun.build({
  entrypoints: [GUIDE_PATHS.clientScriptEntry],
  format: "esm",
  minify: true,
  naming: {
    entry: "guide.[ext]",
  },
  outdir: dirname(stagingPaths.clientScriptOutput),
  root: GUIDE_PATHS.projectRoot,
  target: "browser",
  throw: false,
});

if (!scriptBuild.success) {
  throw new Error(
    ["Failed to build client script.", ...scriptBuild.logs.map((log) => log.message)].filter(Boolean).join("\n")
  );
}

const stylesheetBuild = Bun.spawnSync({
  cmd: [
    process.execPath,
    "x",
    "tailwindcss",
    "-i",
    GUIDE_PATHS.stylesheetEntry,
    "-o",
    stagingPaths.stylesheetOutput,
    "--minify",
  ],
  cwd: GUIDE_PATHS.projectRoot,
  stderr: "pipe",
  stdout: "pipe",
});

if (stylesheetBuild.exitCode !== 0) {
  throw new Error(
    [
      "Failed to build stylesheet.",
      decoder.decode(stylesheetBuild.stderr).trim(),
      decoder.decode(stylesheetBuild.stdout).trim(),
    ]
      .filter(Boolean)
      .join("\n")
  );
}

await Promise.all([
  ...stagingPublicDirectories.map(({ outputPath, sourcePath }) =>
    cp(sourcePath, outputPath, { force: true, recursive: true })
  ),
  ...stagingPublicFiles.map(({ outputPath, sourcePath }) => Bun.write(outputPath, Bun.file(sourcePath))),
]);

const canonicalSocialRequests = resolveCanonicalSocialBuildRequests();
const canonicalSocialPackRequests = [
  ...new Map(
    canonicalSocialRequests.map((request) => [`${request.packId}:${request.language}:${request.theme}:${request.section}`, request])
  ).values(),
];
const canonicalSocialWrites = canonicalSocialRequests.map(async (request) => {
  const outputPath = resolve(stagingPaths.socialPublicOutputRoot, buildSocialStaticAssetPath(request));
  await mkdir(dirname(outputPath), { recursive: true });
  await Bun.write(outputPath, await renderSocialAssetPng(request));
});

const canonicalSocialCarouselWrites = canonicalSocialPackRequests.flatMap((request) =>
  SOCIAL_PRESET_REGISTRY[request.packId].carouselFrames.map(async (frame) => {
    const outputPath = resolve(stagingPaths.socialPublicOutputRoot, buildSocialStaticCarouselPath(request, frame));
    await mkdir(dirname(outputPath), { recursive: true });
    await Bun.write(outputPath, await renderSocialCarouselFramePng(request, frame));
  })
);

const canonicalSocialManifestWrites = canonicalSocialPackRequests.map(async (request) => {
  const outputPath = resolve(
    stagingPaths.socialManifestOutputRoot,
    `${request.packId}-${request.language}-${request.theme}-${request.section}.json`
  );
  await mkdir(dirname(outputPath), { recursive: true });
  const manifest = resolveSocialPackManifest(request);
  await Bun.write(outputPath, `${JSON.stringify(manifest, null, 2)}\n`);
});

await Promise.all([...canonicalSocialWrites, ...canonicalSocialCarouselWrites, ...canonicalSocialManifestWrites]);

const [navigationStats, scriptStats, socialManifestStats, socialPublicEntries, stylesheetStats, sectionRegistryStats] = await Promise.all([
  stat(stagingPaths.sectionNavigationOutput),
  stat(stagingPaths.clientScriptOutput),
  stat(resolve(stagingPaths.socialManifestOutputRoot, "campaign-signature-en-light-s0.json")),
  readdir(stagingPaths.socialPublicOutputRoot, { recursive: true }),
  stat(stagingPaths.stylesheetOutput),
  stat(stagingPaths.sectionRegistryOutput),
]);

await syncGeneratedOutput(stagingBuildDirectory, GUIDE_PATHS.buildDirectory);
await rm(stagingBuildDirectory, { force: true, recursive: true });

const { app } = await import("../src/server/app");
const downloadGuideResponse = await app.handle(new Request(toGuideRequestUrl("/?section=s0&lang=bi&theme=dark")));
const downloadGuideHtml = await downloadGuideResponse.text();

if (!downloadGuideResponse.ok) {
  throw new Error(`Failed to generate the canonical HTML guide snapshot. HTTP ${downloadGuideResponse.status}`);
}

await Bun.write(GUIDE_PATHS.downloadGuideHtmlOutput, downloadGuideHtml);

writeStructuredLog({
  component: "build",
  level: "INFO",
  message: "Guide assets built",
  context: {
    copiedDirectories: stagingPublicDirectories.length,
    copiedFiles: stagingPublicFiles.length + 3,
    navigationBytes: navigationStats.size,
    scriptBytes: scriptStats.size,
    socialManifestBytes: socialManifestStats.size,
    socialPublicFiles: socialPublicEntries.length,
    sectionRegistryBytes: sectionRegistryStats.size,
    stylesheetBytes: stylesheetStats.size,
  },
});
