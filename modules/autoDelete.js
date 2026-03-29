const { Events, ComponentType } = require('discord.js');

// ============================================
// CONFIGURATION
// ============================================

const CONFIG = {
    TARGET_CHANNEL_ID: '1487876267339681813',
    DELETE_DELAY_MS: 60000, // 1 menit
    ALLOWED_CONTENT_TYPES: {
        IMAGE: ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/avif', 'image/bmp', 'image/svg+xml'],
        VIDEO: ['video/mp4', 'video/webm', 'video/quicktime', 'video/x-msvideo'],
        AUDIO: ['audio/mpeg', 'audio/wav', 'audio/ogg', 'audio/aac']
    }
};

// ============================================
// WARNING MESSAGE BUILDER (Component V2)
// ============================================

/**
 * Membuat warning message menggunakan Discord Component V2
 * @param {string} username - Username member yang melanggar
 * @returns {Object} Message payload dengan Component V2
 */
const createWarningMessage = (username) => ({
    flags: 32768, // USE_EMBEDDED_ACTIVITIES (Component V2 flag)
    components: [
        {
            type: ComponentType.Container,
            components: [
                {
                    type: ComponentType.TextDisplay,
                    content: `## <a:merah:1361623714541604894> Warning Do Not Send Messages here`
                },
                {
                    type: ComponentType.Separator
                },
                {
                    type: ComponentType.TextDisplay,
                    content: `**Hey ${username}, tidak boleh kirim pesan di channels <#${CONFIG.TARGET_CHANNEL_ID}>**\n> Kamu hanya boleh kirim gambar, untuk verify`
                },
                {
                    type: ComponentType.Separator
                },
                {
                    type: ComponentType.TextDisplay,
                    content: `-# © EmpireBS - AutoDelete Masaages`
                }
            ]
        }
    ]
});

// ============================================
// UTILITY FUNCTIONS
// ============================================

/**
 * Cek apakah pesan mengandung gambar/attachment visual
 * @param {Message} message - Discord Message object
 * @returns {boolean} True jika pesan mengandung gambar
 */
const hasImageAttachment = (message) => {
    if (!message.attachments || message.attachments.size === 0) return false;
    
    return message.attachments.some(attachment => {
        const contentType = attachment.contentType || '';
        return CONFIG.ALLOWED_CONTENT_TYPES.IMAGE.some(type => 
            contentType.toLowerCase().startsWith(type.split('/')[0] === 'image' ? 'image' : type)
        ) || /\.(jpg|jpeg|png|gif|webp|bmp|svg)$/i.test(attachment.name || '');
    });
};

/**
 * Cek apakah pesan mengandung embed dengan gambar
 * @param {Message} message - Discord Message object
 * @returns {boolean} True jika embed mengandung gambar
 */
const hasImageEmbed = (message) => {
    if (!message.embeds || message.embeds.length === 0) return false;
    
    return message.embeds.some(embed => 
        embed.image?.url || 
        embed.thumbnail?.url ||
        (embed.type === 'image' && embed.url)
    );
};

/**
 * Cek apakah pesan mengandung URL gambar
 * @param {Message} message - Discord Message object
 * @returns {boolean} True jika konten mengandung URL gambar
 */
const hasImageUrl = (message) => {
    if (!message.content) return false;
    
    const imageUrlRegex = /https?:\/\/\S+\.(?:jpg|jpeg|png|gif|webp|bmp|svg)(\?\S*)?/gi;
    const discordCdnRegex = /https:\/\/cdn\.discordapp\.com\/attachments\/\d+\/\d+\/\S+\.(?:jpg|jpeg|png|gif|webp)/gi;
    const mediaDiscordRegex = /https:\/\/media\.discordapp\.net\/attachments\/\d+\/\d+\/\S+\.(?:jpg|jpeg|png|gif|webp)/gi;
    
    return imageUrlRegex.test(message.content) || 
           discordCdnRegex.test(message.content) || 
           mediaDiscordRegex.test(message.content);
};

/**
 * Menentukan apakah pesan adalah gambar saja (tanpa teks berarti)
 * @param {Message} message - Discord Message object
 * @returns {boolean} True jika pesan dianggap "gambar saja"
 */
const isImageOnlyMessage = (message) => {
    const hasAttachmentImage = hasImageAttachment(message);
    const hasEmbedImage = hasImageEmbed(message);
    const hasUrlImage = hasImageUrl(message);
    
    // Jika ada gambar (attachment, embed, atau URL)
    if (hasAttachmentImage || hasEmbedImage || hasUrlImage) {
        // Cek apakah ada teks berarti selain URL
        const contentWithoutUrls = message.content?.replace(/https?:\/\/\S+/g, '').trim() || '';
        const hasMeaningfulText = contentWithoutUrls.length > 0;
        
        // Jika ada gambar dan tidak ada teks berarti → dianggap gambar saja
        return !hasMeaningfulText;
    }
    
    return false;
};

/**
 * Menentukan apakah pesan mengandung teks yang perlu diperingati
 * @param {Message} message - Discord Message object
 * @returns {boolean} True jika pesan mengandung teks (bukan gambar saja)
 */
