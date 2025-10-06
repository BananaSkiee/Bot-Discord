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

    const genAI = getGenAI();
    
    // ✅ GUNAKAN MODEL YANG MODERN DAN TERBARU
    const model = genAI.getGenerativeModel({ 
      model: "gemini-2.0-flash-exp", // Model experimental terbaru
      // model: "gemini-1.5-flash-latest", // Alternatif
      generationConfig: {
        temperature: 0.8,
        topP: 0.9,
        topK: 40,
        maxOutputTokens: 1000,
      }
    });

    // Prompt khusus biar bahasanya gaul tapi sopan
    const prompt = `Kamu adalah AI temen ngobrol di Discord yang jawabnya pake bahasa Indonesia gaul, santai, kayak manusia biasa. 
Pake emoticon kadang-kadang biar nggak kaku, tapi jangan kebanyakan. 
Jawaban harus singkat, nyambung, dan kalau bisa kasih sedikit candaan ringan. 
Kalau ditanya serius, jawab serius tapi tetep santai. 
Hindari bahasa formal banget. Jangan pake tanda bintang untuk aksi (*kayak gini*), fokus ke percakapan aja.

User: ${message.content}
AI:`;

    const result = await model.generateContent(prompt);
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
      // Coba model alternatif
      try {
        const genAI = getGenAI();
        const fallbackModel = genAI.getGenerativeModel({ 
          model: "gemini-1.5-flash-latest",
          generationConfig: {
            temperature: 0.8,
            topP: 0.9,
            topK: 40,
            maxOutputTokens: 1000,
          }
        });
        
        const result = await fallbackModel.generateContent(message.content);
        const reply = result.response?.text() || "";
        
        if (reply.trim()) {
          const trimmedReply = reply.length > 2000 ? reply.substring(0, 1997) + "..." : reply;
          await message.reply(trimmedReply.trim());
          return;
        }
      } catch (fallbackError) {
        console.error("❌ Fallback model juga gagal:", fallbackError);
      }
      
      await message.reply("🤖 Fitur AI sedang update, coba lagi nanti ya!");
    }
    else if (error.status === 429 && currentKeyIndex < apiKeys.length - 1) {
      console.warn(`⚠️ API key ${currentKeyIndex + 1} limit, ganti key...`);
      currentKeyIndex++;
      return module.exports(message);
    } 
    else {
      await message.reply("😵 Lagi error nih, coba lagi sebentar ya!");
    }
  }
};

// Test koneksi dengan model modern
setTimeout(async () => {
  try {
    const genAI = getGenAI();
    console.log("🔄 Testing Gemini API dengan model modern...");
    
    const testModel = genAI.getGenerativeModel({ model: "gemini-2.0-flash-exp" });
    const testResult = await testModel.generateContent("Halo, test connection");
    console.log("✅ Gemini API terhubung dengan model modern!");
    
  } catch (error) {
    console.error("❌ Gagal terhubung:", error.message);
    console.log("🔧 Solusi:");
    console.log("  1. Update package: npm install @google/generative-ai@latest");
    console.log("  2. Cek API key di: https://aistudio.google.com/");
    console.log("  3. Pastikan region tidak diblock");
  }
}, 2000);
