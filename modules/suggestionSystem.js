// modules/suggestionSystem.js
const { MessageFlags } = require('discord.js');
const { MongoClient } = require('mongodb');

const SUGGESTION_CHANNEL_ID = '1430584708974252102';

const MONGO_URI = 'mongodb+srv://AeroX:AeroX@aerox.cgfxn4x.mongodb.net/?retryWrites=true&w=majority&appName=AeroX';
// Database baru - lowercase & deskriptif
const DB_NAME = 'suggestions_akira';
const COLLECTION_NAME = 'votes';

let client = null;
let collection = null;
let isConnecting = false;
let connectionPromise = null;

async function connectDB() {
    if (collection) return;
    if (isConnecting) {
        await connectionPromise;
        return;
    }
    
    isConnecting = true;
    connectionPromise = (async () => {
        try {
            client = new MongoClient(MONGO_URI);
            await client.connect();
            const db = client.db(DB_NAME);
            collection = db.collection(COLLECTION_NAME);
            console.log(`✅ MongoDB connected: ${DB_NAME}.${COLLECTION_NAME}`);
        } catch (error) {
            console.error('❌ MongoDB error:', error);
            throw error;
        } finally {
            isConnecting = false;
        }
    })();
    
    await connectionPromise;
}

async function getVotes(messageId) {
    try {
        await connectDB();
        const doc = await collection.findOne({ _id: messageId });
        return doc ? doc.votes : {};
    } catch (error) {
        console.error('❌ Get votes error:', error);
        return {};
    }
}

async function saveVotes(messageId, votes) {
    try {
        await connectDB();
        await collection.updateOne(
            { _id: messageId },
            { $set: { votes, updatedAt: new Date() } },
            { upsert: true }
        );
    } catch (error) {
        console.error('❌ Save votes error:', error);
        throw error;
    }
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

            await thread.send({
                flags: MessageFlags.IsComponentsV2,
                components: [{
                    type: 17,
                    components: [{ type: 10, content: "Anda dapat berdiskusi di sini tentang saran tersebut." }]
                }]
            });

            await saveVotes(sentMessage.id, {});
            console.log(`✅ Suggestion created: ${sentMessage.id}`);

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
            const action = parts[1];
            const authorId = parts[2];
            const timestamp = parts[3];
            
            if (action !== 'yes' && action !== 'no') return false;
            
            const votes = await getVotes(message.id);
            const userId = interaction.user.id;
            const currentVote = votes[userId];

            let yesCount = 0;
            let noCount = 0;

            for (const vote of Object.values(votes)) {
                if (vote === 'yes') yesCount++;
                else if (vote === 'no') noCount++;
            }

            // Toggle logic
            if (currentVote === action) {
                delete votes[userId];
                action === 'yes' ? yesCount-- : noCount--;
            } else if (!currentVote) {
                votes[userId] = action;
                action === 'yes' ? yesCount++ : noCount++;
            } else {
                votes[userId] = action;
                if (action === 'yes') { yesCount++; noCount--; }
                else { noCount++; yesCount--; }
            }

            await saveVotes(message.id, votes);

            const container = message.components[0];
            if (!container?.components) {
                console.error('❌ Invalid components structure');
                await interaction.deferUpdate().catch(() => {});
                return true;
            }

            const newComponents = [{
                type: 17,
                components: [
                    container.components[0], // Header
                    container.components[1], // Separator
                    container.components[2], // Catatan
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
                ]
            }];

            await message.edit({ components: newComponents, flags: MessageFlags.IsComponentsV2 });
            await interaction.deferUpdate().catch(() => {});
            return true;

        } catch (error) {
            console.error('❌ Error handling button:', error);
            await interaction.deferUpdate().catch(() => {});
            return true;
        }
    },
    
    async disconnect() {
        if (client) {
            await client.close();
            console.log('👋 MongoDB disconnected');
        }
    }
};
