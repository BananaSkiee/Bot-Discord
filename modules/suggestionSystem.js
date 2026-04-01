// modules/suggestionSystem.js
const { MessageFlags } = require('discord.js');
const { MongoClient } = require('mongodb');

const SUGGESTION_CHANNEL_ID = '1430584708974252102';

// MongoDB Connection URI
const MONGO_URI = 'mongodb+srv://AeroX:AeroX@aerox.cgfxn4x.mongodb.net/?retryWrites=true&w=majority&appName=AeroX';
const DB_NAME = 'AeroX';
const COLLECTION_NAME = 'suggestionVotes';

let client = null;
let db = null;
let collection = null;

// Fungsi untuk connect ke MongoDB
async function connectDB() {
    if (client) return;
    
    try {
        client = new MongoClient(MONGO_URI);
        await client.connect();
        db = client.db(DB_NAME);
        collection = db.collection(COLLECTION_NAME);
        console.log('✅ Connected to MongoDB');
    } catch (error) {
        console.error('❌ MongoDB connection error:', error);
        throw error;
    }
}

// Fungsi untuk mendapatkan vote data dari MongoDB
async function getVotes(messageId) {
    await connectDB();
    const doc = await collection.findOne({ _id: messageId });
    return doc ? doc.votes : {};
}

// Fungsi untuk menyimpan vote data ke MongoDB
async function saveVotes(messageId, votes) {
    await connectDB();
    await collection.updateOne(
        { _id: messageId },
        { $set: { votes: votes, updatedAt: new Date() } },
        { upsert: true }
    );
}

// Fungsi untuk menghapus vote data
async function deleteVotes(messageId) {
    await connectDB();
    await collection.deleteOne({ _id: messageId });
}

module.exports = {
    name: 'suggestionSystem',
    
    async handleSuggestionMessage(message) {
        if (message.channel.id !== SUGGESTION_CHANNEL_ID) return;
        if (message.author.bot) return;
        
        try {
            await message.delete().catch(() => {});
            
            const timestamp = Math.floor(Date.now() / 1000);
            const username = message.author.globalName || message.author.username;
            
            const suggestionPayload = {
                flags: MessageFlags.IsComponentsV2,
                components: [{
                    type: 17,
                    components: [
                        {
                            type: 9,
                            components: [{
                                type: 10,
                                content: `# New Suggestion\n> **"${message.content}"**\n\n**__Informasi__**\n> **Pengusul:** ${username}\n> **User ID:** ${message.author.id}\n> **Tanggal:** <t:${timestamp}:F>`
                            }],
                            accessory: {
                                type: 11,
                                media: { url: message.author.displayAvatarURL({ dynamic: true, size: 128 }) }
                            }
                        },
                        { type: 14 },
                        {
                            type: 9,
                            components: [{
                                type: 10,
                                content: `**__Catatan__**\n\n> Silakan berdiskusi tentang saran ini di thread di bawah ini!`
                            }],
                            accessory: {
                                type: 2,
                                style: 5,
                                label: "Profile",
                                url: `https://discord.com/users/${message.author.id}`
                            }
                        },
                        { type: 14 },
                        {
                            type: 1,
                            components: [
                                {
                                    style: 3,
                                    type: 2,
                                    label: "Yes (0)",
                                    emoji: { name: "👍" },
                                    custom_id: `suggest_yes_${message.author.id}_${timestamp}`
                                },
                                {
                                    style: 4,
                                    type: 2,
                                    label: "No (0)",
                                    emoji: { name: "👎" },
                                    custom_id: `suggest_no_${message.author.id}_${timestamp}`
                                }
                            ]
                        }
                    ]
                }]
            };

            const sentMessage = await message.channel.send(suggestionPayload);

            const thread = await sentMessage.startThread({
                name: `Suggestion Discussion`,
                autoArchiveDuration: 1440,
                reason: 'Suggestion discussion thread'
            });

            const threadPayload = {
                flags: MessageFlags.IsComponentsV2,
                components: [{
                    type: 17,
                    components: [
                        {
                            type: 10,
                            content: "Anda dapat berdiskusi di sini tentang saran tersebut."
                        }
                    ]
                }]
            };

            await thread.send(threadPayload);

            // Simpan data vote ke MongoDB (empty object)
            await saveVotes(sentMessage.id, {});

            console.log(`✅ Suggestion created with thread "Suggestion Discussion"`);

        } catch (error) {
            console.error('❌ Error handling suggestion:', error);
        }
    },

    async handleSuggestionButtons(interaction) {
        if (!interaction.isButton()) return false;
        
        const { customId, message } = interaction;
        if (!customId.startsWith('suggest_')) return false;
        
        try {
            const parts = customId.split('_');
            const action = parts[1]; // 'yes' atau 'no'
            const authorId = parts[2];
            const timestamp = parts[3];
            
            if (action === 'yes' || action === 'no') {
                // Ambil data vote dari MongoDB
                const votes = await getVotes(message.id);
                
                const userId = interaction.user.id;
                const currentVote = votes[userId]; // 'yes', 'no', atau undefined

                let yesCount = 0;
                let noCount = 0;

                // Hitung ulang total vote
                for (const [uid, vote] of Object.entries(votes)) {
                    if (vote === 'yes') yesCount++;
                    else if (vote === 'no') noCount++;
                }

                // Logika toggle vote
                if (currentVote === action) {
                    // Double click = hapus vote
                    delete votes[userId];
                    if (action === 'yes') yesCount--;
                    else noCount--;
                } else if (currentVote === undefined) {
                    // Belum vote, tambah vote baru
                    votes[userId] = action;
                    if (action === 'yes') yesCount++;
                    else noCount++;
                } else {
                    // Ganti vote (yes ↔ no)
                    votes[userId] = action;
                    if (action === 'yes') {
                        yesCount++;
                        noCount--;
                    } else {
                        noCount++;
                        yesCount--;
                    }
                }

                // Simpan ke MongoDB
                await saveVotes(message.id, votes);

                // Components V2 structure: message.components[0] adalah Container
                // Container memiliki property components (bukan .components[0].components)
                const container = message.components[0];
                
                // Build new components array - preserve all original components except the button row
                const newContainerComponents = [
                    container.components[0], // Header Section
                    container.components[1], // Separator
                    container.components[2], // Catatan Section  
                    container.components[3], // Separator
                    {
                        type: 1,
                        components: [
                            {
                                type: 2,
                                style: 3,
                                label: `Yes (${yesCount})`,
                                emoji: { name: "👍" },
                                custom_id: `suggest_yes_${authorId}_${timestamp}`
                            },
                            {
                                type: 2,
                                style: 4,
                                label: `No (${noCount})`,
                                emoji: { name: "👎" },
                                custom_id: `suggest_no_${authorId}_${timestamp}`
                            }
                        ]
                    }
                ];

                const newComponents = [{
                    type: 17,
                    components: newContainerComponents
                }];

                await message.edit({ 
                    components: newComponents,
                    flags: MessageFlags.IsComponentsV2
                });
                
                await interaction.deferUpdate().catch(() => {});
                return true;
            }

        } catch (error) {
            console.error('❌ Error handling suggestion button:', error);
            await interaction.deferUpdate().catch(() => {});
        }
        
        return true;
    },
    
    // Cleanup function untuk disconnect MongoDB saat bot shutdown
    async disconnect() {
        if (client) {
            await client.close();
            console.log('👋 MongoDB disconnected');
        }
    }
};
