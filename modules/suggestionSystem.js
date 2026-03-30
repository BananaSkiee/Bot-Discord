// modules/suggestionSystem.js
const { MessageFlags } = require('discord.js');
const fs = require('fs');
const path = require('path');

const SUGGESTION_CHANNEL_ID = '1430584708974252102';

// File untuk menyimpan data vote secara persisten
const VOTES_FILE_PATH = path.join(__dirname, '..', 'data', 'suggestionVotes.json');

// Map untuk menyimpan data vote di memory
let suggestionVotes = new Map();

// Fungsi untuk memastikan folder data ada
function ensureDataDir() {
    const dataDir = path.dirname(VOTES_FILE_PATH);
    if (!fs.existsSync(dataDir)) {
        fs.mkdirSync(dataDir, { recursive: true });
    }
}

// Fungsi untuk load data dari file JSON
function loadVotesData() {
    try {
        ensureDataDir();
        if (fs.existsSync(VOTES_FILE_PATH)) {
            const data = fs.readFileSync(VOTES_FILE_PATH, 'utf8');
            const parsed = JSON.parse(data);
            
            // Convert object ke Map
            suggestionVotes = new Map();
            for (const [messageId, votes] of Object.entries(parsed)) {
                suggestionVotes.set(messageId, new Map(Object.entries(votes)));
            }
            console.log('✅ Vote data loaded from file');
        } else {
            suggestionVotes = new Map();
            console.log('📝 No existing vote data, starting fresh');
        }
    } catch (error) {
        console.error('❌ Error loading vote data:', error);
        suggestionVotes = new Map();
    }
}

// Fungsi untuk save data ke file JSON
function saveVotesData() {
    try {
        ensureDataDir();
        
        // Convert Map ke object untuk JSON
        const dataToSave = {};
        for (const [messageId, votes] of suggestionVotes) {
            dataToSave[messageId] = Object.fromEntries(votes);
        }
        
        fs.writeFileSync(VOTES_FILE_PATH, JSON.stringify(dataToSave, null, 2), 'utf8');
        console.log('💾 Vote data saved to file');
    } catch (error) {
        console.error('❌ Error saving vote data:', error);
    }
}

// Load data saat module di-load
loadVotesData();

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

            // Simpan data vote: Map<userId, 'yes' | 'no'>
            suggestionVotes.set(sentMessage.id, new Map());
            
            // Simpan ke file langsung
            saveVotesData();

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
                // Ambil atau buat vote data
                let userVotes = suggestionVotes.get(message.id);
                if (!userVotes) {
                    userVotes = new Map();
                    suggestionVotes.set(message.id, userVotes);
                }

                const userId = interaction.user.id;
                const currentVote = userVotes.get(userId); // 'yes', 'no', atau undefined

                let yesCount = 0;
                let noCount = 0;

                // Hitung ulang total vote
                for (const [uid, vote] of userVotes) {
                    if (vote === 'yes') yesCount++;
                    else if (vote === 'no') noCount++;
                }

                // Logika toggle vote
                if (currentVote === action) {
                    // Double click = hapus vote
                    userVotes.delete(userId);
                    if (action === 'yes') yesCount--;
                    else noCount--;
                } else if (currentVote === undefined) {
                    // Belum vote, tambah vote baru
                    userVotes.set(userId, action);
                    if (action === 'yes') yesCount++;
                    else noCount++;
                } else {
                    // Ganti vote (yes ↔ no)
                    userVotes.set(userId, action);
                    if (action === 'yes') {
                        yesCount++;
                        noCount--;
                    } else {
                        noCount++;
                        yesCount--;
                    }
                }

                // Simpan ke file setiap kali ada perubahan vote
                saveVotesData();

                // Build new components array
                const newComponents = [{
                    type: 17,
                    components: [
                        message.components[0].components[0], // Header
                        message.components[0].components[1], // Separator
                        message.components[0].components[2], // Catatan
                        message.components[0].components[3], // Separator
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
    }
};
