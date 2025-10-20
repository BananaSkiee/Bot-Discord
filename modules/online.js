// modules/online.js
const config = require("../config");

async function updateOnlineCount(guild) {
  try {
    if (!guild.available) return;

    // Ambil semua member beserta status presence
    await guild.members.fetch({ withPresences: true });

    // Hitung member yang online, idle, atau dnd
    const onlineCount = guild.members.cache.filter(
      (m) => !m.user.bot && ["online", "idle", "dnd"].includes(m.presence?.status)
    ).size;

    const voiceChannel = guild.channels.cache.get(config.voiceChannelId);
    if (!voiceChannel) {
      console.warn("⚠️ Voice channel ID tidak ditemukan di config.js");
      return;
    }

    if (voiceChannel.isVoiceBased()) {
      await voiceChannel.setName(`「 Online: ${onlineCount} 」`);
      console.log(`✅ Channel rename → Online: ${onlineCount}`);
    }
  } catch (err) {
    console.error("❌ Gagal update online:", err);
  }
}

module.exports = function onlineCounter(client) {
  // Pastikan client valid
  if (!client || typeof client.on !== "function") {
    console.error("❌ Invalid client passed to onlineCounter");
    return;
  }

  // Jalankan update saat bot siap
  client.once("ready", async () => {
    const guild = client.guilds.cache.first();
    if (!guild) return console.error("⚠️ Guild tidak ditemukan saat ready.");
    console.log(`🔄 Memulai sistem penghitung online di server: ${guild.name}`);
    updateOnlineCount(guild);

    // Update setiap 1 menit biar konsisten
    setInterval(() => updateOnlineCount(guild), 60_000);
  });

  // Deteksi perubahan status (online, idle, dnd, offline)
  client.on("presenceUpdate", (oldPresence, newPresence) => {
    const guild = newPresence?.guild || oldPresence?.guild;
    if (!guild) return;
    updateOnlineCount(guild);
  });

  // Deteksi join/leave member
  client.on("guildMemberAdd", (member) => updateOnlineCount(member.guild));
  client.on("guildMemberRemove", (member) => updateOnlineCount(member.guild));

  // Deteksi perubahan status voice
  client.on("voiceStateUpdate", (oldState, newState) => {
    const guild = newState?.guild || oldState?.guild;
    if (!guild) return;
    updateOnlineCount(guild);
  });
};
