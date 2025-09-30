// modules/autoMeme.js
const { EmbedBuilder } = require("discord.js");
const axios = require("axios");
const fs = require("fs");
const path = require("path");

const filePath = path.join(__dirname, "../data/usedMemes.json");

module.exports = async function autoSendMeme(channel) {
  try {
    const res = await axios.get("https://meme-api.com/gimme/memeIndonesia");
    const meme = res.data;

    // Baca list meme yang sudah pernah dikirim
    let usedMemes = [];
    if (fs.existsSync(filePath)) {
      usedMemes = JSON.parse(fs.readFileSync(filePath, "utf8"));
    }

    if (usedMemes.includes(meme.url)) {
      console.log("❌ Meme sudah pernah dikirim. Lewat.");
      return; // Jangan kirim meme yang sama
    }

    const embed = new EmbedBuilder()
      .setTitle(meme.title)
      .setImage(meme.url)
      .setURL(meme.postLink)
      .setFooter({ text: `Dari: ${meme.subreddit}` });

    await channel.send({ embeds: [embed] });

    // Simpan URL meme ke daftar yang sudah pernah dikirim
    usedMemes.push(meme.url);
    if (usedMemes.length > 100) usedMemes.shift(); // Biar gak terlalu panjang
    fs.writeFileSync(filePath, JSON.stringify(usedMemes, null, 2));
  } catch (err) {
    console.error("❌ Gagal ambil meme:", err);
  }
};
