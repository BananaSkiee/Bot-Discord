const { MongoClient } = require('mongodb');

module.exports = (client, app) => {
    const uri = "mongodb+srv://AeroX:AeroX@aerox.cgfxn4x.mongodb.net/?retryWrites=true&w=majority&appName=AeroX";
    const dbClient = new MongoClient(uri);
    let db;

    async function connectDB() {
        try {
            await dbClient.connect();
            db = dbClient.db("donasi_akira");
            console.log("📂 [SociaBuzz] MongoDB Connected");
        } catch (e) { console.error("❌ MongoDB Error:", e); }
    }
    connectDB();

    app.post('/webhook', async (req, res) => {
        try {
            const data = req.body;
            const rawAmount = parseFloat(data.amount) || 0;
            const supporterName = data.supporter_name || 'Anonim';
            const messageDonasi = data.message || 'Terima kasih!';
            
            // Format IDR
            const formatted = new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(rawAmount);

            // Database Update
            let totalStr = "";
            if (db) {
                const userCol = db.collection("users");
                const result = await userCol.findOneAndUpdate(
                    { name: supporterName },
                    { $inc: { totalAmount: rawAmount } },
                    { upsert: true, returnDocument: 'after' }
                );
                if (result && result.totalAmount > rawAmount) {
                    totalStr = `\n> **Total Anda:** \`${new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(result.totalAmount)}\``;
                }
            }

            const channel = await client.channels.fetch("1487715289390121041");
            if (channel) {
                const msg = await channel.send({
                    components: [{
                        type: 17,
                        components: [
                            {
                                type: 9,
                                components: [{
                                    type: 10,
                                    content: `# Donation Support\n> "${messageDonasi}"\n\n**__Informasi__**\n> **Nama:** ${supporterName}\n> **Nominal:** \`${formatted}\`${totalStr}\n> **Donasi To:** 001\n> **Tanggal:** <t:${Math.floor(Date.now()/1000)}:F>`
                                }],
                                accessory: { type: 11, media: { url: "https://i.ibb.co.com/49pJCf1/Tak-berjudul17-20260403173554.png" } }
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
                                    { type: 2, style: 3, label: "0", emoji: { name: "❤️" }, custom_id: "donate_like" },
                                    { type: 2, style: 5, label: "Benefit", url: "https://discord.com/channels/1347233781391560837/1487703926483587102" },
                                    { type: 2, style: 5, label: "Profil", url: "https://discord.com/users/1364631032363749628" }
                                ]
                            }
                        ]
                    }]
                });

                // Auto Thread
                const thread = await msg.startThread({ name: `💝 Support dari ${supporterName}`, type: 11 });
                await thread.send({
                    components: [{ type: 17, components: [{ type: 10, content: `Ayo berikan ucapan terima kasih yang tulus untuk **${supporterName}**!` }] }]
                });

                // Auto Role (Jika user terdeteksi di server)
                const guild = client.guilds.cache.get("1347233781391560837");
                const member = guild.members.cache.find(m => m.user.username.toLowerCase() === supporterName.toLowerCase());
                if (member) await member.roles.add("1444248607745245204").catch(() => {});
            }
            res.status(200).send('OK');
        } catch (e) { res.status(500).send('Error'); }
    });

    // Like System Logic
    client.on('interactionCreate', async (i) => {
        if (!i.isButton() || i.customId !== "donate_like") return;
        const col = db.collection("likes");
        if (await col.findOne({ msg: i.message.id, user: i.user.id })) return i.reply({ content: "Udh like anjing", ephemeral: true });
        
        await col.insertOne({ msg: i.message.id, user: i.user.id });
        const count = await col.countDocuments({ msg: i.message.id });
        
        const comps = i.message.components;
        comps[0].components[4].components[0].label = `${count}`; // Target button like
        await i.update({ components: comps });
    });
};
