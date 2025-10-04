// modules/countValidator.js
const fs = require("fs");
const path = require("path");
const { EmbedBuilder } = require("discord.js");

const CHANNEL_ID = "1355219286502932802"; // ID channel counter
const FILE_PATH = path.join(__dirname, "../data/countData.json");

if (!fs.existsSync("./data")) fs.mkdirSync("./data");
if (!fs.existsSync(FILE_PATH)) {
  fs.writeFileSync(FILE_PATH, JSON.stringify({ lastCount: 122, lastUserId: null }, null, 2));
}

module.exports = async (message) => {
  if (message.channel.id !== CHANNEL_ID) return;
  if (message.author.bot) return;

  const content = message.content.trim();
  const count = parseInt(content);
  const isNumber = !isNaN(count);

  const data = JSON.parse(fs.readFileSync(FILE_PATH, "utf8"));

  // ❌ Kalau bukan angka
  if (!isNumber) {
    await message.delete().catch(() => {});
    await sendWarning(message, `Hanya angka yang boleh dikirim!`, "Gunakan urutan yang benar.");
    return;
  }

  // ✅ Cek urutan & user
  if (count === data.lastCount + 1 && message.author.id !== data.lastUserId) {
    data.lastCount = count;
    data.lastUserId = message.author.id;
    fs.writeFileSync(FILE_PATH, JSON.stringify(data, null, 2));
  } else {
    await message.delete().catch(() => {});
    await sendWarning(
      message,
      `Angka salah! Seharusnya **${data.lastCount + 1}**.`,
      "Tidak boleh dua kali berturut-turut oleh user yang sama."
    );
  }
};

async function sendWarning(message, title, desc) {
  const embed = new EmbedBuilder()
    .setColor("#ff4d4d")
    .setTitle(`⚠️ ${title}`)
    .setDescription(desc)
    .setFooter({ text: "Counter System", iconURL: message.guild.iconURL({ dynamic: true }) })
    .setTimestamp();

  const warnMsg = await message.channel.send({ content: `<@${message.author.id}>`, embeds: [embed] });
  setTimeout(() => warnMsg.delete().catch(() => {}), 5000);
}
