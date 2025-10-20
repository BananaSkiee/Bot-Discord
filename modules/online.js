// modules/online.js
const config = require("../config");

async function updateOnlineCount(guild) {
  try {
    await guild.members.fetch({ withPresences: true });
    const onlineCount = guild.members.cache.filter(
      (m) => !m.user.bot && ["online", "idle", "dnd"].includes(m.presence?.status)
    ).size;

    const voiceChannel = guild.channels.cache.get(config.voiceChannelId);
    if (voiceChannel && voiceChannel.isVoiceBased()) {
      await voiceChannel.setName(`「 Online: ${onlineCount} 」`);
      console.log(`✅ Channel rename → Online: ${onlineCount}`);
    }
  } catch (err) {
    console.error("❌ Gagal update online:", err.message);
  }
}

// fungsi utama: menerima client, otomatis register event
module.exports = function onlineCounter(client) {
  if (!client || !client.on) return console.error("❌ Invalid client passed to onlineCounter");

  // trigger saat bot siap
  client.on("ready", () => {
    const guild = client.guilds.cache.first();
    if (guild) updateOnlineCount(guild);
  });

  // update saat presence berubah
  client.on("presenceUpdate", (oldPresence, newPresence) => {
    const guild = newPresence?.guild || oldPresence?.guild;
    if (guild) updateOnlineCount(guild);
  });

  // update saat voiceState berubah
  client.on("voiceStateUpdate", (oldState, newState) => {
    const guild = newState?.guild || oldState?.guild;
    if (guild) updateOnlineCount(guild);
  });
};
