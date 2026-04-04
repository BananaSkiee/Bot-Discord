const { MongoClient } = require('mongodb');

module.exports = (client, app) => {
    // --- KONFIGURASI DATABASE ---
    const uri = "mongodb+srv://AeroX:AeroX@aerox.cgfxn4x.mongodb.net/?retryWrites=true&w=majority&appName=AeroX";
    const dbClient = new MongoClient(uri);
    let db;

    async function connectDB() {
        try {
            await dbClient.connect();
            db = dbClient.db("donasi_akira");
            console.log("📂 [SociaBuzz] Database donasi_akira Terkoneksi!");
        } catch (e) {
            console.error("❌ [SociaBuzz] MongoDB Error:", e.message);
        }
    }
    connectDB();

    // --- WEBHOOK ENDPOINT ---
    app.post('/webhook', async (req, res) => {
        try {
            const data = req.body;
            
            // 1. Parsing Data & Formatting
            const rawAmount = parseFloat(data.amount) || 0;
            const supporterName = data.supporter_name || 'Anonim';
            const messageDonasi = data.message || 'Terima kasih atas dukungannya!';
            const donationDate = `<t:${Math.floor(Date.now() / 1000)}:F>`;
            
            const currencyFormatter = new Intl.NumberFormat('id-ID', {
                style: 'currency',
                currency: 'IDR',
                minimumFractionDigits: 0
            });

            // 2. Update DB & Hitung Total Donasi User
            let totalDonasiStr = "";
            if (db) {
                const userCol = db.collection("users");
                const userData = await userCol.findOneAndUpdate(
                    { name: supporterName.toLowerCase() }, 
                    { $inc: { totalAmount: rawAmount, count: 1 } },
                    { upsert: true, returnDocument: 'after' }
                );
                
                // Jika ini bukan donasi pertama, tampilkan totalnya
                if (userData && userData.totalAmount > rawAmount) {
                    totalDonasiStr = `\n> **Total Anda:** \`${currencyFormatter.format(userData.totalAmount)}\``;
                }
            }

            // 3. Eksekusi ke Discord
            const GUILD_ID = "1347233781391560837";
            const CHANNEL_ID = "1487715289390121041";
            const ROLE_ID = "1444248607745245204";
            
            const guild = client.guilds.cache.get(GUILD_ID);
            const channel = await client.channels.fetch(CHANNEL_ID);

            if (channel) {
                // Cek apakah donatur ada di server (berdasarkan username) untuk pasang avatar & role
                const member = guild.members.cache.find(m => m.user.username.toLowerCase() === supporterName.toLowerCase() || m.displayName.toLowerCase() === supporterName.toLowerCase());
                const userAvatar = member ? member.user.displayAvatarURL({ extension: 'png' }) : "https://i.ibb.co.com/49pJCf1/Tak-berjudul17-20260403173554.png";
                const profileUrl = member ? `https://discord.com/users/${member.id}` : `https://discord.com/users/1364631032363749628`;
                const displayIdentity = member ? member.displayName : supporterName;

                const componentsV2 = [
                    {
                        type: 17,
                        components: [
                            {
                                type: 9,
                                components: [{
                                    type: 10,
                                    content: `# Donation Support\n> "${messageDonasi}"\n\n**__Informasi__**\n> **Nama:** ${displayIdentity}\n> **Nominal:** \`${currencyFormatter.format(rawAmount)}\`${totalDonasiStr}\n> **Donasi To:** 001\n> **Tanggal:** ${donationDate}`
                                }],
                                accessory: {
                                    type: 11,
                                    media: { url: userAvatar }
                                }
                            },
                            { type: 14 },
                            {
                                type: 9,
                                components: [{
                                    type: 10,
                                    content: "**__Terimakasih Banyak__**\n\n> Donasi Anda membantu saya mempercepat beli pc"
                                }],
                                accessory: {
                                    type: 2, style: 5, label: "Donasi",
                                    url: "https://sociabuzz.com/bananaskiee/tribe"
                                }
                            },
                            { type: 14 },
                            {
                                type: 1,
                                components: [
                                    {
                                        type: 2, style: 3, label: "0",
                                        emoji: { name: "❤️" },
                                        custom_id: `like_donation`
                                    },
                                    {
                                        type: 2, style: 5, label: "Benefit",
                                        url: "https://discord.com/channels/1347233781391560837/1487703926483587102"
                                    },
                                    {
                                        type: 2, style: 5, label: "Profil",
                                        url: profileUrl
                                    }
                                ]
                            }
                        ]
                    }
                ];

                const sentMsg = await channel.send({ components: componentsV2 });

                // 4. Auto Create Public Thread
                const thread = await sentMsg.startThread({
                    name: `💝 Support dari ${displayIdentity}`,
                    autoArchiveDuration: 1440,
                    type: 11 
                });

                await thread.send({
                    components: [{
                        type: 17,
                        components: [{
                            type: 10,
                            content: `Ayo berikan ucapan terima kasih yang tulus untuk **${displayIdentity}**!`
                        }]
                    }]
                });

                // 5. Beri Role Otomatis jika member ditemukan
                if (member) {
                    await member.roles.add(ROLE_ID).catch(err => console.error("❌ Gagal tambah role:", err.message));
                }
            }

            res.status(200).send('OK');
        } catch (err) {
            console.error("🚨 [SociaBuzz] Crash:", err);
            res.status(500).send('Internal Error');
        }
    });

    // --- INTERACTION HANDLER (LIKE ❤️) ---
    client.on('interactionCreate', async (interaction) => {
        if (!interaction.isButton() || interaction.customId !== 'like_donation') return;

        const likesCol = db.collection("likes");
        const messageId = interaction.message.id;
        const userId = interaction.user.id;

        // Cek data di MongoDB agar tidak duplikat like
        const existingLike = await likesCol.findOne({ messageId, userId });
        
        if (existingLike) {
            return interaction.reply({ content: "Kamu sudah memberikan dukungan ❤️ untuk pesan ini!", ephemeral: true });
        }

        // Simpan like ke DB
        await likesCol.insertOne({ messageId, userId });
        
        // Hitung total like untuk pesan ini
        const likeCount = await likesCol.countDocuments({ messageId });

        // Update Button Label secara Real-time
        const oldComponents = interaction.message.components;
        // Struktur: Section(17) -> ActionRow(1) -> Button(2)
        // Tombol Like ada di komponen ke-1 dari Action Row terakhir
        oldComponents[0].components[4].components[0].label = `${likeCount}`;

        await interaction.update({ components: oldComponents });
    });

    console.log("✅ SociaBuzz Module (Ultra Mode) Loaded");
};
