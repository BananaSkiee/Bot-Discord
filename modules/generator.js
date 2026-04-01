const { Events } = require('discord.js');

const ALLOWED_CHANNEL_ID = '1488537737488371772';

// Mapping karakter ke small caps Unicode
const smallCapsMap = {
  'a': 'ᴀ', 'b': 'ʙ', 'c': 'ᴄ', 'd': 'ᴅ', 'e': 'ᴇ', 'f': 'ꜰ', 'g': 'ɢ', 'h': 'ʜ',
  'i': 'ɪ', 'j': 'ᴊ', 'k': 'ᴋ', 'l': 'ʟ', 'm': 'ᴍ', 'n': 'ɴ', 'o': 'ᴏ', 'p': 'ᴘ',
  'q': 'ǫ', 'r': 'ʀ', 's': 's', 't': 'ᴛ', 'u': 'ᴜ', 'v': 'ᴠ', 'w': 'ᴡ', 'x': 'x',
  'y': 'ʏ', 'z': 'ᴢ', ' ': ' '
};

// Fungsi convert ke small caps (tanpa huruf besar)
function toSmallCaps(text) {
  return text.toLowerCase()
    .split('')
    .map(char => smallCapsMap[char] || char)
    .join('');
}

// Fungsi buat payload component v2
function createPayload(prefix, channelName) {
  const smallChannel = toSmallCaps(channelName);
  
  // Prefix untuk bracket (kosong kalo no!, isi kalo yes!)
  const bracketContent = prefix || '';

  const content = `### Create Name Channels Generator | for +help
**Channles :**
> **Dashboard:** \`˚⊹\` <:00:1360567203325542431> **Announce:.\`**˚₊**

> \`「${bracketContent}」${smallChannel}\`

**Role :**
>  \`『${bracketContent}』${smallChannel}\`

> \`${smallChannel}\`

**Catagory :**
> \`╭━━━・${channelName}\`

> \`|━━━・${channelName}\`

> \`╰━━━・${channelName}\``;

  return {
    flags: 32768, // IS_COMPONENTS_V2
    components: [
      {
        type: 17, // Container
        components: [
          {
            type: 10, // Text
            content: content
          }
        ]
      }
    ]
  };
}

module.exports = {
  name: Events.MessageCreate,
  execute(message) {
    // Cek channel ID
    if (message.channel.id !== ALLOWED_CHANNEL_ID) return;
    
    // Ignore bot
    if (message.author.bot) return;

    const content = message.content;

    // Handler untuk yes! (dengan prefix di bracket)
    if (content.startsWith('yes!')) {
      const args = content.slice(4).trim();
      const spaceIndex = args.indexOf(' ');
      
      // Harus ada prefix dan nama channel
      if (spaceIndex === -1) return;
      
      const prefix = args.substring(0, spaceIndex);
      const channelName = args.substring(spaceIndex + 1).trim();
      
      if (!channelName) return;

      // Prefix asli (BS, 100, ❤️) tanpa diubah, cuma nama channel jadi small caps
      const payload = createPayload(prefix, channelName);
      message.channel.send(payload);
    }
    
    // Handler untuk no! (bracket kosong)
    else if (content.startsWith('no!')) {
      const channelName = content.slice(3).trim();
      
      if (!channelName) return;
      
      // Prefix kosong untuk bracket 「」dan 『』
      const payload = createPayload('', channelName);
      message.channel.send(payload);
    }
  }
};
