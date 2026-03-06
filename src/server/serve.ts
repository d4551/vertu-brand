import { GUIDE_SERVER } from "../shared/config";
import { startGuideServer } from "./app";

const servePort = Number(Bun.env.GUIDE_PORT ?? "") || GUIDE_SERVER.servePort;

startGuideServer(servePort);
