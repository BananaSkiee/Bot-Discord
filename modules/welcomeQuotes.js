const welcomeMessages = [
  `🎉 Selamat datang di BananaSkiee, \${username}! Semoga harimu makin seru di sini!`,
  `🔥 Yo \${username}, tempat ini cocok buat kamu yang suka rame-rame seru!`,
  `🌟 \${username} telah mendarat! Ayo kita sambut dengan meriah!`,
  `👋 Halo \${username}, jangan malu-malu, langsung aja ngobrol!`,
  `🚀 \${username} join! Semoga makin betah di server ini ya!`,
  `🎮 \${username}, siap main bareng? Ajak teman juga boleh~`,
  `📢 \${username} baru masuk! Yuk kenalan dulu di #introduction~`,
  `💬 \${username}, server ini bakal seru banget kalo kamu aktif!`,
  `🎊 \${username}, semoga jadi member paling legend di sini!`,
  `🌈 Hai \${username}, semoga ketemu banyak temen baru di sini!`,
  `🍌 Selamat datang \${username}! Jangan lupa ambil cemilan di #general 😆`,
  `🌻 \${username}, tempat ini jadi makin cerah karena kamu!`,
  `💡 \${username}, ide-ide kamu ditunggu banget nih!`,
  `✨ \${username}, selamat datang di komunitas penuh bintang!`,
  `👑 \${username} datang membawa vibes positif!`,
  `🧃 \${username}, yuk ngobrol bareng biar makin akrab!`,
  `📸 \${username}, share momen serumu di #gallery dong!`,
  `🎧 \${username}, ada banyak suara tawa menanti kamu di VC~`,
  `🕹️ \${username}, join game bareng jangan lupa bilang ya!`,
  `🗿 \${username} detected... auto jadi warga tetap!`,
  `😎 \${username} join = makin keren servernya~`,
  `📦 \${username} telah tiba dengan paket kejutan!`,
  `🧩 \${username}, satu bagian penting dari puzzle komunitas ini!`,
  `🎯 \${username}, ayo capai tujuan bareng komunitas solid ini!`,
  `🎨 \${username}, ekspresikan dirimu sebebas mungkin di sini!`,
  `📚 \${username}, setiap cerita punya awal. Ini cerita kamu!`,
  `🍀 \${username}, kamu pembawa hoki buat server ini!`,
  `🌟 \${username}, semoga jadi bintang paling terang di komunitas ini!`,
  `⚡ \${username} masuk... dan listrik server langsung nyala!`,
  `🍕 \${username}, pizza udah disiapin di #general!`,
  `🛸 \${username} turun dari langit! Warga sambut dia dong~`,
  `🎤 \${username}, langsung aja ambil mic dan kenalan~`,
  `📱 \${username}, chat kamu ditungguin loh di #ngobrol-bareng`,
  `🧸 \${username}, welcome! Kamu bawa boneka atau vibes positif nih?`,
  `🥤 \${username}, yuk santai dulu sambil minum es teh~`,
  `🎈 \${username}, ada balon buat kamu di sini!`,
  `🕶️ \${username} join = +100 coolness point buat server ini!`,
  `🏝️ \${username}, selamat datang di pulau keseruan BananaSkiee~`,
  `💎 \${username}, kamu kayak permata yang baru ditemukan!`,
  `🦄 \${username}, kamu pasti unik banget~`,
  `🎁 \${username}, kamu kayak hadiah tak terduga buat server ini~`,
  `📀 \${username} putar lagu favoritmu, biar suasana makin hangat!`,
  `🧃 \${username}, kamu udah masuk geng chill nih!`,
  `📣 \${username}, langsung aja teriak "Hai!" di chat~`,
  `🍿 \${username}, pas banget! Filmnya baru mulai~`,
  `🎲 \${username}, siap-siap jadi bagian dari keseruan random ini!`,
  `🌌 \${username}, kamu bintang baru di langit BananaSkiee!`,
  `🌻 \${username}, kamu bikin server ini makin berwarna~`
];

function getRandomQuote(username) {
  const index = Math.floor(Math.random() * welcomeMessages.length);
  const template = welcomeMessages[index];
  return template.replace(/\$\{username\}/g, username);
}

module.exports = getRandomQuote;
