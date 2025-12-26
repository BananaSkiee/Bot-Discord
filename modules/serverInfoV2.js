const { 
  ContainerBuilder, 
  SectionBuilder, 
  TextDisplayBuilder, 
  ThumbnailBuilder, 
  MessageFlags 
} = require('discord.js');

/**
 * Fungsi untuk mengirim pesan V2 secara otomatis
 * @param {import('discord.js').Client} client 
 */
async function sendAutoV2(client) {
    const targetChannelId = '1442949900622102528'; 
    
    try {
        const targetChannel = await client.channels.fetch(targetChannelId);
        if (!targetChannel) return console.error("❌ [V2] Channel tidak ditemukan.");

        // Ambil server pertama tempat bot berada (guild)
        const guild = client.guilds.cache.first();
        if (!guild) return console.error("❌ [V2] Bot tidak berada di server manapun.");

        const serverIcon = guild.iconURL({ extension: 'png', size: 512 }) || client.user.displayAvatarURL();
        
        const mainContainer = new ContainerBuilder()
            .setAccentColor(0x5865F2)
            .addSectionComponents(
                new SectionBuilder()
                    .addTextDisplayComponents(
                        new TextDisplayBuilder().setContent(`👑 **${guild.name}**`),
                        new TextDisplayBuilder().setContent(guild.description || "BananaSkiee Community - Status: Online")
                    )
                    .setThumbnailAccessory(new ThumbnailBuilder({ media: { url: serverIcon } }))
            )
            .addTextDisplayComponents(
                new TextDisplayBuilder().setContent(`🆔 **Server ID:** ${guild.id}`),
                new TextDisplayBuilder().setContent(`📅 **Pesan Otomatis:** Sistem V2 Aktif`)
            );

        await targetChannel.send({
            components: [mainContainer],
            flags: MessageFlags.IsComponentsV2,
        });

        console.log("✅ [V2] Pesan otomatis berhasil dikirim ke channel.");
    } catch (err) {
        console.error("❌ [V2] Gagal kirim otomatis:", err.message);
    }
}

module.exports = { sendAutoV2 };
