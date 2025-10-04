require("dotenv").config();

const COLORS = [
  "#FF0000", "#FF7F00", "#FFFF00", "#00FF00",
  "#0000FF", "#4B0082", "#9400D3"
];

module.exports = function rainbowRole(client, interval = 5000) {
  // Pastikan client ready
  if (!client.isReady()) {
    console.log("⏳ Menunggu client ready untuk rainbowRole...");
    return;
  }

  try {
    const guild = client.guilds.cache.get("1347233781391560837"); // GUILD ID langsung
    if (!guild) {
      console.log("❌ Guild tidak ditemukan untuk rainbowRole");
      return;
    }

    // Role ID langsung (ganti dengan role ID yang benar)
    const roleIds = ["", "ROLE_ID_2"]; // Ganti dengan role ID yang sebenarnya
    
    if (roleIds.length === 0 || roleIds[0] === "ROLE_ID_1") {
      console.log("❌ Role IDs belum dikonfigurasi untuk rainbowRole");
      return;
    }

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
          console.error(`❌ Gagal mengubah warna untuk role ${roleId}:`, err.message);
        }
      }, interval);
    });
    
  } catch (error) {
    console.error("❌ Error di rainbowRole:", error.message);
  }
};
