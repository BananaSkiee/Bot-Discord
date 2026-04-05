const { MongoClient } = require('mongodb');

module.exports = (client, app) => {
    const uri = "mongodb+srv://AeroX:AeroX@aerox.cgfxn4x.mongodb.net/?retryWrites=true&w=majority&appName=AeroX";
    const dbClient = new MongoClient(uri);
    let db;

    async function connectDB() {
        try {
            await dbClient.connect();
            db = dbClient.db("donasi_akira");
            console.log("📂 [SociaBuzz] MongoDB Connected & Ready!");
        } catch (e) { console.error("❌ MongoDB Error:", e.message); }
    }
    connectDB();

    app.post('/webhook', async (req, res) => {
        res.status(200).send('OK');

        (async () => {
            try {
                const data = req.body;
                if (!data || !data.amount) return;

                const rawAmount = parseFloat(data.amount) || 0;
                const supporterName = data.supporter_name || 'Anonim';
                const supporterEmail = data.supporter_email || 'Tidak ada email';
                const messageDonasi = data.message || 'Terima kasih atas dukungannya!';
                
                const isPrivate = data.is_private || data.is_hidden || false;
                const emailHidden = data.hide_email || false;

                const MY_ID = "1346964077309595658"; 
                const GUILD_ID = "1347233781391560837";
                const CHANNEL_ID = "1487715289390121041";
                const ROLE_ID = "1444248607745245204";

                const guild = client.guilds.cache.get(GUILD_ID) || await client.guilds.fetch(GUILD_ID);
                const channel = await client.channels.fetch(CHANNEL_ID);
                const owner = await client.users.fetch(MY_ID);

                // --- 1. NOMOR URUT DONASI ---
                let donationNumber = "001";
                if (db) {
                    const counterCol = db.collection("counters");
                    const counter = await counterCol.findOneAndUpdate(
                        { id: "donation_count" },
                        { $inc: { seq: 1 } },
                        { upsert: true, returnDocument: 'after' }
                    );
                    donationNumber = counter.seq.toString().padStart(3, '0');
                }

                // --- 2. DETEKSI USER ---
                const member = guild.members.cache.find(m => 
                    m.user.username.toLowerCase() === supporterName.toLowerCase() || 
                    m.displayName.toLowerCase() === supporterName.toLowerCase()
                );

                const donationDate = `<t:${Math.floor(Date.now() / 1000)}:F>`;
                const currencyFormatter = new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 });

                // --- 3. LOGIC TOTAL ---
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
                const displayIdentity = member ? `<@${member.id}>` : `\`${supporterName}\``;

                // --- 4. DM OWNER ---
                if (owner) {
                    let dmContent = `🔔 **Donasi Baru Masuk!** (#${donationNumber})\n`;
                    dmContent += `> **Dari:** ${supporterName}\n`;
                    dmContent += `> **Nominal:** ${currencyFormatter.format(rawAmount)}\n`;
                    if (!emailHidden) dmContent += `> **Email:** \`${supporterEmail}\`\n`;
                    dmContent += `> **Pesan:** ${messageDonasi}`;
                    await owner.send(dmContent).catch(() => {});
                }

                // --- 5. CHANNEL SERVER & AUTO REACTION ---
                if (channel) {
                    const displayMessage = isPrivate ? "*[ Pesan ini disembunyikan oleh donatur ]*" : messageDonasi;

                    const payload = {
                        flags: 32768,
                        components: [{
                            type: 17,
                            components: [
                                {
                                    type: 9,
                                    components: [{
                                        type: 10,
                                        content: `# Donation Support\n> "${displayMessage}"\n\n**__Informasi__**\n> **Nama:** ${displayIdentity}\n> **Nominal:** \`${currencyFormatter.format(rawAmount)}\`${totalStr}\n> **Donasi To:** ${donationNumber}\n> **Tanggal:** ${donationDate}`
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
                    };

                    const sentMsg = await channel.send(payload);

                    // --- AUTO REACTION ❤️ ---
                    // Ini otomatis nambahin react ❤️ ke pesan yang baru dikirim (Bot ID: 1364631032363749628)
                    await sentMsg.react('❤️').catch(() => {});

                    // --- 6. AUTO THREAD ---
                    const threadName = `💝 Support dari ${member ? member.user.username : supporterName}`;
                    const thread = await sentMsg.startThread({
                        name: threadName.substring(0, 31),
                        autoArchiveDuration: 1440
                    });

                    await thread.send({
                        flags: 32768,
                        components: [{
                            type: 17,
                            components: [{
                                type: 10,
                                content: `Ayo berikan ucapan terima kasih yang tulus untuk **${member ? member.user.username : supporterName}**!`
                            }]
                        }]
                    });

                    if (member) await member.roles.add(ROLE_ID).catch(() => {});
                }

            } catch (err) { console.error("🚨 Webhook Error:", err); }
        })();
    });
};
