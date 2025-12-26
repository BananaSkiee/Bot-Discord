const { 
    ContainerBuilder, 
    SectionBuilder, 
    TextDisplayBuilder, 
    MessageFlags 
} = require('discord.js');

module.exports = {
    name: 'ready',
    once: false,
    async execute(client) {
        const channelId = '1442949900622102528'; // Channel tujuan
        
        try {
            const channel = await client.channels.fetch(channelId);
            if (!channel) return console.log("❌ Channel V2 tidak ditemukan.");

            // Buat Component V2
            const container = new ContainerBuilder()
                .setAccentColor(0x00FF00) // Warna hijau
                .addSectionComponents(
                    new SectionBuilder().addTextDisplayComponents(
                        new TextDisplayBuilder().setContent("🚀 **Bot Akira Online!**"),
                        new TextDisplayBuilder().setContent("Sistem Components V2 berhasil dimuat ke channel ini.")
                    )
                );

            // Kirim ke channel
            await channel.send({
                components: [container],
                flags: MessageFlags.IsComponentsV2
            });

            console.log("✅ Pesan V2 terkirim ke channel log.");
        } catch (error) {
            console.error("❌ Gagal mengirim pesan V2:", error);
        }
    },
};
