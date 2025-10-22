// modules/joinstage.js
const { joinVoiceChannel, getVoiceConnection } = require("@discordjs/voice");

module.exports = async (client) => {
  try {
    const guild = await client.guilds.fetch(process.env.GUILD_ID);
    const channel = await guild.channels.fetch(process.env.VOICE_CHANNEL_ID);

    // Pastikan channel adalah Stage Channel
    if (!channel || channel.type !== 13) {
      return console.error("❌ Channel tidak ditemukan atau bukan Stage Channel.");
    }

    // Join Stage Channel
    const connection = joinVoiceChannel({
      channelId: channel.id,
      guildId: guild.id,
      adapterCreator: guild.voiceAdapterCreator,
      selfDeaf: false,
    });

    console.log(`🎤 Akira telah join ke Stage: ${channel.name}`);

    // Tunggu sedikit lalu request untuk jadi speaker
    setTimeout(async () => {
      try {
        const me = await guild.members.fetch(client.user.id);
        const stageInstance = channel.stageInstance;

        // Kalau belum ada Stage Instance, buat dulu
        if (!stageInstance) {
          await channel.createStageInstance({
            topic: "Server Maintenance",
          });
        }

        // Request jadi speaker (atau langsung naik kalau punya izin)
        if (me.voice.suppress) {
          await me.voice.setSuppressed(false);
          console.log("✅ Akira sekarang berbicara di Stage Channel!");
        }
      } catch (err) {
        console.error("⚠️ Gagal naik ke panggung:", err);
      }
    }, 3000);
  } catch (err) {
    console.error("❌ Gagal join Stage Channel:", err);
  }
};
