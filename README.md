# date_log

[![deno version](https://img.shields.io/badge/deno-^2.0.2-blue?logo=deno)](https://github.com/denoland/deno)

Reference from [std log](https://jsr.io/@std/log), everyday will
generate a new log file.

## example

```ts
import { yellow } from "@std/fmt/colors";
import { type DateFileLogConfig, getLogger, initLog } from "./mod.ts";

const config: DateFileLogConfig = {
  appenders: {
    dateFile: {
      filename: "logs/deno",
      daysToKeep: 10,
      pattern: "yyyy-MM-dd.log",
    },
  },
  categories: {
    default: {
      appenders: ["console", "dateFile"],
      level: "DEBUG",
    },
    task: {
      appenders: ["console", "dateFile"],
      level: "WARN",
    },
  },
  // "needColor": true, // if you want to use color, set this to true, default is true in dev mode, false in prod mode when the environment variable "DENO_ENV" is set to "production"
};

initLog(config);

const logger = getLogger();

logger.debug("debug1");
logger.warn("warn", "msg2", "msg3");
logger.warn("warn1");
logger.warn(1);
logger.info("info1");
logger.error("error1");
logger.info(
  yellow("Nest"),
  // green(format(new Date(), "yyyy-MM-dd HH:mm:ss")),
  "Nest application successfully started",
);

const err = { name: "error" };

const logger2 = getLogger("task");
logger2.debug("debug2");
logger2.warn("warn2");
logger2.info("info2"); // will be ignored
logger2.error("error2", JSON.stringify(err));

setTimeout(() => {
  logger2.error("error3");
}, 1000);
```

Then will generate a log named like `deno.2023-06-16.log` in logs dir.

If you may not want to print colors, there are 2 ways:

1. Set env `NO_COLOR` to `true`
2. Set config `needColor` to `false`
