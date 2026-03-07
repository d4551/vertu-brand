#!/usr/bin/env bun

import { existsSync } from "node:fs";
import { cp, mkdir, readdir, rm, stat } from "node:fs/promises";
import { dirname, relative, resolve } from "node:path";

import {
  GUIDE_PATHS,
  GUIDE_SOCIAL_BUILD_INPUT_FILES,
  resolveGuidePublicAssetSourcePath,
  resolveGuidePaths,
  resolveGuidePublicDirectories,
  resolveGuidePublicFiles,
  resolveGuideStylesheetBuildCommand,
} from "../src/server/runtime-config";
import { extractGuideSections, normalizeAuthoringAssetUrls } from "../src/shared/authoring-guide";
import { GUIDE_SERVER, toGuideRequestUrl } from "../src/shared/config";
import { writeStructuredLog } from "../src/shared/logger";
import {
  SOCIAL_APPROVED_ASSETS,
  buildSocialStaticAssetPath,
  buildSocialStaticCarouselPath,
  resolveCanonicalSocialBuildRequests,
  resolveSocialPackManifest,
  SOCIAL_PRESET_REGISTRY,
} from "../src/shared/social-toolkit";
import { prepareSectionMarkup } from "../src/shared/section-markup";
import { GUIDE_LANGUAGES, GUIDE_SECTION_IDS, resolveGuideViewState } from "../src/shared/view-state";
import { renderSocialAssetPng, renderSocialCarouselFramePng } from "../src/server/social-renderer";

const decoder = new TextDecoder();
const stagingBuildDirectory = `${GUIDE_PATHS.buildDirectory}-next-${process.pid}-${crypto.randomUUID()}`;

const stagingPaths = resolveGuidePaths({
  buildDirectory: stagingBuildDirectory,
  projectRoot: GUIDE_PATHS.projectRoot,
});

const stagingPublicDirectories = resolveGuidePublicDirectories(stagingPaths);
const stagingPublicFiles = resolveGuidePublicFiles(stagingPaths);
const stagingDirectories = [
  ...new Set([
    dirname(stagingPaths.clientScriptOutput),
    dirname(stagingPaths.downloadGuideHtmlOutput),
    dirname(stagingPaths.socialBuildFingerprintOutput),
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

const collectNestedFiles = async (directory: string): Promise<string[]> => {
  const entries = await readdir(directory, { withFileTypes: true });
  const nestedFiles = await Promise.all(
    entries.map(async (entry) => {
      const entryPath = resolve(directory, entry.name);
      return entry.isDirectory() ? collectNestedFiles(entryPath) : [entryPath];
    })
  );

  return nestedFiles.flat().sort((left, right) => left.localeCompare(right));
};

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

const updateHasherWithFile = async (hasher: Bun.CryptoHasher, filePath: string): Promise<void> => {
  hasher.update(relative(GUIDE_PATHS.projectRoot, filePath));
  hasher.update(new Uint8Array(await Bun.file(filePath).arrayBuffer()));
};

const resolveSocialBuildFingerprint = async (canonicalSocialRequestSource: string): Promise<string> => {
  const hasher = new Bun.CryptoHasher("sha256");
  const socialAssetSourceFiles = await collectNestedFiles(resolve(GUIDE_PATHS.projectRoot, "assets", "images"));
  const approvedAssetSourceFiles = Object.values(SOCIAL_APPROVED_ASSETS).map(({ path }) =>
    resolveGuidePublicAssetSourcePath(path, GUIDE_PATHS.projectRoot)
  );
  const inputFiles = [...new Set([...GUIDE_SOCIAL_BUILD_INPUT_FILES, ...socialAssetSourceFiles, ...approvedAssetSourceFiles])]
    .sort((left, right) => left.localeCompare(right));

  hasher.update(canonicalSocialRequestSource);

  for (const inputFile of inputFiles) {
    await updateHasherWithFile(hasher, inputFile);
  }

  return hasher.digest("hex");
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
  define: {
    "Bun.env": "undefined",
  },
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

const stylesheetBuildCommand = resolveGuideStylesheetBuildCommand(stagingPaths);
const stylesheetBuild = Bun.spawnSync({
  cmd: stylesheetBuildCommand.cmd,
  cwd: stylesheetBuildCommand.cwd,
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
const canonicalSocialRequestSource = JSON.stringify(canonicalSocialRequests);
const canonicalSocialPackRequests = [
  ...new Map(
    canonicalSocialRequests.map((request) => [`${request.packId}:${request.language}:${request.theme}:${request.section}`, request])
  ).values(),
];
const socialBuildFingerprint = await resolveSocialBuildFingerprint(canonicalSocialRequestSource);
const canReuseCanonicalSocialBuild =
  existsSync(GUIDE_PATHS.socialBuildFingerprintOutput) &&
  existsSync(GUIDE_PATHS.socialManifestOutputRoot) &&
  existsSync(GUIDE_PATHS.socialPublicOutputRoot) &&
  (await Bun.file(GUIDE_PATHS.socialBuildFingerprintOutput).text()).trim() === socialBuildFingerprint;

if (canReuseCanonicalSocialBuild) {
  await Promise.all([
    syncGeneratedOutput(GUIDE_PATHS.socialManifestOutputRoot, stagingPaths.socialManifestOutputRoot),
    syncGeneratedOutput(GUIDE_PATHS.socialPublicOutputRoot, stagingPaths.socialPublicOutputRoot),
  ]);
} else {
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
}

await Bun.write(stagingPaths.socialBuildFingerprintOutput, `${socialBuildFingerprint}\n`);

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

const { renderDocument } = await import("../src/server/render/layout");
const snapshotRequestUrl = new URL(toGuideRequestUrl("/?section=s0&lang=bi&theme=dark"));
const downloadGuideHtml = renderDocument(
  resolveGuideViewState(snapshotRequestUrl),
  GUIDE_SERVER.localOrigin,
  snapshotRequestUrl.searchParams
);

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
    socialBuildCache: canReuseCanonicalSocialBuild ? "reused" : "rebuilt",
    socialManifestBytes: socialManifestStats.size,
    socialPublicFiles: socialPublicEntries.length,
    sectionRegistryBytes: sectionRegistryStats.size,
    stylesheetBytes: stylesheetStats.size,
  },
});
