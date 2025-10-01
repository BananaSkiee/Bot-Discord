const { EmbedBuilder } = require("discord.js");
const Parser = require("rss-parser");
const fs = require("fs");
const path = require("path");
const parser = new Parser();

const rssFeeds = [
  "https://www.kompas.com/rss",
  "https://rss.detik.com/index.php/berita",
  "https://www.cnnindonesia.com/nasional/rss",
  "https://www.antaranews.com/rss/nasional.xml",
  "https://tempo.co/rss/nasional",
  "https://www.merdeka.com/feed/",
  "https://republika.co.id/rss/nasional"
];

const SENT_FILE = path.join(__dirname, "../data/sentNews.json");

const sourceLogos = {
  kompas: "https://asset.kompas.com/data/2020/wp/images/logokompascom.png",
  detik: "https://cdn.detik.net.id/assets/images/logo-detikcom.png",
  cnn: "https://upload.wikimedia.org/wikipedia/commons/6/66/CNN_International_logo.svg",
  antara: "https://cdn.antaranews.com/images/2021/antaranewscom.png",
  tempo: "https://cdn.tempo.co/images/tempo.png",
  merdeka: "https://cdn-image.hipwee.com/wp-content/uploads/2023/07/hipwee-merdeka-com.png",
  republika: "https://static.republika.co.id/files/images/logo-republika.png",
};

function loadSentLinks() {
  if (!fs.existsSync(SENT_FILE)) return [];
  return JSON.parse(fs.readFileSync(SENT_FILE));
}

function saveSentLink(link) {
  const sent = loadSentLinks();
  sent.push(link);
  fs.writeFileSync(SENT_FILE, JSON.stringify(sent, null, 2));
}

function getRandomColor() {
  return Math.floor(Math.random() * 0xffffff);
}

module.exports = async function autoNews(client) {
  const channelId = "1352331574376665178"; // ID channel target
  const scheduleHours = [8, 14, 20]; // Jam pengiriman WIB

  setInterval(async () => {
    const now = new Date();
    const hour = now.getHours();
    const minute = now.getMinutes();

    // Cek kalau jam sekarang masuk jadwal
    if (scheduleHours.includes(hour) && minute === 0) {
      const channel = await client.channels.fetch(channelId);
      if (!channel) return;

      const sentLinks = loadSentLinks();

      for (const feedUrl of rssFeeds) {
        try {
          const feed = await parser.parseURL(feedUrl);
          const item = feed.items.find(i => !sentLinks.includes(i.link));
          if (!item) continue;

          let image = null;
          if (item.enclosure?.url) {
            image = item.enclosure.url;
          } else {
            const match = (item.content || item.contentSnippet || "").match(/<img[^>]+src="([^">]+)"/);
            if (match?.[1]) image = match[1];
          }

          const sourceKey = Object.keys(sourceLogos).find(key => feedUrl.includes(key)) || "";
          const sourceLogo = sourceLogos[sourceKey] || null;
          const sourceName = feed.title || "Media";

          const embed = new EmbedBuilder()
            .setTitle(item.title || "Berita")
            .setURL(item.link)
            .setDescription(item.contentSnippet?.slice(0, 200) + "..." || "Klik untuk baca selengkapnya.")
            .setColor(getRandomColor())
            .setTimestamp(new Date(item.pubDate || item.isoDate || Date.now()));

          if (image) embed.setImage(image);

          embed.setFooter({
            text: `${sourceName} • ${new Date(item.pubDate).toLocaleString("id-ID", { hour: '2-digit', minute: '2-digit', hour12: false })}`,
            iconURL: sourceLogo,
          });

          await channel.send({ embeds: [embed] });
          saveSentLink(item.link);
          return; // Kirim satu berita saja per jadwal
        } catch (err) {
          console.error(`Gagal ambil RSS dari ${feedUrl}:`, err.message);
        }
      }
    }
  }, 60_000); // cek setiap 1 menit
};
