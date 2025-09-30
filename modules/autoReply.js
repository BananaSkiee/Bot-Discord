module.exports = async (message) => {
  if (message.author.bot) return;

  const contentLower = message.content.toLowerCase();

  const autoReplies = {
    pagi: ["Pagi juga! 🌞", "Selamat pagi, semangat ya!", "Eh bangun pagi juga 😴"],
    siang: ["Siang juga! 🌤️", "Jangan lupa makan siang ya!", "Siang-siang panas bener 🥵"],
    sore: ["Sore juga! 🌇", "Selamat sore, udah capek belum?", "Sore gini enaknya rebahan 😴"],
    malam: ["Selamat malam! 🌙", "Malam juga, semangat istirahat ya!", "Udah makan malam belum?"],
    halo: ["Halo halo! 👋", "Yo halo!", "Haiii 😄"],
    makasih: ["Sama-sama 😊", "Sippp 👍", "Yok sama-sama~"],
    ngantuk: ["Ngopi dulu gih ☕", "Tidur sana jangan dipaksa 😴", "Ngantuk? Wajar 😆"],
    gabut: ["Gabut? Ketik !gacha aja!", "Mau main tebak gambar? !tebak", "Chat bot aja kalo gabut 😁"],
    hehehe: ["Hehe kenapa 🤭", "Ngakak sendiri ya? 😅", "Hehe iya iya 😏"],
    anjir: ["Anjir parah 😳", "Anjir kenapa tuh?", "Wkwk anjir banget"],
    woi: ["WOI kenapaa 😤", "Sini gua dengerin", "Santai dong bang"],
    bang: ["Siap bang 👊", "Kenapa bang?", "Tenang bang, aman 😎"],
    cape: ["Sini aku pijetin 😌", "Rebahan dulu aja...", "Jangan lupa istirahat ya"],
    bosen: ["Main Discord dulu 😆", "Bosen? Cari konten baru~", "Main game yuk!"],
    kangen: ["Kangen siapa tuh? 😏", "Sini pelukk 🤗", "Kangen tuh berat..."],
    bye: ["👋 Bye bye! Jangan lupa balik lagi ya!", "Daaah~ hati-hati ya 😄", "Sampai ketemu lagi 💫"],
  };

  for (const [keyword, replies] of Object.entries(autoReplies)) {
    if (contentLower.includes(keyword)) {
      const reply = replies[Math.floor(Math.random() * replies.length)];
      return message.reply(reply).catch(console.error);
    }
  }
};
