// modules/sociabuzz.js
const { MessageFlags, ChannelType } = require('discord.js');
const { MongoClient } = require('mongodb');

const uri = "mongodb+srv://AeroX:AeroX@aerox.cgfxn4x.mongodb.net/?retryWrites=true&w=majority&appName=AeroX";
const DB_NAME = 'donasi_akira'; // Sesuai permintaan: donasii_akira (double i)
const DONASI_CHANNEL_ID = '1487715289390121041';
const DEFAULT_AVATAR = 'https://i.ibb.co.com/49pJCf1/Tak-berjudul17-20260403173554.png';
const DEFAULT_USER_ID = '1364631032363749628';

let dbClient = null;
let db = null;

async function connectDB() {
    try {
        if (!dbClient) {
            dbClient = new MongoClient(uri);
            await dbClient.connect();
            db = dbClient.db(DB_NAME);
            console.log(`🍃 MongoDB Connected: Database '${DB_NAME}' Ready!`);
        }
        return db;
    } catch (e) {
        console.error("❌ MongoDB Connection Error:", e);
        throw e;
    }
}

function formatRupiah(angka) {
    return new Intl.NumberFormat('id-ID', {
        style: 'currency',
        currency: 'IDR',
        minimumFractionDigits: 0
    }).format(angka);
}

function formatTimestamp(isoString) {
    const date = new Date(isoString);
    return Math.floor(date.getTime() / 1000);
}

async function handleLike(interaction) {
    try {
        await connectDB();
        
        const txId = interaction.customId.replace('like_', '');
        const userId = interaction.user.id;
        
        const collection = db.collection('donations_likes');
        const existing = await collection.findOne({ 
            transactionId: txId,
            users: userId 
        });
        
        let updateOperation;
        let message = "";
        
        if (existing) {
            updateOperation = { 
                $inc: { count: -1 }, 
                $pull: { users: userId } 
            };
            message = "💔 Kamu membatalkan like";
        } else {
            updateOperation = { 
                $inc: { count: 1 }, 
                $addToSet: { users: userId } 
            };
            message = "❤️ Kamu menyukai donasi ini";
        }
        
        const result = await collection.findOneAndUpdate(
            { transactionId: txId },
            updateOperation,
            { upsert: true, returnDocument: 'after' }
        );

        const newCount = result?.count || 0;

        // Update label tombol like pada Components V2
        const container = interaction.message.components[0];
        if (!container || container.type !== 17) {
            console.error('❌ Bukan Components V2 message');
            return;
        }

        const newComponents = [{
            type: 17,
            components: container.components.map(section => {
                if (section.type === 1 && section.components) {
                    return {
                        ...section,
                        components: section.components.map(btn => {
                            if (btn.custom_id === interaction.customId) {
                                return {
                                    ...btn,
                                    label: `(${newCount})`
                                };
                            }
                            return btn;
                        })
                    };
                }
                return section;
            })
        }];

        await interaction.message.edit({ 
            components: newComponents,
            flags: MessageFlags.IsComponentsV2 
        });
        
        if (!interaction.replied && !interaction.deferred) {
            await interaction.reply({ 
                content: message, 
                flags: MessageFlags.Ephemeral 
            }).catch(() => {});
        } else {
            await interaction.followUp({ 
                content: message, 
                flags: MessageFlags.Ephemeral 
            }).catch(() => {});
        }

    } catch (err) { 
        console.error("❌ Like Error:", err);
        if (!interaction.replied && !interaction.deferred) {
            await interaction.deferUpdate().catch(() => {});
        }
    }
}

