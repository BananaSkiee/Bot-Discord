// modules/webhook.js
const { WebhookClient, ActionRowBuilder, ButtonBuilder, ButtonStyle, EmbedBuilder } = require("discord.js");

// --- KONFIGURASI ---
const AUTHORIZED_USER = "1346964077309595658"; 
const LOG_CHANNEL_ID = "1352800131933802547"; 

module.exports = {
  // 1. HANDLER COMMAND (Manual Chat)
  async handleCommand(message) {
    if (message.author.id !== AUTHORIZED_USER) return;
    const args = message.content.slice(1).trim().split(/ +/);
    const command = args.shift().toLowerCase();

    // --- HELP WEB ---
    if (command === "helpweb") {
      const helpEmbed = new EmbedBuilder()
        .setTitle("🔱 Akira Webhook God-Mode v2")
        .setColor(0x00FFFF)
        .setDescription(
          "**Management Commands:**\n" +
          "- `!createweb [Nama] [AvatarURL] [ChannelID]`\n" +
          "- `!registerweb [URL] [Nama] [AvatarURL]`\n" +
          "- `!listweb [ChannelID]` (Dismiss Message)\n" +
          "- `!gettoken [URL]` (Dismiss Message)\n\n" +
          "**Action Commands:**\n" +
          "- `!sendweb [URL] [Pesan]`\n" +
          "- `!broadweb [Pesan]` (Kirim ke semua)\n" +
          "- `!clearweb [ChannelID]`\n" +
          "- `!nukeweb` - Hapus Total Server\n\n" +
          "🛡️ **Status Monitoring: AKTIF**"
        )
        .setFooter({ text: "BananaSkiee System • Only Authorized User" });

      return message.reply({ embeds: [helpEmbed] });
    }

    // --- LIST WEB ---
    if (command === "listweb") {
      const targetId = args[0] || message.channel.id;
      const row = new ActionRowBuilder().addComponents(
        new ButtonBuilder().setCustomId(`v2_view_${targetId}`).setLabel("Buka Database Webhook").setStyle(ButtonStyle.Primary).setEmoji("🔍")
      );
      return message.reply({ content: `### 🔍 Intelligence\nMengakses database channel <#${targetId}>...`, components: [row] });
    }

    // --- GET TOKEN ---
    if (command === "gettoken") {
      const url = args[0];
      if (!url) return message.reply("⚠️ Masukkan URL Webhook!");
      try {
        const wc = new WebhookClient({ url });
        return message.reply({
          flags: 64,
          content: `### 🔑 Webhook Credential\n**ID:** \`${wc.id}\`\n**Token:** \`${wc.token}\`\n**URL:** \`${url}\``
        });
      } catch (e) { return message.reply("❌ URL Webhook tidak valid."); }
    }

    // --- CREATE WEB ---
    if (command === "createweb") {
      const name = args[0] || "Akira-System";
      const avatar = args[1] || null;
      const chId = args[2] || message.channel.id;
      try {
        const channel = await message.guild.channels.fetch(chId);
        const wb = await channel.createWebhook({ name, avatar });
        return message.reply(`✅ **Webhook Berhasil Dibuat!**\n**URL:** \`${wb.url}\`\n**Channel:** <#${chId}>`);
      } catch (e) { return message.reply("❌ Gagal membuat webhook. Cek izin bot."); }
    }

    // --- REGISTER/EDIT WEB ---
    if (command === "registerweb") {
      const [url, newName, newAvatar] = args;
      if (!url) return message.reply("⚠️ Masukkan URL Webhook!");
      try {
        const wc = new WebhookClient({ url });
        await wc.edit({ name: newName || undefined, avatar: newAvatar || undefined });
        return message.reply("✅ Webhook data updated successfully.");
      } catch (e) { return message.reply("❌ Gagal mengedit webhook."); }
    }

    // --- SEND WEB ---
    if (command === "sendweb") {
      const url = args[0];
      const text = args.slice(1).join(" ");
      if (!url || !text) return message.reply("⚠️ Format: `!sendweb [URL] [Pesan]`");
      try {
        const wc = new WebhookClient({ url });
        await wc.send({ content: text });
        return message.reply("✅ Pesan terkirim via Webhook.");
      } catch (e) { return message.reply("❌ Gagal mengirim pesan."); }
    }

    // --- BROADCAST WEB ---
    if (command === "broadweb") {
      const text = args.join(" ");
      if (!text) return message.reply("⚠️ Masukkan pesan broadcast!");
      const allHooks = await message.guild.fetchWebhooks();
      allHooks.forEach(async (w) => {
        try {
          const wc = new WebhookClient({ url: w.url });
          await wc.send({ content: text });
        } catch (e) {}
      });
      return message.reply(`📡 Membroadcast pesan ke **${allHooks.size}** webhook.`);
    }

    // --- CLEAR WEB ---
    if (command === "clearweb") {
      const chId = args[0] || message.channel.id;
      try {
        const channel = await message.guild.channels.fetch(chId);
        const hooks = await channel.fetchWebhooks();
        for (const h of hooks.values()) await h.delete();
        return message.reply(`🗑️ Berhasil menghapus **${hooks.size}** webhook di <#${chId}>.`);
      } catch (e) { return message.reply("❌ Gagal membersihkan webhook."); }
    }

    // --- NUKE WEB ---
    if (command === "nukeweb") {
      const row = new ActionRowBuilder().addComponents(
        new ButtonBuilder().setCustomId("v2_nuke_confirm").setLabel("YA, HAPUS SEMUA").setStyle(ButtonStyle.Danger)
      );
      return message.reply({ content: "### ☢️ NUKE CONFIRMATION\nApakah lu yakin ingin menghapus **SEMUA** webhook di server ini?", components: [row] });
    }
  },

  // 2. HANDLER TOMBOL (Owner Only)
  async handleInteraction(interaction) {
    if (!interaction.isButton()) return;

    // PROTEKSI KERAS
    if (interaction.user.id !== AUTHORIZED_USER) {
      return interaction.reply({ content: "❌ **Akses Ditolak!** Cuma Owner yang bisa akses sistem ini.", flags: 64 });
    }

    // View List Database
    if (interaction.customId.startsWith("v2_view_")) {
      const targetId = interaction.customId.replace("v2_view_", "");
      try {
        const channel = await interaction.guild.channels.fetch(targetId);
        const webhooks = await channel.fetchWebhooks();
        
        const data = webhooks.map(w => 
          `**Name:** ${w.name}\n**ID:** \`${w.id}\`\n**Token:** \`${w.token}\`\n**URL:** \`${w.url}\``
        ).join("\n\n") || "Tidak ada webhook di channel ini.";

        return interaction.reply({
          flags: 64,
          content: `### 📋 Database Webhook: #${channel.name}\n${data}\n\n-# © BananaSkiee God-Mode`
        });
      } catch (e) { return interaction.reply({ content: "❌ Gagal fetch data channel.", flags: 64 }); }
    }

    // Nuke All
    if (interaction.customId === "v2_nuke_confirm") {
      const all = await interaction.guild.fetchWebhooks();
      for (const w of all.values()) await w.delete().catch(() => {});
      return interaction.update({ content: "☢️ **Selesai.** Seluruh webhook server telah dimusnahkan.", components: [] });
    }

    // Delete Single (From Log)
    if (interaction.customId.startsWith("v2_delete_")) {
      const hookId = interaction.customId.replace("v2_delete_", "");
      try {
        const allWebs = await interaction.guild.fetchWebhooks();
        const target = allWebs.get(hookId);
        if (target) {
          await target.delete();
          return interaction.update({ content: "🗑️ **Terhapus!** Webhook ilegal berhasil dimusnahkan.", components: [], embeds: [] });
        } else {
          return interaction.reply({ content: "❌ Webhook sudah tidak ada (mungkin sudah dihapus manual).", flags: 64 });
        }
      } catch (e) { return interaction.reply({ content: "❌ Gagal menghapus.", flags: 64 }); }
    }
  },

  // 3. MONITORING OTOMATIS
  async monitorNewWebhook(webhook) {
    const logChannel = webhook.guild.channels.cache.get(LOG_CHANNEL_ID);
    if (!logChannel) return;

    // Audit Log: Siapa pelakunya?
    const auditLogs = await webhook.guild.fetchAuditLogs({ limit: 1, type: 72 });
    const entry = auditLogs.entries.first();
    const executor = entry ? entry.executor.tag : "Unknown Staff";

    const logEmbed = new EmbedBuilder()
      .setTitle("🚨 WEBHOOK BARU TERDETEKSI!")
      .setColor(0xFF0000)
      .addFields(
        { name: "Pelaku", value: `\`${executor}\``, inline: true },
        { name: "Channel", value: `<#${webhook.channelId}>`, inline: true },
        { name: "Nama Webhook", value: `\`${webhook.name}\``, inline: false },
        { name: "ID Webhook", value: `\`${webhook.id}\``, inline: false }
      )
      .setTimestamp();

    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder().setCustomId(`v2_delete_${webhook.id}`).setLabel("Hapus Instan").setStyle(ButtonStyle.Danger),
      new ButtonBuilder().setCustomId(`v2_view_${webhook.channelId}`).setLabel("Intip Token").setStyle(ButtonStyle.Secondary)
    );

    return logChannel.send({ embeds: [logEmbed], components: [row] });
  }
};
