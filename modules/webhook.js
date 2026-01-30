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

// OWNER ID yang bisa pakai command (Hanya Lu)
const AUTHORIZED_USER = "1346964077309595658";
const LOG_CHANNEL_ID = "1352800131933802547";
const ADMIN_ROLE_ID = "1346964077309595658"; // Role yang di-tag saat ada penyusup

module.exports = {
  async handleCommand(message) {
    // PROTEKSI: Cuma ID Lu yang bisa jalanin command !
    if (message.author.id !== AUTHORIZED_USER) return;

    const args = message.content.slice(1).trim().split(/ +/);
    const command = args.shift().toLowerCase();

    // --- 1. !helpweb ---
    if (command === "helpweb") {
      const help = new EmbedBuilder()
        .setTitle("🔱 Akira Webhook God-Mode (Owner Only)")
        .setColor(0x00FFFF)
        .addFields(
          { name: "📝 Management", value: "`!registerweb [URL] [Nama] [URL_Gambar] [Channel_ID]`\n`!createweb [Nama] [URL_Gambar] [Channel_ID]`" },
          { name: "📡 Control", value: "`!listweb`, `!gettoken [URL]`, `!sendweb [URL] [Pesan]`, `!broadweb [Pesan]`" },
          { name: "☢️ Clean", value: "`!clearweb [Channel_ID]`, `!nukeweb`" }
        )
        .setFooter({ text: "Owner Access Granted" });
      return message.reply({ embeds: [help] });
    }

    // --- 2. !registerweb [URL] [Nama] [URL_Gambar] [Channel_ID] ---
    if (command === "registerweb") {
        const [url, name, avatar, channelId] = args;
        if (!url) return message.reply("⚠️ Mana URL Webhooknya?");
        
        try {
            const wc = new WebhookClient({ url: url });
            const targetChannel = channelId ? await message.guild.channels.fetch(channelId) : message.channel;
            
            // Edit webhook yang sudah ada (Register & Sync)
            await wc.edit({ name: name || "Registered Webhook", avatar: avatar || null });
            
            return message.reply({
                embeds: [new EmbedBuilder()
                    .setTitle("✅ Webhook Registered")
                    .setColor(0x2ecc71)
                    .addFields(
                        { name: "Target Channel", value: `<#${targetChannel.id}>` },
                        { name: "New Name", value: name || "Default" }
                    )]
            });
        } catch (e) { return message.reply(`❌ Gagal: ${e.message}`); }
    }

    // --- 3. !createweb [Nama] [URL_Gambar] [Channel_ID] ---
    if (command === "createweb") {
        const name = args[0] || "Akira Webhook";
        const avatar = args[1] || null;
        const channelId = args[2] || message.channel.id;

        try {
            const channel = await message.guild.channels.fetch(channelId);
            const webhook = await channel.createWebhook({
                name: name,
                avatar: avatar,
                reason: "Created via Akira God-Mode"
            });

            return message.reply({
                embeds: [new EmbedBuilder()
                    .setTitle("✨ New Webhook Created")
                    .setColor(0x00FF00)
                    .addFields(
                        { name: "ID", value: `\`${webhook.id}\``, inline: true },
                        { name: "URL (Private)", value: `||${webhook.url}||`, inline: false }
                    )]
            });
        } catch (e) { return message.reply(`❌ Gagal: ${e.message}`); }
    }

    // --- 4. !listweb [Channel_ID] ---
    if (command === "listweb") {
        const target = args[0] || message.channel.id;
        const channel = await message.guild.channels.fetch(target);
        const webhooks = await channel.fetchWebhooks();

        const embed = new EmbedBuilder().setTitle(`📋 List Webhook: #${channel.name}`).setColor(0x3498db);
        if (webhooks.size === 0) embed.setDescription("Kosong.");
        else embed.setDescription(webhooks.map(w => `🔹 **${w.name}**\nID: \`${w.id}\`\nURL: [Klik Disini](${w.url})`).join("\n\n"));

        return message.reply({ embeds: [embed] });
    }

    // --- 5. !gettoken [URL] ---
    if (command === "gettoken") {
        const url = args[0];
        if (!url) return message.reply("Mana URLnya?");
        try {
            const wc = new WebhookClient({ url });
            return message.reply({ content: `🔑 **ID:** \`${wc.id}\`\n**Token:** ||${wc.token}||`, ephemeral: true });
        } catch { return message.reply("URL Salah!"); }
    }

    // --- 6. !nukeweb (Hapus Semua) ---
    if (command === "nukeweb") {
        const all = await message.guild.fetchWebhooks();
        for (const w of all.values()) await w.delete();
        return message.reply(`☢️ **${all.size}** Webhook berhasil dimusnahkan.`);
    }

    // (Fitur lain seperti !sendweb & !broadweb bisa lu tambahkan polanya sama)
  },

  // --- MONITORING SYSTEM (Otomatis) ---
  async monitorNewWebhook(webhook) {
    const channel = webhook.guild.channels.cache.get(LOG_CHANNEL_ID);
    if (!channel) return;

    const alert = new EmbedBuilder()
      .setTitle("🚨 WEBHOOK ILEGAL TERDETEKSI!")
      .setColor(0xFF0000)
      .setDescription(`Dibuat di channel <#${webhook.channelId}>`)
      .addFields({ name: "Nama", value: `\`${webhook.name}\`` })
      .setTimestamp();

    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder().setCustomId(`deny_${webhook.id}`).setLabel("HAPUS SEKARANG").setStyle(ButtonStyle.Danger),
      new ButtonBuilder().setCustomId(`view_${webhook.id}`).setLabel("LIHAT TOKEN").setStyle(ButtonStyle.Secondary)
    );

    const msg = await channel.send({ content: `<@&${ADMIN_ROLE_ID}>`, embeds: [alert], components: [row] });
    const collector = msg.createMessageComponentCollector({ componentType: ComponentType.Button });

    collector.on("collect", async (i) => {
      if (i.user.id !== AUTHORIZED_USER) return i.reply({ content: "Cuma OWNER yang boleh!", ephemeral: true });

      if (i.customId === `deny_${webhook.id}`) {
        await webhook.delete();
        await i.update({ content: "🗑️ Berhasil dimusnahkan!", embeds: [], components: [] });
      } else if (i.customId === `view_${webhook.id}`) {
        await i.reply({ content: `🔑 Token: \`${webhook.token}\``, ephemeral: true });
      }
    });
  }
};
