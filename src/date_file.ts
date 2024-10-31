import {
  BaseHandler,
  type LevelName,
  LogLevels,
  type LogRecord,
} from "@std/log";
import { ensureDirSync } from "@std/fs";
import { join } from "@std/path";
import { writeAllSync } from "@std/io/write-all";
import {
  bufSymbol,
  encoderSymbol,
  filenameSymbol,
  fileSymbol,
  modeSymbol,
  openOptionsSymbol,
  pointerSymbol,
} from "./_date_file_handler_symbols.ts";
import { expireDate } from "./utils.ts";
import type { DateFileHandlerOptions } from "./types.ts";
import { dateToString } from "./date_format.ts";

export type LogMode = "a" | "w" | "x";

export class DateFileHandler extends BaseHandler {
  protected _pattern = "yyyy-MM-dd.log";
  protected _daysToKeep = 30;
  private originFileName = "";
  protected tomorrowDay = 0;
  protected _flushTimeout = 1000; // 1s refresh once

  [fileSymbol]: Deno.FsFile | undefined;
  [bufSymbol]: Uint8Array;
  [pointerSymbol] = 0;
  [filenameSymbol]: string;
  [modeSymbol]: LogMode;
  [openOptionsSymbol]: Deno.OpenOptions;
  [encoderSymbol]: TextEncoder = new TextEncoder();
  #unloadCallback = (() => {
    this.destroy();
  }).bind(this);

  constructor(levelName: LevelName, options: DateFileHandlerOptions) {
    super(levelName, options);

    this[filenameSymbol] = options.filename;
    // default to append mode, write only
    this[modeSymbol] = options.mode ?? "a";
    this[openOptionsSymbol] = {
      createNew: this[modeSymbol] === "x",
      create: this[modeSymbol] !== "x",
      append: this[modeSymbol] === "a",
      truncate: this[modeSymbol] !== "a",
      write: true,
    };
    this[bufSymbol] = new Uint8Array(options.bufferSize ?? 4096);

    this.originFileName = options.filename;

    if (options.pattern) {
      this._pattern = options.pattern;
    }
    if (options.daysToKeep) {
      this._daysToKeep = options.daysToKeep;
    }
    if (options.flushTimeout !== undefined) {
      this._flushTimeout = options.flushTimeout;
    }
  }

  private getTomorrow() {
    const now = new Date();
    now.setHours(0);
    now.setMinutes(0);
    now.setSeconds(0);
    now.setDate(now.getDate() + 1);
    return now.getTime();
  }

  private init() {
    this.mkdirAndRemoveExpiredFiles();
    this.setupBuf();
  }

  private mkdirAndRemoveExpiredFiles() {
    this.tomorrowDay = this.getTomorrow();
    let name = this.originFileName;
    let dir = "./";
    if (name.includes("/")) {
      const arr = name.split("/");
      name = arr.pop()!;
      dir = arr.join("/");
      ensureDirSync(dir);
    }

    // remove expired files
    if (this._daysToKeep > 0) {
      const ed = expireDate(this._daysToKeep);
      const expiredFileName = this.getFilenameByDate(name, ed);
      for (const dirEntry of Deno.readDirSync(dir)) {
        const dirEntryName = dirEntry.name;
        if (dirEntryName.startsWith(name) && /\d+/.test(dirEntryName)) {
          if (expiredFileName > dirEntryName) {
            console.log(
              `[${dirEntryName}]Compared to [${expiredFileName}] has expired and will be deleted soon`,
            );
            const filename = join(dir, dirEntryName);
            Deno.remove(filename).catch((err) => {
              console.error(`remove expired file [${filename}] error:`, err);
            });
          }
        }
      }
    }
  }

  private getFilenameByDate(filename: string, date = new Date()): string {
    if (this._pattern) {
      return filename + "." + dateToString(this._pattern, date);
    }
    return filename;
  }

  private setupBuf() {
    this[filenameSymbol] = this.getFilenameByDate(this.originFileName);
    this[fileSymbol] = Deno.openSync(
      this[filenameSymbol],
      this[openOptionsSymbol],
    );
    this.#resetBuffer();
  }

  override setup() {
    this[filenameSymbol] = this.getFilenameByDate(this.originFileName);
    this.init();
    addEventListener("unload", this.#unloadCallback.bind(this));
  }

  flush() {
    if (this[pointerSymbol] > 0 && this[fileSymbol]) {
      let written = 0;
      while (written < this[pointerSymbol]) {
        written += this[fileSymbol].writeSync(
          this[bufSymbol].subarray(written, this[pointerSymbol]),
        );
      }
      this.#resetBuffer();
    }
  }

  #resetBuffer() {
    this[pointerSymbol] = 0;
  }

  override destroy() {
    this.flush();
    this[fileSymbol]?.close();
    this[fileSymbol] = undefined;
    removeEventListener("unload", this.#unloadCallback);
  }

  override handle(logRecord: LogRecord) {
    super.handle(logRecord);

    // Immediately flush if log level is higher than ERROR
    if (logRecord.level > LogLevels.ERROR) {
      this.flush();
    }
  }

  private _log(msg: string): void {
    const bytes = this[encoderSymbol].encode(msg + "\n");
    if (bytes.byteLength > this[bufSymbol].byteLength - this[pointerSymbol]) {
      this.flush();
    }
    if (bytes.byteLength > this[bufSymbol].byteLength) {
      writeAllSync(this[fileSymbol]!, bytes);
    } else {
      this[bufSymbol].set(bytes, this[pointerSymbol]);
      this[pointerSymbol] += bytes.byteLength;
    }
    setTimeout(() => {
      this.flush();
    }, this._flushTimeout);
  }

  log(msg: string): void {
    if (this.tomorrowDay <= Date.now()) { // date changed
      this.init();
    }
    this._log(msg);
  }
}
