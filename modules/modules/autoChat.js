// SINTAKS YANG BENAR UNTUK GOOGLE GEMINI
const { GoogleGenerativeAI } = require("@google/generative-ai");

// Inisialisasi Gemini dengan API Key dari Environment Variables
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// Ganti dengan ID channel kamu yang benar
const AI_CHANNEL_ID = "1394478754297811034";

module.exports = async (message) => {
  // Jangan proses pesan dari bot lain atau dari channel yang salah
  if (message.author.bot || message.channel.id !== AI_CHANNEL_ID) return;

  try {
    // Kirim status "sedang mengetik..."
    await message.channel.sendTyping();

    // --- PERUBAHAN DI SINI ---
    // Pilih model Gemini terbaru yang direkomendasikan.
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-pro-latest" });

    // Ambil konten pesan dari user
    const prompt = message.content;

    // Panggil API Gemini untuk menghasilkan konten
    const result = await model.generateContent(prompt);
    const response = await result.response;
    
    // Ambil teks balasan dari Gemini
    const reply = response.text();

    if (reply) {
      // Balas pesan user
      await message.reply(reply);
    } else {
      // Jika Gemini tidak memberikan balasan
      await message.reply("Maaf, saya tidak bisa memikirkan balasan saat ini.");
    }

  } catch (error) {
    // Tangani error dari API Gemini
    console.error("❌ Gemini AI error:", error);
    await message.reply("⚠️ Maaf, terjadi kesalahan saat saya mencoba berpikir. Coba lagi nanti.");
  }
};
