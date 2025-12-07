// modules/memeCommand.js (Mengambil 5 Meme, Mengirim 1 Pilihan Acak)

const { 
    EmbedBuilder, 
    ActionRowBuilder, 
    ButtonBuilder, 
    ButtonStyle 
} = require("discord.js");
const axios = require("axios");

// Mengambil 5 meme dari subreddit Indonesia per panggilan
const MEME_API_URL = "https://meme-api.com/gimme/Indonesia/5"; 

module.exports = {
  name: "meme",
  description: "Mengirim meme acak dari Reddit Indonesia",
  
  async execute(message) { 
    const loadingMessage = await message.reply("⏳ Sedang mencari meme Indonesia (5 hasil diambil)...");

    try {
      const res = await axios.get(MEME_API_URL);
      
      const memeArray = res.data.memes; // Data sekarang ada di array 'memes'

      if (!memeArray || memeArray.length === 0) {
          await loadingMessage.edit("❌ Gagal mendapatkan meme. Coba lagi.");
          return;
      }

      // Pilih satu meme secara acak dari 5 hasil yang didapat
      const randomIndex = Math.floor(Math.random() * memeArray.length);
      const meme = memeArray[randomIndex];
      
      // Periksa validitas meme yang dipilih
      if (!meme || !meme.url) {
          await loadingMessage.edit("❌ Gagal memilih meme yang valid.");
          return;
      }
      
      // --- IMPLEMENTASI EMBED & BUTTON (KOMPONEN V2) ---
      
      // 1. Buat Embed Modern
      const embed = new EmbedBuilder()
        .setColor(0xFF8800) // Warna Oranye
        .setTitle(`🇮🇩 ${meme.title}`)
        .setImage(meme.url)
        .setDescription(`Ditemukan di subreddit **r/${meme.subreddit}**`)
        .setTimestamp()
        .setFooter({ text: `Oleh u/${meme.author || 'Anonim'} | Upvotes: ${meme.ups || 0}` });

      // 2. Buat Tombol (Component V2)
      const row = new ActionRowBuilder()
        .addComponents(
          new ButtonBuilder()
            .setLabel('Lihat Postingan Asli')
            .setStyle(ButtonStyle.Link)
            .setURL(meme.postLink),
          
          new ButtonBuilder()
            .setLabel('Subreddit Asal')
            .setStyle(ButtonStyle.Secondary)
            .setURL(`https://reddit.com/r/${meme.subreddit}`)
        );

      // 3. Kirim Pesan: Edit pesan loading menjadi pesan meme
      await loadingMessage.edit({
          content: '🎉 Ini dia meme-nya!',
          embeds: [embed],
          components: [row]
      });

    } catch (err) {
      console.error("❌ Gagal ambil meme:", err.message);
      await loadingMessage.edit(`❌ Gagal mengambil meme. Coba lagi nanti!`);
    }
  },
};
