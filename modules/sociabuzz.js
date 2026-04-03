// modules/sociabuzz.js
const { MongoClient, MessageFlags } = require('discord.js');

const uri = "mongodb+srv://AeroX:AeroX@aerox.cgfxn4x.mongodb.net/?retryWrites=true&w=majority&appName=AeroX";
const dbClient = new MongoClient(uri);
let db;

async function connectDB() {
    try {
        if (!db) {
            await dbClient.connect();
            db = dbClient.db('donasi_akira');
            console.log("🍃 MongoDB Connected: Database 'donasi_akira' Ready!");
        }
    } catch (e) { 
        console.error("❌ MongoDB Error di Sociabuzz:", e); 
    }
}

async function handleLike(interaction) {
    try {
        // Connect dulu
        await connectDB();
        
        const txId = interaction.customId.replace('like_', '');
        
        // Cek apakah user sudah like sebelumnya (toggle logic)
        const existing = await db.collection('donations_likes').findOne({ 
            transactionId: txId,
            users: interaction.user.id 
        });
        
        let updateOperation;
        if (existing) {
            // Unlike (hapus like)
            updateOperation = { 
                $inc: { count: -1 }, 
                $pull: { users: interaction.user.id } 
            };
        } else {
            // Like baru
            updateOperation = { 
                $inc: { count: 1 }, 
                $addToSet: { users: interaction.user.id } 
            };
        }
        
        const result = await db.collection('donations_likes').findOneAndUpdate(
            { transactionId: txId },
            updateOperation,
            { upsert: true, returnDocument: 'after' }
        );

        const newCount = result?.count || 0;

        // Components V2 Handling
        // Struktur: Container(17) -> [Section(9), Separator(14), Section(9), Separator(14), ActionRow(1)]
        const container = interaction.message.components[0];
        
        if (!container || container.type !== 17) {
            console.error('❌ Bukan Components V2 message');
            return;
        }

        // Rebuild components dengan update tombol like
        const newComponents = [{
            type: 17,
            components: container.components.map(section => {
                // Cari ActionRow (type 1) yang berisi tombol
                if (section.type === 1 && section.components) {
                    return {
                        ...section,
                        components: section.components.map(btn => {
                            // Update tombol yang matching custom_id
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

        // Edit message langsung (bukan editReply karena ini update existing message)
        await interaction.message.edit({ 
            components: newComponents,
            flags: MessageFlags.IsComponentsV2 
        });
        
        // Acknowledge interaction dengan deferUpdate (silent)
        if (!interaction.replied && !interaction.deferred) {
            await interaction.deferUpdate().catch(() => {});
        }

    } catch (err) { 
        console.error("❌ Like Error Detail:", err);
        // Silent fail untuk avoid "Unknown interaction"
        if (!interaction.replied && !interaction.deferred) {
            await interaction.deferUpdate().catch(() => {});
        }
    }
}

function initWebhook(client, app) {
    if (!app || typeof app.post !== 'function') {
        return console.error("❌ Gagal init Webhook: Express 'app' tidak valid.");
    }

    connectDB();
    
    app.post('/webhook', async (req, res) => {
        // ... Kode webhook donasi Tuan ...
        res.status(200).send('OK');
    });
}

// Export yang benar (object, bukan overwrite)
module.exports = { initWebhook, handleLike };