function initSociabuzz(client, app) {
    if (!app || typeof app.post !== 'function') {
        return console.error("❌ Express 'app' tidak valid.");
    }

    // Register webhook route
    app.post('/webhook', async (req, res) => {
        try {
            console.log('📩 Webhook received:', JSON.stringify(req.body, null, 2));
            
            const {
                id: transactionId,
                amount,
                name: donaturName,
                message: pesanDonasi,
                created_at,
                metadata
            } = req.body;

            if (!amount) {
                return res.status(400).json({ error: 'Amount required' });
            }

            await connectDB();

            // Anti duplikat
            const existing = await db.collection('donations').findOne({ transactionId });
            if (existing) {
                console.log('⚠️ Donasi duplikat:', transactionId);
                return res.status(200).json({ message: 'Already processed' });
            }

            await db.collection('donations').insertOne({
                transactionId,
                amount: parseInt(amount),
                name: donaturName || 'Anonim',
                message: pesanDonasi || '',
                createdAt: new Date(created_at || Date.now()),
                metadata: metadata || {}
            });

            // Hitung total donasi user ini
            const totalDonasi = await db.collection('donations')
                .aggregate([
                    { $match: { name: donaturName || 'Anonim' } },
                    { $group: { _id: null, total: { $sum: '$amount' } } }
                ]).toArray();
            
            const total = totalDonasi[0]?.total || parseInt(amount);
            const isFirstDonation = total === parseInt(amount);

            // Resolve Discord user info
            let displayName = donaturName || 'Anonim';
            let avatarUrl = DEFAULT_AVATAR;
            let profileUrl = `https://discord.com/users/${DEFAULT_USER_ID}`;
            
            if (metadata?.discordUserId) {
                try {
                    const discordUser = await client.users.fetch(metadata.discordUserId);
                    displayName = discordUser.globalName || discordUser.username;
                    avatarUrl = discordUser.displayAvatarURL({ dynamic: true, size: 256 });
                    profileUrl = `https://discord.com/users/${discordUser.id}`;
                } catch (e) {
                    console.log('⚠️ Discord user not found:', metadata.discordUserId);
                }
            }

            const timestamp = formatTimestamp(created_at || new Date());
            const formattedAmount = formatRupiah(amount);
            const formattedTotal = formatRupiah(total);
            const shortId = transactionId.slice(-6).toUpperCase();
            
            const likeCustomId = `like_${transactionId}`;
            
            // Bangun konten Informasi
            let informasiText = `> **Nama:** ${displayName}\n> **Nominal:** \`${formattedAmount}\``;
            if (!isFirstDonation) {
                informasiText += `\n> **Total Anda:** \`${formattedTotal}\``;
            }
            informasiText += `\n> **Donasi To:** ${shortId}\n> **Tanggal:** <t:${timestamp}:F>`;

            // Payload Components V2 sesuai template
            const donationPayload = {
                flags: MessageFlags.IsComponentsV2,
                components: [
                    {
                        type: 17,
                        components: [
                            {
                                type: 9,
                                components: [
                                    {
                                        type: 10,
                                        content: `# Donation Support\n> "${pesanDonasi || 'Terima kasih atas dukungannya!'}"\n\n**__Informasi__**\n${informasiText}`
                                    }
                                ],
                                accessory: {
                                    type: 11,
                                    media: {
                                        url: avatarUrl
                                    }
                                }
                            },
                            {
                                type: 14
                            },
                            {
                                type: 9,
                                components: [
                                    {
                                        type: 10,
                                        content: `**__Terimakasih Banyak__**\n\n> Donasi Anda membantu saya mempercepat beli pc`
                                    }
                                ],
                                accessory: {
                                    type: 2,
                                    style: 5,
                                    label: "Donasi",
                                    url: "https://sociabuzz.com/bananaaskiee/donate",
                                    custom_id: `donate_btn_${transactionId}`
                                }
                            },
                            {
                                type: 14
                            },
                            {
                                type: 1,
                                components: [
                                    {
                                        style: 3,
                                        type: 2,
                                        label: "(0)",
                                        emoji: {
                                            name: "❤️"
                                        },
                                        custom_id: likeCustomId
                                    },
                                    {
                                        type: 2,
                                        style: 5,
                                        label: "Benefit",
                                        url: "https://discord.com/channels/1347233781391560837/1487703926483587102",
                                        custom_id: `benefit_${transactionId}`
                                    },
                                    {
                                        type: 2,
                                        style: 5,
                                        label: "Profil",
                                        url: profileUrl,
                                        custom_id: `profile_${transactionId}`
                                    }
                                ]
                            }
                        ]
                    }
                ]
            };

            const channel = await client.channels.fetch(DONASI_CHANNEL_ID);
            if (!channel) {
                console.error('❌ Channel donasi tidak ditemukan:', DONASI_CHANNEL_ID);
                return res.status(500).json({ error: 'Channel not found' });
            }

            const sentMessage = await channel.send(donationPayload);

            // Buat Public Thread
            const thread = await sentMessage.startThread({
                name: `💝 Support dari ${displayName}`,
                autoArchiveDuration: 1440,
                type: ChannelType.PublicThread,
                reason: 'Diskusi donasi dari ' + displayName
            });

            // Kirim pesan di dalam thread (Components V2)
            const threadMessage = {
                flags: MessageFlags.IsComponentsV2,
                components: [
                    {
                        type: 17,
                        components: [
                            {
                                type: 10,
                                content: `Ayo berikan ucapan terima kasih yang tulus untuk **${displayName}**!`
                            }
                        ]
                    }
                ]
            };

            await thread.send(threadMessage);

            // Inisialisasi like counter
            await db.collection('donations_likes').insertOne({
                transactionId,
                count: 0,
                users: [],
                messageId: sentMessage.id,
                createdAt: new Date()
            });

            console.log(`✅ Donasi diproses: ${transactionId} - ${formattedAmount} oleh ${displayName}`);
            console.log(`🧵 Thread dibuat: ${thread.name} (${thread.id})`);

            res.status(200).json({ 
                success: true, 
                messageId: sentMessage.id,
                threadId: thread.id 
            });

        } catch (error) {
            console.error('❌ Webhook Error:', error);
            res.status(500).json({ error: 'Internal server error', details: error.message });
        }
    });

    console.log("✅ Sociabuzz Webhook registered at /webhook");
}

// Export pattern
module.exports = initSociabuzz;
module.exports.handleLike = handleLike;
