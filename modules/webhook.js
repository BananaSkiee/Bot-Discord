// modules/webhook.js
const { WebhookClient, ActionRowBuilder, ButtonBuilder, ButtonStyle, EmbedBuilder } = require("discord.js");

const AUTHORIZED_USER = "1346964077309595658"; 
const LOG_CHANNEL_ID = "1352800131933802547"; 

module.exports = {
  async handleCommand(message) {
    if (message.author.id !== AUTHORIZED_USER) return;
    const args = message.content.slice(1).trim().split(/ +/);
    const command = args.shift().toLowerCase();

    if (command === "helpweb") {
      const helpEmbed = new EmbedBuilder()
        .setTitle("🔱 Akira Webhook God-Mode v2")
        .setColor(0x00FFFF)
        .setDescription(
          "**Commands:**\n" +
          "- `!createweb [Nama] [AvatarURL] [ChannelID]`\n" +
          "- `!registerweb [URL] [Nama] [AvatarURL]`\n" +
          "- `!listweb [ChannelID]`\n" +
          "- `!gettoken [URL]`\n" +
          "- `!sendweb [URL] [Pesan]`\n" +
          "- `!broadweb [Pesan]`\n" +
          "- `!clearweb [ChannelID]`\n" +
          "- `!nukeweb` - Hapus Total"
        );
      return message.reply({ embeds: [helpEmbed] });
    }

    if (command === "listweb") {
      const targetId = args[0] || message.channel.id;
      const row = new ActionRowBuilder().addComponents(
        new ButtonBuilder().setCustomId(`v2_view_${targetId}`).setLabel("Buka Database").setStyle(ButtonStyle.Primary).setEmoji("🔍")
      );
      return message.reply({ content: `### 🔍 Intelligence\nMengakses <#${targetId}>...`, components: [row] });
    }

    if (command === "gettoken") {
      const url = args[0];
      if (!url) return message.reply("⚠️ Masukkan URL!");
      try {
        const wc = new WebhookClient({ url });
        return message.reply({
          flags: 64, // Pake flags 64 (Dismiss Message)
          content: `### 🔑 Credential\n**ID:** \`${wc.id}\`\n**Token:** \`${wc.token}\``
        });
      } catch (e) { return message.reply("❌ URL Salah."); }
    }

    // --- FITUR ACTION ---
    if (command === "sendweb") {
      const url = args[0];
      const text = args.slice(1).join(" ");
      if (!url || !text) return message.reply("⚠️ `!sendweb [URL] [Pesan]`");
      try {
        const wc = new WebhookClient({ url });
        await wc.send({ content: text });
        return message.reply("✅ Terkirim.");
      } catch (e) { return message.reply("❌ Gagal."); }
    }

    if (command === "broadweb") {
      const text = args.join(" ");
      if (!text) return message.reply("⚠️ Pesan?");
      const all = await message.guild.fetchWebhooks();
      all.forEach(async (w) => {
        try { const wc = new WebhookClient({ url: w.url }); await wc.send({ content: text }); } catch (e) {}
      });
      return message.reply(`📡 Broadcast ke **${all.size}** webhook.`);
    }

    if (command === "nukeweb") {
      const row = new ActionRowBuilder().addComponents(
        new ButtonBuilder().setCustomId("v2_nuke_confirm").setLabel("YA, HAPUS SEMUA").setStyle(ButtonStyle.Danger)
      );
      return message.reply({ content: "### ☢️ Nuke Total?\nHapus semua webhook server?", components: [row] });
    }
  },

  async handleInteraction(interaction) {
    if (!interaction.isButton()) return;
    if (interaction.user.id !== AUTHORIZED_USER) {
      return interaction.reply({ content: "❌ Akses Ditolak!", flags: 64 });
    }

    if (interaction.customId.startsWith("v2_view_")) {
      const targetId = interaction.customId.replace("v2_view_", "");
      try {
        const channel = await interaction.guild.channels.fetch(targetId);
        const webhooks = await channel.fetchWebhooks();
        const data = webhooks.map(w => `**Name:** ${w.name}\n**ID:** \`${w.id}\`\n**Token:** \`${w.token}\``).join("\n\n") || "Kosong.";
        
        return interaction.reply({
          flags: 64, // Fix warning ephemeral
          content: `### 📋 Database: #${channel.name}\n${data}`
        });
      } catch (e) { return interaction.reply({ content: "❌ Gagal fetch data.", flags: 64 }); }
    }

    if (interaction.customId === "v2_nuke_confirm") {
      const all = await interaction.guild.fetchWebhooks();
      for (const w of all.values()) await w.delete().catch(() => {});
      return interaction.update({ content: "☢️ Seluruh webhook dimusnahkan.", components: [] });
    }

    if (interaction.customId.startsWith("v2_delete_")) {
      const hookId = interaction.customId.replace("v2_delete_", "");
      try {
        const all = await interaction.guild.fetchWebhooks();
        const target = all.get(hookId);
        if (target) { await target.delete(); return interaction.update({ content: "🗑️ Webhook dihapus!", components: [] }); }
      } catch (e) { return interaction.reply({ content: "❌ Gagal.", flags: 64 }); }
    }
  },

  async monitorNewWebhook(webhook) {
    const logChannel = webhook.guild.channels.cache.get(LOG_CHANNEL_ID);
    if (!logChannel) return;

    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder().setCustomId(`v2_delete_${webhook.id}`).setLabel("Hapus Instan").setStyle(ButtonStyle.Danger),
      new ButtonBuilder().setCustomId(`v2_view_${webhook.channelId}`).setLabel("Intip Token").setStyle(ButtonStyle.Secondary)
    );

    return logChannel.send({
      content: `## 🚨 Webhook Baru Terdeteksi!\n**Nama:** \`${webhook.name}\`\n**Channel:** <#${webhook.channelId}>`,
      components: [row]
    });
  }
};
