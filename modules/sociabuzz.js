module.exports = (client, app) => {
    app.post('/webhook', async (req, res) => {
        try {
            const data = req.body;
            
            // 1. Log data mentah untuk debugging di Koyeb
            console.log("💰 [SociaBuzz] Data diterima:", JSON.stringify(data, null, 2));

            // 2. Pastikan nominal adalah angka (SociaBuzz kadang kirim string)
            const rawAmount = parseFloat(data.amount) || 0;
            const formattedAmount = new Intl.NumberFormat('id-ID', {
                style: 'currency',
                currency: 'IDR',
                minimumFractionDigits: 0
            }).format(rawAmount);

            // 3. Ambil channel (Gunakan fetch jika cache kosong)
            const LOG_CHANNEL_ID = "1352800131933802547"; 
            let channel = client.channels.cache.get(LOG_CHANNEL_ID);
            
            if (!channel) {
                try {
                    channel = await client.channels.fetch(LOG_CHANNEL_ID);
                } catch (e) {
                    console.error("❌ [SociaBuzz] Gagal fetch channel:", e.message);
                }
            }

            if (channel) {
                const { EmbedBuilder } = require('discord.js');
                
                // Gunakan format standar dulu jika Type 17 (Component V2) rewel di channel tertentu
                const logContainer = {
                    type: 17,
                    components: [
                        { type: 10, content: `## 💸 DUKUNGAN SOCIABUZZ MASUK!` },
                        { type: 14 },
                        { 
                            type: 10, 
                            content: `### 👤 Informasi Donatur\n> **Nama:** ${data.supporter_name || 'Anonim'}\n> **Nominal:** \`${formattedAmount}\`\n> **Metode:** ${data.payment_method || 'E-Wallet'}` 
                        },
                        { type: 14 },
                        { 
                            type: 10, 
                            content: `### ✉️ Pesan\n\`\`\`\n${data.message || 'Tidak ada pesan.'}\n\`\`\`` 
                        },
                        { type: 14 },
                        { type: 10, content: `-# ID: ${data.transaction_id || '-'} • BananaSkiee Systems` }
                    ]
                };

                await channel.send({
                    flags: 32768,
                    components: [logContainer]
                });
                
                console.log("✅ [SociaBuzz] Log berhasil dikirim ke Discord.");
            } else {
                console.error("❌ [SociaBuzz] Channel tidak ditemukan!");
            }

            // WAJIB: Kirim respon 200 ke SociaBuzz agar tidak Error 500 lagi
            res.status(200).send('OK');

        } catch (err) {
            console.error("🚨 [SociaBuzz] Crash Error:", err.stack);
            // Tetap kirim 200 atau 500? Sebaiknya 500 agar kamu tahu ada yang salah
            res.status(500).send('Internal Error');
        }
    });

    console.log("✅ SociaBuzz Module (Safe Mode) Loaded");
};
