import { blue, bold, red, yellow } from "@std/fmt/colors";
import {
  BaseHandler,
  LogLevels,
  type BaseHandlerOptions,
  type LevelName,
  type LogRecord,
} from "@std/log";

/**
 * This is the default logger. It will output color coded log messages to the
 * console via `console.log()`.
 */
export class MyConsoleHandler extends BaseHandler {
  needColor: boolean;

  constructor(levelName: LevelName, options: BaseHandlerOptions & {
    needColor?: boolean;
  } = {}) {
    super(levelName, options);
    this.needColor = options.needColor ?? false;
  }

  override format(logRecord: LogRecord): string {
    let msg = super.format(logRecord);
    if (!this.needColor) {
      return msg;
    }
    switch (logRecord.level) {
      case LogLevels.INFO:
        msg = blue(msg);
        break;
      case LogLevels.WARN:
        msg = yellow(msg);
        break;
      case LogLevels.ERROR:
        msg = red(msg);
        break;
      case LogLevels.CRITICAL:
        msg = bold(red(msg));
        break;
      default:
        break;
    }

    return msg;
  }

  override log(msg: string) {
    console.log(msg);
  }
}
