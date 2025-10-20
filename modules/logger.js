// modules/logger.js
const chalk = require("chalk");
const dayjs = require("dayjs");

// 🟡 Brand text: BS (BananaSkiee)
const BRAND = chalk.bgHex("#FFD700").hex("#000000").bold(" BS ");

// 🕒 Timestamp
const time = () => chalk.dim(`[${dayjs().format("HH:mm:ss")}]`);

// 🎨 Format generator
function format(icon, tag, color, msg) {
  const label = chalk.bold[color](`${icon} ${tag.padEnd(5)}`);
  return `${chalk.gray("│")} ${BRAND} ${chalk.gray("│")} ${label} ${chalk.gray("│")} ${msg}`;
}

module.exports = {
  banner: () => {
    console.clear();
    console.log(
      chalk.hex("#FFD700").bold(`
██████╗ ███████╗
██╔══██╗██╔════╝
██████╔╝█████╗  
██╔══██╗██╔══╝  
██║  ██║███████╗
╚═╝  ╚═╝╚══════╝
`)
    );
    console.log(chalk.hex("#FFD700").bold("🚀  BananaSkiee Systems (BS) Logger v4.0"));
    console.log(chalk.gray("────────────────────────────────────────────────────────────"));
  },

  info: (msg) =>
    console.log(`${time()} ${format("ℹ️", "INFO", "cyan", chalk.white(msg))}`),

  success: (msg) =>
    console.log(`${time()} ${format("✅", "OK", "green", chalk.whiteBright(msg))}`),

  warn: (msg) =>
    console.log(`${time()} ${format("⚠️", "WARN", "yellow", chalk.yellow(msg))}`),

  error: (msg) =>
    console.log(`${time()} ${format("❌", "ERR", "red", chalk.redBright(msg))}`),

  event: (msg) =>
    console.log(`${time()} ${format("🎬", "EVENT", "magenta", chalk.magentaBright(msg))}`),

  debug: (msg) =>
    console.log(`${time()} ${format("🧩", "DBG", "gray", chalk.gray(msg))}`),

  divider: () =>
    console.log(chalk.gray("────────────────────────────────────────────────────────────")),
};
