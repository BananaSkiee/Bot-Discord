// modules/sociabuzz.js
const { MessageFlags, ChannelType, PermissionFlagsBits } = require('discord.js');
const { MongoClient } = require('mongodb');

const uri = "mongodb+srv://AeroX:AeroX@aerox.cgfxn4x.mongodb.net/?retryWrites=true&w=majority&appName=AeroX";
const DONASI_CHANNEL_ID = '1489600684088229972';
const DEFAULT_AVATAR = 'https://i.ibb.co.com/49pJCf1/Tak-berjudul17-20260403173554.png';

let dbClient = null;
let db = null;

async function connectDB() {
    try {
        if (!dbClient) {
            dbClient = new MongoClient(uri);
            await dbClient.connect();
            db = dbClient.db('donasi_akira');
            console.log("🍃 MongoDB Connected: Database 'donasi_akira' Ready!");
        }
    } catch (e) { 
        console.error("❌ MongoDB Error:", e);
    }
}

async function handleLike(interaction) {
    try {
        await connectDB();
        
        const txId = interaction.customId.replace('like_', '');
        const userId = interaction.user.id;
        
        // Cek apakah user sudah like
        const existing = await db.collection('donations_likes').findOne({ 
            transactionId: txId,
            users: userId 
        });
        
        let updateOperation;
        let message = "";
        
        if (existing) {
            // Unlike
            updateOperation = { 
                $inc: { count: -1 }, 
                $pull: { users: userId } 
            };
            message = "💔 Kamu membatalkan like";
        } else {
            // Like baru
            updateOperation = { 
                $inc: { count: 1 }, 
                $addToSet: { users: userId } 
            };
            message = "❤️ Kamu menyukai donasi ini";
        }
        
        const result = await db.collection('donations_likes').findOneAndUpdate(
            { transactionId: txId },
            updateOperation,
            { upsert: true, returnDocument: 'after' }
        );

        const newCount = result?.count || 0;

        // Update tombol like di message
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
        
        // Reply ephemeral untuk konfirmasi
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

function initWebhook(client, app) {
    if (!app || typeof app.post !== 'function') {
        return console.error("❌ Express 'app' tidak valid.");
    }

    connectDB();
    
    // Webhook endpoint untuk Sociabuzz
    app.post('/webhook', async (req, res) => {
        try {
            console.log('📩 Webhook received:', JSON.stringify(req.body, null, 2));
            
            // Parse data dari Sociabuzz
            const {
                id: transactionId,
                amount,
                name: donaturName,
                message: pesanDonasi,
                created_at,
                email, // Bisa digunakan untuk mapping Discord
                metadata // Data tambahan jika ada
            } = req.body;

            if (!amount) {
                return res.status(400).json({ error: 'Amount required' });
            }

            // Cek apakah sudah pernah diproses (anti duplikat)
            const existing = await db.collection('donations').findOne({ transactionId });
            if (existing) {
                console.log('⚠️ Donasi duplikat:', transactionId);
                return res.status(200).json({ message: 'Already processed' });
            }

            // Simpan ke database
            await db.collection('donations').insertOne({
                transactionId,
                amount: parseInt(amount),
                name: donaturName || 'Anonim',
                message: pesanDonasi || '',
                createdAt: new Date(created_at || Date.now()),
                metadata: metadata || {}
            });

            // Hitung total donasi dari user ini (jika ada email/identifier sama)
            const totalDonasi = await db.collection('donations')
                .aggregate([
                    { $match: { name: donaturName || 'Anonim' } },
                    { $group: { _id: null, total: { $sum: '$amount' } } }
                ]).toArray();
            
            const total = totalDonasi[0]?.total || parseInt(amount);

            // Cari Discord user (jika metadata ada userId)
            let discordUser = null;
            let displayName = donaturName || 'Anonim';
            let avatarUrl = DEFAULT_AVATAR;
            let profileUrl = 'https://discord.com/users/1364631032363749628'; // Default fallback
            
            if (metadata?.discordUserId) {
                try {
                    discordUser = await client.users.fetch(metadata.discordUserId);
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
            
            // Generate custom_id untuk tombol like
            const likeCustomId = `like_${transactionId}`;
            
            // Template Components V2
            const donationPayload = {
                flags: MessageFlags.IsComponentsV2,
                components: [
                    {
                        type: 17, // Container
                        components: [
                            {
                                type: 9, // Section - Header
                                components: [
                                    {
                                        type: 10, // Text Display
                                        content: `# 💎 Donation Support\n> "${pesanDonasi || 'Terima kasih atas dukungannya!'}"\n\n**__Informasi Donasi__**\n> **Nama:** ${displayName}\n> **Nominal:** \`${formattedAmount}\`\n> **Total Donasi:** \`${formattedTotal}\`\n> **Donasi ID:** \`${transactionId.slice(-6).toUpperCase() || '001'}\`\n> **Waktu:** <t:${timestamp}:F>`
                                    }
                                ],
                                accessory: {
                                    type: 11, // Thumbnail
                                    media: {
                                        url: avatarUrl
                                    }
                                }
                            },
                            {
                                type: 14 // Separator
                            },
                            {
                                type: 9, // Section - Terima Kasih
                                components: [
                                    {
                                        type: 10,
                                        content: `**__Terima Kasih Banyak__**\n\n> Donasi Anda sangat berarti dan membantu perkembangan komunitas ini!`
                                    }
                                ],
                                accessory: {
                                    type: 2, // Button
                                    style: 5, // Link
                                    label: "Donasi",
                                    url: "https://sociabuzz.com/bananaaskiee/donate",
                                    custom_id: `donate_btn_${transactionId}`
                                }
                            },
                            {
                                type: 14 // Separator
                            },
                            {
                                type: 1, // ActionRow
                                components: [
                                    {
                                        style: 3, // Success/Green
                                        type: 2, // Button
                                        label: "(0)",
                                        emoji: {
                                            name: "❤️"
                                        },
                                        custom_id: likeCustomId
                                    },
                                    {
                                        type: 2,
                                        style: 5, // Link
                                        label: "Benefit",
                                        url: "https://discord.com/channels/1347233781391560837/1487703926483587102",
                                        custom_id: `benefit_${transactionId}`
                                    },
                                    {
                                        type: 2,
                                        style: 5, // Link
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

            // Kirim ke channel donasi
            const channel = await client.channels.fetch(DONASI_CHANNEL_ID);
            if (!channel) {
                console.error('❌ Channel donasi tidak ditemukan:', DONASI_CHANNEL_ID);
                return res.status(500).json({ error: 'Channel not found' });
            }

            const sentMessage = await channel.send(donationPayload);

            // Buat thread publik
            const thread = await sentMessage.startThread({
                name: `💬 Terima Kasih ${displayName}`,
                autoArchiveDuration: 1440, // 24 jam
                type: ChannelType.PublicThread, // Thread publik (semua bisa chat)
                reason: 'Diskusi donasi dari ' + displayName
            });

            // Kirim pesan di thread dengan Components V2
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

            // Inisialisasi like counter di MongoDB
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
            res.status(500).json({ error: 'Internal server error' });
        }
    });

    console.log("✅ Sociabuzz Webhook registered at /webhook");
}

module.exports = { initWebhook, handleLike };
