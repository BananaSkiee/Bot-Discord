require("dotenv").config();

const COLORS = [
  "#FF0000", "#FF7F00", "#FFFF00", "#00FF00",
  "#0000FF", "#4B0082", "#9400D3"
];

module.exports = function rainbowRole(client, interval = 5000) {
  const guild = client.guilds.cache.get(process.env.GUILD_ID);
  if (!guild) return console.log("❌ Guild tidak ditemukan.");

  const roleIds = process.env.RAINBOW_ROLE_IDS.split(",").map(id => id.trim());

  roleIds.forEach(roleId => {
    console.log(`🌈 Rainbow role aktif untuk role: ${roleId}`);

    let index = 0;
    setInterval(async () => {
      try {
        const role = guild.roles.cache.get(roleId);
        if (!role) {
          console.log(`❌ Role tidak ditemukan: ${roleId}`);
          return;
        }

        await role.setColor(COLORS[index]);
        console.log(`🎨 [${role.name}] diubah ke ${COLORS[index]}`);

        index = (index + 1) % COLORS.length;
      } catch (err) {
        console.error(`❌ Gagal mengubah warna untuk role ${roleId}:`, err);
      }
    }, interval);
  });
};
