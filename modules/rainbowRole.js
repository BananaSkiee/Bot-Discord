require("dotenv").config();

const log = global.log; // gunakan logger global
const COLORS = [
  "#FF0000", "#FF7F00", "#FFFF00", "#00FF00",
  "#0000FF", "#4B0082", "#9400D3"
];

module.exports = function rainbowRole(client, interval = 20000) { // default 20 detik
  const guild = client.guilds.cache.get(process.env.GUILD_ID);
  if (!guild) return log.error("Guild tidak ditemukan untuk rainbow role.");

  const roleIds = process.env.RAINBOW_ROLE_IDS?.split(",").map(id => id.trim());
  if (!roleIds?.length) return log.warn("RAINBOW_ROLE_IDS belum dikonfigurasi di .env");

  roleIds.forEach(roleId => {
    log.info(`🌈 Rainbow role aktif untuk role: ${roleId}`);
    let index = 0;

    const changeColor = async () => {
      try {
        const role = guild.roles.cache.get(roleId);
        if (!role) return log.warn(`Role ${roleId} tidak ditemukan di guild.`);

        const color = COLORS[index % COLORS.length];
        await role.edit({ color });
        log.info(`🎨 [${role.name}] diubah ke ${color}`);
        index++;

        setTimeout(changeColor, interval);
      } catch (err) {
        if (err?.status === 429 || err?.code === 50013) { // rate limit or missing perms
          log.warn(`⚠️ [RateLimit] Discord API membatasi permintaan ke /guilds/:id/roles/:id`);
          log.info(`⏳ Tunggu 30 detik sebelum lanjut...`);
          setTimeout(changeColor, 30_000);
        } else {
          log.error(`❌ Gagal mengubah warna role ${roleId}: ${err.message}`);
          setTimeout(changeColor, interval);
        }
      }
    };

    changeColor();
  });
};
