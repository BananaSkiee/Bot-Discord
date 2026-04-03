const { MongoClient } = require('mongodb');
const express = require('express');

const uri = "mongodb+srv://AeroX:AeroX@aerox.cgfxn4x.mongodb.net/?retryWrites=true&w=majority&appName=AeroX";
const dbClient = new MongoClient(uri);
let donationsColl;

async function connectDB() {
    try {
        await dbClient.connect();
        const db = dbClient.db('donasi_akira');
        donationsColl = db.collection('donations_likes');
        console.log("🍃 MongoDB Connected: Database 'donasi_akira' Ready!");
    } catch (e) { console.error("❌ MongoDB Error:", e); }
}
connectDB();

module.exports = (client, app) => {
    app.use(express.json());

    app.post('/webhook', async (req, res) => {
        try {
            const data = req.body;
            const LOG_CHANNEL_ID = "1487715289390121041";
            const ROLE_DONATUR_ID = "1444248607745245204";
            
            const channel = await client.channels.fetch(LOG_CHANNEL_ID).catch(() => null);
            if (!channel) return res.status(200).send('Channel Not Found');

            const discordInput = data.additional_fields?.[0]?.value;
            let memberObject = null;
            let displayName = "Anonim";
            let avatarURL = "https://i.ibb.co.com/49pJCf1/Tak-berjudul17-20260403173554.png";

            if (discordInput) {
                const cleanId = discordInput.toString().replace(/[<@!>]/g, '').trim();
                memberObject = await channel.guild.members.fetch(cleanId).catch(() => null);
                if (memberObject) {
                    displayName = memberObject.user.username; 
                    avatarURL = memberObject.user.displayAvatarURL({ extension: 'png', size: 512 });
                    await memberObject.roles.add(ROLE_DONATUR_ID).catch(() => null);
                }
            }

            const amount = new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(data.amount || 0);
            const txId = data.transaction_id || `TX-${Date.now()}`;

            // --- FIXED COMPONENT V2 STRUCTURE ---
            const mainMsg = {
                flags: 32768,
                components: [{
                    type: 17,
                    components: [
                        {
                            type: 9,
                            components: [{
                                type: 10,
                                content: `# Donation Support\n> "${data.message || 'Semoga bermanfaat!'}"\n\n**__Informasi__**\n> **Nama:** ${displayName}\n> **Nominal:** \`${amount}\`\n> **Donasi To:** 001\n> **Tanggal:** <t:${Math.floor(Date.now() / 1000)}:F>`
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
                }]
            };

            const sentMsg = await channel.send(mainMsg);

            // --- AUTO THREAD DENGAN PESAN COMPONENT V2 ---
            const thread = await sentMsg.startThread({
                name: `💝 Support - ${displayName}`,
                autoArchiveDuration: 1440
            });

            await thread.send({
                flags: 32768,
                components: [{
                    type: 17,
                    components: [{ 
                        type: 10, 
                        content: `✨ Ayo berikan ucapan terima kasih yang tulus untuk **${displayName}**! 🚀` 
                    }]
                }]
            });

            res.status(200).send('OK');
        } catch (err) {
            console.error("🚨 Webhook Error:", err.message);
            res.status(200).send('Error Handled');
        }
    });

    // --- FIXED LIKE HANDLER ---
    client.on('interactionCreate', async (interaction) => {
        if (!interaction.isButton() || !interaction.customId.startsWith('like_')) return;
        
        // Gunakan deferUpdate agar tidak bentrok dengan interaction lain
        if (!interaction.deferred && !interaction.replied) {
            await interaction.deferUpdate().catch(() => null);
        }

        const txId = interaction.customId.replace('like_', '');
        try {
            const result = await donationsColl.findOneAndUpdate(
                { transactionId: txId },
                { $inc: { count: 1 }, $addToSet: { users: interaction.user.id } },
                { upsert: true, returnDocument: 'after' }
            );

            const newCount = result.count || 1;
            const updatedComponents = interaction.message.components.map(row => {
                if (row.type === 17) {
                    row.components = row.components.map(comp => {
                        if (comp.type === 1) { // Action Row didalam type 17
                            comp.components = comp.components.map(btn => {
                                if (btn.customId === interaction.customId) btn.label = `(${newCount})`;
                                return btn;
                            });
                        }
                        return comp;
                    });
                }
                return row;
            });

            await interaction.editReply({ components: updatedComponents }).catch(() => null);
        } catch (err) { console.log("Like Error:", err.message); }
    });
};
