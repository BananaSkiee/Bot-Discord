module.exports = (client, app) => {
    // Pastikan app bisa baca JSON dari SociaBuzz
    const express = require('express');
    app.use(express.json());
    app.use(express.urlencoded({ extended: true }));

    app.post('/webhook', async (req, res) => {
        try {
            const data = req.body;
            
            // Cek apakah data ada isinya, kalau kosong kirim log dan stop
            if (!data || Object.keys(data).length === 0) {
                console.log("⚠️ [SociaBuzz] Webhook terpanggil tapi data kosong.");
                return res.status(400).send('No Data Received');
            }

            console.log("💰 [SociaBuzz] Data masuk dari:", data.voter_name || "Anonim");

            // Ambil ID Discord dari Pertanyaan Tambahan
            const discordInput = data.additional_fields && data.additional_fields[0] 
                ? data.additional_fields[0].value 
                : null;

            const LOG_CHANNEL_ID = "1352800131933802547"; 
            const ROLE_DONATUR_ID = "1444248607745245204"; 
            
            // Cari channel di cache bot
            const channel = client.channels.cache.get(LOG_CHANNEL_ID);

            if (channel) {
                let memberMention = "Anonim";
                let memberObject = null;

                if (discordInput) {
                    const cleanId = discordInput.toString().replace(/[<@!>]/g, '').trim();
                    
                    try {
                        // Cari member di server
                        memberObject = await channel.guild.members.fetch(cleanId).catch(() => null);
                        
                        if (memberObject) {
                            memberMention = `<@${memberObject.id}>`;
                            // Kasih Role
                            await memberObject.roles.add(ROLE_DONATUR_ID).catch(e => console.log("Gagal kasih role:", e.message));
                        } else {
                            memberMention = `**${discordInput}** (ID Salah/Tidak di Server)`;
                        }
                    } catch (e) {
                        memberMention = `**${discordInput}**`;
                    }
                }

                const formattedAmount = new Intl.NumberFormat('id-ID', {
                    style: 'currency', currency: 'IDR', minimumFractionDigits: 0
                }).format(parseFloat(data.amount) || 0);

                // Kirim Log
                await channel.send({
                    content: memberObject ? `🎊 Terima kasih ${memberMention}!` : "🎊 Donasi baru masuk!",
                    embeds: [{
                        title: "💸 DUKUNGAN SOCIABUZZ",
                        description: `**Donatur:** ${memberMention}\n**Nominal:** \`${formattedAmount}\`\n**Pesan:** \`${data.message || '-'}\`\n**Metode:** ${data.payment_method || '-'}`,
                        color: 0x00ff00,
                        footer: { text: `ID: ${data.transaction_id || '-'} • BananaSkiee` }
                    }]
                }).catch(err => console.log("Gagal kirim log ke Discord:", err.message));
            }

            // Kirim respon balik ke SociaBuzz biar statusnya "Success"
            res.status(200).send('OK');

        } catch (err) {
            console.error("🚨 [SociaBuzz Error]:", err);
            // Tetap kirim 200 supaya SociaBuzz tidak kirim ulang terus menerus jika error minor
            res.status(200).send('Error but handled'); 
        }
    });
};
