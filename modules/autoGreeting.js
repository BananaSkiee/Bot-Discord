const { ChannelType, EmbedBuilder } = require("discord.js");
const moment = require("moment-timezone");

// Greeting configurations for WIB timezone (UTC+7)
const greetings = [
  { 
    hour: 5, // 5 AM WIB
    title: "🌄 Selamat Pagi Buta",
    message: "Fajar mulai menyingsing, saatnya bangun dan memulai hari dengan semangat baru!",
    color: "#4B6CB7",
    footer: "Jangan lupa sarapan ya!"
  },
  { 
    hour: 7, // 7 AM WIB
    title: "🌅 Selamat Pagi",
    message: "Semoga hari ini membawa kebahagiaan dan kesuksesan untuk kita semua!",
    color: "#FFD700",
    footer: "Awali hari dengan senyuman :)"
  },
  { 
    hour: 12, // 12 PM WIB
    title: "🍛 Selamat Siang",
    message: "Waktunya istirahat sejenak dan mengisi energi dengan makan siang!",
    color: "#FF7F50",
    footer: "Makan yang bergizi ya!"
  },
  { 
    hour: 15, // 3 PM WIB
    title: "☕ Selamat Sore",
    message: "Saatnya coffee break untuk mengembalikan fokus dan semangat!",
    color: "#E25822",
    footer: "Jangan lupa minum air putih"
  },
  { 
    hour: 18, // 6 PM WIB
    title: "🌇 Selamat Petang",
    message: "Waktunya pulang dan beristirahat setelah seharian beraktivitas!",
    color: "#FF8C00",
    footer: "Hati-hati di jalan!"
  },
  { 
    hour: 21, // 9 PM WIB
    title: "🌙 Selamat Malam",
    message: "Saatnya beristirahat untuk memulihkan energi hari ini!",
    color: "#1E3A8A",
    footer: "Tidur yang nyenyak!"
  }
];

module.exports = (client) => {
  const channelId = process.env.GREETING_CHANNEL;

  // Check every minute but only send at the exact hour
  setInterval(async () => {
    try {
      // Get current WIB time
      const now = moment().tz('Asia/Jakarta');
      const currentHour = now.hour();
      const currentMinute = now.minute();

      // Only send at the top of the hour (minute 0)
      if (currentMinute !== 0) return;

      const greeting = greetings.find(g => g.hour === currentHour);
      if (!greeting) return;

      const channel = await client.channels.fetch(channelId).catch(() => null);
      if (!channel || channel.type !== ChannelType.GuildText) return;

      // Create clean embed without image
      const embed = new EmbedBuilder()
        .setTitle(greeting.title)
        .setDescription(greeting.message)
        .setColor(greeting.color)
        .setFooter({ 
          text: `${greeting.footer} | Waktu Server: ${now.format('HH:mm')} WIB`,
        })
        .setTimestamp();

      channel.send({ embeds: [embed] }).catch(console.error);

    } catch (error) {
      console.error("Error in greeting module:", error);
    }
  }, 60 * 1000); // Check every minute
};
