//modules/generator.js
/**
 * Create Name Channels Generator Module
 * Spesifikasi: Small Caps, Professional Alignment, Category Normal Font
 */

function toSmallCaps(text) {
    const map = {
        'a': 'ᴀ', 'b': 'ʙ', 'c': 'ᴄ', 'd': 'ᴅ', 'e': 'ᴇ', 'f': 'ғ', 'g': 'ɢ', 'h': 'ʜ',
        'i': 'ɪ', 'j': 'ᴊ', 'k': 'ᴋ', 'l': 'ʟ', 'm': 'ᴍ', 'n': 'ɴ', 'o': 'ᴏ', 'p': 'ᴘ',
        'q': 'ǫ', 'r': 'ʀ', 's': 's', 't': 'ᴛ', 'u': 'ᴜ', 'v': 'ᴠ', 'w': 'ᴡ', 'x': 'x',
        'y': 'ʏ', 'z': 'ᴢ'
    };
    return text.toLowerCase().split('').map(char => map[char] || char).join('');
}

function toCategoryFormat(text) {
    // Font normal, Huruf Besar di awal kata
    return text.split(' ')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
        .join(' ');
}

module.exports = {
    async execute(message) {
        // LOCK CHANNEL ID (Wajib di channel ini)
        if (message.channel.id !== '1488537737488371772') return;
        if (message.author.bot) return;

        let prefixTag = "";
        let rawContent = "";

        if (message.content.startsWith('yes!')) {
            const input = message.content.slice(4).trim();
            const spaceIndex = input.indexOf(' ');
            
            if (spaceIndex === -1) {
                // Jika cuma yes!❤️ tanpa teks tambahan
                prefixTag = input;
                rawContent = ""; 
            } else {
                prefixTag = input.substring(0, spaceIndex); // Ambil emoji/angka/huruf
                rawContent = input.substring(spaceIndex + 1); // Ambil sisanya
            }
        } 
        else if (message.content.startsWith('no!')) {
            prefixTag = ""; // Kosongkan kurungan
            rawContent = message.content.slice(3).trim();
        } 
        else {
            return; // Bukan command yes! atau no!
        }

        const smallText = toSmallCaps(rawContent);
        const categoryText = toCategoryFormat(rawContent);

        // Template Output High-End & Simetris
        const responseContent = `### Create Name Channels Generator | for +help
**Channles :**
> **Dashboard:** \`˚⊹\` <:00:1360567203325542431> **Announce:.**\`˚₊\`

> \`「${prefixTag}」${smallText}\`

**Role :**
>  \`『${prefixTag}』${smallText}\`

> \`${smallText}\`

**Catagory :**
> \`╭━━━・${categoryText}\`

> \`|━━━・${categoryText}\`

> \`╰━━━・${categoryText}\`
`;

        try {
            await message.channel.send({
                // Menggunakan flags 32768 (Ephemeral-style feel atau bypass filter tertentu jika ada)
                flags: 32768,
                content: responseContent
            });
        } catch (err) {
            console.error("❌ Generator Error:", err);
        }
    }
};
