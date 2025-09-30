const fs = require("fs");
const path = require("path");

const CHANNEL_ID = "1355219286502932802"; // ID count channel kamu
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

  const data = JSON.parse(fs.readFileSync(FILE_PATH));

  // Kalau bukan angka → hapus langsung
  if (!isNumber) {
    await message.delete().catch(() => {});
    console.log(`❌ Bukan angka, dihapus: "${content}" oleh ${message.author.tag}`);
    return;
  }

  // Cek angka harus urut dan bukan dari user yang sama
  if (count === data.lastCount + 1 && message.author.id !== data.lastUserId) {
    // Valid ✅
    data.lastCount = count;
    data.lastUserId = message.author.id;
    fs.writeFileSync(FILE_PATH, JSON.stringify(data, null, 2));
    console.log(`✅ Valid count: ${count} oleh ${message.author.tag}`);
  } else {
    // Salah urutan atau spam dari user sama
    await message.delete().catch(() => {});
    await message.channel.send({
      content: `❌ <@${message.author.id}> angka harus **${data.lastCount + 1}** dan bukan dari orang yang sama!`,
    }).then((msg) => {
      setTimeout(() => msg.delete().catch(() => {}), 5000);
    });
    console.log(`⛔ Salah urutan: ${count} oleh ${message.author.tag}`);
  }
};
