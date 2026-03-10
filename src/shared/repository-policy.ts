import { lstat, readdir } from "node:fs/promises";
import { join } from "node:path";

import ts from "typescript";

import { GUIDE_PATHS } from "../server/runtime-config";

/**
 * Root filesystem entries covered by repository policy checks and audits.
 */
export const REPOSITORY_POLICY_ROOTS = [
  join(GUIDE_PATHS.projectRoot, "src"),
  join(GUIDE_PATHS.projectRoot, "tests"),
  join(GUIDE_PATHS.projectRoot, "scripts"),
] as const;

/**
 * Shared string tokens used by repository policy assertions.
 */
export const REPOSITORY_POLICY_TOKENS = {
  bunPlugin: ["Bun", ".plugin("].join(""),
  console: ["con", "sole."].join(""),
  execCommand: ["exec", "Command("].join(""),
  htmxExtension: ["htmx", ".defineExtension("].join(""),
} as const;

/**
 * Shared matcher for hardcoded social route literals that bypass shared config.
 */
export const REPOSITORY_SOCIAL_ROUTE_LITERAL_PATTERN = /["'`]\/social(?:\/|\?)/;

/**
 * Missing exported-declaration JSDoc entry emitted by the repository policy scan.
 */
export interface MissingJsDocExport {
  exportName: string;
  filePath: string;
}

/**
 * Collects maintained source files covered by repository policy checks.
 */
export const collectRepositoryPolicyFiles = async (
  entries: readonly string[] = REPOSITORY_POLICY_ROOTS
): Promise<string[]> => {
  const results: string[] = [];

  for (const entry of entries) {
    const stats = await lstat(entry);
    if (!stats.isDirectory()) {
      results.push(entry);
      continue;
    }

    const directoryEntries = await readdir(entry, { withFileTypes: true });
    const nestedFiles = await collectRepositoryPolicyFiles(
      directoryEntries
        .filter((directoryEntry) => directoryEntry.name !== "vendor")
        .map((directoryEntry) => join(entry, directoryEntry.name))
    );
    results.push(...nestedFiles);
  }

  return results.filter((file) => /\.(?:js|mjs|ts)$/.test(file));
};

/**
 * Finds exported TypeScript declarations that do not carry JSDoc comments.
 */
export const findExportedDeclarationsMissingJsDoc = async (
  entries: readonly string[] = REPOSITORY_POLICY_ROOTS
): Promise<readonly MissingJsDocExport[]> => {
  const files = await collectRepositoryPolicyFiles(entries);
  const violations: MissingJsDocExport[] = [];

  for (const filePath of files.filter((file) => file.endsWith(".ts") && !file.endsWith(".d.ts"))) {
    const sourceText = await Bun.file(filePath).text();
    const sourceFile = ts.createSourceFile(filePath, sourceText, ts.ScriptTarget.Latest, true);

    const visit = (node: ts.Node): void => {
      if (isJsDocValidatedExport(node)) {
        const exportNames = getExportedDeclarationNames(node, sourceFile);
        if (exportNames.length > 0 && ts.getJSDocCommentsAndTags(node).length === 0) {
          exportNames.forEach((exportName) => {
            violations.push({ exportName, filePath });
          });
        }
      }

      ts.forEachChild(node, visit);
    };

    visit(sourceFile);
  }

  return violations;
};

const isJsDocValidatedExport = (
  node: ts.Node
): node is
  | ts.ClassDeclaration
  | ts.FunctionDeclaration
  | ts.InterfaceDeclaration
  | ts.TypeAliasDeclaration
  | ts.VariableStatement =>
  (ts.isClassDeclaration(node) ||
    ts.isFunctionDeclaration(node) ||
    ts.isInterfaceDeclaration(node) ||
    ts.isTypeAliasDeclaration(node) ||
    ts.isVariableStatement(node)) &&
  hasExportModifier(node);

const hasExportModifier = (node: ts.Node): boolean =>
  ts.canHaveModifiers(node) &&
  (ts.getModifiers(node)?.some((modifier) => modifier.kind === ts.SyntaxKind.ExportKeyword) ?? false);

const getExportedDeclarationNames = (
  node:
    | ts.ClassDeclaration
    | ts.FunctionDeclaration
    | ts.InterfaceDeclaration
    | ts.TypeAliasDeclaration
    | ts.VariableStatement,
  sourceFile: ts.SourceFile
): readonly string[] => {
  if (ts.isVariableStatement(node)) {
    return node.declarationList.declarations.map((declaration) => declaration.name.getText(sourceFile));
  }

  return node.name ? [node.name.getText(sourceFile)] : [];
};
