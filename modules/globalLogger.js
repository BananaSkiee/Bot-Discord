// modules/globalLogger.js
const chalk = require("chalk");
const dayjs = require("dayjs");

// Logo “BS” versi universal (aman untuk semua versi chalk)
const BRAND = chalk.bold(`[${chalk.yellowBright("BS")}]`);
const time = () => chalk.dim(`[${dayjs().format("HH:mm:ss")}]`);

// Fungsi untuk format log
function formatLog(level, color, icon, ...msg) {
  const label = chalk.bold[color](`${icon} ${level.padEnd(5)}`);
  return `${time()} ${chalk.gray("│")} ${BRAND} ${chalk.gray("│")} ${label} ${chalk.gray("│")} ${msg.join(" ")}`;
}

// Simpan referensi asli biar gak bentrok
const orig = {
  log: console.log,
  warn: console.warn,
  error: console.error
};

// Override semua console bawaan
console.log = (...args) => orig.log(formatLog("INFO", "cyan", "ℹ️", ...args));
console.warn = (...args) => orig.warn(formatLog("WARN", "yellow", "⚠️", ...args));
console.error = (...args) => orig.error(formatLog("ERR", "red", "❌", ...args));

// Banner awal
console.clear();
orig.log(chalk.yellowBright(`
██████╗ ███████╗
██╔══██╗██╔════╝
██████╔╝█████╗  
██╔══██╗██╔══╝  
██║  ██║███████╗
╚═╝  ╚═╝╚══════╝
`));
orig.log(chalk.yellowBright("🚀 BananaSkiee Systems (BS) Logger vAuto"));
orig.log(chalk.gray("────────────────────────────────────────────────────────────"));
