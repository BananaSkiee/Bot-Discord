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

// Cache untuk model yang berhasil
let workingModel = null;

// Function untuk mendapatkan model yang kompatibel
async function getCompatibleModel(genAI) {
  // Prioritaskan model yang paling dasar dan kompatibel
  const compatibleModels = [
    "gemini-pro",           // Model paling dasar
    "models/gemini-pro",    // Format alternatif
    "gemini-1.0-pro",       // Fallback ke versi 1.0
  ];

  for (const modelName of compatibleModels) {
    try {
      console.log(`🔍 Mencoba model: ${modelName}`);
      const model = genAI.getGenerativeModel({ 
        model: modelName,
        generationConfig: {
          temperature: 0.8,
          topP: 0.9,
          topK: 40,
          maxOutputTokens: 1000,
        }
      });
      
      // Test kecil dengan prompt sederhana
      const testResult = await model.generateContent("Hai");
      const testReply = testResult.response?.text();
      
      if (testReply && testReply.trim()) {
        console.log(`✅ Model ${modelName} berhasil!`);
        return model;
      }
    } catch (error) {
      console.log(`❌ Model ${modelName} gagal: ${error.message}`);
      continue;
    }
  }
  
  return null;
}

module.exports = async (message) => {
  if (message.author.bot || message.channel.id !== AI_CHANNEL_ID) return;

  try {
    await message.channel.sendTyping();

    const genAI = getGenAI();
    
    // Gunakan cached model atau cari yang kompatibel
    if (!workingModel) {
      workingModel = await getCompatibleModel(genAI);
    }

    if (!workingModel) {
      throw new Error("Tidak ada model Gemini yang kompatibel");
    }

    // Prompt khusus biar bahasanya gaul tapi sopan
    const prompt = `Kamu adalah AI temen ngobrol di Discord yang jawabnya pake bahasa Indonesia gaul, santai, kayak manusia biasa. 
Pake emoticon kadang-kadang biar nggak kaku, tapi jangan kebanyakan. 
Jawaban harus singkat, nyambung, dan kalau bisa kasih sedikit candaan ringan. 
Kalau ditanya serius, jawab serius tapi tetep santai. 
Hindari bahasa formal banget. Jangan pake tanda bintang untuk aksi (*kayak gini*), fokus ke percakapan aja.

User: ${message.content}
AI:`;

    const result = await workingModel.generateContent(prompt);
    const reply = result.response?.text() || "";

    if (reply.trim()) {
      // Potong reply jika terlalu panjang untuk Discord
      const trimmedReply = reply.length > 2000 ? reply.substring(0, 1997) + "..." : reply;
      await message.reply(trimmedReply.trim());
    } else {
      await message.reply("🤔 Maaf, aku belum nemu jawabannya.");
    }

  } catch (error) {
    console.error("❌ Gemini AI error:", error);
    
    if (error.status === 404) {
      // Model tidak ditemukan, reset cache
      workingModel = null;
      
      if (currentKeyIndex < apiKeys.length - 1) {
        console.warn(`🔄 Model tidak ditemukan, ganti API key...`);
        currentKeyIndex++;
        return module.exports(message);
      } else {
        await message.reply("🤖 Fitur AI sedang maintenance nih, coba lagi nanti ya!");
      }
    }
    else if (error.status === 429 && currentKeyIndex < apiKeys.length - 1) {
      console.warn(`⚠️ API key ${currentKeyIndex + 1} limit, ganti key...`);
      workingModel = null;
      currentKeyIndex++;
      return module.exports(message);
    } 
    else {
      await message.reply("😵 Lagi error nih, coba lagi sebentar ya!");
    }
  }
};

// Cek kompatibilitas saat startup
setTimeout(async () => {
  try {
    const genAI = getGenAI();
    console.log("🔄 Mengecek model Gemini yang tersedia...");
    
    // Coba langsung dengan model dasar
    const testModel = genAI.getGenerativeModel({ model: "gemini-pro" });
    const testResult = await testModel.generateContent("Test");
    console.log("✅ Gemini API terhubung dengan model 'gemini-pro'");
    
  } catch (error) {
    console.error("❌ Gagal terhubung ke Gemini API:", error.message);
    console.log("💡 Tips: Pastikan:");
    console.log("  1. API key valid dan memiliki akses Gemini");
    console.log("  2. Package @google/generative-ai terupdate");
    console.log("  3. Model 'gemini-pro' tersedia di region Anda");
  }
}, 2000);
