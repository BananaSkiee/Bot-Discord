const fs = require("fs");
const path = require("path");
const { ActionRowBuilder, ButtonBuilder, ButtonStyle, AttachmentBuilder, EmbedBuilder } = require("discord.js");

const countValidator = require("../modules/countValidator");
const handleHapusTag = require("../modules/hapusTagCommand");
const translateHandler = require("../modules/translate");
const memeCommand = require("../modules/memeCommand");
const textCounter = require("../modules/textCounter");
const autoDeleteCrypto = require("../modules/autoDeleteCryptoMessages.js");
const autoReply = require("../modules/autoReply");
const autoChat = require("../modules/autoChat");
const generateWelcomeCard = require("../modules/welcomeCard");
const getRandomQuote = require("../modules/welcomeQuotes"); // sesuaikan path-nya

const filePath = path.join(__dirname, "../data/taggedUsers.json");

const ADMIN_ROLE_ID = "1352279577174605884";

const ROLES = [
  { id: "1352279577174605884", tag: "[OWNER]" },
  { id: "1352282368043389069", tag: "[ADMIN]" },
  { id: "1352282892935368787", tag: "[MOD]" },
  { id: "1358311584681693324", tag: "[BOOST]" },
  { id: "1352285051521601618", tag: "[CREATOR]" },
  { id: "1354161955669147649", tag: "[ALUMNI]" },
  { id: "1354196993680867370", tag: "[100]" },
  { id: "1354197284476420106", tag: "[80]" },
  { id: "1354197417754628176", tag: "[70]" },
  { id: "1354197527582212106", tag: "[60]" },
  { id: "1354197530010976521", tag: "[55]" },
  { id: "1352286232331292814", tag: "[VIP]" },
  { id: "1352286224420962376", tag: "[FRIEND]" },
  { id: "1357693246268244209", tag: "[PARTNER]" },
  { id: "1352286235233620108", tag: "[MEM]" }
];

const ROLE_DISPLAY_MAP = {
  "1352279577174605884": "「 👑 」sᴇʀᴠᴇʀ ᴏᴡɴᴇʀ",
  "1352282368043389069": "「 ❗ 」ᴀᴅᴍɪɴɪsᴛʀᴀᴛᴏʀ",
  "1352282892935368787": "「 ❓ 」ᴍᴏᴅᴇʀᴀᴛᴏʀ",
  "1358311584681693324": "「🚀」ʙᴏᴏsᴛ",
  "1352285051521601618": "「📸」ᴄᴏɴᴛᴇɴᴛ ᴄʀᴇᴀᴛᴏʀ",
  "1354161955669147649": "『 👨‍🎓』ᴀʟᴜᴍɴɪ",
  "1354196993680867370": "「100」ᴘᴇᴇʀʟᴇꜱꜱ",
  "1354197284476420106": "「80」ᴛʀᴀɴꜱᴄᴇɴᴅᴇɴᴛ",
  "1354197417754628176": "「70」ꜱᴜᴘʀᴇᴍᴇ",
  "1354197527582212106": "「60」ʟᴏʀᴅ",
  "1354197530010976521": "「55」ᴇᴍᴘᴇʀᴏʀ",
  "1352286232331292814": "『💜』Sᴘᴇsɪᴀʟ",
  "1352286224420962376": "『💙』ғʀɪᴇɴᴅs",
  "1357693246268244209": "「🤝」ᴘᴀʀᴛɴᴇʀsʜɪᴘ",
  "1352286235233620108": "『〽️』ᴍᴇᴍʙᴇʀ"
};

