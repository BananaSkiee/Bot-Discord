const { MongoClient } = require('mongodb');

module.exports = (client, app) => {
    const uri = "mongodb+srv://AeroX:AeroX@aerox.cgfxn4x.mongodb.net/?retryWrites=true&w=majority&appName=AeroX";
    const dbClient = new MongoClient(uri);
    let db;

    async function connectDB() {
        try {
            await dbClient.connect();
            db = dbClient.db("donasi_akira");
            console.log("📂 [SociaBuzz] MongoDB Connected!");
        } catch (e) { console.error("❌ MongoDB Error:", e.message); }
    }
    connectDB();

    app.post('/webhook', async (req, res) => {
        try {
            const data = req.body;
            const rawAmount = parseFloat(data.amount) || 0;
            const supporterName = data.supporter_name || 'Anonim';
            const messageDonasi = data.message || 'Terima kasih atas dukungannya!';
            const donationDate = `<t:${Math.floor(Date.now() / 1000)}:F>`;
            
            const currencyFormatter = new Intl.NumberFormat('id-ID', {
                style: 'currency', currency: 'IDR', minimumFractionDigits: 0
            });

            let totalDonasiStr = "";
            if (db) {
                const userCol = db.collection("users");
                const userData = await userCol.findOneAndUpdate(
                    { name: supporterName.toLowerCase() }, 
                    { $inc: { totalAmount: rawAmount, count: 1 } },
                    { upsert: true, returnDocument: 'after' }
                );
                if (userData && userData.totalAmount > rawAmount) {
                    totalDonasiStr = `\n> **Total Anda:** \`${currencyFormatter.format(userData.totalAmount)}\``;
                }
            }

            const GUILD_ID = "1347233781391560837";
            const CHANNEL_ID = "1487715289390121041";
            const ROLE_ID = "1444248607745245204";
            
            const guild = client.guilds.cache.get(GUILD_ID);
            const channel = await client.channels.fetch(CHANNEL_ID);

            if (channel) {
                const member = guild.members.cache.find(m => m.user.username.toLowerCase() === supporterName.toLowerCase() || m.displayName.toLowerCase() === supporterName.toLowerCase());
                const userAvatar = member ? member.user.displayAvatarURL({ extension: 'png' }) : "https://i.ibb.co.com/49pJCf1/Tak-berjudul17-20260403173554.png";
                const profileUrl = member ? `https://discord.com/users/${member.id}` : `https://discord.com/users/1364631032363749628`;
                const displayIdentity = member ? member.displayName : supporterName;

                // FIX: Gunakan struktur data mentah (Raw API Payload) untuk Type 17
                const payload = {
                    flags: 32768,
                    components: [
                        {
                            type: 17,
                            components: [
                                {
                                    type: 9,
                                    components: [{
                                        type: 10,
                                        content: `# Donation Support\n> "${messageDonasi}"\n\n**__Informasi__**\n> **Nama:** ${displayIdentity}\n> **Nominal:** \`${currencyFormatter.format(rawAmount)}\`${totalDonasiStr}\n> **Donasi To:** 001\n> **Tanggal:** ${donationDate}`
                                    }],
                                    accessory: { type: 11, media: { url: userAvatar } }
                                },
                                { type: 14 },
                                {
                                    type: 9,
                                    components: [{ type: 10, content: "**__Terimakasih Banyak__**\n\n> Donasi Anda membantu saya mempercepat beli pc" }],
                                    accessory: { type: 2, style: 5, label: "Donasi", url: "https://sociabuzz.com/bananaskiee/tribe" }
                                },
                                { type: 14 },
                                {
                                    type: 1,
                                    components: [
                                        { type: 2, style: 3, label: "0", emoji: { name: "❤️" }, custom_id: `like_donation` },
                                        { type: 2, style: 5, label: "Benefit", url: "https://discord.com/channels/1347233781391560837/1487703926483587102" },
                                        { type: 2, style: 5, label: "Profil", url: profileUrl }
                                    ]
                                }
                            ]
                        }
                    ]
                };

                // Kirim via REST agar tidak kena validasi internal djs yang kaku
                const sentMsg = await channel.send(payload);

                const thread = await sentMsg.startThread({
                    name: `💝 Support dari ${displayIdentity}`,
                    autoArchiveDuration: 1440,
                    type: 11 
                });

                await thread.send({
                    components: [{
                        type: 17,
                        components: [{ type: 10, content: `Ayo berikan ucapan terima kasih yang tulus untuk **${displayIdentity}**!` }]
                    }]
                });

                if (member) await member.roles.add(ROLE_ID).catch(() => {});
            }
            res.status(200).send('OK');
        } catch (err) {
            console.error("🚨 [SociaBuzz] Crash:", err);
            res.status(500).send('Error');
        }
    });

    client.on('interactionCreate', async (interaction) => {
        if (!interaction.isButton() || interaction.customId !== 'like_donation') return;
        const likesCol = db.collection("likes");
        if (await likesCol.findOne({ messageId: interaction.message.id, userId: interaction.user.id })) {
            return interaction.reply({ content: "Kamu sudah memberikan dukungan ❤️!", ephemeral: true });
        }
        await likesCol.insertOne({ messageId: interaction.message.id, userId: interaction.user.id });
        const likeCount = await likesCol.countDocuments({ messageId: interaction.message.id });

        const oldComponents = interaction.message.components;
        // Penyesuaian indeks pencarian tombol Like (Type 17 -> ActionRow -> Button)
        oldComponents[0].components[4].components[0].label = `${likeCount}`;
        await interaction.update({ components: oldComponents });
    });
};
