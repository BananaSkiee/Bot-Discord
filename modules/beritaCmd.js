const { EmbedBuilder } = require("discord.js");
const Parser = require("rss-parser");
const fs = require("fs");
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

// Logo untuk tiap sumber berita
const sourceLogos = {
  kompas: "https://www.google.com/imgres?q=kompas%20indonesia&imgurl=https%3A%2F%2Flookaside.fbsbx.com%2Flookaside%2Fcrawler%2Fmedia%2F%3Fmedia_id%3D100064383715647&imgrefurl=https%3A%2F%2Fwww.facebook.com%2FKOMPAScom%2F&docid=vLXEMFclqbeHFM&tbnid=2XREYxgObZ_phM&vet=12ahUKEwjtpuqj7N-OAxWcxzgGHbomIdcQM3oECHYQAA..i&w=250&h=250&hcb=2&ved=2ahUKEwjtpuqj7N-OAxWcxzgGHbomIdcQM3oECHYQAA",
  detik: "https://www.google.com/imgres?q=gambar%20detik&imgurl=https%3A%2F%2Flookaside.fbsbx.com%2Flookaside%2Fcrawler%2Fmedia%2F%3Fmedia_id%3D100064777748241&imgrefurl=https%3A%2F%2Fm.facebook.com%2Fdetikcom%2Fphotos%2F%3Flocale%3Did_ID&docid=ISkmBtDWCczfNM&tbnid=-0cibm8I0OpnyM&vet=12ahUKEwiG0saR7N-OAxX-zjgGHWcrJ6QQM3oECBkQAA..i&w=348&h=348&hcb=2&ved=2ahUKEwiG0saR7N-OAxX-zjgGHWcrJ6QQM3oECBkQAA",
  cnn: "https://www.google.com/imgres?q=gambar%20cnn&imgurl=https%3A%2F%2Fupload.wikimedia.org%2Fwikipedia%2Fcommons%2F6%2F66%2FCNN_International_logo.svg&imgrefurl=https%3A%2F%2Fid.wikipedia.org%2Fwiki%2FCNN_International&docid=k58Ww738S1ty-M&tbnid=Gu-vfbT-qgWqaM&vet=12ahUKEwjpztb869-OAxWoZyoJHe7-N_oQM3oECBMQAA..i&w=1000&h=1000&hcb=2&ved=2ahUKEwjpztb869-OAxWoZyoJHe7-N_oQM3oECBMQAA",
  antara: "https://www.google.com/imgres?q=antara&imgurl=https%3A%2F%2Fs3-id-jkt-1.kilatstorage.id%2Fcdn-andienaisyahcom%2F2024%2F09%2Flogo-antara-news.jpg&imgrefurl=https%3A%2F%2Fandienaisyah.com%2Fauthor%2Fantaranews%2Findex.html&docid=iNS5xPfcp4FgTM&tbnid=5O2X14R5zJY61M&vet=12ahUKEwjs5t6x7N-OAxXCzzgGHeAmIbwQM3oECGIQAA..i&w=400&h=400&hcb=2&ved=2ahUKEwjs5t6x7N-OAxXCzzgGHeAmIbwQM3oECGIQAA",
  tempo: "https://www.google.com/imgres?q=tempo.co%20gambar&imgurl=https%3A%2F%2Flookaside.fbsbx.com%2Flookaside%2Fcrawler%2Fmedia%2F%3Fmedia_id%3D100064636346470&imgrefurl=https%3A%2F%2Fwww.facebook.com%2FMajalahTempoOfficial%2F&docid=bAamPagDRAEnOM&tbnid=NWxSaVaq8kHC7M&vet=12ahUKEwiIvKXS7N-OAxX2yjgGHcc1IYMQM3oECBYQAA..i&w=2048&h=2048&hcb=2&ved=2ahUKEwiIvKXS7N-OAxX2yjgGHcc1IYMQM3oECBYQAA",
  merdeka: "https://www.google.com/imgres?q=merdeka.com%20gambar&imgurl=https%3A%2F%2Fthumbor.prod.vidiocdn.com%2FFxcUUDCyMZFMKMnQ3IFIomg3fW0%3D%2Ffilters%3Astrip_icc()%3Aquality(70)%2Fvidio-web-prod-user%2Fuploads%2Fuser%2Favatar%2F217032%2FAsset5-f8975df16c36beac.png&imgrefurl=https%3A%2F%2Fwww.vidio.com%2F%40merdeka&docid=SxzFkCr9kQY0dM&tbnid=nHzfh8_VQrbPmM&vet=12ahUKEwjWwKjv7N-OAxUj4zgGHdP8Mx8QM3oECAwQAA..i&w=663&h=663&hcb=2&itg=1&ved=2ahUKEwjWwKjv7N-OAxUj4zgGHdP8Mx8QM3oECAwQAA",
  republika: "https://www.google.com/imgres?q=republika%20gambar&imgurl=https%3A%2F%2Fplay-lh.googleusercontent.com%2FjXwOKexaM8q_VTu64SybIW5WndjPQLocSvkxCYG9dpxUfQMw20jiUpXnTnfRW-4_Bg&imgrefurl=https%3A%2F%2Fplay.google.com%2Fstore%2Fapps%2Fdetails%3Fid%3Dcom.republika.mobile%26hl%3Did&docid=aiwxwhfH-r-3lM&tbnid=valVTHxnr2g66M&vet=12ahUKEwjTy7r_7N-OAxV7y6ACHdJHBJUQM3oECBIQAA..i&w=512&h=512&hcb=2&ved=2ahUKEwjTy7r_7N-OAxV7y6ACHdJHBJUQM3oECBIQAA",
};

function loadSentLinks() {
  try {
    return JSON.parse(fs.readFileSync("sentLinks.json"));
  } catch (e) {
    return [];
  }
}

function saveSentLinks(links) {
  fs.writeFileSync("sentLinks.json", JSON.stringify(links, null, 2));
}

module.exports = async function beritaCmd(message) {
  const sentLinks = loadSentLinks();

  for (const feedUrl of rssFeeds) {
    try {
      const feed = await parser.parseURL(feedUrl);

      for (const item of feed.items) {
        if (!sentLinks.includes(item.link)) {
          // Cari gambar
          let image = null;
          if (item.enclosure?.url) {
            image = item.enclosure.url;
          } else {
            const match = (item.content || item.contentSnippet || "").match(/<img[^>]+src="([^">]+)"/);
            if (match?.[1]) {
              image = match[1];
            }
          }

          // Tentukan sumber dan logo
          const sourceKey = Object.keys(sourceLogos).find(key => feedUrl.includes(key));
          const sourceLogo = sourceLogos[sourceKey] || null;
          const sourceName = feed.title || "Berita";

          if (image) {
            const embed = new EmbedBuilder()
              .setTitle(item.title || "Berita")
              .setURL(item.link)
              .setDescription(item.contentSnippet?.slice(0, 200) + "..." || "Klik untuk baca selengkapnya.")
              .setImage(image)
              .setColor(Math.floor(Math.random() * 0xffffff))
              .setTimestamp(new Date(item.pubDate || Date.now()))
              .setFooter({
                text: `${sourceName}`,
                iconURL: sourceLogo,
              });

            await message.reply({ embeds: [embed] });
          } else {
            await message.reply(`[📰 ${item.title}](${item.link})`);
          }

          sentLinks.push(item.link);
          saveSentLinks(sentLinks);
          return;
        }
      }
    } catch (err) {
      console.error(`Gagal fetch RSS dari ${feedUrl}:`, err.message);
    }
  }

  await message.reply("Tidak ada berita baru untuk saat ini.");
};
