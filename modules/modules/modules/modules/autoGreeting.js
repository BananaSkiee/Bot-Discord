const { ChannelType } = require("discord.js");

const greetings = [
  { hour: 7, message: "🌅 Selamat pagi semuanya! Semoga harimu menyenangkan ☀️" },
  { hour: 12, message: "🍛 Selamat siang! Jangan lupa makan siang ya!" },
  { hour: 18, message: "🌆 Selamat sore! Istirahat sebentar yuk!" },
  { hour: 21, message: "🌙 Selamat malam! Waktunya istirahat, good night!" }
];

module.exports = (client) => {
  const channelId = process.env.GREETING_CHANNEL;

  setInterval(async () => {
    const now = new Date();
    
    // Konversi waktu UTC ke WIB (GMT+7)
    const wibHour = (now.getUTCHours() + 7) % 24;

    const greeting = greetings.find(g => g.hour === wibHour);
    if (!greeting) return;

    const channel = await client.channels.fetch(channelId).catch(() => null);
    if (!channel || channel.type !== ChannelType.GuildText) return;

    channel.send(greeting.message).catch(console.error);
  }, 60 * 60 * 1000); // cek tiap 1 jam
};
