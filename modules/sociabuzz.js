const { EmbedBuilder } = require('discord.js');

module.exports = (client, app) => {
    // Port dan Route sudah otomatis terhandle karena memakai 'app' dari index.js
    app.post('/webhook', async (req, res) => {
        try {
            const data = req.body;
            console.log("💰 [SociaBuzz] Data diterima:", data);

            // Channel ID untuk log donasi
            const LOG_CHANNEL_ID = "1487715289390121041"; 
            const channel = client.channels.cache.get(LOG_CHANNEL_ID);

            if (channel) {
                const donationEmbed = new EmbedBuilder()
                    .setTitle('💸 Dukungan SociaBuzz Baru!')
                    .setColor(0x2ecc71)
                    .setThumbnail('https://sociabuzz.com/assets/img/logo/logo-sociabuzz-icon.png')
                    .addFields(
                        { name: '👤 Pengirim', value: `**${data.supporter_name || 'Anonim'}**`, inline: true },
                        { name: '💵 Nominal', value: `**Rp${Number(data.amount).toLocaleString('id-ID')}**`, inline: true },
                        { name: '✉️ Pesan', value: data.message || '_Tidak ada pesan._' }
                    )
                    .setFooter({ text: `ID Transaksi: ${data.transaction_id || '-'}` })
                    .setTimestamp();

                await channel.send({ embeds: [donationEmbed] });
            }

            res.status(200).send('OK');
        } catch (err) {
            console.error("❌ [SociaBuzz] Webhook Error:", err);
            res.status(500).send('Internal Error');
        }
    });

    console.log("✅ SociaBuzz Module Loaded");
};
