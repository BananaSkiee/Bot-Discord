// modules/autoMeme.js (VERSI UNTUK MEME INDONESIA)

const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require("discord.js");
const axios = require("axios");
const fs = require("fs");
const path = require("path");

const filePath = path.join(__dirname, "../data/usedMemes.json");

// Ganti URL API untuk fokus ke subreddit Indonesia. 
// Gunakan /indonesia atau /indowibu. Saya set ke 5 meme per panggilan untuk keamanan.
const MEME_API_URL = "https://meme-api.com/gimme/Indonesia/5"; 

module.exports = async function autoSendMeme(channel) {
  try {
    const res = await axios.get(MEME_API_URL);
    // Kita tetap menggunakan array meme, meski mungkin hanya ada 1 hasilnya
    const memeArray = res.data.memes;

    if (!memeArray || memeArray.length === 0) {
         console.log("❌ Gagal mendapatkan meme dari Subreddit Indonesia.");
         // Fallback ke meme umum jika subreddit spesifik gagal? (Opsional)
         return;
    }

    // Ambil hanya meme pertama dari array (jika kita mau kirim satu per satu setiap 3 jam)
    const meme = memeArray[0];

    // --- Pengecekan Meme yang Sudah Digunakan ---
    let usedMemes = [];
    if (fs.existsSync(filePath)) {
      usedMemes = JSON.parse(fs.readFileSync(filePath, "utf8"));
    }

    if (usedMemes.includes(meme.url)) {
      console.log("❌ Meme sudah pernah dikirim. Lewat.");
      return; 
    }
    // --------------------------------------------

    // --- IMPLEMENTASI EMBED & BUTTON (KOMPONEN V2) ---
    
    // 1. Buat Embed Modern
    const embed = new EmbedBuilder()
      .setColor(0xFFA500) // Warna Oranye
      .setTitle(`🇮🇩 Meme Baru: ${meme.title}`)
      .setImage(meme.url)
      .setDescription(`Ditemukan di subreddit **r/${meme.subreddit}**`)
      .setTimestamp()
      .setFooter({ text: `Oleh u/${meme.author} | Upvotes: ${meme.ups}` });

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

    // 3. Kirim Pesan
    await channel.send({ 
        embeds: [embed],
        components: [row]
    });

    // --- Simpan URL Meme yang Sudah Digunakan ---
    usedMemes.push(meme.url);
    if (usedMemes.length > 100) usedMemes.shift(); 
    fs.writeFileSync(filePath, JSON.stringify(usedMemes, null, 2));

  } catch (err) {
    console.error(`❌ Gagal ambil meme dari ${MEME_API_URL}:`, err.message);
  }
};
