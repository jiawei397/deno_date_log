import {
  BaseHandler,
  HandlerOptions,
  LevelName,
  Logger,
  LoggerConfig,
  LogMode,
  LogRecord,
} from "../deps.ts";

export type LogAppender = "console" | "dateFile";

export interface LogLoggers {
  [name: string]: LoggerConfig;
}

export interface LogHandlers {
  [name: string]: BaseHandler;
}

export interface FileHandlerOptions extends HandlerOptions {
  filename: string;
  mode?: LogMode;

  pattern?: string; // like : yyyy-MM-dd.log
  daysToKeep?: number;
}

export type Formatter = (logRecord: LogRecord) => string;

export interface DateFileLogConfig {
  appenders: {
    dateFile: FileHandlerOptions;
  };
  categories: {
    [key: string]: {
      level: LevelName;
      appenders: LogAppender[];
    };
  };
  consoleFormatter?: Formatter;
  dateFileFormatter?: Formatter;
  /**
   * If you want to use color, set this to true.
   * This option only works for console appender.
   * @default true in dev mode, and false in prod mode when the environment variable "DENO_ENV" is set to "production"
   */
  needColor?: boolean;
}

export type MyLogger = Logger & {
  warn: (...msg: unknown[]) => unknown;
};
