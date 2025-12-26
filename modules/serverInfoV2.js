const { 
  ContainerBuilder, 
  SectionBuilder, 
  TextDisplayBuilder, 
  MediaGalleryBuilder,
  MediaGalleryItemBuilder,
  SeparatorBuilder,
  SeparatorSpacingSize,
  ButtonBuilder,
  ButtonStyle,
  MessageFlags 
} = require('discord.js');

/**
 * Fungsi untuk mengirim pesan V2 secara otomatis sesuai JSON yang diminta
 * @param {import('discord.js').Client} client 
 */
async function sendAutoV2(client) {
    const targetChannelId = '1442949900622102528'; 
    
    try {
        const targetChannel = await client.channels.fetch(targetChannelId);
        if (!targetChannel) return console.error("❌ [V2] Channel tidak ditemukan.");

        // 1. Gambar Utama (Media Gallery)
        const mediaGallery = new MediaGalleryBuilder().addItems(
            new MediaGalleryItemBuilder().setURL("https://cdn.discordapp.com/attachments/1426958344442347651/1444603866812514404/Teks_paragraf_Anda_20251130_150913_0000.png?ex=692df871&is=692ca6f1&hm=282756cdd32062733c11aec4eb4fd9117defe1065e9554549a7b0ade9f72731f&")
        );

        // 2. Konten Utama
        const mainContent = new TextDisplayBuilder().setContent(
            "## Welcome to BananaSkiee Community!\n" +
            "**Dimana kami menyediakan lingkungan yang suportif dan layanan Setup Server Kualitas Tinggi untuk memenuhi semua kebutuhan Discord Anda.**\n\n" +
            "__**Kami Tawarkan:**__\n" +
            "- *Setup Kustom: Layanan setup lengkap dari tim kami.*\n" +
            "- *Wawasan Server: Tips, trik, dan sumber daya gratis.*\n" +
            "- *Komunitas Terfokus: Lingkungan ramah dan suportif untuk berbagi ilmu.*\n" +
            "- *Diskusi Bot & Tools: Tempat berbagi wawasan mendalam tentang Bot Discord.*"
        );

        // 3. Separator Pertama
        const separator1 = new SeparatorBuilder()
            .setDivider(true)
            .setSpacing(SeparatorSpacingSize.Small);

        // 4. Konten Keuntungan
        const extraContent = new TextDisplayBuilder().setContent(
            "***Dapatkan Keuntungan Ekstra!***\n" +
            "> Anggota yang membantu mengundang teman dan menyebarkan tautan berhak mendapatkan Peran <@&1363711808145195258> !"
        );

        // 5. Separator Kedua
        const separator2 = new SeparatorBuilder().setDivider(false);

        // 6. Section Link & Tombol Aksesori
        const linkSection = new SectionBuilder()
            .addTextDisplayComponents(
                new TextDisplayBuilder().setContent("[**__KLIK DISINI__**](https://discord.gg/qd5mxurNa)\n-# Ayo Bagikan Link Discordnya!")
            )
            .setButtonAccessory(
                new ButtonBuilder()
                    .setStyle(ButtonStyle.Link)
                    .setLabel("Bagikan")
                    .setEmoji("🔗")
                    .setURL("https://discord.gg/qd5mxurNa")
            );

        // 7. Gabungkan semua ke dalam Container
        const container = new ContainerBuilder()
            .addMediaGalleryComponents(mediaGallery)
            .addTextDisplayComponents(mainContent)
            .addSeparatorComponents(separator1)
            .addTextDisplayComponents(extraContent)
            .addSeparatorComponents(separator2)
            .addSectionComponents(linkSection);

        // Kirim ke channel
        await targetChannel.send({
            components: [container],
            flags: MessageFlags.IsComponentsV2,
        });

        console.log("✅ [V2] Pesan Welcome otomatis berhasil dikirim.");
    } catch (err) {
        console.error("❌ [V2] Gagal kirim otomatis:", err.message);
    }
}

module.exports = { sendAutoV2 };
