import {
  BufWriterSync,
  dateToString,
  join,
  LevelName,
  LogLevels,
  LogMode,
  LogRecord,
  WriterHandler,
} from "../deps.ts";
import { FileHandlerOptions } from "./types.ts";
import { expireDate, mkdirSync } from "./utils.ts";

export class DateFileHandler extends WriterHandler {
  protected _file: Deno.FsFile | undefined;
  protected _buf!: BufWriterSync;
  protected _mode: LogMode;
  protected _openOptions: Deno.OpenOptions;
  protected _encoder = new TextEncoder();

  protected _pattern = "yyyy-MM-dd.log";
  protected _daysToKeep = 30;
  private originFileName = "";
  protected tomorrowDay = 0;

  #unloadCallback() {
    this.destroy();
  }

  constructor(levelName: LevelName, options: FileHandlerOptions) {
    super(levelName, options);
    // default to append mode, write only
    this._mode = options.mode ? options.mode : "a";
    this._openOptions = {
      createNew: this._mode === "x",
      create: this._mode !== "x",
      append: this._mode === "a",
      truncate: this._mode !== "a",
      write: true,
    };

    this.originFileName = options.filename;

    if (options.pattern) {
      this._pattern = options.pattern;
    }
    if (options.daysToKeep) {
      this._daysToKeep = options.daysToKeep;
    }
  }

  getTomorrow() {
    const now = new Date();
    now.setHours(0);
    now.setMinutes(0);
    now.setSeconds(0);
    now.setDate(now.getDate() + 1);
    return now.getTime();
  }

  private init() {
    this.mkdirAndremoveExpiredFiles();
    this.setupBuf();
  }

  private mkdirAndremoveExpiredFiles() {
    this.tomorrowDay = this.getTomorrow();
    let name = this.originFileName;
    let dir = "./";
    if (name.includes("/")) {
      const arr = name.split("/");
      name = arr.pop()!;
      dir = arr.join("/");
      mkdirSync(dir);
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
    const filename = this.getFilenameByDate(this.originFileName);
    this._file = Deno.openSync(filename, this._openOptions);
    this._writer = this._file;
    this._buf = new BufWriterSync(this._file);
  }

  setup() {
    this.init();
    addEventListener("unload", this.#unloadCallback.bind(this));
  }

  handle(logRecord: LogRecord): void {
    super.handle(logRecord);

    // Immediately flush if log level is higher than ERROR
    if (logRecord.level > LogLevels.ERROR) {
      this.flush();
    }
  }

  flush(): void {
    if (this._buf?.buffered() > 0) {
      this._buf.flush();
    }
  }

  destroy() {
    this.flush();
    this._file?.close();
    this._file = undefined;
    removeEventListener("unload", this.#unloadCallback);
  }

  private _log(msg: string): void {
    if (this._encoder.encode(msg).byteLength + 1 > this._buf.available()) {
      this.flush();
    }
    this._buf.writeSync(this._encoder.encode(msg + "\n"));
  }

  log(msg: string): void {
    if (this.tomorrowDay <= Date.now()) { // date changed
      this.init();
    }
    this._log(msg);
  }
}
