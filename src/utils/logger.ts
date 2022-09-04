export class Logger {
  private moduleName?: string;
  public constructor(moduleName?: string) {
    this.moduleName = moduleName;
  }
  public debug(...args: any[]): void {
    console.debug(...this.buildMessage(args));
  }
  public info(...args: any[]): void {
    console.debug(...this.buildMessage(args));
  }
  public warn(...args: any[]): void {
    console.warn(...this.buildMessage(args));
  }
  public error(...args: any[]): void {
    console.error(...this.buildMessage(args));
  }
  private buildMessage(args: any[]) {
    return [`[JinDan]${this.moduleName ? `[${this.moduleName}]` : ''}`, ...args];
  }
}

export default new Logger();
