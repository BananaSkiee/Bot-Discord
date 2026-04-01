const { Events, PermissionFlagsBits } = require('discord.js');

const ALLOWED_CHANNEL_ID = '1488537737488371772';
const ALLOWED_USER_ID = '1346964077309595658';

// Mapping karakter ke small caps Unicode
const smallCapsMap = {
  'a': 'ᴀ', 'b': 'ʙ', 'c': 'ᴄ', 'd': 'ᴅ', 'e': 'ᴇ', 'f': 'ꜰ', 'g': 'ɢ', 'h': 'ʜ',
  'i': 'ɪ', 'j': 'ᴊ', 'k': 'ᴋ', 'l': 'ʟ', 'm': 'ᴍ', 'n': 'ɴ', 'o': 'ᴏ', 'p': 'ᴘ',
  'q': 'ǫ', 'r': 'ʀ', 's': 's', 't': 'ᴛ', 'u': 'ᴜ', 'v': 'ᴠ', 'w': 'ᴡ', 'x': 'x',
  'y': 'ʏ', 'z': 'ᴢ', ' ': ' '
};

function toSmallCaps(text) {
  return text.toLowerCase()
    .split('')
    .map(char => smallCapsMap[char] || char)
    .join('');
}

// Payload generator untuk Component V2
function createGeneratorPayload(prefix, channelName) {
  const smallChannel = toSmallCaps(channelName);
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
    flags: 32768,
    components: [
      {
        type: 17,
        components: [
          {
            type: 10,
            content: content
          }
        ]
      }
    ]
  };
}

// Payload untuk Rename Success
function createRenamePayload(type, id, before, after, emoji) {
  const titles = {
    channel: 'Rename Channls',
    category: 'Rename Catagory',
    role: 'Rename Role'
  };
  
  const mentions = {
    channel: `<#${id}>`,
    category: `<#${id}>`,
    role: `<@&${id}>`
  };

  return {
    flags: 32768,
    components: [
      {
        type: 17,
        components: [
          {
            type: 10,
            content: `## <:1_:1486297322848653425><:00:1360567203325542431>${titles[type]}`
          },
          {
            type: 14
          },
          {
            type: 10,
            content: `**• ${titles[type]} ${mentions[type]} Berhasil**\n> Before: ${before}\n> After: ${after}`
          },
          {
            type: 14
          },
          {
            type: 10,
            content: `-# © EmpireBS - ${titles[type]}`
          }
        ]
      }
    ]
  };
}

// Payload untuk Help
function createHelpPayload() {
  return {
    flags: 32768,
    components: [
      {
        type: 17,
        components: [
          {
            type: 10,
            content: `## <:00:1360567203325542431> Generator Commands Help`
          },
          {
            type: 14
          },
          {
            type: 10,
            content: `**Name Generator:**
> \`yes!<prefix> <name>\` - Generate dengan prefix (contoh: \`yes!100 Verify Hosting\`)
> \`no!<name>\` - Generate tanpa prefix (contoh: \`no!Verify Hosting\`)

**Management Commands:**
> \`!rc <channel_id> <new_name>\` - Rename Channel
> \`!rg <category_id> <new_name>\` - Rename Category  
> \`!rr <role_id> <new_name>\` - Rename Role

**Info:**
> \`+help\` - Menampilkan pesan ini`
          },
          {
            type: 14
          },
          {
            type: 10,
            content: `-# © EmpireBS - Generator System`
          }
        ]
      }
    ]
  };
}

// Check permission
function hasPermission(message) {
  return message.author.id === ALLOWED_USER_ID && message.channel.id === ALLOWED_CHANNEL_ID;
}

module.exports = {
  name: Events.MessageCreate,
  async execute(message) {
    // Cek channel ID untuk semua command
    if (message.channel.id !== ALLOWED_CHANNEL_ID) return;
    if (message.author.bot) return;

    const content = message.content;
    const args = content.trim().split(/\s+/);

    // Command +help (bisa dipakai semua orang di channel tersebut)
    if (content === '+help') {
      const payload = createHelpPayload();
      await message.channel.send(payload);
      return;
    }

    // Command berikut hanya untuk user ID tertentu
    if (!hasPermission(message)) return;

    // Command !rc (Rename Channel)
    if (content.toLowerCase().startsWith('!rc ')) {
      if (args.length < 3) {
        return message.reply('❌ Format: `!rc <channel_id> <nama_baru>`');
      }
      
      const channelId = args[1];
      const newName = args.slice(2).join(' ');
      
      try {
        const channel = await message.guild.channels.fetch(channelId);
        if (!channel) return message.reply('❌ Channel tidak ditemukan!');
        
        const oldName = channel.name;
        await channel.setName(newName);
        
        const payload = createRenamePayload('channel', channelId, `\`${oldName}\``, `\`${newName}\``);
        await message.channel.send(payload);
      } catch (error) {
        message.reply(`❌ Error: ${error.message}`);
      }
      return;
    }

    // Command !rg (Rename Category)
    if (content.toLowerCase().startsWith('!rg ')) {
      if (args.length < 3) {
        return message.reply('❌ Format: `!rg <category_id> <nama_baru>`');
      }
      
      const categoryId = args[1];
      const newName = args.slice(2).join(' ');
      
      try {
        const category = await message.guild.channels.fetch(categoryId);
        if (!category || category.type !== 4) return message.reply('❌ Category tidak ditemukan!');
        
        const oldName = category.name;
        await category.setName(newName);
        
        const payload = createRenamePayload('category', categoryId, `\`${oldName}\``, `\`${newName}\``);
        await message.channel.send(payload);
      } catch (error) {
        message.reply(`❌ Error: ${error.message}`);
      }
      return;
    }

    // Command !rr (Rename Role)
    if (content.toLowerCase().startsWith('!rr ')) {
      if (args.length < 3) {
        return message.reply('❌ Format: `!rr <role_id> <nama_baru>`');
      }
      
      const roleId = args[1];
      const newName = args.slice(2).join(' ');
      
      try {
        const role = await message.guild.roles.fetch(roleId);
        if (!role) return message.reply('❌ Role tidak ditemukan!');
        
        const oldName = role.name;
        await role.setName(newName);
        
        const payload = createRenamePayload('role', roleId, `\`${oldName}\``, `\`${newName}\``);
        await message.channel.send(payload);
      } catch (error) {
        message.reply(`❌ Error: ${error.message}`);
      }
      return;
    }

    // Command yes! (dengan prefix)
    if (content.startsWith('yes!')) {
      const argsText = content.slice(4).trim();
      const spaceIndex = argsText.indexOf(' ');
      
      if (spaceIndex === -1) return;
      
      const prefix = argsText.substring(0, spaceIndex);
      const channelName = argsText.substring(spaceIndex + 1).trim();
      
      if (!channelName) return;

      const payload = createGeneratorPayload(prefix, channelName);
      await message.channel.send(payload);
      return;
    }
    
    // Command no! (tanpa prefix)
    if (content.startsWith('no!')) {
      const channelName = content.slice(3).trim();
      
      if (!channelName) return;
      
      const payload = createGeneratorPayload('', channelName);
      await message.channel.send(payload);
      return;
    }
  }
};
