export * from "./src/date_file.ts";
export * from "./src/console.ts";
export * from "./src/main.ts";
export * from "./src/date_format.ts";

export type { DateFileLogConfig, Formatter, LogAppender } from "./src/types.ts";

export { getLogger, type LevelName, type LogRecord } from "@std/log";
