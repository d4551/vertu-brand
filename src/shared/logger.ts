/**
 * Supported log levels for structured output.
 */
export type StructuredLogLevel = "INFO" | "WARN" | "ERROR";

/**
 * Structured log payload written to stdout or stderr.
 */
export interface StructuredLogEvent {
  component: string;
  level: StructuredLogLevel;
  message: string;
  context?: Record<string, string | number | boolean | null>;
}

/**
 * Writes a single JSON log line for automation-friendly diagnostics.
 */
export const writeStructuredLog = (event: StructuredLogEvent): void => {
  const payload = JSON.stringify({
    timestamp: new Date().toISOString(),
    ...event,
  });
  const stream = event.level === "ERROR" ? process.stderr : process.stdout;
  stream.write(`${payload}\n`);
};
