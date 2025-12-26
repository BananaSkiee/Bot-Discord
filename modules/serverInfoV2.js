// Di dalam file serverInfoV2.js atau modules Anda

  /**
   * @param {import('discord.js').CommandInteraction} interaction
   */
  run: async (client, interaction) => {
    const { guild } = interaction;
    const targetChannelId = '1442949900622102528'; // ID channel tujuan Anda

    try {
      // Ambil channel tujuan dari cache atau API
      const targetChannel = await client.channels.fetch(targetChannelId);

      if (!targetChannel) {
        return interaction.reply({ content: "❌ Channel tidak ditemukan!", ephemeral: true });
      }

      // --- Proses pembuatan Container V2 (Sama seperti sebelumnya) ---
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

      // --- PENGIRIMAN KE CHANNEL SPESIFIK ---
      await targetChannel.send({
        components: [mainContainer],
        flags: MessageFlags.IsComponentsV2,
      });

      // Beri tahu pengguna bahwa pesan sudah dikirim ke sana
      await interaction.reply({ 
        content: `✅ Info server telah dikirim ke <#${targetChannelId}>`, 
        ephemeral: true 
      });

    } catch (err) {
      console.error(err);
      await interaction.reply({ content: "❌ Terjadi kesalahan saat mengirim ke channel.", ephemeral: true });
    }
  },
