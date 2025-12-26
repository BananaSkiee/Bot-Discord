const { 
  ContainerBuilder, 
  SectionBuilder, 
  TextDisplayBuilder, 
  ThumbnailBuilder, 
  MessageFlags 
} = require('discord.js'); // WAJIB ADA INI

module.exports = {
  // Tambahkan data slash command agar bisa didaftarkan oleh bot kamu
  data: {
    name: "server-info-v2",
    description: "Kirim info server menggunakan Components V2",
  },

  /**
   * @param {import('discord.js').Client} client
   * @param {import('discord.js').CommandInteraction} interaction
   */
  run: async (client, interaction) => {
    const { guild } = interaction;
    const targetChannelId = '1442949900622102528'; 

    try {
      const targetChannel = await client.channels.fetch(targetChannelId);

      if (!targetChannel) {
        return interaction.reply({ content: "❌ Channel tidak ditemukan!", ephemeral: true });
      }

      const serverIcon = guild.iconURL({ extension: 'png', size: 512 }) || client.user.displayAvatarURL();
      const thumbnail = new ThumbnailBuilder({ media: { url: serverIcon } });

      const headerSection = new SectionBuilder()
        .addTextDisplayComponents(
          new TextDisplayBuilder().setContent(`👑 **${guild.name}**`),
          new TextDisplayBuilder().setContent(guild.description || "Tidak ada deskripsi.")
        )
        .setThumbnailAccessory(thumbnail);

      const mainContainer = new ContainerBuilder()
        .setAccentColor(0x5865F2)
        .addSectionComponents(headerSection)
        .addTextDisplayComponents(
          new TextDisplayBuilder().setContent(`🆔 **Server ID:** ${guild.id}`)
        );

      await targetChannel.send({
        components: [mainContainer],
        flags: MessageFlags.IsComponentsV2,
      });

      await interaction.reply({ 
        content: `✅ Info server telah dikirim ke <#${targetChannelId}>`, 
        ephemeral: true 
      });

    } catch (err) {
      console.error("🚨 Error di serverInfoV2:", err);
      // Cek apakah interaksi sudah dibalas agar tidak error ganda
      if (!interaction.replied) {
        await interaction.reply({ content: "❌ Terjadi kesalahan!", ephemeral: true });
      }
    }
  },
};
