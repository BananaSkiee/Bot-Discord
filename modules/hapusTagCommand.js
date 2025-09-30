const fs = require("fs");
const path = require("path");
const {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
} = require("discord.js");
const { ROLES } = require("../config");

const filePath = path.join(__dirname, "../data/taggedUsers.json");

module.exports = async function handleHapusTag(message) {
  const contentRaw = message.content.trim();
  const args = contentRaw.split(/\s+/);
  const user = message.mentions.users.first();
  const inputTagRaw = args.slice(2).join(" ").trim();
  const inputTag = inputTagRaw.toUpperCase().replace(/[\[\]]/g, "");

  if (!user || !inputTag) {
    return message.reply("❌ Format salah. Contoh: `!hapustag @user MOD`");
  }

  const matchedRole = ROLES.find(r =>
    r.tag.replace(/[\[\]]/g, "").toUpperCase() === inputTag
  );

  if (!matchedRole) {
    return message.reply("❌ Tag tidak valid.");
  }

  const member = await message.guild.members.fetch(user.id).catch(() => null);
  if (!member) {
    return message.reply("❌ Gagal mengambil member.");
  }

  if (!member.roles.cache.has(matchedRole.id)) {
    return message.reply(`❌ User tidak memiliki tag ${matchedRole.tag}.`);
  }

  await member.setNickname(null).catch(console.error);
  await member.roles.remove(matchedRole.id).catch(console.error);

  // Update JSON
  let taggedUsers = {};
  if (fs.existsSync(filePath)) {
    taggedUsers = JSON.parse(fs.readFileSync(filePath));
  }
  taggedUsers[user.id] = false;
  fs.writeFileSync(filePath, JSON.stringify(taggedUsers, null, 2));

  const displayName = user.globalName ?? user.username;
  const realTag = matchedRole.tag;

  const nextRole = ROLES.find(r => member.roles.cache.has(r.id));
  const row = nextRole
    ? new ActionRowBuilder().addComponents(
        new ButtonBuilder()
          .setCustomId(`test_use_tag_${nextRole.id}_${nextRole.tag.replace(/[^\w-]/g, "").toLowerCase()}`)
          .setLabel(`✅ Pakai Tag ${nextRole.tag}`)
          .setStyle(ButtonStyle.Success),
        new ButtonBuilder()
          .setCustomId(`test_remove_tag_${nextRole.id}_${nextRole.tag.replace(/[^\w-]/g, "").toLowerCase()}`)
          .setLabel(`❌ Jangan Pakai Tag`)
          .setStyle(ButtonStyle.Secondary)
      )
    : null;

  try {
    await user.send({
      content: `✨ Mohon maaf, ${displayName}.

Kamu tidak memiliki tag ${realTag} lagi.
Tag tersebut telah dihapus oleh owner. 🙏

─────────────────────────────
Silakan pilih di bawah ini 👇`,
      components: row ? [row] : []
    });

    await message.reply(`✅ Tag ${realTag} berhasil dihapus dari ${displayName}`);
  } catch (err) {
    console.error("❌ Gagal kirim DM:", err);
    return message.reply("⚠️ Tag dihapus, tapi DM gagal dikirim.");
  }
};