const hasTextContent = (message) => {
    if (!message.content || message.content.trim().length === 0) return false;
    
    // Hapus URL dari konten untuk cek teks murni
    const contentWithoutUrls = message.content.replace(/https?:\/\/\S+/g, '').trim();
    
    // Cek sticker (dianggap sebagai gambar)
    if (message.stickers && message.stickers.size > 0) return false;
    
    return contentWithoutUrls.length > 0;
};

// ============================================
// MESSAGE HANDLER
// ============================================

/**
 * Handler utama untuk auto-delete messages
 * @param {Message} message - Discord Message object
 * @param {Client} client - Discord Client instance
 */
const handleAutoDelete = async (message, client) => {
    try {
        // Validasi awal
        if (!message || message.channelId !== CONFIG.TARGET_CHANNEL_ID) return;
        if (message.author.id === client.user.id) return; // Jangan proses pesan bot sendiri
        
        const isBot = message.author.bot;
        const isImageOnly = isImageOnlyMessage(message);
        const hasText = hasTextContent(message);
        
        // Log untuk debugging (opsional, bisa dihapus di production)
        console.log(`[AutoDelete] Pesan dari ${isBot ? 'Bot' : 'Human'} | Image Only: ${isImageOnly} | Has Text: ${hasText}`);
        
        // Case 1: Bot mengirim apa pun → Hapus saja (tanpa warning)
        if (isBot) {
            await scheduleDeletion(message, 'Bot message - auto delete');
            return;
        }
        
        // Case 2: Human kirim gambar saja → Hapus saja (tanpa warning)
        if (isImageOnly && !hasText) {
            await scheduleDeletion(message, 'Human image only - auto delete');
            return;
        }
        
        // Case 3: Human kirim teks (dengan atau tanpa gambar) → Warning + Hapus
        if (hasText) {
            await handleTextViolation(message);
            return;
        }
        
        // Default: Hapus semua pesan lain yang lolos filter
        await scheduleDeletion(message, 'Default cleanup');
        
    } catch (error) {
        console.error('[AutoDelete] Error handling message:', error);
    }
};

/**
 * Menghandle pelanggaran pengiriman teks oleh human
 * @param {Message} message - Discord Message object
 */
const handleTextViolation = async (message) => {
    try {
        // Kirim warning message (Component V2)
        const warningPayload = createWarningMessage(message.author.toString());
        const warningMsg = await message.channel.send(warningPayload);
        
        // Hapus pesan pelanggaran setelah delay
        await scheduleDeletion(message, 'Text violation - user message', CONFIG.DELETE_DELAY_MS);
        
        // Hapus warning message juga setelah delay yang sama
        setTimeout(async () => {
            try {
                await warningMsg.delete();
            } catch (err) {
                // Abaikan error jika pesan sudah dihapus
            }
        }, CONFIG.DELETE_DELAY_MS);
        
    } catch (error) {
        console.error('[AutoDelete] Error handling text violation:', error);
    }
};

/**
 * Menjadwalkan penghapusan pesan
 * @param {Message} message - Discord Message object
 * @param {string} reason - Alasan penghapusan (untuk log)
 * @param {number} delay - Delay dalam ms (default: 60 detik)
 */
const scheduleDeletion = async (message, reason, delay = CONFIG.DELETE_DELAY_MS) => {
    try {
        // Gunakan setTimeout untuk delay 1 menit
        setTimeout(async () => {
            try {
                // Fetch ulang pesan untuk cek apakah masih ada
                const fetchedMessage = await message.channel.messages.fetch(message.id).catch(() => null);
                
                if (fetchedMessage) {
                    await fetchedMessage.delete();
                    console.log(`[AutoDelete] Deleted message (${reason}) | User: ${message.author.tag}`);
                }
            } catch (error) {
                // Abaikan error "Unknown Message" (pesan sudah dihapus)
                if (error.code !== 10008) {
                    console.error('[AutoDelete] Error deleting message:', error);
                }
            }
        }, delay);
        
    } catch (error) {
        console.error('[AutoDelete] Error scheduling deletion:', error);
    }
};

// ============================================
// MODULE EXPORT
// ============================================

/**
 * Inisialisasi modul auto-delete
 * @param {Client} client - Discord Client instance
 */
const initAutoDelete = (client) => {
    console.log('[AutoDelete] Module initialized');
    console.log(`[AutoDelete] Target Channel: ${CONFIG.TARGET_CHANNEL_ID}`);
    console.log(`[AutoDelete] Delete Delay: ${CONFIG.DELETE_DELAY_MS / 1000} seconds`);
    
    // Event listener untuk messageCreate
    client.on(Events.MessageCreate, (message) => handleAutoDelete(message, client));
    
    // Event listener untuk messageUpdate (jika pesan diedit)
    client.on(Events.MessageUpdate, async (oldMessage, newMessage) => {
        // Handle edited messages yang mungkin menjadi pelanggaran
        if (newMessage.channelId === CONFIG.TARGET_CHANNEL_ID && !newMessage.author.bot) {
            // Jika pesan diedit dan sekarang mengandung teks
            if (hasTextContent(newMessage)) {
                await handleTextViolation(newMessage);
            }
        }
    });
};

module.exports = {
    initAutoDelete,
    CONFIG,
    // Export fungsi internal untuk testing (opsional)
    utils: {
        hasImageAttachment,
        hasImageEmbed,
        hasImageUrl,
        isImageOnlyMessage,
        hasTextContent
    }
};
