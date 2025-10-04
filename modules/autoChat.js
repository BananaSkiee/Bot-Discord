const { GoogleGenerativeAI } = require("@google/generative-ai");

if (!process.env.GEMINI_API_KEY) {
  console.error("❌ GEMINI_API_KEY belum diatur!");
  process.exit(1);
}

const apiKeys = process.env.GEMINI_API_KEY.split(",").map(k => k.trim());
let currentKeyIndex = 0;

const AI_CHANNEL_ID = "1352635177536327760";

module.exports = async (message) => {
  if (message.author.bot || message.channel.id !== AI_CHANNEL_ID) return;

  try {
    await message.channel.sendTyping();

    const genAI = new GoogleGenerativeAI(apiKeys[currentKeyIndex]);
    
    // COBA MODEL YANG BERBEDA - gemini-1.5-flash mungkin belum available
    const model = genAI.getGenerativeModel({ 
      model: "gemini-1.5-flash-latest",  // Coba versi latest
      // model: "gemini-1.5-flash",      // Atau coba tanpa -latest
      // model: "gemini-1.0-flash",      // Fallback 1
      // model: "gemini-pro",            // Fallback 2 (pasti work)
      generationConfig: {
        maxOutputTokens: 200,  // Lebih hemat
        temperature: 0.8,
      }
    });

    // Prompt yang sudah bagus & hemat
    const prompt = `Jawab dengan bahasa Indonesia gaul dan santai, maksimal 2 kalimat: ${message.content}`;

    const result = await model.generateContent(prompt);
    const reply = result.response.text(); // Simplifikasi, tidak perlu candidates

    if (reply.trim()) {
      await message.reply(reply.trim());
    } else {
      await message.reply("🤔 Maaf, aku belum nemu jawabannya.");
    }

  } catch (error) {
    console.error("❌ Gemini AI error:", error.message);
    
    if (error.status === 429 && currentKeyIndex < apiKeys.length - 1) {
      console.warn(`⚠️ API key ${currentKeyIndex + 1} limit, ganti key...`);
      currentKeyIndex++;
      return module.exports(message);
    }
    
    // Handle model not found error
    if (error.status === 404) {
      console.log("🔄 Model tidak ditemukan, coba fallback ke gemini-pro...");
      
      // Fallback ke gemini-pro yang pasti work
      try {
        const genAI = new GoogleGenerativeAI(apiKeys[currentKeyIndex]);
        const fallbackModel = genAI.getGenerativeModel({ 
          model: "gemini-pro",
          generationConfig: {
            maxOutputTokens: 150,
            temperature: 0.8,
          }
        });
        
        const prompt = `Jawab singkat dengan bahasa Indonesia gaul: ${message.content}`;
        const result = await fallbackModel.generateContent(prompt);
        const reply = result.response.text();
        
        if (reply.trim()) {
          await message.reply(reply.trim().substring(0, 1000));
        }
      } catch (fallbackError) {
        await message.reply("⚠️ AI sedang maintenance, coba lagi nanti!");
      }
    } else {
      await message.reply("⚠️ Lagi error nih, coba lagi ya!");
    }
  }
};
