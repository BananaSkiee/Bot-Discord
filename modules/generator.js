const { Client, GatewayIntentBits } = require('discord.js');

function toSmallCaps(text) {
    const map = {
        'a': 'ᴀ', 'b': 'ʙ', 'c': 'ᴄ', 'd': 'ᴅ', 'e': 'ᴇ', 'f': 'ғ', 'g': 'ɢ', 'h': 'ʜ',
        'i': 'ɪ', 'j': 'ᴊ', 'k': 'ᴋ', 'l': 'ʟ', 'm': 'ᴍ', 'n': 'ɴ', 'o': 'ᴏ', 'p': 'ᴘ',
        'q': 'ǫ', 'r': 'ʀ', 's': 's', 't': 'ᴛ', 'u': 'ᴜ', 'v': 'ᴠ', 'w': 'ᴡ', 'x': 'x',
        'y': 'ʏ', 'z': 'ᴢ'
    };
    return text.toLowerCase().split('').map(char => map[char] || char).join('');
}

// Fungsi agar Category Font Normal & Huruf Besar di Awal
function toCategoryFormat(text) {
    return text.split(' ')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
        .join(' ');
}

module.exports = {
    async execute(message) {
        // LOCK CHANNEL ID
        if (message.channel.id !== '1488537737488371772') return;
        if (message.author.bot) return;

        let prefixTag = "";
        let rawContent = "";

        if (message.content.startsWith('yes!')) {
            const input = message.content.slice(4).trim();
            const spaceIndex = input.indexOf(' ');
            if (spaceIndex === -1) return; // Jika cuma yes!100 tanpa teks

            prefixTag = input.substring(0, spaceIndex); // Ambil 100, ❤️, atau BS
            rawContent = input.substring(spaceIndex + 1); // Ambil "Verify hosting"
        } 
        else if (message.content.startsWith('no!')) {
            prefixTag = ""; // Kosongkan kurungan
            rawContent = message.content.slice(3).trim();
        } 
        else return;

        const smallText = toSmallCaps(rawContent);
        const categoryText = toCategoryFormat(rawContent);

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

        await message.channel.send({
            flags: 32768,
            content: responseContent
        });
    }
};
