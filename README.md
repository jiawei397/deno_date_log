# date_log

[![deno version](https://img.shields.io/badge/deno-^1.16.2-blue?logo=deno)](https://github.com/denoland/deno)
[![Deno](https://github.com/jiawei397/deno_lib/actions/workflows/deno.yml/badge.svg)](https://github.com/jiawei397/deno_lib/actions/workflows/deno.yml)

reference from [std log](https://deno.land/std@0.100.0/log), everyday will
generate a new log file.

## examples

```ts
import {
  DateFileLogConfig,
  getLogger,
  initLog,
} from "https://deno.land/x/date_log@v1.0.0/mod.ts";

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

then will generate a log named like `deno.2021-07-12.log` in logs
