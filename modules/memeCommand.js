// modules/memeCommand.js
const {
  SlashCommandBuilder,
  MessageFlags,
  ContainerBuilder,
  SectionBuilder,
  TextDisplayBuilder,
  MediaGalleryBuilder,
  MediaGalleryItemBuilder,
  ButtonBuilder,
  ButtonStyle,
  ActionRowBuilder,
} = require("discord.js");
const axios = require("axios");

module.exports = {
  // Menggunakan SlashCommandBuilder untuk implementasi modern
  data: new SlashCommandBuilder()
    .setName('meme')
    .setDescription('Mengirim meme acak dari Reddit (menggunakan Components V2)'),

  /**
   * @param {import('discord.js').CommandInteraction} interaction
   */
  run: async (client, interaction) => {
    // Balas segera untuk menunda waktu pengambilan (ephemeral)
    await interaction.deferReply(); 

    try {
      // Mengambil hanya 1 meme (tidak perlu /5 seperti sebelumnya)
      const res = await axios.get("https://meme-api.com/gimme/memeIndonesia");
      const meme = res.data.memes[0]; // Ambil meme pertama dari array

      // --- 1. Komponen Gambar (MediaGallery) ---
      const mediaGallery = new MediaGalleryBuilder().addItems(
        new MediaGalleryItemBuilder().setURL(meme.url)
      );

      // --- 2. Komponen Teks (Section/TextDisplay) ---
      const sectionHeader = new SectionBuilder()
        .addTextDisplayComponents(
          new TextDisplayBuilder().setContent(`**${meme.title}**`) // Judul
        )
        // Menambahkan Button Accessory untuk Link Post
        .setButtonAccessory(
          new ButtonBuilder()
            .setLabel('Lihat Postingan')
            .setURL(meme.postLink)
            .setStyle(ButtonStyle.Link)
        );

      const sectionFooter = new SectionBuilder()
        .addTextDisplayComponents(
          new TextDisplayBuilder().setContent(`Dari subreddit: ${meme.subreddit}`) // Footer
        );

      // --- 3. Komponen Utama (Container) ---
      const memeContainer = new ContainerBuilder()
        .setAccentColor(0xFF4500) // Warna Oranye Reddit (atau ganti sesuai selera)
        .addMediaGalleryComponents(mediaGallery) // Tampilkan gambar dulu
        .addSectionComponents(sectionHeader)   // Tampilkan judul dan link
        .addSectionComponents(sectionFooter);  // Tampilkan Subreddit

      // --- 4. Kirim Balasan ---
      await interaction.editReply({
        components: [memeContainer],
        flags: MessageFlags.IsComponentsV2,
      });

    } catch (err) {
      console.error("Gagal ambil meme:", err);
      await interaction.editReply({ 
        content: "❌ Gagal mengambil meme. Coba lagi nanti!",
        components: [], // Pastikan tidak ada komponen V2 jika gagal
      });
    }
  },
};
