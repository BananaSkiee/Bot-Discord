// modules/autoEmoji.js
module.exports = async function autoEmoji(message) {
  if (message.author.bot) return;

  const triggers = [
    // Sapaan & Emosi
    { keyword: "halo", emoji: "👋" },
    { keyword: "hi", emoji: "👋" },
    { keyword: "hai", emoji: "👋" },
    { keyword: "bye", emoji: "👋" },
    { keyword: "dadah", emoji: "👋" },
    { keyword: "pagi", emoji: "🌅" },
    { keyword: "siang", emoji: "☀️" },
    { keyword: "malam", emoji: "🌙" },
    { keyword: "senang", emoji: "😄" },
    { keyword: "bahagia", emoji: "😄" },
    { keyword: "sedih", emoji: "😢" },
    { keyword: "nangis", emoji: "😭" },
    { keyword: "marah", emoji: "😡" },
    { keyword: "emosi", emoji: "😠" },
    { keyword: "lucu", emoji: "😂" },
    { keyword: "ngakak", emoji: "🤣" },
    { keyword: "tertawa", emoji: "😆" },
    { keyword: "kaget", emoji: "😲" },
    { keyword: "terkejut", emoji: "😳" },
    { keyword: "kasihan", emoji: "😥" },
    { keyword: "lelah", emoji: "😫" },
    { keyword: "bosan", emoji: "🥱" },

    // Aktivitas
    { keyword: "makan", emoji: "🍔" },
    { keyword: "lapar", emoji: "😋" },
    { keyword: "minum", emoji: "🥤" },
    { keyword: "haus", emoji: "💧" },
    { keyword: "tidur", emoji: "😴" },
    { keyword: "ngantuk", emoji: "😴" },
    { keyword: "main", emoji: "🎮" },
    { keyword: "kerja", emoji: "💻" },
    { keyword: "belajar", emoji: "📚" },
    { keyword: "ujian", emoji: "📝" },
    { keyword: "ngopi", emoji: "☕" },
    { keyword: "masak", emoji: "🍳" },
    { keyword: "olahraga", emoji: "🏋️" },

    // Cinta / Sosial
    { keyword: "love", emoji: "❤️" },
    { keyword: "cinta", emoji: "❤️" },
    { keyword: "sayang", emoji: "💞" },
    { keyword: "rindu", emoji: "🥺" },
    { keyword: "kangen", emoji: "🥺" },
    { keyword: "friend", emoji: "🤝" },
    { keyword: "teman", emoji: "🧑‍🤝‍🧑" },
    { keyword: "bestie", emoji: "👯" },
    { keyword: "grup", emoji: "👥" },

    // Reaksi & Ekspresi
    { keyword: "oke", emoji: "👌" },
    { keyword: "baik", emoji: "👌" },
    { keyword: "mantap", emoji: "👍" },
    { keyword: "setuju", emoji: "👍" },
    { keyword: "bagus", emoji: "✨" },
    { keyword: "hebat", emoji: "🌟" },
    { keyword: "jelek", emoji: "🤢" },
    { keyword: "buruk", emoji: "👎" },
    { keyword: "sakit", emoji: "🤒" },
    { keyword: "sehat", emoji: "💪" },
    { keyword: "hore", emoji: "🎉" },
    { keyword: "yey", emoji: "🥳" },
    { keyword: "wih", emoji: "😮" },

    // Cuaca & Alam
    { keyword: "hujan", emoji: "🌧️" },
    { keyword: "panas", emoji: "☀️" },
    { keyword: "dingin", emoji: "❄️" },
    { keyword: "salju", emoji: "☃️" },
    { keyword: "angin", emoji: "💨" },
    { keyword: "badai", emoji: "🌪️" },

    // Kata Random
    { keyword: "kucing", emoji: "🐱" },
    { keyword: "meow", emoji: "🐈" },
    { keyword: "anjing", emoji: "🐶" },
    { keyword: "guk", emoji: "🐕" },
    { keyword: "naga", emoji: "🐉" },
    { keyword: "api", emoji: "🔥" },
    { keyword: "air", emoji: "💧" },
    { keyword: "tanah", emoji: "🌍" },
    { keyword: "mobil", emoji: "🚗" },
    { keyword: "motor", emoji: "🛵" },
    { keyword: "komputer", emoji: "🖥️" },
    { keyword: "hp", emoji: "📱" },
  ];

  for (const trigger of triggers) {
    if (message.content.toLowerCase().includes(trigger.keyword)) {
      try {
        await message.react(trigger.emoji);
      } catch (err) {
        console.error("❌ Gagal react emoji:", err);
      }
      break; // React satu kali saja
    }
  }
};
