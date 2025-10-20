// modules/globalLogger.js
const chalk = require("chalk");
const dayjs = require("dayjs");

// Manual warna kuning emas pakai kode ANSI (universal)
const yellow = (text) => `\x1b[33m${text}\x1b[0m`;
const gray = (text) => `\x1b[90m${text}\x1b[0m`;
const bold = (text) => `\x1b[1m${text}\x1b[0m`;

// Logo “BS” aman semua versi
const BRAND = bold(`[${yellow("BS")}]`);
const time = () => gray(`[${dayjs().format("HH:mm:ss")}]`);

// Format log universal
function formatLog(level, color, icon, ...msg) {
  const label = bold(`${icon} ${level.padEnd(5)}`);
  return `${time()} ${gray("│")} ${BRAND} ${gray("│")} ${label} ${gray("│")} ${msg.join(" ")}`;
}

// Simpan console asli
const orig = {
  log: console.log,
  warn: console.warn,
  error: console.error
};

// Override log bawaan Node.js
console.log = (...args) => orig.log(formatLog("INFO", "cyan", "ℹ️", ...args));
console.warn = (...args) => orig.warn(formatLog("WARN", "yellow", "⚠️", ...args));
console.error = (...args) => orig.error(formatLog("ERR", "red", "❌", ...args));

// Banner awal
console.clear();
orig.log(yellow(`
██████╗ ███████╗
██╔══██╗██╔════╝
██████╔╝█████╗  
██╔══██╗██╔══╝  
██║  ██║███████╗
╚═╝  ╚═╝╚══════╝
`));
orig.log(yellow("🚀 BananaSkiee Systems (BS) Logger vAuto"));
orig.log(gray("────────────────────────────────────────────────────────────"));
