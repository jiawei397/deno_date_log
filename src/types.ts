import type {
  BaseHandler,
  BaseHandlerOptions,
  LevelName,
  LoggerConfig,
  LogMode,
  LogRecord,
} from "@std/log";

export type LogAppender = "console" | "dateFile";

export interface LogLoggers {
  [name: string]: LoggerConfig;
}

export interface LogHandlers {
  [name: string]: BaseHandler;
}

export type DateFileHandlerOptions = BaseHandlerOptions & {
  filename: string;
  /**
   * @default {"a"}
   */
  mode?: LogMode;
  /**
   * Buffer size for writing log messages to file, in bytes.
   *
   * @default {4096}
   */
  bufferSize?: number;

  pattern?: string; // like : yyyy-MM-dd.log
  daysToKeep?: number;
  flushTimeout?: number; // ms
};

export type Formatter = (logRecord: LogRecord) => string;

export interface DateFileLogConfig {
  appenders?: {
    dateFile: DateFileHandlerOptions;
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
   * If you want to disable color, set this to false.
   * This option only works for console appender.
   * @default true
   */
  needColor?: boolean;
}
