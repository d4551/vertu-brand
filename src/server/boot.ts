import { GUIDE_SERVER } from "../shared/config";
import { startGuideServer } from "./app";
import { resolveGuideServerPort, type GuideServerCommandTarget } from "./runtime-config";

/**
 * Shared boot contract for repository-owned server entrypoints.
 */
export const GUIDE_SERVER_BOOT_OPTIONS = {
  dev: {
    defaultPort: GUIDE_SERVER.defaultPort,
    includeLegacyPort: true,
  },
  serve: {
    defaultPort: GUIDE_SERVER.servePort,
    includeLegacyPort: false,
  },
} as const satisfies Record<
  GuideServerCommandTarget,
  {
    defaultPort: number;
    includeLegacyPort: boolean;
  }
>;

/**
 * Boots one of the canonical guide server entrypoints with the shared port contract.
 */
export const bootGuideServer = (
  target: GuideServerCommandTarget,
  args: readonly string[] = Bun.argv,
  env: Readonly<Record<string, string | undefined>> = Bun.env
): void => {
  const options = GUIDE_SERVER_BOOT_OPTIONS[target];
  const port = resolveGuideServerPort({
    args,
    defaultPort: options.defaultPort,
    env,
    includeLegacyPort: options.includeLegacyPort,
  });

  startGuideServer(port);
};