module.exports = {
  name: "messageCreate",
  async execute(message, client) {
    if (message.author.bot) return;
 // Panggil fungsi-fungsinya saat ada pesan baru
    await countValidator(message);
    await textCounter(message);
    await autoDeleteCrypto(message);
    await autoReply(message);
    await autoChat(message);
    
    const prefix = "!";
    const contentRaw = message.content.trim();
    const contentLower = contentRaw.toLowerCase();

await translateHandler(message);

if (!contentRaw.startsWith(prefix)) return;

const [commandRaw, ...args] = contentRaw.slice(prefix.length).trim().split(/ +/);
const command = commandRaw.toLowerCase();

// Di dalam messageCreate:
if (command === "meme") {
  return memeCommand.execute(message);
}

// GANTI BLOK LAMA !testwelcome DI messageCreate.js ANDA DENGAN INI

if (command === 'testwelcome') { // Menggunakan 'command' dari struktur kode Anda
    if (message.author.bot) return;

    const member = message.member;
    const channel = message.channel; // Tes akan dikirim di channel saat ini

    // --- ID CHANNEL UNTUK TOMBOL ---
    const rulesChannelId   = '1352311290432983182';
    const rolesChannelId   = '1352823970054803509';
    const helpChannelId    = '1352326787367047188';
    // ------------------------------------
    
    try {
        const imageBuffer = await generateWelcomeCard(member);
        const attachment = new AttachmentBuilder(imageBuffer, { name: 'welcome-card.png' });

const { EmbedBuilder } = require('discord.js');

// Fungsi warna acak HEX
function getRandomColor() {
  const letters = '0123456789ABCDEF';
  let color = '#';
  for (let i = 0; i < 6; i++) {
    color += letters[Math.floor(Math.random() * 16)];
  }
  return color;
}

const message = getRandomQuote(member.user.username);

const testEmbed = new EmbedBuilder()
  .setColor(getRandomColor())
  .setTitle(`${message}`)
  .setImage('attachment://welcome-card.png')
  .setFooter({
    text: '© Copyright | BananaSkiee Community',
    iconURL: 'https://i.imgur.com/RGp8pqJ.jpeg',
  })
  .setTimestamp();
      
        const row = new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder()
                    .setLabel('Rules')
                    .setEmoji('📖')
                    .setStyle(ButtonStyle.Link)
                    .setURL(`https://discord.com/channels/${member.guild.id}/${rulesChannelId}`),
                
                new ButtonBuilder()
                    .setLabel('Verified')
                    .setEmoji('✅')
                    .setStyle(ButtonStyle.Link)
                    .setURL(`https://discord.com/channels/${member.guild.id}/${rolesChannelId}`),

                new ButtonBuilder()
                    .setLabel('Bantuan')
                    .setEmoji('❓')
                    .setStyle(ButtonStyle.Link)
                    .setURL(`https://discord.com/channels/${member.guild.id}/${helpChannelId}`)
            );
        
        // Kirim pesan tes ke channel tempat command dijalankan
        await channel.send({ 
  content: `<a:BananaSkiee:1360541400382439475> <a:rflx:1361623860205715589> <a:rflx_e:1361624001939771413> <a:rflx_l:1361624056884887673> <a:rflx_c:1361624260434591855> <a:rflx_o:1361624335126626396> <a:rflx_m:1361624355771256956> <a:rflx_e:1361624001939771413> <a:BananaSkiee:1360541400382439475>
  
Welcome           : <@${member.id}>
To Server          : ${member.guild.name}
Total Members   : ${member.guild.memberCount}`,
  embeds: [testEmbed], 
  files: [attachment], 
  components: [row] 
});

        // Hapus pesan perintah !testwelcome agar channel bersih (opsional)
        if (message.deletable) {
            await message.delete().catch(console.error);
        }

    } catch (error) {
        console.error("ERROR SAAT TES WELCOME MANUAL:", error);
        message.reply('❌ Terjadi kesalahan saat membuat kartu tes.');
    }
    return; // Hentikan eksekusi setelah perintah ini selesai
}
    
// ====== !testdm command ======
if (contentLower.startsWith("!testdm")) {
  const memberAuthor = await message.guild.members.fetch(message.author.id);
  if (!memberAuthor.roles.cache.has(ADMIN_ROLE_ID)) {
    return message.reply("❌ Kamu tidak punya izin pakai command ini.");
  }

    // ========== 2. JOIN VC ==============
    if (contentLower === "!join") {
      const voiceChannel = message.member.voice.channel;
      if (!voiceChannel) return message.reply("❌ Join voice channel dulu.");

      try {
        const { joinVoiceChannel, getVoiceConnection } = require("@discordjs/voice");
        const oldConnection = getVoiceConnection(message.guild.id);
        if (oldConnection) oldConnection.destroy();

        joinVoiceChannel({
          channelId: voiceChannel.id,
          guildId: voiceChannel.guild.id,
          adapterCreator: voiceChannel.guild.voiceAdapterCreator,
          selfDeaf: false,
        });

        return message.reply(`✅ Bot join ke VC **${voiceChannel.name}**`);
      } catch (err) {
        console.error("❌ Gagal join VC:", err);
        return message.reply("❌ Bot gagal join VC. Cek permission.");
      }
    }
  
  const args = contentRaw.split(/\s+/);
  const user = message.mentions.users.first();
  const inputTagRaw = args.slice(2).join(" ").trim();
  const inputTag = inputTagRaw.toUpperCase().replace(/[\[\]]/g, "");

  if (!user || !inputTag) {
    return message.reply("❌ Format salah. Contoh: `!testdm @user MOD`");
  }

  const matchedRole = ROLES.find(r =>
    r.tag.replace(/[\[\]]/g, "").toUpperCase() === inputTag
  );

  if (!matchedRole) {
    return message.reply("❌ Tag tidak valid.");
  }

  const member = await message.guild.members.fetch(user.id);
  const realTag = matchedRole.tag;
  const safeTagId = realTag.replace(/[^\w-]/g, "").toLowerCase();
  const displayName = user.globalName ?? user.username;
  const roleDisplay = ROLE_DISPLAY_MAP[matchedRole.id] || "Tanpa Nama";

  let taggedUsers = {};
  if (fs.existsSync(filePath)) {
    taggedUsers = JSON.parse(fs.readFileSync(filePath));
  }

  if (!taggedUsers[user.id]) {
    taggedUsers[user.id] = {
      originalName: member.displayName,
      usedTags: []
    };
  }

  // ======= LANGSUNG KASIH ROLE =======
  if (!member.roles.cache.has(matchedRole.id)) {
    await member.roles.add(matchedRole.id).catch(console.error);
  }
  // ===================================

  taggedUsers[user.id].usedTags.push(matchedRole.id);
  fs.writeFileSync(filePath, JSON.stringify(taggedUsers, null, 2));

  const row = new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId(`test_use_tag_${matchedRole.id}_${safeTagId}`)
      .setLabel("Ya, pakai tag ${roleTag}")
      .setStyle(ButtonStyle.Success),
    new ButtonBuilder()
      .setCustomId(`test_remove_tag_${matchedRole.id}_${safeTagId}`)
      .setLabel("Tidak, tanpa tag")
      .setStyle(ButtonStyle.Secondary)
  );

  try {
    await user.send({
      content: `✨ *Selamat kepada ${displayName}!*

🔰 Kamu menerima tag khusus: \`${realTag}\`
📛 Diberikan karena kamu memiliki role: \`${roleDisplay}\`

Ingin menampilkan tag itu di nickname kamu?
Contoh: \`${realTag} ${displayName}\`

─────────────────────────────
Pilih salah satu opsi di bawah ini: 👇`,
      components: [row]
    });

    await message.reply(`✅ DM berhasil dikirim ke ${displayName}`);
  } catch (err) {
    console.error("❌ Gagal kirim DM:", err);
    if (err.code === 50007) {
      return message.reply("❌ DM gagal. User matiin DM dari server.");
    }
    return message.reply("❌ Terjadi kesalahan saat kirim DM.");
  }
}

    // ========== 4. HAPUS TAG ============
if (contentLower.startsWith("!hapustag")) {
return handleHapusTag(message);
}
    }
};
