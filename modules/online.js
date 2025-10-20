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

module.exports = (client) => {
  client.on("presenceUpdate", (oldPresence, newPresence) => {
    const guild = newPresence.guild || oldPresence?.guild;
    if (guild) updateOnlineCount(guild);
  });

  client.on("ready", () => {
    const guild = client.guilds.cache.first();
    if (guild) updateOnlineCount(guild);
  });
};
