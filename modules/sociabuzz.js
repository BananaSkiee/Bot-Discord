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
        // Respon cepat ke SociaBuzz
        res.status(200).send('OK');

        (async () => {
            try {
                const data = req.body;
                if (!data || !data.amount) return;

                const rawAmount = parseFloat(data.amount) || 0;
                const supporterName = data.supporter_name || 'Anonim';
                const messageDonasi = data.message || 'Terima kasih atas dukungannya!';
                
                const GUILD_ID = "1347233781391560837";
                const CHANNEL_ID = "1487715289390121041";
                const ROLE_ID = "1444248607745245204";

                const guild = client.guilds.cache.get(GUILD_ID) || await client.guilds.fetch(GUILD_ID);
                const channel = await client.channels.fetch(CHANNEL_ID);

                if (!channel) return;

                // Cari member untuk avatar & role
                const member = guild.members.cache.find(m => 
                    m.user.username.toLowerCase() === supporterName.toLowerCase() || 
                    m.displayName.toLowerCase() === supporterName.toLowerCase()
                );

                const donationDate = `<t:${Math.floor(Date.now() / 1000)}:F>`;
                const currencyFormatter = new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 });

                // Logic Database: "Total Anda" hanya muncul jika sudah pernah donasi
                let totalStr = "";
                if (db) {
                    const userCol = db.collection("users");
                    const existing = await userCol.findOne({ name: supporterName.toLowerCase() });
                    if (existing) {
                        const newTotal = existing.totalAmount + rawAmount;
                        totalStr = `\n> **Total Anda:** \`${currencyFormatter.format(newTotal)}\``;
                        await userCol.updateOne({ name: supporterName.toLowerCase() }, { $inc: { totalAmount: rawAmount, count: 1 } });
                    } else {
                        await userCol.insertOne({ name: supporterName.toLowerCase(), totalAmount: rawAmount, count: 1 });
                    }
                }

                const userAvatar = member ? member.user.displayAvatarURL({ extension: 'png' }) : "https://i.ibb.co.com/49pJCf1/Tak-berjudul17-20260403173554.png";
                const profileUrl = member ? `https://discord.com/users/${member.id}` : `https://discord.com/users/1364631032363749628`;
                const displayIdentity = member ? member.user.username : supporterName;

                // Kirim Pesan Utama (Type 17)
                const sentMsg = await channel.send({
                    flags: 32768,
                    components: [{
                        type: 17,
                        components: [
                            {
                                type: 9,
                                components: [{
                                    type: 10,
                                    content: `# Donation Support\n> "${messageDonasi}"\n\n**__Informasi__**\n> **Nama:** ${displayIdentity}\n> **Nominal:** \`${currencyFormatter.format(rawAmount)}\`${totalStr}\n> **Donasi To:** 001\n> **Tanggal:** ${donationDate}`
                                }],
                                accessory: { type: 11, media: { url: userAvatar } }
                            },
                            { type: 14 },
                            {
                                type: 9,
                                components: [{ type: 10, content: "**__Terimakasih Banyak__**\n\n> Donasi Anda membantu saya mempercepat beli pc" }],
                                accessory: { type: 2, style: 5, label: "Donasi", url: "https://sociabuzz.com/bananaaskiee/donate" }
                            },
                            { type: 14 },
                            {
                                type: 1,
                                components: [
                                    { type: 2, style: 5, label: "Benefit", url: "https://discord.com/channels/1347233781391560837/1487703926483587102" },
                                    { type: 2, style: 5, label: "Profil", url: profileUrl }
                                ]
                            }
                        ]
                    }]
                });

                // Auto Thread
                const thread = await sentMsg.startThread({
                    name: `💝 Support dari ${displayIdentity}`,
                    autoArchiveDuration: 1440,
                    type: 11 
                });

                // Pesan Template V2 di dalam Thread
                await thread.send({
                    flags: 32768,
                    components: [{
                        type: 17,
                        components: [{
                            type: 10,
                            content: `Ayo berikan ucapan terima kasih yang tulus untuk **${displayIdentity}**!`
                        }]
                    }]
                });

                // Kasih Role Donatur
                if (member) await member.roles.add(ROLE_ID).catch(() => {});

            } catch (err) { console.error("🚨 Donation Error:", err.message); }
        })();
    });
};
