import { Elysia } from "elysia";

import { GUIDE_REQUEST_ID_HEADER, HTMX_REQUEST_HEADERS } from "../shared/config";
import { writeStructuredLog, type StructuredLogLevel } from "../shared/logger";

const requestIdRegistry = new WeakMap<Request, string>();

/**
 * Resolves a stable correlation id for the lifetime of a single Request instance.
 */
export const resolveGuideRequestId = (request: Request): string => {
  const existingRequestId = requestIdRegistry.get(request);
  if (existingRequestId) {
    return existingRequestId;
  }

  const requestId = request.headers.get(GUIDE_REQUEST_ID_HEADER)?.trim() || crypto.randomUUID();
  requestIdRegistry.set(request, requestId);
  return requestId;
};

const resolveStatusCode = (response: Response | object | string | number | boolean | null | undefined, setStatus: number | string | undefined): number => {
  if (response instanceof Response) {
    return response.status;
  }

  if (typeof setStatus === "number") {
    return setStatus;
  }

  if (typeof setStatus !== "string") {
    return 200;
  }

  const parsedStatus = Number.parseInt(setStatus, 10);
  return Number.isInteger(parsedStatus) ? parsedStatus : 200;
};

const resolveStatusLevel = (statusCode: number): StructuredLogLevel => {
  if (statusCode >= 500) {
    return "ERROR";
  }

  if (statusCode >= 400) {
    return "WARN";
  }

  return "INFO";
};

const resolveDurationMs = (startedAt: number): number => Number.parseFloat((performance.now() - startedAt).toFixed(2));

type GuideObservedResponse = Response | object | string | number | boolean | null | undefined;

/**
 * Shared Elysia plugin that adds request correlation ids and structured request logging.
 */
export const guideObservabilityPlugin = new Elysia({ name: "guideObservabilityPlugin" })
  .derive(({ request }) => ({
    guideRequestId: resolveGuideRequestId(request),
    guideRequestStartedAt: performance.now(),
  }))
  .onAfterHandle(({ guideRequestId, guideRequestStartedAt, request, response, set }) => {
    const requestUrl = new URL(request.url);
    const observedResponse: GuideObservedResponse =
      response === null ||
      response === undefined ||
      typeof response === "string" ||
      typeof response === "number" ||
      typeof response === "boolean" ||
      typeof response === "object"
        ? response
        : undefined;
    const statusCode = resolveStatusCode(observedResponse, set.status);
    const resolvedRequestId = guideRequestId ?? resolveGuideRequestId(request);

    writeStructuredLog({
      component: "http",
      level: resolveStatusLevel(statusCode),
      message: "Guide request completed",
      context: {
        durationMs: resolveDurationMs(guideRequestStartedAt),
        historyRestore: request.headers.get(HTMX_REQUEST_HEADERS.historyRestoreRequest) === "true",
        htmxRequest: request.headers.get(HTMX_REQUEST_HEADERS.request) === "true",
        method: request.method,
        path: `${requestUrl.pathname}${requestUrl.search}`,
        requestId: resolvedRequestId,
        statusCode,
        target: request.headers.get(HTMX_REQUEST_HEADERS.target) || null,
      },
    });
  })
  .onError(({ code, error, guideRequestId, guideRequestStartedAt, request }) => {
    const requestUrl = new URL(request.url);
    const resolvedRequestId = guideRequestId ?? resolveGuideRequestId(request);
    const resolvedErrorName = error instanceof Error ? error.name : "ElysiaCustomStatusResponse";

    writeStructuredLog({
      component: "http",
      level: "ERROR",
      message: "Guide request failed",
      context: {
        code: code ?? "UNKNOWN",
        durationMs: guideRequestStartedAt ? resolveDurationMs(guideRequestStartedAt) : 0,
        error: resolvedErrorName,
        method: request.method,
        path: `${requestUrl.pathname}${requestUrl.search}`,
        requestId: resolvedRequestId,
      },
    });
  });
