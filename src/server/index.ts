import { GUIDE_SERVER } from "../shared/config";
import { startGuideServer } from "./app";

const defaultPort = Number(Bun.env.GUIDE_PORT ?? Bun.env.PORT ?? "") || GUIDE_SERVER.defaultPort;
const portFlagIndex = Bun.argv.findIndex((value) => value === "-l" || value === "--listen");
const port = portFlagIndex >= 0 ? Number(Bun.argv[portFlagIndex + 1]) || defaultPort : defaultPort;

startGuideServer(port);
