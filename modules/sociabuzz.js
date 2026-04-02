module.exports = (client, app) => {
    app.post('/webhook', async (req, res) => {
        try {
            const data = req.body;
            console.log("💰 [SociaBuzz] Data diterima:", data);

            // Channel ID untuk log donasi
            const LOG_CHANNEL_ID = "1352800131933802547"; 
            const channel = client.channels.cache.get(LOG_CHANNEL_ID);

            if (channel) {
                // Format nominal uang ke Rupiah
                const formattedAmount = new Intl.NumberFormat('id-ID', {
                    style: 'currency',
                    currency: 'IDR',
                    minimumFractionDigits: 0
                }).format(data.amount);

                // Component V2 Container (Type 17)
                const logContainer = {
                    type: 17,
                    components: [
                        { 
                            type: 10, 
                            content: `## 💸 DUKUNGAN SOCIABUZZ MASUK!` 
                        },
                        { type: 14 }, // Divider
                        { 
                            type: 10, 
                            content: `### 👤 Informasi Donatur\n> **Nama:** ${data.supporter_name || 'Anonim'}\n> **Nominal:** \`${formattedAmount}\`\n> **Metode:** ${data.payment_method || 'E-Wallet'}` 
                        },
                        { type: 14 }, // Divider
                        { 
                            type: 10, 
                            content: `### ✉️ Pesan Dukungan\n\`\`\`\n${data.message || 'Tidak ada pesan.'}\n\`\`\`` 
                        },
                        { type: 14 }, // Divider
                        { 
                            type: 10, 
                            content: `-# ID Transaksi: ${data.transaction_id || '-'} • BananaSkiee Systems` 
                        }
                    ]
                };

                // Kirim menggunakan flags: 32768 agar Component V2 merender dengan benar
                await channel.send({
                    flags: 32768,
                    components: [logContainer]
                });
            }

            res.status(200).send('OK');
        } catch (err) {
            console.error("❌ [SociaBuzz] Webhook Error:", err);
            res.status(500).send('Internal Error');
        }
    });

    console.log("✅ SociaBuzz Module (Component V2) Loaded");
};
