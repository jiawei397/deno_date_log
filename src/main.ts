import {
  cyan,
  dateToString,
  getLoggerOrigin,
  handlers as Handlers,
  LevelName,
  LogRecord,
  setup,
} from "../deps.ts";
import { DateFileHandler } from "./date_file.ts";
import {
  DateFileLogConfig,
  LogHandlers,
  LogLoggers,
  MyLogger,
} from "./types.ts";

export const getFormatter = function (needColor: boolean) {
  return function (logRecord: LogRecord) {
    const t1 = dateToString("yyyy-MM-dd hh:mm:ss", new Date());
    let msg = `${needColor ? cyan(t1) : t1} [${logRecord.levelName}] - `;
    if (logRecord.args.length > 0) { // if msg is multi, giv first a special color
      msg += `[${needColor ? cyan(logRecord.msg) : logRecord.msg}] ${
        logRecord.args.join(", ")
      }`;
    } else {
      msg += logRecord.msg;
    }
    return msg;
  };
};

export function initLog(config: DateFileLogConfig) {
  const loggers: LogLoggers = {};
  const handlers: LogHandlers = {};
  Object.keys(config.categories).forEach((key: string) => {
    const level = config.categories[key].level.toUpperCase() as LevelName;
    const appenders = config.categories[key].appenders;

    if (appenders.includes("console")) {
      if (!handlers.console) {
        const formatter = config.consoleFormatter || getFormatter(true);
        handlers.console = new Handlers.ConsoleHandler(level, {
          formatter: config.consoleFormatter || formatter,
        });
      }
    }
    if (appenders.includes("dateFile")) {
      if (!handlers.dateFile) {
        const formatter = config.dateFileFormatter || getFormatter(false);
        handlers.dateFile = new DateFileHandler(level, {
          ...config.appenders.dateFile,
          formatter,
        });
      }
    }

    loggers[key] = {
      level,
      handlers: appenders,
    };
  });
  return setup({
    handlers,
    loggers,
  });
}

export function getLogger(name?: string): MyLogger {
  const logger = getLoggerOrigin(name) as MyLogger;
  logger.warn = logger.warning;
  return logger;
}
