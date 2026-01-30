// modules/webhook.js
const { WebhookClient, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require("discord.js");

const AUTHORIZED_USER = "1346964077309595658"; 
const LOG_CHANNEL_ID = "1352800131933802547"; 

module.exports = {
  async handleCommand(message) {
    if (message.author.id !== AUTHORIZED_USER) return;
    const args = message.content.slice(1).trim().split(/ +/);
    const command = args.shift().toLowerCase();

    // 1. HELP WEB
    if (command === "helpweb") {
      return message.reply({
        components: [{
          type: 1,
          components: [{
            type: 10,
            content: "### 🔱 Akira Webhook God-Mode v2\n- `!createweb [Nama] [Avatar] [ChannelID]`\n- `!registerweb [URL] [Nama] [Avatar]`\n- `!listweb [ChannelID]`\n- `!gettoken [URL]`\n- `!sendweb [URL] [Pesan]`\n- `!broadweb [Pesan]`\n- `!clearweb [ChannelID]`\n- `!nukeweb` - Hapus Total"
          }]
        }]
      });
    }

    // 2. LISTWEB
    if (command === "listweb") {
      const targetId = args[0] || message.channel.id;
      const row = new ActionRowBuilder().addComponents(
        new ButtonBuilder().setCustomId(`v2_view_${targetId}`).setLabel("Buka Database").setStyle(ButtonStyle.Primary).setEmoji("🔍")
      );
      return message.reply({ content: `### 🔍 Intelligence\nMengakses <#${targetId}>...`, components: [row] });
    }

    // 3. GETTOKEN (AMBIL TOKEN DARI URL)
    if (command === "gettoken") {
      const url = args[0];
      if (!url) return message.reply("⚠️ Masukkan URL!");
      try {
        const wc = new WebhookClient({ url });
        return message.reply({
          flags: 64,
          components: [{ type: 1, components: [{ type: 10, content: `### 🔑 Credential\n- **ID:** \`${wc.id}\`\n- **Token:** \`${wc.token}\`` }] }]
        });
      } catch (e) { return message.reply("❌ URL Salah."); }
    }

    // 4. CREATEWEB
    if (command === "createweb") {
      const name = args[0] || "Akira-System";
      const avatar = args[1] || null;
      const chId = args[2] || message.channel.id;
      try {
        const channel = await message.guild.channels.fetch(chId);
        const wb = await channel.createWebhook({ name, avatar });
        return message.reply(`✅ **Dibuat!**\nURL: \`${wb.url}\``);
      } catch (e) { return message.reply("❌ Gagal."); }
    }

    // 5. REGISTER/EDIT WEB
    if (command === "registerweb") {
      const [url, name, avatar] = args;
      if (!url) return message.reply("⚠️ URL mana?");
      try {
        const wc = new WebhookClient({ url });
        await wc.edit({ name: name || undefined, avatar: avatar || undefined });
        return message.reply("✅ Updated.");
      } catch (e) { return message.reply("❌ Gagal."); }
    }

    // 6. SENDWEB
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

    // 7. BROADWEB (KIRIM KE SEMUA)
    if (command === "broadweb") {
      const text = args.join(" ");
      if (!text) return message.reply("⚠️ Pesan?");
      const all = await message.guild.fetchWebhooks();
      all.forEach(async (w) => {
        const wc = new WebhookClient({ url: w.url });
        await wc.send({ content: text }).catch(() => {});
      });
      return message.reply(`📡 Broadcast ke **${all.size}** webhook.`);
    }

    // 8. CLEARWEB & NUKEWEB
    if (command === "clearweb") {
      const chId = args[0] || message.channel.id;
      const hooks = await (await message.guild.channels.fetch(chId)).fetchWebhooks();
      hooks.forEach(async (w) => await w.delete());
      return message.reply(`🗑️ **${hooks.size}** webhook dihapus dari <#${chId}>.`);
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
        // INI FITUR AMBIL TOKENNYA
        const data = webhooks.map(w => `**${w.name}**\nID: \`${w.id}\`\nToken: \`${w.token}\`\nURL: \`${w.url}\``).join("\n\n") || "Kosong.";
        return interaction.reply({
          flags: 64,
          components: [{
            type: 1, components: [
              { type: 10, content: `### 📋 Database: #${channel.name}\n${data}` },
              { type: 14 },
              { type: 10, content: "-# © BananaSkiee Protection" }
            ]
          }]
        });
      } catch (e) { return interaction.reply({ content: "❌ Error.", flags: 64 }); }
    }

    if (interaction.customId === "v2_nuke_confirm") {
      const all = await interaction.guild.fetchWebhooks();
      for (const w of all.values()) await w.delete().catch(() => {});
      return interaction.update({ content: "☢️ Webhook dimusnahkan.", components: [] });
    }

    if (interaction.customId.startsWith("v2_delete_")) {
      const hookId = interaction.customId.replace("v2_delete_", "");
      const allWebhooks = await interaction.guild.fetchWebhooks();
      const target = allWebhooks.get(hookId);
      if (target) {
        await target.delete();
        return interaction.update({ content: "🗑️ Webhook Ilegal Dihapus!", components: [] });
      }
    }
  },

  async monitorNewWebhook(webhook) {
    const logChannel = webhook.guild.channels.cache.get(LOG_CHANNEL_ID);
    if (!logChannel) return;

    const auditLogs = await webhook.guild.fetchAuditLogs({ limit: 1, type: 72 });
    const entry = auditLogs.entries.first();
    const creator = entry ? entry.executor.tag : "Unknown";

    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder().setCustomId(`v2_delete_${webhook.id}`).setLabel("Hapus Instan").setStyle(ButtonStyle.Danger),
      new ButtonBuilder().setCustomId(`v2_view_${webhook.channelId}`).setLabel("Intip Token").setStyle(ButtonStyle.Secondary)
    );

    return logChannel.send({
      content: "## 🚨 Webhook Baru Terdeteksi!",
      components: [{
        type: 1, components: [{
          type: 10, content: `**Oleh:** ${creator}\n**Nama:** \`${webhook.name}\`\n**Channel:** <#${webhook.channelId}>`
        }]
      }, row]
    });
  }
};
