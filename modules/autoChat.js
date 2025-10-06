const { GoogleGenerativeAI } = require("@google/generative-ai");

// Pisahkan banyak API key dengan koma di Environment Variables Railway
if (!process.env.GEMINI_API_KEY) {
  console.error("❌ GEMINI_API_KEY belum diatur di Railway!");
  process.exit(1);
}

const apiKeys = process.env.GEMINI_API_KEY.split(",").map(k => k.trim());
let currentKeyIndex = 0;

function getGenAI() {
  return new GoogleGenerativeAI(apiKeys[currentKeyIndex]);
}

const AI_CHANNEL_ID = "1352800131933802547";

module.exports = async (message) => {
  if (message.author.bot || message.channel.id !== AI_CHANNEL_ID) return;

  try {
    await message.channel.sendTyping();

    // ✅ PERBAIKAN: Ganti dengan model yang masih aktif
    const model = getGenAI().getGenerativeModel({ 
      model: "gemini-1.5-flash", // atau "gemini-1.5-pro"
      generationConfig: {
        temperature: 0.8, // Biar lebih kreatif dan gaul
        topP: 0.9,
        topK: 40,
      }
    });

    // Prompt khusus biar bahasanya gaul tapi sopan
    const prompt = `Kamu adalah AI temen ngobrol di Discord yang jawabnya pake bahasa Indonesia gaul, santai, kayak manusia biasa. 
Pake emoticon kadang-kadang biar nggak kaku, tapi jangan kebanyakan. 
Jawaban harus singkat, nyambung, dan kalau bisa kasih sedikit candaan ringan. 
Kalau ditanya serius, jawab serius tapi tetep santai. 
Hindari bahasa formal banget. Jangan pake tanda bintang untuk aksi (*kayak gini*), fokus ke percakapan aja.:
${message.content}`;

    const result = await model.generateContent(prompt);
    const reply = result.response?.text() || ""; // ✅ PERBAIKAN: Gunakan .text() method

    if (reply.trim()) {
      // Potong reply jika terlalu panjang untuk Discord
      const trimmedReply = reply.length > 2000 ? reply.substring(0, 1997) + "..." : reply;
      await message.reply(trimmedReply.trim());
    } else {
      await message.reply("🤔 Maaf, aku belum nemu jawabannya.");
    }

  } catch (error) {
    if (error.status === 429 && currentKeyIndex < apiKeys.length - 1) {
      console.warn(`⚠️ API key ${currentKeyIndex + 1} limit, ganti ke key berikutnya...`);
      currentKeyIndex++;
      return module.exports(message);
    }
    console.error("❌ Gemini AI error:", error);
    await message.reply("⚠️ Lagi error nih, coba lagi nanti ya!");
  }
};
