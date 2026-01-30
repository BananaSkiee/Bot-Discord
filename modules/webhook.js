// modules/webhook.js
const { 
  EmbedBuilder, 
  PermissionFlagsBits, 
  WebhookClient, 
  ActionRowBuilder, 
  ButtonBuilder, 
  ButtonStyle, 
  ComponentType 
} = require("discord.js");

// --- KONFIGURASI PRIVATE ---
const AUTHORIZED_USER = "1346964077309595658"; // Hanya ID ini yang bisa pakai command
const LOG_CHANNEL_ID = "1352800131933802547";  // Channel Log Webhook
const ADMIN_ROLE_ID = "1346964077309595658";   // Role yang di-tag jika ada penyusup

module.exports = {
  async handleCommand(message) {
    // PROTEKSI: Cuma Lu (Owner) yang bisa akses
    if (message.author.id !== AUTHORIZED_USER) return;

    const args = message.content.slice(1).trim().split(/ +/);
    const command = args.shift().toLowerCase();

    // --- 1. COMMAND: !helpweb ---
    if (command === "helpweb") {
      const helpEmbed = new EmbedBuilder()
        .setTitle("🔱 Akira Webhook God-Mode v2")
        .setColor(0x00FFFF)
        .setThumbnail(message.client.user.displayAvatarURL())
        .setDescription("Sistem kontrol penuh webhook server. **Owner Access Only.**")
        .addFields(
          { name: "🛠️ Management", value: "`!createweb [Nama] [AvatarURL] [ChannelID]`\n`!registerweb [URL] [Nama] [AvatarURL]`", inline: false },
          { name: "🔍 Intelligence", value: "`!listweb [ChannelID]` (Dismiss Message)\n`!gettoken [URL]` (Dismiss Message)", inline: false },
          { name: "📡 Delivery", value: "`!sendweb [URL] [Pesan]`\n`!broadweb [Pesan]`", inline: false },
          { name: "☢️ Destructive", value: "`!clearweb [ChannelID]`\n`!nukeweb` - Hapus Total", inline: false }
        )
        .setFooter({ text: "BananaSkiee Community Protection", iconURL: message.guild.iconURL() });

      return message.reply({ embeds: [helpEmbed] });
    }

    // --- 2. COMMAND: !listweb [ChannelID] (DENGAN DISMISS MESSAGE) ---
    if (command === "listweb") {
      const targetId = args[0] || message.channel.id;
      const row = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
          .setCustomId(`view_list_${targetId}`)
          .setLabel("Lihat Daftar Webhook (Private)")
          .setStyle(ButtonStyle.Primary)
          .setEmoji("🔍")
      );

      const msg = await message.reply({
        content: `Mempersiapkan data untuk channel <#${targetId}>...`,
        components: [row]
      });

      const collector = msg.createMessageComponentCollector({ 
        componentType: ComponentType.Button, 
        time: 60000 
      });

      collector.on('collect', async (i) => {
        if (i.user.id !== AUTHORIZED_USER) return i.reply({ content: "❌ Lu bukan Owner!", ephemeral: true });
        
        try {
          const channel = await i.guild.channels.fetch(targetId);
          const webhooks = await channel.fetchWebhooks();

          if (webhooks.size === 0) return i.reply({ content: "❌ Tidak ada webhook di channel ini.", ephemeral: true });

          const listEmbed = new EmbedBuilder()
            .setTitle(`📋 List Webhook: #${channel.name}`)
            .setColor(0x2B2D31)
            .setDescription(webhooks.map(w => 
              `**Nama:** ${w.name}\n**ID:** \`${w.id}\`\n**Token:** ||${w.token}||\n**URL:** [Copy Link](${w.url})\n───────────────`
            ).join("\n"));

          await i.reply({ embeds: [listEmbed], ephemeral: true });
        } catch (e) {
          await i.reply({ content: "❌ Gagal fetch data. ID Channel salah?", ephemeral: true });
        }
      });
      return;
    }

    // --- 3. COMMAND: !gettoken [URL] (DISMISS MESSAGE) ---
    if (command === "gettoken") {
      const url = args[0];
      if (!url) return message.reply("⚠️ Masukkan URL Webhook!");

      try {
        const wc = new WebhookClient({ url: url });
        return message.reply({
          content: `🔑 **Data Webhook Ditemukan:**\n**ID:** \`${wc.id}\`\n**Token:** ||${wc.token}||\n*Pesan ini hanya bisa dilihat oleh lu.*`,
          ephemeral: true
        });
      } catch (e) {
        return message.reply("❌ Link Webhook tidak valid.");
      }
    }

    // --- 4. COMMAND: !createweb [Nama] [AvatarURL] [ChannelID] ---
    if (command === "createweb") {
      const name = args[0] || "Akira Webhook";
      const avatar = args[1] || null;
      const channelId = args[2] || message.channel.id;

      try {
        const channel = await message.guild.channels.fetch(channelId);
        const webhook = await channel.createWebhook({
          name: name,
          avatar: avatar,
          reason: `Created by Owner (${message.author.tag})`
        });

        const embed = new EmbedBuilder()
          .setTitle("✨ Webhook Berhasil Dibuat")
          .setColor(0x00FF00)
          .addFields(
            { name: "Nama", value: name, inline: true },
            { name: "Channel", value: `<#${channel.id}>`, inline: true },
            { name: "URL (Private)", value: `||${webhook.url}||`, inline: false }
          );

        return message.reply({ embeds: [embed] });
      } catch (e) { return message.reply(`❌ Gagal: ${e.message}`); }
    }

    // --- 5. COMMAND: !registerweb [URL] [NamaBaru] [AvatarBaru] ---
    if (command === "registerweb") {
      const [url, newName, newAvatar] = args;
      if (!url) return message.reply("⚠️ Masukkan URL Webhook!");

      try {
        const wc = new WebhookClient({ url });
        await wc.edit({
          name: newName || undefined,
          avatar: newAvatar || undefined
        });
        return message.reply("✅ Webhook berhasil di-update dan di-register ulang.");
      } catch (e) { return message.reply("❌ Gagal mengedit webhook."); }
    }

    // --- 6. COMMAND: !nukeweb (Hapus Semua) ---
    if (command === "nukeweb") {
      const confirmRow = new ActionRowBuilder().addComponents(
        new ButtonBuilder().setCustomId("nuke_yes").setLabel("YA, HAPUS SEMUA").setStyle(ButtonStyle.Danger),
        new ButtonBuilder().setCustomId("nuke_no").setLabel("BATAL").setStyle(ButtonStyle.Secondary)
      );

      const msg = await message.reply({
        content: "☢️ **PERINGATAN KERAS!** Lu mau hapus SEMUA webhook di server ini?",
        components: [confirmRow]
      });

      const coll = msg.createMessageComponentCollector({ componentType: ComponentType.Button, time: 15000 });
      coll.on('collect', async (i) => {
        if (i.user.id !== AUTHORIZED_USER) return;
        if (i.customId === "nuke_yes") {
          const all = await message.guild.fetchWebhooks();
          for (const w of all.values()) await w.delete();
          await i.update({ content: `☢️ **${all.size}** Webhook telah dimusnahkan.`, components: [] });
        } else {
          await i.update({ content: "❌ Nuke dibatalkan.", components: [] });
        }
      });
    }
  },

  // --- FITUR AUTO MONITORING ---
  async monitorNewWebhook(webhook) {
    const logChannel = webhook.guild.channels.cache.get(LOG_CHANNEL_ID);
    if (!logChannel) return;

    const alertEmbed = new EmbedBuilder()
      .setTitle("🚨 WEBHOOK ILEGAL TERDETEKSI!")
      .setColor(0xFF0000)
      .setDescription(`Dibuat di channel <#${webhook.channelId}>`)
      .addFields(
        { name: "Nama Webhook", value: `\`${webhook.name}\``, inline: true },
        { name: "ID", value: `\`${webhook.id}\``, inline: true }
      )
      .setTimestamp();

    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder().setCustomId(`deny_${webhook.id}`).setLabel("HAPUS").setStyle(ButtonStyle.Danger),
      new ButtonBuilder().setCustomId(`view_${webhook.id}`).setLabel("LIHAT TOKEN").setStyle(ButtonStyle.Secondary)
    );

    const msg = await logChannel.send({
      content: `<@&${ADMIN_ROLE_ID}>`,
      embeds: [alertEmbed],
      components: [row]
    });

    const collector = msg.createMessageComponentCollector({ componentType: ComponentType.Button });

    collector.on("collect", async (i) => {
      if (i.user.id !== AUTHORIZED_USER) return i.reply({ content: "Cuma OWNER yang boleh eksekusi!", ephemeral: true });

      if (i.customId === `deny_${webhook.id}`) {
        await webhook.delete().catch(() => {});
        await i.update({ content: "🗑️ Webhook telah dihapus.", embeds: [], components: [] });
      } else if (i.customId === `view_${webhook.id}`) {
        await i.reply({ content: `🔑 **Token:** \`${webhook.token}\``, ephemeral: true });
      }
    });
  }
};
