# date_log

[![deno version](https://img.shields.io/badge/deno-^1.34.2-blue?logo=deno)](https://github.com/denoland/deno)

Reference from [std log](https://deno.land/std@0.191.0/log), everyday will
generate a new log file.

## examples

```ts
import {
  DateFileLogConfig,
  getLogger,
  initLog,
} from "https://deno.land/x/date_log@v1.0.2/mod.ts";

const config: DateFileLogConfig = {
  "appenders": {
    "dateFile": {
      "filename": "logs/deno",
      "daysToKeep": 10,
      "pattern": "yyyy-MM-dd.log",
    },
  },
  "categories": {
    "default": {
      "appenders": ["console", "dateFile"],
      "level": "DEBUG",
    },
  },
  // "needColor": true, 
};

await initLog(config);

const logger = getLogger();
logger.warning("warning");
logger.warning(1);
logger.info("info");
logger.error("error");

const logger2 = getLogger("task");
logger2.warning("warning2");
logger2.warning(2);
logger2.info("info2");
logger2.error("error2");
```

Then will generate a log named like `deno.2023-06-16.log` in logs dir.
