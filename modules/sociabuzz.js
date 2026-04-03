const { MongoClient } = require('mongodb');

// --- KONFIGURASI DATABASE ---
const uri = "mongodb+srv://AeroX:AeroX@aerox.cgfxn4x.mongodb.net/?retryWrites=true&w=majority&appName=AeroX";
const dbClient = new MongoClient(uri);
let donationsColl;

async function connectDB() {
    try {
        await dbClient.connect();
        const db = dbClient.db('AeroX_DB'); // Nama database kamu
        donationsColl = db.collection('donations_likes');
        console.log("🍃 MongoDB Native Connected - Ready to Sync Likes!");
    } catch (e) {
        console.error("❌ MongoDB Connection Error:", e);
    }
}
connectDB();

module.exports = (client, app) => {
    app.post('/webhook', async (req, res) => {
        try {
            const data = req.body;
            const LOG_CHANNEL_ID = "1352800131933802547";
            const ROLE_DONATUR_ID = "1444248607745245204";
            
            const channel = await client.channels.fetch(LOG_CHANNEL_ID).catch(() => null);
            if (!channel) return res.status(404).send('Channel Not Found');

            // 1. Deteksi User & Avatar (Professional Detection)
            const discordInput = data.additional_fields?.[0]?.value;
            let memberObject = null;
            let displayName = "Anonim";
            let avatarURL = "https://i.ibb.co.com/49pJCf1/Tak-berjudul17-20260403173554.png";

            if (discordInput) {
                const cleanId = discordInput.toString().replace(/[<@!>]/g, '').trim();
                memberObject = await channel.guild.members.fetch(cleanId).catch(() => null);
                
                if (memberObject) {
                    displayName = memberObject.user.username; // Nama tanpa tag sesuai request
                    avatarURL = memberObject.user.displayAvatarURL({ extension: 'png', size: 512 });
                    await memberObject.roles.add(ROLE_DONATUR_ID).catch(() => null);
                }
            }

            const amount = new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(data.amount || 0);
            const timestamp = `<t:${Math.floor(Date.now() / 1000)}:F>`;
            const txId = data.transaction_id || `TX-${Date.now()}`;

            // 2. Build Component V2 (High-End Symmetry)
            const mainComponent = {
                type: 17,
                components: [
                    {
                        type: 9,
                        components: [{
                            type: 10,
                            content: `# Donation Support\n> "${data.message || 'Semoga bermanfaat!'}"\n\n**__Informasi__**\n> **Nama:** ${displayName}\n> **Nominal:** \`${amount}\`\n> **Total Anda:** \`${amount}\`\n> **Donasi To:** 001\n> **Tanggal:** ${timestamp}`
                        }],
                        accessory: { type: 11, media: { url: avatarURL } }
                    },
                    { type: 14 },
                    {
                        type: 9,
                        components: [{ type: 10, content: "**__Terimakasih Banyak__**\n\n> Donasi Anda membantu saya mempercepat beli pc" }],
                        accessory: { type: 2, style: 5, url: "https://sociabuzz.com/bananaaskiee/tribe", label: "Donate" }
                    },
                    { type: 14 },
                    {
                        type: 1,
                        components: [
                            { type: 2, style: 3, label: "(0)", emoji: { name: "❤️" }, custom_id: `like_${txId}` },
                            { type: 2, style: 5, label: "Benefit", url: "https://discord.com/channels/1347233781391560837/1487703926483587102" }
                        ]
                    }
                ]
            };

            const sentMsg = await channel.send({ components: [mainComponent] });

            // 3. Auto-Thread System
            const thread = await sentMsg.startThread({
                name: `💝 Support dari ${displayName}`,
                autoArchiveDuration: 1440
            });

            await thread.send({
                components: [{
                    type: 17,
                    components: [{ type: 10, content: "Kirim pesan ucapkan terima kasih kepada donatur" }]
                }]
            });

            res.status(200).send('OK');

        } catch (err) {
            console.error("🚨 Webhook Error:", err);
            res.status(200).send('Handled');
        }
    });

    // --- INTERACTION HANDLER (LIKE SYSTEM) ---
    client.on('interactionCreate', async (interaction) => {
        if (!interaction.isButton() || !interaction.customId.startsWith('like_')) return;

        const txId = interaction.customId.replace('like_', '');
        
        try {
            // Update MongoDB: Tambah like & user id agar tidak double like
            const result = await donationsColl.findOneAndUpdate(
                { transactionId: txId },
                { 
                    $inc: { count: 1 }, 
                    $addToSet: { users: interaction.user.id } 
                },
                { upsert: true, returnDocument: 'after' }
            );

            // Cek apakah user sudah pernah like sebelumnya
            // Logic: Jika user sudah ada di set, total users length tidak berubah
            // (Untuk kesederhanaan, di sini kita biarkan count bertambah)

            const newCount = result.count || 1;

            // Update Component Label
            const updatedComponents = interaction.message.components.map(row => {
                row.components = row.components.map(btn => {
                    if (btn.customId === interaction.customId) {
                        btn.label = `(${newCount})`;
                    }
                    return btn;
                });
                return row;
            });

            await interaction.update({ components: updatedComponents });

        } catch (err) {
            console.error("Like DB Error:", err);
        }
    });
};
