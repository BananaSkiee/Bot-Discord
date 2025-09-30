// modules/memeCommand.js
const { EmbedBuilder } = require("discord.js");
const axios = require("axios");

module.exports = {
  name: "meme",
  description: "Mengirim meme acak dari Reddit",
  async execute(message) {
    try {
      const res = await axios.get("https://meme-api.com/gimme/memeIndonesia");
      const meme = res.data;

      const embed = new EmbedBuilder()
        .setTitle(meme.title)
        .setImage(meme.url)
        .setURL(meme.postLink)
        .setFooter({ text: `Dari subreddit: ${meme.subreddit}` })
        .setColor("Random");

      await message.channel.send({ embeds: [embed] });
    } catch (err) {
      console.error("Gagal ambil meme:", err);
      message.channel.send("❌ Gagal mengambil meme. Coba lagi nanti!");
    }
  },
};
