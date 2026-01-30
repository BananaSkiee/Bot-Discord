// modules/webhook.js
const { EmbedBuilder, WebhookClient, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require("discord.js");

const AUTHORIZED_USER = "1346964077309595658"; 
const LOG_CHANNEL_ID = "1352800131933802547";  

module.exports = {
  async handleCommand(message) {
    if (message.author.id !== AUTHORIZED_USER) return;

    const args = message.content.slice(1).trim().split(/ +/);
    const command = args.shift().toLowerCase();

    // 1. HELP WEB
    if (command === "helpweb") {
      const embed = new EmbedBuilder()
        .setTitle("🔱 Akira Webhook God-Mode v2")
        .setColor(0x00FFFF)
        .setDescription("### 🛠️ Perintah Tersedia\n- `!listweb [ID]` : Intip data webhook\n- `!createweb [Nama]` : Buat baru\n- `!gettoken [URL]` : Ambil ID/Token\n- `!sendweb [URL] [Pesan]` : Kirim pesan\n- `!nukeweb` : Hapus semua");
      
      return message.reply({ embeds: [embed] });
    }

    // 2. LIST WEBHOOK
    if (command === "listweb") {
      const targetId = args[0] || message.channel.id;
      const row = new ActionRowBuilder().addComponents(
        new ButtonBuilder().setCustomId(`v2_view_${targetId}`).setLabel("Buka Data").setStyle(ButtonStyle.Success).setEmoji("🔎")
      );
      return message.reply({ content: `### 📂 Database\nTarget: <#${targetId}>`, components: [row] });
    }

    // 3. GET TOKEN
    if (command === "gettoken") {
      const url = args[0];
      if (!url) return message.reply("⚠️ Masukkan URL!");
      try {
        const wc = new WebhookClient({ url });
        return message.reply({
          flags: 64, // Ephemeral / Dismiss Message
          content: `### 🔑 Webhook Data\n- **ID:** \`${wc.id}\`\n- **Token:** ||${wc.token}||`
        });
      } catch (e) { return message.reply("❌ URL tidak valid."); }
    }

    // 4. CREATE WEBHOOK
    if (command === "createweb") {
      const name = args[0] || "Akira-System";
      try {
        const wb = await message.channel.createWebhook({ name });
        return message.reply({ content: `✅ **Berhasil!**\nURL: \`${wb.url}\`` });
      } catch (e) { return message.reply("❌ Gagal."); }
    }

    // 5. NUKE WEBHOOK
    if (command === "nukeweb") {
      const row = new ActionRowBuilder().addComponents(
        new ButtonBuilder().setCustomId("v2_nuke_confirm").setLabel("YA, HAPUS SEMUA").setStyle(ButtonStyle.Danger)
      );
      return message.reply({ content: "### ☢️ Konfirmasi Nuke\nBeneran mau hapus semua webhook?", components: [row] });
    }
  },

  async handleInteraction(interaction) {
    if (!interaction.isButton() || interaction.user.id !== AUTHORIZED_USER) return;

    if (interaction.customId.startsWith("v2_view_")) {
      await interaction.deferReply({ ephemeral: true });
      const targetId = interaction.customId.replace("v2_view_", "");
      
      try {
        const channel = await interaction.guild.channels.fetch(targetId);
        const webhooks = await channel.fetchWebhooks();
        const data = webhooks.map(w => `**${w.name}**\n\`${w.url}\``).join("\n\n") || "Tidak ada webhook.";

        return interaction.editReply({
          content: `### 📋 List Webhook (#${channel.name})\n${data}`
        });
      } catch (e) {
        return interaction.editReply({ content: "❌ Gagal mengambil data." });
      }
    }

    if (interaction.customId === "v2_nuke_confirm") {
      const all = await interaction.guild.fetchWebhooks();
      for (const w of all.values()) await w.delete().catch(() => {});
      return interaction.update({ content: `✅ **${all.size} Webhook** dimusnahkan.`, components: [] });
    }
  }
};
