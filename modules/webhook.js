// modules/webhook.js
const { WebhookClient, ActionRowBuilder, ButtonBuilder, ButtonStyle, ComponentType } = require("discord.js");

// --- KONFIGURASI PRIVATE ---
const AUTHORIZED_USER = "1346964077309595658"; 
const LOG_CHANNEL_ID = "1352800131933802547";  

module.exports = {
  async handleCommand(message) {
    if (message.author.id !== AUTHORIZED_USER) return;

    const args = message.content.slice(1).trim().split(/ +/);
    const command = args.shift().toLowerCase();

    // 1. HELP WEB (Layout v2)
    if (command === "helpweb") {
      return message.reply({
        components: [{
          type: 1,
          components: [{
            type: 10,
            content: "### 🔱 Akira Webhook God-Mode v2\n- `!listweb [ID]` : Intip semua webhook\n- `!createweb [Nama] [Avatar]` : Buat baru\n- `!registerweb [URL] [Nama]` : Edit webhook ada\n- `!gettoken [URL]` : Ambil ID & Token\n- `!sendweb [URL] [Pesan]` : Kirim via Hook\n- `!nukeweb` : Hapus Total Server\n\n> -# © BananaSkiee Protection System"
          }]
        }]
      });
    }

    // 2. LIST WEBHOOK
    if (command === "listweb") {
      const targetId = args[0] || message.channel.id;
      const row = new ActionRowBuilder().addComponents(
        new ButtonBuilder().setCustomId(`v2_view_${targetId}`).setLabel("Buka Database").setStyle(ButtonStyle.Success).setEmoji("🔎")
      );
      return message.reply({ 
        content: `### 📂 Accessing Database...\nTarget: <#${targetId}>`, 
        components: [row] 
      });
    }

    // 3. GET TOKEN (Dismiss Message v2)
    if (command === "gettoken") {
      const url = args[0];
      if (!url) return message.reply("⚠️ Masukkan URL!");
      try {
        const wc = new WebhookClient({ url });
        return message.reply({
          flags: 64,
          components: [{
            type: 1,
            components: [{
              type: 10,
              content: `### 🔑 Credential Found\n- **ID:** \`${wc.id}\`\n- **Token:** \`${wc.token}\`\n\n-# Peringatan: Data ini sangat sensitif.`
            }]
          }]
        });
      } catch (e) { return message.reply("❌ URL tidak valid."); }
    }

    // 4. CREATE WEBHOOK
    if (command === "createweb") {
      const name = args[0] || "Akira-System";
      const avatar = args[1] || null;
      try {
        const wb = await message.channel.createWebhook({ name, avatar });
        return message.reply({ 
          flags: 64, 
          content: `### ✅ Webhook Created\n**URL:** \`${wb.url}\`` 
        });
      } catch (e) { return message.reply("❌ Gagal membuat webhook."); }
    }

    // 5. REGISTER/EDIT WEBHOOK
    if (command === "registerweb") {
      const [url, newName] = args;
      if (!url) return message.reply("⚠️ Format: `!registerweb [URL] [NamaBaru]`");
      try {
        const wc = new WebhookClient({ url });
        await wc.edit({ name: newName });
        return message.reply("✅ Webhook berhasil di-update.");
      } catch (e) { return message.reply("❌ Gagal mengedit."); }
    }

    // 6. SEND WEBHOOK
    if (command === "sendweb") {
      const url = args[0];
      const text = args.slice(1).join(" ");
      if (!url || !text) return message.reply("⚠️ Format: `!sendweb [URL] [Pesan]`");
      try {
        const wc = new WebhookClient({ url });
        await wc.send({ content: text });
        return message.reply("✅ Pesan terkirim.");
      } catch (e) { return message.reply("❌ Gagal kirim."); }
    }

    // 7. NUKE WEBHOOK
    if (command === "nukeweb") {
      const row = new ActionRowBuilder().addComponents(
        new ButtonBuilder().setCustomId("v2_nuke_confirm").setLabel("YA, HAPUS SEMUA").setStyle(ButtonStyle.Danger)
      );
      return message.reply({ 
        content: "### ☢️ Peringatan Nuke\nKlik tombol di bawah untuk menghapus **SEMUA** webhook di server ini.", 
        components: [row] 
      });
    }
  },

  // HANDLER INTERAKSI (Tombol & Dismiss)
  async handleInteraction(interaction) {
    if (!interaction.isButton() || interaction.user.id !== AUTHORIZED_USER) return;

    // View List Handler
    if (interaction.customId.startsWith("v2_view_")) {
      const targetId = interaction.customId.replace("v2_view_", "");
      try {
        const channel = await interaction.guild.channels.fetch(targetId);
        const webhooks = await channel.fetchWebhooks();
        const data = webhooks.map(w => `- **${w.name}**\n  URL: \`${w.url}\``).join("\n\n") || "Tidak ada webhook.";

        return interaction.reply({
          flags: 64,
          components: [{
            type: 1,
            components: [
              { type: 10, content: `### 📋 List Webhook (#${channel.name})\n${data}` },
              { type: 14 },
              { type: 10, content: "-# © Database System by BananaSkiee" }
            ]
          }]
        });
      } catch (e) { return interaction.reply({ content: "❌ Error fetch data.", flags: 64 }); }
    }

    // Nuke Handler
    if (interaction.customId === "v2_nuke_confirm") {
      const all = await interaction.guild.fetchWebhooks();
      for (const w of all.values()) await w.delete().catch(() => {});
      return interaction.update({ content: `✅ **${all.size} Webhook** dimusnahkan.`, components: [] });
    }
  }
};
