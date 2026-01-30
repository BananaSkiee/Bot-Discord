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

module.exports = {
  // --- ⚙️ HANDLER SEMUA COMMAND ---
  async handleCommand(message) {
    const args = message.content.slice(1).trim().split(/ +/);
    const command = args.shift().toLowerCase();

    if (!message.member.permissions.has(PermissionFlagsBits.Administrator)) return;

    // --- 📖 1. HELP WEB (Menu Utama) ---
    if (command === "helpweb") {
      const helpEmbed = new EmbedBuilder()
        .setTitle("🔱 Akira Webhook Ultimate System")
        .setThumbnail(message.guild.iconURL())
        .setColor(0x00FFFF)
        .setDescription("🛡️ **Security Status:** `PROTECTED`\nSistem monitoring dan manajemen webhook otomatis.")
        .addFields(
          { name: "📡 Delivery & Testing", value: "• `!sendweb [URL] [Pesan]`\n• `!broadweb [Pesan]` - Kirim ke semua channel.", inline: false },
          { name: "📋 Intelligence", value: "• `!listweb` - Intip webhook channel.\n• `!checkweb [URL]` - Cek info & kesehatan.", inline: false },
          { name: "🗑️ Destructive", value: "• `!clearweb` - Hapus webhook channel.\n• `!nukeweb` - Hapus SEMUA webhook server.", inline: false },
          { name: "🔧 Tools", value: "• `!gettoken [URL]` - Ambil ID/Token via Dismiss Message.", inline: false }
        )
        .setFooter({ text: "BananaSkiee Community Protection", iconURL: message.client.user.displayAvatarURL() });

      return message.reply({ embeds: [helpEmbed] });
    }

    // --- 🔑 2. GET TOKEN (Private via Dismiss Message) ---
    if (command === "gettoken") {
      const url = args[0];
      if (!url) return message.reply("⚠️ Mana link-nya?");
      
      try {
        const wc = new WebhookClient({ url: url });
        return message.reply({
          content: `✅ **Data Webhook Berhasil Diambil:**\n**ID:** \`${wc.id}\`\n**Token:** ||${wc.token}||\n*Pesan ini hanya bisa dilihat oleh lu.*`,
          ephemeral: true // Ini bakal jadi dismiss message
        });
      } catch (err) {
        return message.reply("❌ Link webhook nggak valid!");
      }
    }

    // --- 📋 3. LIST WEB ---
    if (command === "listweb") {
      const target = args[0] || message.channel.id;
      const channel = await message.guild.channels.fetch(target);
      const webhooks = await channel.fetchWebhooks();

      const embed = new EmbedBuilder()
        .setTitle(`🌐 Webhooks di #${channel.name}`)
        .setColor(0x2B2D31)
        .setDescription(webhooks.size > 0 ? webhooks.map(w => `🔹 **Name:** ${w.name}\nID: \`${w.id}\``).join("\n\n") : "Kosong melompong.");

      return message.reply({ embeds: [embed] });
    }

    // --- 🚀 4. BROADWEB (Kirim ke Semua Webhook Server) ---
    if (command === "broadweb") {
      const content = args.join(" ");
      if (!content) return message.reply("⚠️ Isi pesannya apa?");
      
      const allWebhooks = await message.guild.fetchWebhooks();
      let count = 0;

      for (const w of allWebhooks.values()) {
        const wc = new WebhookClient({ url: w.url });
        await wc.send({ content: content, username: "Akira Broadcast" });
        count++;
      }
      return message.reply(`📢 Broadcast terkirim ke **${count}** webhook.`);
    }

    // --- 🧹 5. CLEARWEB ---
    if (command === "clearweb") {
      const webhooks = await message.channel.fetchWebhooks();
      for (const w of webhooks.values()) await w.delete("Cleanup");
      return message.reply("🗑️ Channel ini sekarang bersih dari webhook.");
    }

    // --- ☢️ 6. NUKEWEB (Super Berbahaya!) ---
    if (command === "nukeweb") {
      const confirmEmbed = new EmbedBuilder()
        .setTitle("⚠️ KONFIRMASI PENGHAPUSAN MASSAL")
        .setDescription("Tindakan ini akan menghapus **SELURUH** webhook di server ini! Lu yakin?")
        .setColor(0xFF0000);

      const row = new ActionRowBuilder().addComponents(
        new ButtonBuilder().setCustomId("nuke_yes").setLabel("YA, HAPUS SEMUA").setStyle(ButtonStyle.Danger),
        new ButtonBuilder().setCustomId("nuke_no").setLabel("BATAL").setStyle(ButtonStyle.Secondary)
      );

      const msg = await message.reply({ embeds: [confirmEmbed], components: [row] });
      const collect = msg.createMessageComponentCollector({ componentType: ComponentType.Button, time: 15000 });

      collect.on("collect", async (i) => {
        if (i.user.id !== message.author.id) return i.reply({ content: "Bukan urusan lu!", ephemeral: true });
        if (i.customId === "nuke_yes") {
          const all = await message.guild.fetchWebhooks();
          all.forEach(w => w.delete());
          await i.update({ content: `☢️ **${all.size}** Webhook telah dimusnahkan!`, embeds: [], components: [] });
        } else {
          await i.update({ content: "❌ Nuke dibatalkan.", embeds: [], components: [] });
        }
      });
    }
  },

  // --- 🚨 7. MONITORING & APPROVAL SYSTEM (Real-time) ---
  async monitorNewWebhook(webhook) {
    const LOG_CHANNEL = "1352800131933802547";
    const ADMIN_ROLE = "1346964077309595658";
    const channel = webhook.guild.channels.cache.get(LOG_CHANNEL);
    if (!channel) return;

    const embed = new EmbedBuilder()
      .setTitle("🚨 DETEKSI WEBHOOK ILEGAL")
      .setColor(0xFF0000)
      .setThumbnail("https://i.imgur.com/A6uSQuX.png") // Gambar peringatan
      .addFields(
        { name: "📍 Lokasi", value: `<#${webhook.channelId}>`, inline: true },
        { name: "📛 Nama", value: `\`${webhook.name}\``, inline: true },
        { name: "🆔 ID", value: `\`${webhook.id}\``, inline: false },
        { name: "🛡️ Status", value: "Menunggu Keputusan Admin..." }
      )
      .setTimestamp();

    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder().setCustomId(`allow_${webhook.id}`).setLabel("IZINKAN").setStyle(ButtonStyle.Success),
      new ButtonBuilder().setCustomId(`deny_${webhook.id}`).setLabel("HAPUS SEKARANG").setStyle(ButtonStyle.Danger),
      new ButtonBuilder().setCustomId(`view_${webhook.id}`).setLabel("LIHAT TOKEN").setStyle(ButtonStyle.Secondary)
    );

    const msg = await channel.send({ content: `<@&${ADMIN_ROLE}>`, embeds: [embed], components: [row] });

    const collector = msg.createMessageComponentCollector({ componentType: ComponentType.Button });

    collector.on("collect", async (i) => {
      if (!i.member.roles.cache.has(ADMIN_ROLE)) return i.reply({ content: "Lu siapa iseng klik-klik?", ephemeral: true });

      if (i.customId === `allow_${webhook.id}`) {
        await i.update({ content: `✅ Webhook disetujui oleh **${i.user.tag}**`, embeds: [embed.setColor(0x00FF00)], components: [] });
      } 
      else if (i.customId === `deny_${webhook.id}`) {
        await webhook.delete("Unauthorized creation");
        await i.update({ content: `🗑️ Webhook dimusnahkan oleh **${i.user.tag}**`, embeds: [embed.setColor(0x808080)], components: [] });
      }
      else if (i.customId === `view_${webhook.id}`) {
        // FITUR DISMISS MESSAGE: Token cuma kelihatan buat yang nge-klik
        await i.reply({ content: `🔑 **Token Webhook:**\n\`${webhook.token}\``, ephemeral: true });
      }
    });
  }
};
