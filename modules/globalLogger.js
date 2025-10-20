// modules/globalLogger.js
const chalk = require("chalk");
const dayjs = require("dayjs");

// logo & waktu
const BRAND = chalk.bgHex("#FFD700").hex("#000000").bold(" BS ");
const time = () => chalk.dim(`[${dayjs().format("HH:mm:ss")}]`);

// fungsi format
function formatLog(level, color, icon, ...msg) {
  const label = chalk.bold[color](`${icon} ${level.padEnd(5)}`);
  return `${time()} ${chalk.gray("│")} ${BRAND} ${chalk.gray("│")} ${label} ${chalk.gray("│")} ${msg.join(" ")}`;
}

// override console.log(), warn(), error()
const orig = {
  log: console.log,
  warn: console.warn,
  error: console.error
};

console.log = (...args) => orig.log(formatLog("INFO", "cyan", "ℹ️", ...args));
console.warn = (...args) => orig.warn(formatLog("WARN", "yellow", "⚠️", ...args));
console.error = (...args) => orig.error(formatLog("ERR", "red", "❌", ...args));

console.clear();
orig.log(chalk.hex("#FFD700").bold(`
██████╗ ███████╗
██╔══██╗██╔════╝
██████╔╝█████╗  
██╔══██╗██╔══╝  
██║  ██║███████╗
╚═╝  ╚═╝╚══════╝
`));
orig.log(chalk.hex("#FFD700").bold("🚀 BananaSkiee Systems (BS) Logger vAuto"));
orig.log(chalk.gray("────────────────────────────────────────────────────────────"));
