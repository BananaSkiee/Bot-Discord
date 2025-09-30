const { joinVoiceChannel } = require("@discordjs/voice");

module.exports = async (client) => {
  const guild = await client.guilds.fetch(process.env.GUILD_ID);
  const channel = await guild.channels.fetch(process.env.VOICE_CHANNEL_ID); // ✅ fetch, bukan cache

  if (!channel || channel.type !== 2) {
    return console.error("❌ Voice channel tidak ditemukan atau bukan voice channel.");
  }

  joinVoiceChannel({
    channelId: channel.id,
    guildId: guild.id,
    adapterCreator: guild.voiceAdapterCreator,
    selfDeaf: false,
  });

  console.log(`🔊 Akira telah join ke VC: ${channel.name}`);
};
