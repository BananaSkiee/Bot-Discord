const { GoogleGenerativeAI } = require("@google/generative-ai");

// Pisahkan banyak API key dengan koma di Environment Variables Railway
if (!process.env.GEMINI_API_KEY) {
  console.error("❌ GEMINI_API_KEY belum diatur di Environment Variables (Koyeb)!");
  process.exit(1);
}

const apiKeys = process.env.GEMINI_API_KEY.split(",").map(k => k.trim());
let currentKeyIndex = 0;
let rateLimitReset = 0;

function getGenAI() {
  return new GoogleGenerativeAI(apiKeys[currentKeyIndex]);
}

const AI_CHANNEL_ID = "1352635177536327760";

// Cache untuk menghindari spam
const userCooldown = new Map();
const COOLDOWN_TIME = 3000; // 3 detik

module.exports = async (message) => {
  // Cek jika message dari bot atau bukan channel AI
  if (message.author.bot || message.channel.id !== AI_CHANNEL_ID) return;

  // Cek cooldown
  const now = Date.now();
  const lastMessage = userCooldown.get(message.author.id);
  if (lastMessage && (now - lastMessage) < COOLDOWN_TIME) {
    await message.react('⏳');
    return;
  }

  try {
    await message.channel.sendTyping();

    // Update cooldown
    userCooldown.set(message.author.id, now);

    // Cek rate limit
    if (Date.now() < rateLimitReset) {
      await message.reply("⏳ Lagi sibuk nih, coba lagi sebentar ya...");
      return;
    }

    const model = getGenAI().getGenerativeModel({ 
      model: "gemini-1.5-flash",
      generationConfig: {
        maxOutputTokens: 500, // Batasi output biar tidak kepanjangan
        temperature: 0.7, // Sedikit kreatif tapi tetap konsisten
      }
    });

    // Prompt yang lebih baik
// System prompt yang lebih kompleks
const systemPrompt = `Kamu adalah teman ngobrol yang asik di server Discord. 
Karakteristik:
- Panggil user dengan "bro", "sis", atau nama panggilan casual
- Bahasa Indonesia sehari-hari yang natural
- Boleh sarkas dikit-dikit tapi jangan berlebihan
- Jawaban maksimal 200 karakter biar ga kepanjangan
- Sesekali kasih reaksi pake emoji yang relevan
- Kalau nggak ngerti, bilang aja jangan asal jawab

Tone: Kayak temen deket yang lagi chat di WA/Telegram`;

Pertanyaan: "${message.content}"

Jawab dengan gaya obrolan santai:`;

    const result = await model.generateContent(prompt);
    const reply = result.response?.candidates?.[0]?.content?.parts?.[0]?.text || "";

    if (reply.trim()) {
      // Potong jika terlalu panjang untuk Discord
      const finalReply = reply.trim().length > 2000 
        ? reply.trim().substring(0, 1997) + "..." 
        : reply.trim();
      
      await message.reply(finalReply);
    } else {
      await message.reply("🤔 Wah, aku bingung nangkep maksud lu. Coba ulangi dengan kata lain dong!");
    }

  } catch (error) {
    console.error("❌ Gemini AI error:", error);

    // Handle rate limit dengan lebih baik
    if (error.status === 429) {
      if (currentKeyIndex < apiKeys.length - 1) {
        console.warn(`⚠️ API key ${currentKeyIndex + 1} limit, ganti ke key berikutnya...`);
        currentKeyIndex++;
        
        // Coba lagi dengan key baru
        setTimeout(() => module.exports(message), 1000);
      } else {
        // Semua key habis
        rateLimitReset = Date.now() + 60000; // 1 menit
        await message.reply("🚫 Lagi banyak request nih, coba lagi nanti ya!");
      }
    } else {
      await message.reply("😵 Lagi error nih, coba lagi sebentar ya!");
    }
  }
};
