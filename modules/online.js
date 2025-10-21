// modules/online.js
const config = require("../config");

async function updateOnlineCount(guild) {
  try {
    if (!guild.available) return;

    await guild.members.fetch({ withPresences: true });

    const onlineCount = guild.members.cache.filter(
      (m) => !m.user.bot && ["online", "idle", "dnd"].includes(m.presence?.status)
    ).size;

    const voiceChannel = guild.channels.cache.get(config.voiceChannelId);
    if (!voiceChannel) return console.warn("⚠️ Voice channel ID tidak ditemukan di config.js");

    if (voiceChannel.isVoiceBased()) {
      await voiceChannel.setName(`「 Online: ${onlineCount} 」`);
      console.log(`✅ Update realtime → Online: ${onlineCount}`);
    }
  } catch (err) {
    console.error("❌ Gagal update online:", err);
  }
}

module.exports = function onlineCounter(client) {
  if (!client || typeof client.on !== "function") {
    console.error("❌ Invalid client passed to onlineCounter");
    return;
  }

  client.once("ready", async () => {
    const guild = client.guilds.cache.first();
    if (!guild) return console.error("⚠️ Guild tidak ditemukan saat ready.");
    console.log(`🔄 Mengaktifkan sistem penghitung online realtime di server: ${guild.name}`);
    updateOnlineCount(guild);
  });

  // Deteksi perubahan status presence (online/dnd/offline)
  client.on("presenceUpdate", (oldPresence, newPresence) => {
    const guild = newPresence?.guild || oldPresence?.guild;
    if (!guild) return;
    updateOnlineCount(guild);
  });

  // Deteksi join/leave member
  client.on("guildMemberAdd", (member) => updateOnlineCount(member.guild));
  client.on("guildMemberRemove", (member) => updateOnlineCount(member.guild));

  // Deteksi perubahan voice (misal disconnect/mute/unmute)
  client.on("voiceStateUpdate", (oldState, newState) => {
    const guild = newState?.guild || oldState?.guild;
    if (!guild) return;
    updateOnlineCount(guild);
  });
};
