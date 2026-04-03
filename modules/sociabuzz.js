module.exports = (client, app) => {
    app.post('/webhook', async (req, res) => {
        try {
            const data = req.body;
            console.log("💰 [SociaBuzz] Data masuk dari:", data.voter_name || "Anonim");

            // 1. Ambil ID Discord dari "Pertanyaan Tambahan"
            // Kita ambil dari data.additional_fields[0] karena itu kolom pertama kamu
            const discordInput = data.additional_fields && data.additional_fields[0] 
                ? data.additional_fields[0].value 
                : null;

            const LOG_CHANNEL_ID = "1487715289390121041"; 
            const ROLE_DONATUR_ID = "1444248607745245204"; // Role yang kamu minta
            const channel = client.channels.cache.get(LOG_CHANNEL_ID);

            if (channel) {
                let memberMention = "Anonim";
                let memberObject = null;

                if (discordInput) {
                    // Bersihkan input jika user copy-paste mention (menghilangkan <@!>)
                    const cleanId = discordInput.replace(/[<@!>]/g, '').trim();
                    
                    try {
                        // Cari member di server The Nexus
                        memberObject = await channel.guild.members.fetch(cleanId).catch(() => null);
                        
                        if (memberObject) {
                            memberMention = `<@${memberObject.id}>`;
                            
                            // 2. OTOMATIS KASIH ROLE (Berapapun nominalnya)
                            await memberObject.roles.add(ROLE_DONATUR_ID)
                                .then(() => console.log(`✅ Role berhasil diberikan ke ${memberObject.user.tag}`))
                                .catch(err => console.error("❌ Gagal kasih role:", err.message));
                        } else {
                            memberMention = `**${discordInput}** (User tidak ditemukan/salah ID)`;
                        }
                    } catch (e) {
                        memberMention = `**${discordInput}**`;
                    }
                }

                // Format mata uang IDR
                const formattedAmount = new Intl.NumberFormat('id-ID', {
                    style: 'currency', 
                    currency: 'IDR', 
                    minimumFractionDigits: 0
                }).format(parseFloat(data.amount) || 0);

                // 3. Tampilkan Log dengan Component V2
                const logContainer = {
                    type: 17,
                    components: [
                        { type: 10, content: `## 💸 DUKUNGAN BARU MASUK!` },
                        { type: 14 },
                        { 
                            type: 10, 
                            content: `### 👤 Info Donatur\n> **Akun:** ${memberMention}\n> **Nominal:** \`${formattedAmount}\`\n> **Metode:** ${data.payment_method || 'E-Wallet'}` 
                        },
                        { type: 14 },
                        { 
                            type: 10, 
                            content: `### ✉️ Pesan\n\`\`\`\n${data.message || 'Tidak ada pesan.'}\n\`\`\`` 
                        },
                        { type: 14 },
                        { type: 10, content: `-# ID Transaksi: ${data.transaction_id || '-'} • BananaSkiee Systems` }
                    ]
                };

                await channel.send({
                    content: memberObject ? `🎊 Terima kasih ${memberMention} atas dukungannya!` : "🎊 Seseorang baru saja berdonasi!",
                    flags: 32768,
                    components: [logContainer]
                });
            }

            res.status(200).send('OK');
        } catch (err) {
            console.error("🚨 [SociaBuzz Webhook] Error:", err);
            res.status(500).send('Internal Server Error');
        }
    });
};
                            
