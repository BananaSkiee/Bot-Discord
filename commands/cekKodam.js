const { SlashCommandBuilder } = require("discord.js");
const { GoogleGenerativeAI } = require("@google/generative-ai");

// Inisialisasi Gemini
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

module.exports = {
  data: new SlashCommandBuilder()
    .setName("cek-kodam")
    .setDescription("🔮 Cek kodam spiritual kamu dari AI ✨"),

  async execute(interaction) {
    await interaction.deferReply();

    try {
      const model = genAI.getGenerativeModel({ model: "gemini-pro" });

      const prompt = `Tolong bacakan kodamku.\n
Kamu adalah dukun sakti nan mistis. Jawabanmu harus gaib, puitis, dan spiritual. Jawab hanya 2–4 kalimat.`;

      const result = await model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();

      await interaction.editReply(`🔮 **Kodammu telah dibaca:**\n${text}`);
    } catch (error) {
      console.error("❌ Gemini Error:", error);
      await interaction.editReply("❌ Gagal membaca kodam. Coba lagi nanti.");
    }
  },
};
