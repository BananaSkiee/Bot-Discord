const { GoogleGenerativeAI } = require("@google/generative-ai");

if (!process.env.GEMINI_API_KEY) {
  console.error("❌ GEMINI_API_KEY belum diatur!");
  process.exit(1);
}

const apiKeys = process.env.GEMINI_API_KEY.split(",").map(k => k.trim());
let currentKeyIndex = 0;

const AI_CHANNEL_ID = "1352635177536327760";

// PERBAIKAN: Export function yang menerima client, bukan message
module.exports = (client) => {
  client.on('messageCreate', async (message) => {
    // PENAMBAHAN: Cek jika message undefined
    if (!message || !message.author) return;
    
    if (message.author.bot || message.channel.id !== AI_CHANNEL_ID) return;

    try {
      await message.channel.sendTyping();

      const genAI = new GoogleGenerativeAI(apiKeys[currentKeyIndex]);
      
      // LANGSUNG GUNAKAN gemini-pro YANG PASTI WORK
      const model = genAI.getGenerativeModel({ 
        model: "gemini-pro",
        generationConfig: {
          maxOutputTokens: 150,
          temperature: 0.8,
        }
      });

      const prompt = `Jawab singkat (max 2 kalimat) dengan bahasa Indonesia gaul: ${message.content}`;

      const result = await model.generateContent(prompt);
      const reply = result.response.text();

      if (reply.trim()) {
        await message.reply(reply.trim());
      } else {
        await message.reply("🤔 Gak nemu jawabannya nih.");
      }

    } catch (error) {
      console.error("❌ Gemini error:", error.message);
      
      if (error.status === 429 && currentKeyIndex < apiKeys.length - 1) {
        currentKeyIndex++;
        // Tidak perlu recursive call
      }
      
      await message.reply("⚠️ Lagi error, coba lagi nanti!");
    }
  });
};
