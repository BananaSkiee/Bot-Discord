const { GoogleGenerativeAI } = require("@google/generative-ai");

// Pastikan API Key tersedia
if (!process.env.GEMINI_API_KEY) {
  console.error("❌ GEMINI_API_KEY belum diatur di environment variables!");
  process.exit(1); // Hentikan proses jika tidak ada API key
}

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// Ganti dengan ID channel kamu yang benar
const AI_CHANNEL_ID = "1394478754297811034";

module.exports = async (message) => {
  // Abaikan pesan dari bot atau channel yang tidak sesuai
  if (message.author.bot || message.channel.id !== AI_CHANNEL_ID) return;

  try {
    await message.channel.sendTyping(); // Menampilkan indikator mengetik...

    const prompt = message.content;

    // Inisialisasi model Gemini
    const model = genAI.getGenerativeModel({
      model: "gemini-1.5-pro-latest",
    });

    const result = await model.generateContent(prompt);
    const response = await result.response;

    const reply = response.text();

    if (reply && reply.trim()) {
      await message.reply(reply.trim());
    } else {
      await message.reply("🤔 Maaf, saya tidak bisa memberikan jawaban saat ini.");
    }

  } catch (error) {
    console.error("❌ Gemini AI error:", error);
    await message.reply("⚠️ Maaf, terjadi kesalahan saat saya mencoba menjawab. Coba lagi nanti.");
  }
};
