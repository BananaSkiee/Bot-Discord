const fs = require("fs");
const path = require("path");
const { ActionRowBuilder, ButtonBuilder, ButtonStyle } = require("discord.js");

const filePath = path.join(__dirname, "../data/taggedUsers.json");
// Load data taggedUsers.json
const taggedUsers = fs.existsSync(filePath)
  ? JSON.parse(fs.readFileSync(filePath, "utf8"))
  : {};

const ROLES = [
  { id: process.env.ROLE_1_ID, tag: "[OWNER]" },
  { id: process.env.ROLE_2_ID, tag: "[ADMIN]" },
  { id: process.env.ROLE_3_ID, tag: "[MOD]" },
  { id: process.env.ROLE_4_ID, tag: "[BOOST]" },
  { id: process.env.ROLE_5_ID, tag: "[CREATOR]" },
  { id: process.env.ROLE_6_ID, tag: "[ALUMNI]" },
  { id: process.env.ROLE_7_ID, tag: "[100]" },
  { id: process.env.ROLE_8_ID, tag: "[80]" },
  { id: process.env.ROLE_9_ID, tag: "[70]" },
  { id: process.env.ROLE_10_ID, tag: "[60]" },
  { id: process.env.ROLE_11_ID, tag: "[55]" },
  { id: process.env.ROLE_12_ID, tag: "[VIP]" },
  { id: process.env.ROLE_13_ID, tag: "[FRIEND]" },
  { id: process.env.ROLE_14_ID, tag: "[PARTNER]" },
  { id: process.env.ROLE_15_ID, tag: "[MEM]" }
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
  name: "guildMemberUpdate",
  async execute(oldMember, newMember) {
    // Cek role yang baru ditambahkan
    const addedRoles = newMember.roles.cache.filter(r => !oldMember.roles.cache.has(r.id));
    console.log("🧪 Added roles:", addedRoles.map(r => `${r.name} (${r.id})`).join(", "));
console.log("📋 ROLES:", ROLES);
    const matchingRole = ROLES.find(r => addedRoles.has(r.id));
    if (!matchingRole) return;
    const highestDisplayRole = newMember.roles.highest;
    const roleDisplay = highestDisplayRole
  ? ROLE_DISPLAY_MAP[highestDisplayRole.id] || "Tanpa Nama"
  : "Tanpa Nama";
    const displayName = newMember.user.globalName ?? newMember.user.username;

const row = new ActionRowBuilder().addComponents(
  new ButtonBuilder()
    .setCustomId("use_tag")
    .setLabel(`Ya, pakai tag ${matchingRole.tag}`)
    .setStyle(ButtonStyle.Success),
  new ButtonBuilder()
    .setCustomId("remove_tag")
    .setLabel("Tidak, tanpa tag")
    .setStyle(ButtonStyle.Secondary)
);

try {
  await newMember.send({
    content: `✨ *Salam hangat, ${displayName}.*

🔰 Kamu menerima tag khusus: \`${matchingRole.tag}\`  
📛 Diberikan karena kamu memiliki role: \`${roleDisplay}\`

Ingin menampilkan tag itu di nickname kamu?  
Contoh: \`${matchingRole.tag} ${displayName}\`

───────────────────────────

Silakan pilih opsi di bawah ini: 👇`,
    components: [row],
  });

  console.log(`✅ DM dikirim ke ${newMember.user.tag}`);
} catch (err) {
  console.error("❌ Gagal mengirim DM:", err.message);   
}
  } // ← ini penutup function `execute`
} // ← ini penutup `module.exports`
