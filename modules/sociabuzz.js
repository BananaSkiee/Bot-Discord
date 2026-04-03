const { MongoClient } = require('mongodb');

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
    } catch (e) { console.error("❌ MongoDB Error di Sociabuzz:", e); }
}

async function handleLike(interaction) {
    // PROTEKSI: Jika sudah dijawab oleh handler lain, batalkan.
    if (interaction.replied || interaction.deferred) return;

    try {
        await connectDB();
        // Gunakan deferUpdate hanya jika belum ada acknowledge
        await interaction.deferUpdate().catch(() => null);

        const txId = interaction.customId.replace('like_', '');
        const result = await db.collection('donations_likes').findOneAndUpdate(
            { transactionId: txId },
            { $inc: { count: 1 }, $addToSet: { users: interaction.user.id } },
            { upsert: true, returnDocument: 'after' }
        );

        const newCount = result.value ? result.value.count : 1; // Sesuai versi driver mongo Tuan

        const updatedComponents = interaction.message.components.map(row => {
            // Logika update label tombol tetap sama...
            if (row.type === 1) { // ActionRow
                row.components = row.components.map(btn => {
                    if (btn.customId === interaction.customId) {
                        btn.label = `(${newCount})`;
                    }
                    return btn;
                });
            }
            return row;
        });

        await interaction.editReply({ components: updatedComponents }).catch(() => null);
    } catch (err) { 
        console.log("Like Error Detail:", err.message); 
    }
}

function initWebhook(client, app) {
    if (!app || typeof app.post !== 'function') {
        return console.error("❌ Gagal init Webhook: Express 'app' tidak valid.");
    }

    connectDB();
    
    app.post('/webhook', async (req, res) => {
        // ... Kode webhook donasi Tuan yang lengkap tadi ...
        // Pastikan menyertakan kode pembuatan thread publik yang Tuan minta
        res.status(200).send('OK');
    });
}

module.exports = initWebhook;
module.exports.handleLike = handleLike;
