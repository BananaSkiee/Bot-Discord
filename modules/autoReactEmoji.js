const allowedChannelIds = [
  "1502256109526978691", // Ganti dengan ID channel yang diizinkan
  "1498935218910924800",
  "1502215449482625024",
  "1502224249820155904",
  "1498935771992690708",
  "1498935442446352484"
];

// Daftar emoji yang akan direact (sebanyak apapun)
const emojiList = ["🔥", "💯", "😎", "😂", "🎉", "👏", "✨", "🙏", "👍", "❤️"];

// Fungsi delay
function wait(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

module.exports = {
  name: "autoReactEmoji",

  async execute(message) {
    // Hanya di channel tertentu
    if (!allowedChannelIds.includes(message.channel.id)) return;

    for (const emoji of emojiList) {
      try {
        await message.react(emoji);
        await wait(300); // Delay agar aman dari rate limit
      } catch (err) {
        console.warn(`⚠️ Gagal react emoji ${emoji}:`, err.message);
      }
    }
  }
};

// Fungsi delay
function wait(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}
