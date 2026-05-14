const { 
  Client, 
  EmbedBuilder, 
  ActionRowBuilder, 
  ButtonBuilder, 
  ButtonStyle, 
  StringSelectMenuBuilder,
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle,
  PermissionFlagsBits,
  ChannelType,
  MessageFlags,
  ComponentType,
  ForumLayoutType
} = require("discord.js");
const { MongoClient, ObjectId } = require("mongodb");

// ==================== CONFIGURATION ====================
const CONFIG = {
  DASHBOARD_CHANNEL_ID: "1498934645096448010",
  SERVER_PARTNER_CHANNEL_ID: "1498934926630850693",
  EVENT_PARTNER_CHANNEL_ID: "1502206484489175101",
  ADMIN_REVIEW_CHANNEL_ID: "1503704709779820605",
  STOP_DISCUSSION_CATEGORY_ID: "1504152063154847955",
  FORUM_LOG_CHANNEL_ID: "1503130728278392853",
  PARTNER_CATEGORY_ID: "1498933997005443082",
  PARTNER_ROLE_ID: "1357693246268244209",
  ADMIN_ROLE_ID: "1352286232779948144",
  BOT_ID: "1447102808900898887",
  LOG_CHANNEL_ID: "1352800131933802547",
  MAX_PARTNER_CHANNELS: 3,
  MONGODB_URI: process.env.MONGODB_URI || "mongodb+srv://AeroX:AeroX@aerox.cgfxn4x.mongodb.net/partnership_akira?retryWrites=true&w=majority&appName=AeroX"
};

// ==================== DATABASE CONNECTION ====================
let dbClient = null;
let db = null;
let isConnected = false;

async function connectDatabase() {
  if (isConnected && db) return db;
  try {
    dbClient = new MongoClient(CONFIG.MONGODB_URI);
    await dbClient.connect();
    db = dbClient.db("partnership_akira");
    isConnected = true;
    console.log("✅ Partnership MongoDB Connected (Native Driver)");
    return db;
  } catch (err) {
    console.error("❌ Partnership MongoDB Error:", err.message);
    throw err;
  }
}

function getCollection(name) {
  if (!db) throw new Error("Database not connected");
  return db.collection(name);
}

// ==================== COMPONENT V2 HELPERS ====================
function createContainer(components, accentColor = null) {
  const container = { type: 17, components };
  if (accentColor !== null) container.accent_color = accentColor;
  return container;
}

function textComponent(content) {
  return { type: 10, content };
}

function separatorComponent() {
  return { type: 14 };
}

function actionRowComponent(components) {
  return { type: 1, components };
}

function buttonComponent({ style, label, customId, url = null, disabled = false, emoji = null }) {
  const btn = { type: 2, style, label, disabled, flow: { actions: [] } };
  if (customId) btn.custom_id = customId;
  if (url) btn.url = url;
  if (emoji) btn.emoji = emoji;
  return btn;
}

function selectMenuComponent({ customId, options, placeholder, minValues = 1, maxValues = 1 }) {
  return { type: 3, custom_id: customId, options, placeholder, min_values: minValues, max_values: maxValues, flows: {} };
}

function sectionComponent(textComponents, accessory = null) {
  const section = { type: 9, components: textComponents.map(t => typeof t === "string" ? textComponent(t) : t) };
  if (accessory) section.accessory = accessory;
  return section;
}

function mediaGalleryComponent(urls) {
  return { type: 12, items: urls.map(url => ({ media: { url } })) };
}

function buildV2Message(components, flags = MessageFlags.IsComponentsV2) {
  return { flags, components: [createContainer(components)] };
}

function buildV2MessageWithAccent(components, accentColor, flags = MessageFlags.IsComponentsV2) {
  return { flags, components: [createContainer(components, accentColor)] };
}

// ==================== PARTNERSHIP CLASS ====================
class PartnershipSystem {
  constructor(client) {
    this.client = client;
    this.userChannels = new Map();
    // track !partner command usage (userId -> count)
    this.partnerCmdUsage = new Map();
  }

  async initialize() {
    await connectDatabase();
    // Load existing usage counts from DB if needed, but we'll check on command call
    console.log("✅ Partnership System Initialized (Native MongoDB)");
  }

  async close() {
    if (dbClient) {
      await dbClient.close();
      isConnected = false;
      db = null;
    }
  }

  async sendDashboard(channel) {
    const dashboardComponents = [
      textComponent("## <:1_:1486297322848653425> Partnership Requirement<:00:1360567203325542431><:00:1360567203325542431><:00:1360567203325542431><:00:1360567203325542431>"),
      separatorComponent(),
      textComponent("> - Member dan Staff server aktif\n> - Tidak mengandung konten NSFW.\n> - Tiada minimal jumlah member server.\n> - Gunakan channels partner bukan forum.\n> - Tidak menerima server khusus berjualan.\n> - Bebas dari konflik dengan komunitas lain."),
      separatorComponent(),
      actionRowComponent([selectMenuComponent({
        customId: "p_301362246674550785",
        options: [
          { label: "Open Partnership", value: "2X4OAiLrez", emoji: { name: "🔍" } },
          { label: "Posting Events", value: "5rSW3aoXFw", emoji: { name: "📥" } },
          { label: "Re-Posting Partner", value: "Vrv9pE1vwp", emoji: { name: "🔃" } },
          { label: "List Partnership", value: "IoA1YxsT8u", emoji: { name: "📜" } },
          { label: "Berhenti Partnership", value: "ASH11sgG4x", emoji: { name: "🛑" } }
        ],
        placeholder: "Pilih menu partnership...",
        minValues: 1,
        maxValues: 1
      })]),
      separatorComponent(),
      textComponent("-# © Guild Partnership - EmpireBS")
    ];

    const dashboardMessage = { flags: 32768, components: [{ type: 17, components: dashboardComponents }] };

    try {
      const messages = await channel.messages.fetch({ limit: 10 });
      const existingDashboard = messages.find(msg => 
        msg.components && msg.components[0] && 
        msg.components[0].components && 
        msg.components[0].components.some(c => c.type === 1 && c.components[0]?.custom_id === "p_301362246674550785")
      );

      if (existingDashboard) {
        await existingDashboard.edit(dashboardMessage);
        console.log("✅ Partnership Dashboard updated");
      } else {
        await channel.send(dashboardMessage);
        console.log("✅ Partnership Dashboard sent");
      }
    } catch (err) {
      console.error("❌ Error sending dashboard:", err.message);
      await channel.send(dashboardMessage);
    }
  }

  hasPartnerRole(member) {
    return member.roles.cache.has(CONFIG.PARTNER_ROLE_ID);
  }

  hasAdminRole(member) {
    return member.roles.cache.has(CONFIG.ADMIN_ROLE_ID);
  }

  async handleInteraction(interaction) {
    if (!interaction.isStringSelectMenu() && !interaction.isButton() && !interaction.isModalSubmit()) return false;

    const customId = interaction.customId;

    // Dashboard select menu
    if (customId === "p_301362246674550785") {
      await this.handleDashboardSelect(interaction);
      return true;
    }

    // Partnership sub buttons (benefit, rules, form toggles, etc.)
    if (customId.startsWith("partnership_")) {
      await this.handlePartnershipButton(interaction);
      return true;
    }

    // Admin accept/reject/edit
    if (customId.startsWith("admin_")) {
      await this.handleAdminAction(interaction);
      return true;
    }

    // Stop accept/reject
    if (customId.startsWith("stop_accept_") || customId.startsWith("stop_reject_")) {
      await this.handleStopAdminAction(interaction);
      return true;
    }

    // List pagination
    if (customId.startsWith("list_page_")) {
      await this.handleListPagination(interaction);
      return true;
    }

    // Search
    if (customId === "partnership_search") {
      await this.handleSearch(interaction);
      return true;
    }

    // DM toggle
    if (customId === "partnership_dm_yes" || customId === "partnership_dm_no") {
      await this.handleDmToggle(interaction);
      return true;
    }

    // Stop/Continue forms from !berhenti / !lanjut
    if (customId.startsWith("berhenti_")) {
      await this.handleBerhentiLanjutButton(interaction);
      return true;
    }

    return false;
  }

  async handleDashboardSelect(interaction) {
    const value = interaction.values[0];
    const member = interaction.member;

    switch (value) {
      case "2X4OAiLrez":
        if (this.hasPartnerRole(member)) {
          await interaction.reply({ ...this.getAlreadyPartnerTemplate(), ephemeral: true });
        } else {
          await interaction.reply({ ...this.getOpenPartnershipTemplate(), ephemeral: true });
        }
        break;

      case "5rSW3aoXFw":
        if (!this.hasPartnerRole(member)) {
          await interaction.reply({ ...this.getNeedPartnerFirstTemplate(), ephemeral: true });
        } else {
          await interaction.reply({ ...this.getPostingEventsTemplate(), ephemeral: true });
        }
        break;

      case "Vrv9pE1vwp":
        if (!this.hasPartnerRole(member)) {
          await interaction.reply({ ...this.getNeedPartnerFirstTemplate(), ephemeral: true });
        } else {
          await interaction.reply({ ...this.getRepostingTemplate(), ephemeral: true });
        }
        break;

      case "IoA1YxsT8u":
        await this.showList(interaction, 1);
        break;

      case "ASH11sgG4x":
        if (!this.hasPartnerRole(member)) {
          await interaction.reply({ ...this.getNeedPartnerFirstTemplate(), ephemeral: true });
        } else {
          await interaction.reply({ ...this.getStopPartnershipTemplate(), ephemeral: true });
        }
        break;
    }
  }

  async handlePartnershipButton(interaction) {
    const customId = interaction.customId;
    const member = interaction.member;

    if (customId === "partnership_benefit") {
      await interaction.reply({ ...this.getBenefitTemplate(), ephemeral: true });
      return;
    }

    if (customId === "partnership_rules") {
      await interaction.reply({ ...this.getRulesTemplate(), ephemeral: true });
      return;
    }

    // Event Yes/No toggles
    if (customId === "partnership_event_yes" || customId === "partnership_event_no") {
      await this.handleEventRepostToggle(interaction, customId, "event");
      return;
    }

    // Repost Yes/No toggles
    if (customId === "partnership_repost_yes" || customId === "partnership_repost_no") {
      await this.handleEventRepostToggle(interaction, customId, "repost");
      return;
    }

    // Cmd Yes/No toggles
    if (customId === "partnership_cmd_yes" || customId === "partnership_cmd_no") {
      await this.handleCmdToggle(interaction, customId);
      return;
    }

    // Form buttons - Show modals
    if (customId.includes("_form")) {
      await this.showFormModal(interaction, customId);
      return;
    }

    // Stop form button
    if (customId === "partnership_stop_form") {
      await this.showFormModal(interaction, customId);
      return;
    }
  }

  async handleEventRepostToggle(interaction, customId, type) {
    const isYes = customId.endsWith("_yes");
    const baseKey = type === "event" ? "event" : "repost";
    const formCustomId = isYes ? `partnership_${baseKey}_form` : `partnership_${baseKey}_form_noembed`;

    const components = [
      textComponent(type === "event" ? "## 📥 Posting Events" : "## 🔃 Re-Posting Partnership"),
      separatorComponent(),
      textComponent(type === "event" ? 
        "### Ketentuan Events:\n> - Wajib gunakan mention khusus yang tersedia.\n> - Postingan ditinjau admin sebelum dipublikasikan.\n> - Admin berhak menyesuaikan teks sesuai ketentuan.\n### Prosedur:\n> - Pilih Yes/No untuk memakai embed atau tidak.\n> - Klik tombol di bawah dan lengkapi detail acara anda." :
        "### Ketentuan Utama:\n> - Cooldown 1 minggu sekali.\n> - Saling memposting ulang deskripsi.\n> - Gunakan mention khusus yang tersedia.\n### Prosedur:\n> - Pilih Yes/No untuk memakai embed atau tidak.\n> - Postingan ditinjau admin sebelum dipublikasikan.\n> - Admin berhak menyesuaikan teks sesuai ketentuan.\n> - Klik tombol di bawah dan lengkapi data server anda."
      ),
      separatorComponent(),
      actionRowComponent([
        buttonComponent({ style: 1, label: "Isi Formulir Disini", emoji: { name: "📩" }, customId: formCustomId }),
        buttonComponent({ style: 3, label: "Yes", customId: `partnership_${baseKey}_yes`, disabled: isYes }),
        buttonComponent({ style: 4, label: "No", customId: `partnership_${baseKey}_no`, disabled: !isYes })
      ]),
      separatorComponent(),
      textComponent("-# © Guild Partnership - EmpireBS")
    ];

    await interaction.update({ ...buildV2Message(components), ephemeral: true });
  }

  async handleCmdToggle(interaction, customId) {
    const isYes = customId.endsWith("_yes");
    const formCustomId = isYes ? "partnership_cmd_form" : "partnership_cmd_form_noembed";

    const components = [
      textComponent("## ✉️ Pengajuan Partnership"),
      separatorComponent(),
      textComponent("> Click dibawah ini untuk isi deskripsi server kamu\n\n**Note:** Pilih Yes/No untuk menggunakan embed atau tidak."),
      separatorComponent(),
      actionRowComponent([
        buttonComponent({ style: 1, label: "Isi Formulir Disini", emoji: { name: "📩" }, customId: formCustomId }),
        buttonComponent({ style: 3, label: "Yes", customId: "partnership_cmd_yes", disabled: isYes }),
        buttonComponent({ style: 4, label: "No", customId: "partnership_cmd_no", disabled: !isYes })
      ]),
      separatorComponent(),
      textComponent("-# © Guild Partnership - EmpireBS")
    ];

    await interaction.update({ ...buildV2Message(components), ephemeral: true });
  }

  // ==================== MODAL HANDLING ====================
  async showFormModal(interaction, customId) {
    let modal;

    if (customId === "partnership_event_form") {
      modal = new ModalBuilder().setCustomId("modal_event_yes").setTitle("Formulir Posting Events (Dengan Embed)")
        .addComponents(
          new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId("server_name").setLabel("Nama Server").setStyle(TextInputStyle.Short).setRequired(true).setPlaceholder("Contoh: EmpireBS V2")),
          new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId("description").setLabel("Deskripsi Server/Event").setStyle(TextInputStyle.Paragraph).setRequired(true).setPlaceholder("Jelaskan detail event/server Anda")),
          new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId("banner").setLabel("Banner Server (Opsional)").setStyle(TextInputStyle.Short).setRequired(false).setPlaceholder("URL Banner, pisahkan dengan koma")),
          new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId("server_link").setLabel("Link Server").setStyle(TextInputStyle.Short).setRequired(true).setPlaceholder("https://discord.gg/...")),
          new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId("sidebar_color").setLabel("Sidebar Color (Opsional)").setStyle(TextInputStyle.Short).setRequired(false).setPlaceholder("Contoh: 16711685 (hex integer)"))
        );
    } else if (customId === "partnership_event_form_noembed") {
      modal = new ModalBuilder().setCustomId("modal_event_no").setTitle("Formulir Posting Events (Tanpa Embed)")
        .addComponents(
          new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId("server_name").setLabel("Nama Server").setStyle(TextInputStyle.Short).setRequired(true).setPlaceholder("Contoh: EmpireBS V2")),
          new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId("description").setLabel("Deskripsi Server/Event").setStyle(TextInputStyle.Paragraph).setRequired(true).setPlaceholder("Jelaskan detail event/server Anda")),
          new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId("server_link").setLabel("Link Server").setStyle(TextInputStyle.Short).setRequired(true).setPlaceholder("https://discord.gg/...")),
          new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId("event_link").setLabel("Link Event (Opsional)").setStyle(TextInputStyle.Short).setRequired(false).setPlaceholder("URL event jika ada"))
        );
    } else if (customId === "partnership_repost_form") {
      modal = new ModalBuilder().setCustomId("modal_repost_yes").setTitle("Formulir Re-Posting (Dengan Embed)")
        .addComponents(
          new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId("server_name").setLabel("Nama Server").setStyle(TextInputStyle.Short).setRequired(true).setPlaceholder("Contoh: EmpireBS V2")),
          new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId("description").setLabel("Deskripsi Server").setStyle(TextInputStyle.Paragraph).setRequired(true).setPlaceholder("Deskripsi lengkap server Anda")),
          new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId("banner").setLabel("Banner Server (Opsional)").setStyle(TextInputStyle.Short).setRequired(false).setPlaceholder("URL Banner, pisahkan dengan koma")),
          new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId("server_link").setLabel("Link Server").setStyle(TextInputStyle.Short).setRequired(true).setPlaceholder("https://discord.gg/...")),
          new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId("sidebar_color").setLabel("Sidebar Color (Opsional)").setStyle(TextInputStyle.Short).setRequired(false).setPlaceholder("Contoh: 16711685 (hex integer)"))
        );
    } else if (customId === "partnership_repost_form_noembed") {
      modal = new ModalBuilder().setCustomId("modal_repost_no").setTitle("Formulir Re-Posting (Tanpa Embed)")
        .addComponents(
          new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId("server_name").setLabel("Nama Server").setStyle(TextInputStyle.Short).setRequired(true).setPlaceholder("Contoh: EmpireBS V2")),
          new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId("description").setLabel("Deskripsi Server").setStyle(TextInputStyle.Paragraph).setRequired(true).setPlaceholder("Deskripsi lengkap server Anda")),
          new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId("server_link").setLabel("Link Server").setStyle(TextInputStyle.Short).setRequired(true).setPlaceholder("https://discord.gg/...")),
          new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId("banner").setLabel("Banner Server (Opsional)").setStyle(TextInputStyle.Short).setRequired(false).setPlaceholder("URL Banner, pisahkan dengan koma"))
        );
    } else if (customId === "partnership_cmd_form") {
      modal = new ModalBuilder().setCustomId("modal_partner_yes").setTitle("Formulir Pengajuan Partnership (Dengan Embed)")
        .addComponents(
          new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId("server_name").setLabel("Nama Server").setStyle(TextInputStyle.Short).setRequired(true).setPlaceholder("Contoh: EmpireBS V2")),
          new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId("description").setLabel("Deskripsi Server").setStyle(TextInputStyle.Paragraph).setRequired(true).setPlaceholder("Deskripsi lengkap server Anda")),
          new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId("banner").setLabel("Banner Server (Opsional)").setStyle(TextInputStyle.Short).setRequired(false).setPlaceholder("URL Banner, pisahkan dengan koma")),
          new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId("server_link").setLabel("Link Server").setStyle(TextInputStyle.Short).setRequired(true).setPlaceholder("https://discord.gg/...")),
          new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId("sidebar_color").setLabel("Sidebar Color (Opsional)").setStyle(TextInputStyle.Short).setRequired(false).setPlaceholder("Contoh: 16711685 (hex integer)"))
        );
    } else if (customId === "partnership_cmd_form_noembed") {
      modal = new ModalBuilder().setCustomId("modal_partner_no").setTitle("Formulir Pengajuan Partnership (Tanpa Embed)")
        .addComponents(
          new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId("server_name").setLabel("Nama Server").setStyle(TextInputStyle.Short).setRequired(true).setPlaceholder("Contoh: EmpireBS V2")),
          new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId("description").setLabel("Deskripsi Server").setStyle(TextInputStyle.Paragraph).setRequired(true).setPlaceholder("Deskripsi lengkap server Anda")),
          new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId("server_link").setLabel("Link Server").setStyle(TextInputStyle.Short).setRequired(true).setPlaceholder("https://discord.gg/...")),
          new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId("banner").setLabel("Banner Server (Opsional)").setStyle(TextInputStyle.Short).setRequired(false).setPlaceholder("URL Banner, pisahkan dengan koma"))
        );
    } else if (customId === "partnership_stop_form") {
      modal = new ModalBuilder().setCustomId("stop_modal_submit").setTitle("Formulir Berhenti Partnership")
        .addComponents(
          new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId("server_name").setLabel("Nama Server").setStyle(TextInputStyle.Short).setRequired(true).setPlaceholder("Nama server partner Anda")),
          new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId("server_link").setLabel("Link Server").setStyle(TextInputStyle.Short).setRequired(true).setPlaceholder("https://discord.gg/...")),
          new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId("reason").setLabel("Alasan Berhenti Partnership").setStyle(TextInputStyle.Paragraph).setRequired(true).setPlaceholder("Jelaskan dengan detail alasan penghentian partnership"))
        );
    }

    if (modal) {
      await interaction.showModal(modal);
    }
  }

  async handleModalSubmit(interaction) {
    const customId = interaction.customId;

    if (customId.startsWith("modal_")) {
      await this.processFormSubmission(interaction);
      return true;
    }
    if (customId.startsWith("edit_modal_")) {
      await this.processEditSubmission(interaction);
      return true;
    }
    if (customId.startsWith("reject_modal_")) {
      await this.processRejectionSubmission(interaction);
      return true;
    }
    if (customId.startsWith("stop_modal_")) {
      await this.processStopSubmission(interaction);
      return true;
    }
    if (customId.startsWith("stop_admin_modal_")) {
      await this.processStopAdminSubmission(interaction);
      return true;
    }
    if (customId === "search_modal") {
      await this.processSearchSubmission(interaction);
      return true;
    }
    // !berhenti / !lanjut modal submission
    if (customId.startsWith("berhenti_modal_") || customId.startsWith("lanjut_modal_")) {
      await this.processBerhentiLanjutModal(interaction);
      return true;
    }
    return false;
  }

  // ==================== FORM SUBMISSION PROCESSING ====================
  async processFormSubmission(interaction) {
    const customId = interaction.customId;
    const fields = interaction.fields;
    const user = interaction.user;

    try {
      if (customId.startsWith("modal_event_")) {
        const useEmbed = customId.endsWith("yes");
        const data = {
          userId: user.id,
          username: user.username,
          serverName: fields.getTextInputValue("server_name"),
          eventDescription: fields.getTextInputValue("description"),
          serverLink: fields.getTextInputValue("server_link"),
          bannerUrls: useEmbed ? this.parseBannerUrls(fields.getTextInputValue("banner")) : [],
          sidebarColor: useEmbed ? this.parseColor(fields.getTextInputValue("sidebar_color")) : 0x3498db,
          useEmbed,
          eventLink: useEmbed ? "" : (fields.getTextInputValue("event_link") || ""),
          status: "pending",
          createdAt: new Date()
        };
        const result = await getCollection("event_posts").insertOne(data);
        data._id = result.insertedId;
        await this.sendToAdminReview(interaction, data, "event");
        await interaction.reply({ ...this.buildSimpleMessage("✅ Pengajuan Events Terkirim", "Pengajuan posting events Anda telah dikirim dan sedang menunggu review admin."), ephemeral: true });
      } else if (customId.startsWith("modal_repost_")) {
        const useEmbed = customId.endsWith("yes");
        const existing = await getCollection("partnerships").findOne({ userId: user.id, status: "accepted" });
        if (!existing) {
          await interaction.reply({ ...this.buildSimpleMessage("❌ Tidak Ditemukan", "Anda belum memiliki partnership yang aktif untuk di-repost."), ephemeral: true });
          return;
        }
        if (existing.lastRepostAt && (Date.now() - existing.lastRepostAt.getTime()) < 7 * 24 * 60 * 60 * 1000) {
          await interaction.reply({ ...this.buildSimpleMessage("⏳ Cooldown Aktif", "Anda baru saja melakukan re-post. Mohon tunggu 1 minggu sebelum re-post kembali."), ephemeral: true });
          return;
        }
        const data = {
          userId: user.id,
          username: user.username,
          serverName: fields.getTextInputValue("server_name"),
          serverDescription: fields.getTextInputValue("description"),
          serverLink: fields.getTextInputValue("server_link"),
          bannerUrls: this.parseBannerUrls(fields.getTextInputValue("banner")),
          sidebarColor: useEmbed ? this.parseColor(fields.getTextInputValue("sidebar_color")) : 0x3498db,
          useEmbed,
          status: "pending",
          originalId: existing._id,
          createdAt: new Date()
        };
        const result = await getCollection("partnerships").insertOne(data);
        data._id = result.insertedId;
        await this.sendToAdminReview(interaction, data, "repost");
        await interaction.reply({ ...this.buildSimpleMessage("✅ Re-Posting Terkirim", "Pengajuan re-posting partnership Anda telah dikirim dan sedang menunggu review admin."), ephemeral: true });
      } else if (customId.startsWith("modal_partner_")) {
        const useEmbed = customId.endsWith("yes");
        const data = {
          userId: user.id,
          username: user.username,
          serverName: fields.getTextInputValue("server_name"),
          serverDescription: fields.getTextInputValue("description"),
          serverLink: fields.getTextInputValue("server_link"),
          bannerUrls: this.parseBannerUrls(fields.getTextInputValue("banner")),
          sidebarColor: useEmbed ? this.parseColor(fields.getTextInputValue("sidebar_color")) : 0x3498db,
          useEmbed,
          status: "pending",
          createdAt: new Date()
        };
        const result = await getCollection("partnerships").insertOne(data);
        data._id = result.insertedId;
        await this.sendToAdminReview(interaction, data, "partnership");
        // Mark user as having used !partner successfully
        await getCollection("partner_commands").updateOne(
          { userId: user.id },
          { $set: { used: true, lastUsed: new Date() } },
          { upsert: true }
        );
        await interaction.reply({ ...this.buildSimpleMessage("✅ Pengajuan Partnership Terkirim", "Pengajuan partnership Anda telah dikirim dan sedang menunggu review admin. Anda tidak dapat mengirim lagi."), ephemeral: true });
      }
    } catch (err) {
      console.error("Form submission error:", err);
      await interaction.reply({ ...this.buildSimpleMessage("❌ Error", "Terjadi kesalahan saat memproses formulir. Silakan coba lagi."), ephemeral: true });
    }
  }

  async processStopSubmission(interaction) {
    const fields = interaction.fields;
    const user = interaction.user;
    const data = {
      userId: user.id,
      username: user.username,
      userTag: user.tag,
      serverName: fields.getTextInputValue("server_name"),
      serverLink: fields.getTextInputValue("server_link"),
      reason: fields.getTextInputValue("reason"),
      status: "pending",
      createdAt: new Date()
    };
    const result = await getCollection("stop_requests").insertOne(data);
    data._id = result.insertedId;

    const adminChannel = await this.client.channels.fetch(CONFIG.ADMIN_REVIEW_CHANNEL_ID);
    if (adminChannel) {
      const components = [
        textComponent("## 🛑 Permintaan Berhenti Partnership"),
        separatorComponent(),
        textComponent(`**👤 Informasi User**\n> **Username:** [${user.username}](https://discord.com/users/${user.id})\n> **ID:** \`${user.id}\`\n> **Display Name:** ${interaction.member.displayName}\n> **Akun Dibuat:** <t:${Math.floor(user.createdTimestamp / 1000)}:R>`),
        separatorComponent(),
        textComponent(`**📊 Detail Permintaan**\n> **Nama Server:** ${data.serverName}\n> **Link Server:** ${data.serverLink}\n> **Alasan:** ${data.reason}\n> **Handle By:** Belum ditangani`),
        separatorComponent(),
        actionRowComponent([
          buttonComponent({ style: 3, label: "Accept", customId: `stop_accept_${data._id}` }),
          buttonComponent({ style: 4, label: "Reject", customId: `stop_reject_${data._id}` })
        ]),
        separatorComponent(),
        textComponent("-# © Guild Partnership - EmpireBS")
      ];
      await adminChannel.send(buildV2Message(components));
    }
    await interaction.reply({ ...this.buildSimpleMessage("✅ Permintaan Terkirim", "Permintaan penghentian partnership Anda telah dikirim ke admin. Silakan tunggu konfirmasi."), ephemeral: true });
  }

  // ==================== ADMIN REVIEW HELPER ====================
  async sendToAdminReview(interaction, data, type) {
    const adminChannel = await this.client.channels.fetch(CONFIG.ADMIN_REVIEW_CHANNEL_ID);
    if (!adminChannel) return;

    const user = interaction.user;
    const isEmbed = data.useEmbed !== false;
    let components = [];

    if (isEmbed) {
      const accentColor = data.sidebarColor || 0x3498db;
      components = [
        textComponent(`# ${data.serverName}`),
        separatorComponent(),
        textComponent(data.serverDescription || data.eventDescription),
        separatorComponent()
      ];
      if (data.bannerUrls && data.bannerUrls.length > 0) {
        components.push(mediaGalleryComponent(data.bannerUrls));
        components.push(separatorComponent());
      }
      components.push(
        textComponent(`📎 | Server Link: [Invite](<${data.serverLink}>)\n🏷️ | Partner By: <@${user.id}>`),
        separatorComponent(),
        actionRowComponent([
          buttonComponent({ style: 3, label: "Accept", customId: `admin_accept_${type}_${data._id}` }),
          buttonComponent({ style: 4, label: "Reject", customId: `admin_reject_${type}_${data._id}` }),
          buttonComponent({ style: 1, label: "Edit Pesan", customId: `admin_edit_${type}_${data._id}` }),
          buttonComponent({ style: 2, label: data.serverName, customId: `admin_name_${type}_${data._id}`, disabled: true })
        ]),
        separatorComponent(),
        textComponent("-# © Guild Partnership - EmpireBS")
      );
      await adminChannel.send(buildV2MessageWithAccent(components, accentColor));
    } else {
      const plainText = `# ${data.serverName}\n**${data.serverDescription || data.eventDescription}**\n\n📎 | Server Link: [Invite](<${data.serverLink}>)\n🏷️ | Partner By: <@${user.id}>`;
      components = [
        textComponent(plainText),
        separatorComponent(),
        actionRowComponent([
          buttonComponent({ style: 3, label: "Accept", customId: `admin_accept_${type}_${data._id}` }),
          buttonComponent({ style: 4, label: "Reject", customId: `admin_reject_${type}_${data._id}` }),
          buttonComponent({ style: 1, label: "Edit Pesan", customId: `admin_edit_${type}_${data._id}` }),
          buttonComponent({ style: 2, label: data.serverName, customId: `admin_name_${type}_${data._id}`, disabled: true })
        ]),
        separatorComponent(),
        textComponent("-# © Guild Partnership - EmpireBS")
      ];
      await adminChannel.send(buildV2Message(components));
    }
  }

  // ==================== ADMIN ACTION HANDLERS ====================
  async handleAdminAction(interaction) {
    if (!interaction.memberPermissions?.has(PermissionFlagsBits.ManageMessages) && !this.hasAdminRole(interaction.member)) {
      await interaction.reply({ ...this.buildSimpleMessage("Akses Ditolak", "Hanya admin partnership yang dapat melakukan tindakan ini."), ephemeral: true });
      return;
    }

    // Defer immediately to avoid Unknown interaction timeout
    await interaction.deferUpdate();

    const customId = interaction.customId;
    // Regex: admin_(action)_(type)_(id)
    const match = customId.match(/^admin_(accept|reject|edit)_([a-z]+)_([a-f0-9]+)$/);
    if (!match) {
      console.error("Invalid admin customId format:", customId);
      return;
    }
    const action = match[1];
    const type = match[2];
    const id = match[3];

    try {
      if (action === "accept") {
        await this.handleAccept(interaction, type, id);
      } else if (action === "reject") {
        await this.handleReject(interaction, type, id);
      } else if (action === "edit") {
        await this.handleEdit(interaction, type, id);
      }
    } catch (err) {
      console.error("Admin action error:", err);
    }
  }

  async handleAccept(interaction, type, id) {
    const startTime = Date.now();
    let objId;
    try {
      objId = new ObjectId(id);
    } catch (e) {
      console.error("Invalid ObjectId:", id);
      return;
    }

    let data;
    if (type === "partnership" || type === "repost") {
      data = await getCollection("partnerships").findOne({ _id: objId });
      if (!data) return;
      await getCollection("partnerships").updateOne(
        { _id: objId },
        { $set: { status: "accepted", acceptedBy: interaction.user.id, acceptedAt: new Date() } }
      );
      if (type === "partnership") {
        const guild = interaction.guild;
        const member = await guild.members.fetch(data.userId).catch(() => null);
        if (member) {
          await member.roles.add(CONFIG.PARTNER_ROLE_ID).catch(() => {});
        }
      }
      // Post to channel
      const partnerChannel = await this.client.channels.fetch(CONFIG.SERVER_PARTNER_CHANNEL_ID);
      if (partnerChannel) {
        const message = await this.sendPartnerMessage(partnerChannel, data);
        await getCollection("partnerships").updateOne(
          { _id: objId },
          { $set: { messageId: message.id, channelId: message.channelId } }
        );
        data.messageId = message.id;
        data.channelId = message.channelId;
      }
      await this.createForumLog(interaction, data, type, startTime);
      await this.sendAcceptDm(data.userId, data, interaction.user, type);

    } else if (type === "event") {
      data = await getCollection("event_posts").findOne({ _id: objId });
      if (!data) return;
      await getCollection("event_posts").updateOne(
        { _id: objId },
        { $set: { status: "accepted", acceptedBy: interaction.user.id, acceptedAt: new Date() } }
      );
      const eventChannel = await this.client.channels.fetch(CONFIG.EVENT_PARTNER_CHANNEL_ID);
      if (eventChannel) {
        const message = await this.sendEventMessage(eventChannel, data);
        await getCollection("event_posts").updateOne(
          { _id: objId },
          { $set: { messageId: message.id, channelId: message.channelId } }
        );
        data.messageId = message.id;
        data.channelId = message.channelId;
      }
      await this.createForumLog(interaction, data, "event", startTime);
      await this.sendEventDm(data, interaction.user, startTime);
    }

    // Disable buttons after accept
    const successEmbed = buildV2Message([
      textComponent("## ✅ Diterima"),
      separatorComponent(),
      textComponent(`Diterima oleh: <@${interaction.user.id}>\nWaktu: <t:${Math.floor(Date.now() / 1000)}:R>`),
      separatorComponent(),
      textComponent("-# © Guild Partnership - EmpireBS")
    ]);
    await interaction.editReply(successEmbed);
  }

  async handleReject(interaction, type, id) {
    // Show modal directly (no word count restriction)
    const modal = new ModalBuilder()
      .setCustomId(`reject_modal_${type}_${id}`)
      .setTitle("Alasan Penolakan");
    modal.addComponents(
      new ActionRowBuilder().addComponents(
        new TextInputBuilder()
          .setCustomId("reject_reason")
          .setLabel("Alasan Penolakan")
          .setStyle(TextInputStyle.Paragraph)
          .setRequired(true)
          .setPlaceholder("Jelaskan alasan penolakan...")
      )
    );
    await interaction.showModal(modal);
  }

  async processRejectionSubmission(interaction) {
    const customId = interaction.customId;
    const parts = customId.replace("reject_modal_", "").split("_");
    const type = parts[0];
    const id = parts[1];
    const reason = interaction.fields.getTextInputValue("reject_reason");

    let objId;
    try {
      objId = new ObjectId(id);
    } catch (e) {
      await interaction.reply({ content: "❌ ID tidak valid.", ephemeral: true });
      return;
    }

    const collectionName = (type === "event") ? "event_posts" : "partnerships";
    const data = await getCollection(collectionName).findOne({ _id: objId });

    if (data) {
      await getCollection(collectionName).updateOne(
        { _id: objId },
        { $set: { status: "rejected", rejectedBy: interaction.user.id, rejectedAt: new Date(), rejectReason: reason } }
      );
      try {
        const user = await this.client.users.fetch(data.userId);
        if (user) {
          const typeLabel = type === "partnership" ? "partnership" : type === "event" ? "posting events" : "re-posting";
          await user.send({ ...this.buildSimpleMessage("❌ Pengajuan Ditolak", `Maaf, pengajuan ${typeLabel} Anda telah ditolak.\n\n**Alasan:**\n${reason}`) });
        }
      } catch (err) {}
    }

    const rejectEmbed = buildV2Message([
      textComponent("## ❌ Ditolak"),
      separatorComponent(),
      textComponent(`Ditolak oleh: <@${interaction.user.id}>\nAlasan: ${reason}\nWaktu: <t:${Math.floor(Date.now() / 1000)}:R>`),
      separatorComponent(),
      textComponent("-# © Guild Partnership - EmpireBS")
    ]);
    await interaction.update(rejectEmbed);
  }

  async handleEdit(interaction, type, id) {
    let objId;
    try {
      objId = new ObjectId(id);
    } catch (e) {
      await interaction.reply({ content: "❌ ID tidak valid.", ephemeral: true });
      return;
    }

    let data;
    if (type === "partnership" || type === "repost") {
      data = await getCollection("partnerships").findOne({ _id: objId });
    } else if (type === "event") {
      data = await getCollection("event_posts").findOne({ _id: objId });
    }

    if (!data) {
      await interaction.reply({ content: "❌ Data tidak ditemukan.", ephemeral: true });
      return;
    }

    const currentContent = data.serverDescription || data.eventDescription || "";
    const modal = new ModalBuilder()
      .setCustomId(`edit_modal_${type}_${id}`)
      .setTitle("Edit Pesan Partnership");
    modal.addComponents(
      new ActionRowBuilder().addComponents(
        new TextInputBuilder().setCustomId("edit_content").setLabel("Konten Baru").setStyle(TextInputStyle.Paragraph).setRequired(true).setValue(currentContent).setPlaceholder("Masukkan konten baru...")
      )
    );
    await interaction.showModal(modal);
  }

  async processEditSubmission(interaction) {
    const customId = interaction.customId;
    const parts = customId.replace("edit_modal_", "").split("_");
    const type = parts[0];
    const id = parts[1];
    const newContent = interaction.fields.getTextInputValue("edit_content");

    let objId;
    try {
      objId = new ObjectId(id);
    } catch (e) {
      await interaction.reply({ content: "❌ ID tidak valid.", ephemeral: true });
      return;
    }

    let data;
    if (type === "partnership" || type === "repost") {
      data = await getCollection("partnerships").findOne({ _id: objId });
    } else if (type === "event") {
      data = await getCollection("event_posts").findOne({ _id: objId });
    }

    if (data) {
      const updateField = (type === "event") ? "eventDescription" : "serverDescription";
      await getCollection(type === "event" ? "event_posts" : "partnerships").updateOne(
        { _id: objId },
        { $set: { [updateField]: newContent, editedAt: new Date(), editedBy: interaction.user.id } }
      );

      // Update existing message if any
      if (data.messageId && data.channelId) {
        const channel = await this.client.channels.fetch(data.channelId).catch(() => null);
        if (channel) {
          const message = await channel.messages.fetch(data.messageId).catch(() => null);
          if (message) {
            const accentColor = data.sidebarColor || 0x3498db;
            const components = [
              textComponent(`# ${data.serverName}`),
              separatorComponent(),
              textComponent(newContent),
              separatorComponent()
            ];
            if (data.bannerUrls && data.bannerUrls.length > 0) {
              components.push(mediaGalleryComponent(data.bannerUrls));
              components.push(separatorComponent());
            }
            components.push(
              textComponent(`📎 | Server Link: [Invite](<${data.serverLink}>)\n🏷️ | Partner By: <@${data.userId}>`),
              separatorComponent(),
              textComponent("-# © Guild Partnership - EmpireBS")
            );
            if (data.useEmbed !== false) {
              await message.edit(buildV2MessageWithAccent(components, accentColor));
            } else {
              await message.edit(buildV2Message(components));
            }
          }
        }
      }
    }

    await interaction.reply({ ...this.buildSimpleMessage("✅ Berhasil Diedit", "Pesan telah berhasil diperbarui."), ephemeral: true });
  }

  // ==================== STOP / CONTINUE HANDLERS ====================
  async handleStopAdminAction(interaction) {
    if (!this.hasAdminRole(interaction.member)) {
      await interaction.reply({ ...this.buildSimpleMessage("Akses Ditolak", "Hanya admin partnership yang dapat melakukan tindakan ini."), ephemeral: true });
      return;
    }

    const customId = interaction.customId;
    const match = customId.match(/^stop_(accept|reject)_([a-f0-9]+)$/);
    if (!match) return;
    const action = match[1];
    const id = match[2];

    let objId;
    try {
      objId = new ObjectId(id);
    } catch (e) {
      await interaction.reply({ content: "❌ ID tidak valid.", ephemeral: true });
      return;
    }

    const stopRequest = await getCollection("stop_requests").findOne({ _id: objId });
    if (!stopRequest || stopRequest.status !== "pending") {
      await interaction.reply({ ...this.buildSimpleMessage("⚠️ Sudah Diproses", "Permintaan ini sudah diproses sebelumnya."), ephemeral: true });
      return;
    }

    if (action === "accept") {
      const modal = new ModalBuilder()
        .setCustomId(`stop_admin_modal_${id}`)
        .setTitle("Pesan Terima Kasih");
      modal.addComponents(
        new ActionRowBuilder().addComponents(
          new TextInputBuilder().setCustomId("thank_you_msg").setLabel("Pesan Terima Kasih").setStyle(TextInputStyle.Paragraph).setRequired(true)
            .setValue("Terima kasih telah berpartnership dengan kami. Semoga sukses selalu!")
        )
      );
      await interaction.showModal(modal);
    } else if (action === "reject") {
      await interaction.deferUpdate();
      // Create discussion channel
      const category = await this.client.channels.fetch(CONFIG.STOP_DISCUSSION_CATEGORY_ID).catch(() => null);
      if (category && category.type === ChannelType.GuildCategory) {
        const channelName = `stop-discussion-${stopRequest.username.toLowerCase().replace(/[^a-z0-9]/g, "")}`;
        const channel = await interaction.guild.channels.create({
          name: channelName,
          type: ChannelType.GuildText,
          parent: category.id,
          permissionOverwrites: [
            { id: interaction.guild.id, deny: [PermissionFlagsBits.ViewChannel] },
            { id: stopRequest.userId, allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages] },
            { id: CONFIG.ADMIN_ROLE_ID, allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages] }
          ]
        });
        await getCollection("stop_requests").updateOne(
          { _id: objId },
          { $set: { discussionChannelId: channel.id, status: "rejected", handledBy: interaction.user.id } }
        );
        await channel.send(buildV2Message([
          textComponent("## 💬 Diskusi Penghentian Partnership"),
          separatorComponent(),
          textComponent(`Halo <@${stopRequest.userId}>, admin ingin mendiskusikan lebih lanjut mengenai permintaan penghentian partnership Anda.\n\nSilakan jelaskan kembali alasan Anda.`),
          separatorComponent(),
          textComponent("-# © Guild Partnership - EmpireBS")
        ]));
        try {
          const user = await this.client.users.fetch(stopRequest.userId);
          if (user) await user.send({ ...this.buildSimpleMessage("💬 Diskusi Dibuka", `Admin telah membuka channel diskusi: <#${channel.id}>`) });
        } catch (err) {}
      }
      await interaction.editReply(buildV2Message([
        textComponent("## ❌ Rejected - Diskusi Dibuka"),
        separatorComponent(),
        textComponent(`Ditolak oleh: <@${interaction.user.id}>\nChannel diskusi telah dibuat.\n**Handle By:** <@${interaction.user.id}>`),
        separatorComponent(),
        textComponent("-# © Guild Partnership - EmpireBS")
      ]));
    }
  }

  async processStopAdminSubmission(interaction) {
    const id = interaction.customId.replace("stop_admin_modal_", "");
    const thankYouMsg = interaction.fields.getTextInputValue("thank_you_msg");
    await interaction.deferUpdate();

    let objId;
    try {
      objId = new ObjectId(id);
    } catch (e) {
      return;
    }

    const stopRequest = await getCollection("stop_requests").findOne({ _id: objId });
    if (!stopRequest || stopRequest.status !== "pending") return;

    await getCollection("stop_requests").updateOne({ _id: objId }, { $set: { status: "accepted", handledBy: interaction.user.id } });

    // Remove role and delete partnership data
    const guild = interaction.guild;
    const member = await guild.members.fetch(stopRequest.userId).catch(() => null);
    if (member) {
      await member.roles.remove(CONFIG.PARTNER_ROLE_ID).catch(() => {});
    }
    const partnership = await getCollection("partnerships").findOne({ userId: stopRequest.userId, status: "accepted" });
    if (partnership) {
      // Delete messages in partner/event channels
      if (partnership.messageId && partnership.channelId) {
        const ch = await this.client.channels.fetch(partnership.channelId).catch(() => null);
        if (ch) {
          await ch.messages.delete(partnership.messageId).catch(() => {});
        }
      }
      // Also delete any event posts from the same user
      const eventPosts = await getCollection("event_posts").find({ userId: stopRequest.userId, status: "accepted" }).toArray();
      for (const ep of eventPosts) {
        if (ep.messageId && ep.channelId) {
          const evCh = await this.client.channels.fetch(ep.channelId).catch(() => null);
          if (evCh) {
            await evCh.messages.delete(ep.messageId).catch(() => {});
          }
        }
        await getCollection("event_posts").deleteOne({ _id: ep._id });
      }
      // Update forum post thread name
      if (partnership.forumThreadId) {
        const forumChannel = await this.client.channels.fetch(CONFIG.FORUM_LOG_CHANNEL_ID).catch(() => null);
        if (forumChannel) {
          const thread = await forumChannel.threads.fetch(partnership.forumThreadId).catch(() => null);
          if (thread) {
            const newName = thread.name.replace(/\)/g, "") + " Mantan";
            await thread.setName(newName).catch(() => {});
          }
        }
      }
      await getCollection("partnerships").deleteOne({ _id: partnership._id });
    }

    try {
      const user = await this.client.users.fetch(stopRequest.userId);
      if (user) await user.send({ ...this.buildSimpleMessage("🛑 Partnership Dihentikan", `${thankYouMsg}\n\nRole partnership Anda telah dicabut.`) });
    } catch (err) {}

    await interaction.editReply(buildV2Message([
      textComponent("## ✅ Diterima - Partnership Dihentikan"),
      separatorComponent(),
      textComponent(`Diterima oleh: <@${interaction.user.id}>\nRole partnership telah dicabut.\n**Handle By:** <@${interaction.user.id}>`),
      separatorComponent(),
      textComponent("-# © Guild Partnership - EmpireBS")
    ]));
  }

  // ==================== COMMAND HANDLER ====================
  async handleCommand(message) {
    const content = message.content.trim();
    const member = message.member;
    const channel = message.channel;
    const guild = message.guild;

    // Only respond to known commands
    if (!content.startsWith("!partner") && !content.startsWith("!berhenti") && !content.startsWith("!lanjut")) return false;

    // Permission check: only admins
    if (!this.hasAdminRole(member)) {
      await message.reply({ ...this.buildSimpleMessage("Akses Ditolak", "Maaf, hanya admin partnership yang bisa menggunakan perintah ini.") });
      return true;
    }

    // Category restriction checks
    const parentId = channel.parentId;
    if (content.startsWith("!partner")) {
      if (parentId !== CONFIG.PARTNER_CATEGORY_ID) {
        await message.reply({ ...this.buildSimpleMessage("⚠️ Akses Ditolak", "Perintah ini hanya dapat digunakan di channel dalam kategori Partnership.") });
        return true;
      }
      return await this.handlePartnerCmd(message, member);
    }

    if (content.startsWith("!berhenti") || content.startsWith("!lanjut")) {
      if (parentId !== CONFIG.STOP_DISCUSSION_CATEGORY_ID) {
        await message.reply({ ...this.buildSimpleMessage("⚠️ Akses Ditolak", "Perintah ini hanya dapat digunakan di channel dalam kategori Diskusi Penghentian.") });
        return true;
      }
      return await this.handleBerhentiLanjutCmd(message, member, content.startsWith("!berhenti"));
    }

    return false;
  }

  async handlePartnerCmd(message, member) {
    const userId = member.id;

    // Check if user already used the command successfully (has submitted form)
    const commandData = await getCollection("partner_commands").findOne({ userId });
    if (commandData && commandData.used) {
      return message.reply({ ...this.buildSimpleMessage("❌ Akses Ditolak", "Anda sudah berhasil mengajukan partnership. Anda tidak dapat mengirim lagi.") });
    }

    // Check total attempts (max 3)
    const usageCount = (commandData?.attempts || 0) + 1;
    if (usageCount > 3) {
      return message.reply({
        ...this.buildSimpleMessage("⚠️ Batas Tercapai", "Maaf, Anda telah mencapai batas maksimal penggunaan perintah !partner (3 kali). Silakan hubungi admin jika ada kendala.") 
      });
    }

    // Update attempt count
    await getCollection("partner_commands").updateOne(
      { userId },
      { $set: { attempts: usageCount, lastAttempt: new Date() }, $setOnInsert: { used: false } },
      { upsert: true }
    );

    // Send the partner embed with Yes/No and form button
    const components = [
      textComponent("## ✉️ Pengajuan Partnership"),
      separatorComponent(),
      textComponent("> Click dibawah ini untuk isi deskripsi server kamu\n\n**Note:** Pilih Yes/No untuk menggunakan embed atau tidak."),
      separatorComponent(),
      actionRowComponent([
        buttonComponent({ style: 1, label: "Isi Formulir Disini", emoji: { name: "📩" }, customId: "partnership_cmd_form" }),
        buttonComponent({ style: 3, label: "Yes", customId: "partnership_cmd_yes", disabled: true }),
        buttonComponent({ style: 4, label: "No", customId: "partnership_cmd_no" })
      ]),
      separatorComponent(),
      textComponent("-# © Guild Partnership - EmpireBS")
    ];

    await message.reply(buildV2Message(components));
    return true;
  }

  async handleBerhentiLanjutCmd(message, member, isBerhenti) {
    // Create an embed with a button that opens a modal
    const actionLabel = isBerhenti ? "Berhenti Partnership" : "Lanjutkan Partnership";
    const modalPrefix = isBerhenti ? "berhenti" : "lanjut";
    const buttonId = `${modalPrefix}_btn_${member.id}`;

    const components = [
      textComponent(`## ${isBerhenti ? "🛑 Berhenti Partnership" : "✅ Lanjutkan Partnership"}`),
      separatorComponent(),
      textComponent(isBerhenti
        ? "Anda akan mengajukan penghentian partnership. Klik tombol di bawah untuk melanjutkan."
        : "Anda akan membatalkan penghentian partnership. Klik tombol di bawah untuk melanjutkan."),
      separatorComponent(),
      actionRowComponent([
        buttonComponent({ style: isBerhenti ? 4 : 3, label: isBerhenti ? "Ajukan Berhenti" : "Lanjutkan", customId: buttonId })
      ]),
      separatorComponent(),
      textComponent("-# © Guild Partnership - EmpireBS")
    ];

    await message.reply(buildV2Message(components));
    return true;
  }

  async handleBerhentiLanjutButton(interaction) {
    const customId = interaction.customId;
    const isBerhenti = customId.startsWith("berhenti_");
    const userId = customId.split("_").pop(); // last part is user ID
    if (interaction.user.id !== userId) {
      return interaction.reply({ content: "❌ Hanya pemilik perintah yang bisa menekan tombol ini.", ephemeral: true });
    }

    const modalCustomId = isBerhenti ? `berhenti_modal_${userId}` : `lanjut_modal_${userId}`;
    const modal = new ModalBuilder()
      .setCustomId(modalCustomId)
      .setTitle(isBerhenti ? "Formulir Berhenti Partnership" : "Formulir Lanjut Partnership");

    modal.addComponents(
      new ActionRowBuilder().addComponents(
        new TextInputBuilder()
          .setCustomId("pesan")
          .setLabel(isBerhenti ? "Ucapan Terima Kasih" : "Alasan Dibatalkan")
          .setStyle(TextInputStyle.Paragraph)
          .setRequired(true)
          .setPlaceholder(isBerhenti
            ? "Terima kasih banyak atas kerja samanya selama ini..."
            : "Terima kasih, penghentian tidak jadi dilakukan...")
          .setValue(isBerhenti
            ? "Terima kasih banyak atas kerja sama dan kepercayaannya. Kami mendoakan yang terbaik untuk komunitas Anda."
            : "Terima kasih telah melanjutkan partnership. Kami sangat menghargai keputusan Anda.")
      )
    );
    await interaction.showModal(modal);
  }

  async processBerhentiLanjutModal(interaction) {
    const customId = interaction.customId;
    const isBerhenti = customId.startsWith("berhenti_");
    const userId = customId.split("_").pop();
    const pesan = interaction.fields.getTextInputValue("pesan");
    await interaction.deferUpdate();
    const guild = interaction.guild;

    // Delete the channel where the command was issued
    const channel = interaction.channel;
    try {
      await channel.delete("Permintaan berhenti/lanjut selesai");
    } catch (e) {
      console.error("Gagal menghapus channel:", e);
    }

    if (isBerhenti) {
      // Remove partnership role
      const member = await guild.members.fetch(userId).catch(() => null);
      if (member) {
        await member.roles.remove(CONFIG.PARTNER_ROLE_ID).catch(() => {});
      }
      // Cleanup partnership data (delete messages, update forum thread, etc.)
      const partnership = await getCollection("partnerships").findOne({ userId, status: "accepted" });
      if (partnership) {
        if (partnership.messageId && partnership.channelId) {
          const ch = await this.client.channels.fetch(partnership.channelId).catch(() => null);
          if (ch) await ch.messages.delete(partnership.messageId).catch(() => {});
        }
        const eventPosts = await getCollection("event_posts").find({ userId, status: "accepted" }).toArray();
        for (const ep of eventPosts) {
          if (ep.messageId && ep.channelId) {
            const evCh = await this.client.channels.fetch(ep.channelId).catch(() => null);
            if (evCh) await evCh.messages.delete(ep.messageId).catch(() => {});
          }
          await getCollection("event_posts").deleteOne({ _id: ep._id });
        }
        if (partnership.forumThreadId) {
          const forumChannel = await this.client.channels.fetch(CONFIG.FORUM_LOG_CHANNEL_ID).catch(() => null);
          if (forumChannel) {
            const thread = await forumChannel.threads.fetch(partnership.forumThreadId).catch(() => null);
            if (thread) {
              const newName = thread.name.replace(/\)/g, "") + " Mantan";
              await thread.setName(newName).catch(() => {});
            }
          }
        }
        await getCollection("partnerships").deleteOne({ _id: partnership._id });
      }
    } else {
      // !lanjut: just delete channel, do not remove role
      // Optionally send a message to user
      try {
        const user = await this.client.users.fetch(userId);
        await user.send({ ...this.buildSimpleMessage("✅ Partnership Dilanjutkan", `Terima kasih, partnership Anda tetap berjalan.\n\nPesan Anda:\n${pesan}`) });
      } catch (err) {}
    }

    // Notify user if possible
    try {
      const user = await this.client.users.fetch(userId);
      await user.send({
        ...this.buildSimpleMessage(
          isBerhenti ? "🛑 Partnership Dihentikan" : "✅ Partnership Dilanjutkan",
          isBerhenti
            ? `Partnership Anda telah dihentikan. Pesan Anda:\n${pesan}`
            : `Partnership Anda tetap berjalan. Pesan Anda:\n${pesan}`
        )
      });
    } catch (err) {}

    // No need to reply further as channel is deleted
  }

  // ==================== LIST AND SEARCH ====================
  async showList(interaction, page) {
    try {
      const perPage = 10;
      const total = await getCollection("partnerships").countDocuments({ status: "accepted" });
      const totalPages = Math.ceil(total / perPage) || 1;
      if (page < 1) page = totalPages;
      if (page > totalPages) page = 1;

      const partnerships = await getCollection("partnerships")
        .find({ status: "accepted" })
        .skip((page - 1) * perPage)
        .limit(perPage)
        .toArray();

      let listText = "";
      for (let i = 0; i < 10; i++) {
        const p = partnerships[i];
        if (p) {
          listText += `**${(page - 1) * 10 + i + 1}.** <@${p.userId}>\n-# <:00:1360567203325542431>Server Link: [${p.serverName}](${p.serverLink})\n`;
        } else {
          listText += `**${(page - 1) * 10 + i + 1}.** @none\n-# <:00:1360567203325542431>Server Link: \`none\`\n`;
        }
      }

      const components = [
        textComponent("## 📜 List Partnership"),
        separatorComponent(),
        sectionComponent([listText], buttonComponent({ style: 2, label: "Search", customId: "partnership_search" })),
        separatorComponent(),
        textComponent(`-# Terakhir diperbarui: <t:${Math.floor(Date.now() / 1000)}:R> • Total partnership: ${total}`),
        actionRowComponent([
          buttonComponent({ style: 2, label: "◀◀", customId: `list_page_${page === 1 ? totalPages : Math.max(1, page - 5)}` }),
          buttonComponent({ style: 2, label: "◀", customId: `list_page_prev_${page}` }),
          buttonComponent({ style: 2, label: `${page}/${totalPages}`, customId: `list_page_info_${page}`, disabled: true }),
          buttonComponent({ style: 2, label: "▶", customId: `list_page_next_${page}` }),
          buttonComponent({ style: 2, label: "▶▶", customId: `list_page_${page === totalPages ? 1 : Math.min(totalPages, page + 5)}` })
        ]),
        separatorComponent(),
        textComponent("-# © Guild Partnership - EmpireBS")
      ];

      await interaction.reply({ ...buildV2Message(components), ephemeral: true });
    } catch (err) {
      console.error("List error:", err);
      await interaction.reply({ ...this.buildSimpleMessage("❌ Error", "Terjadi kesalahan saat memuat daftar partnership."), ephemeral: true });
    }
  }

  async handleListPagination(interaction) {
    const customId = interaction.customId;
    let page;
    if (customId.startsWith("list_page_prev_")) {
      page = parseInt(customId.replace("list_page_prev_", "")) - 1;
    } else if (customId.startsWith("list_page_next_")) {
      page = parseInt(customId.replace("list_page_next_", "")) + 1;
    } else if (customId.startsWith("list_page_info_")) {
      return;
    } else {
      page = parseInt(customId.replace("list_page_", ""));
    }
    if (isNaN(page)) return;
    await this.showList(interaction, page);
  }

  async handleSearch(interaction) {
    const modal = new ModalBuilder()
      .setCustomId("search_modal")
      .setTitle("Cari Partnership");
    modal.addComponents(
      new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId("search_name").setLabel("Nama Server (Opsional)").setStyle(TextInputStyle.Short).setRequired(false)),
      new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId("search_link").setLabel("Link Server (Opsional)").setStyle(TextInputStyle.Short).setRequired(false)),
      new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId("search_by").setLabel("Partnership By (Opsional)").setStyle(TextInputStyle.Short).setRequired(false))
    );
    await interaction.showModal(modal);
  }

  async processSearchSubmission(interaction) {
    const name = interaction.fields.getTextInputValue("search_name");
    const link = interaction.fields.getTextInputValue("search_link");
    const by = interaction.fields.getTextInputValue("search_by");
    if (!name && !link && !by) {
      await interaction.reply({ ...this.buildSimpleMessage("⚠️ Input Diperlukan", "Minimal satu field harus diisi."), ephemeral: true });
      return;
    }
    const query = { status: "accepted" };
    if (name) query.serverName = { $regex: name, $options: "i" };
    if (link) query.serverLink = { $regex: link, $options: "i" };
    if (by) query.username = { $regex: by, $options: "i" };
    const results = await getCollection("partnerships").find(query).limit(10).toArray();

    let resultText = "## 🔍 Hasil Pencarian\n\n";
    if (results.length === 0) {
      resultText += "Tidak ditemukan hasil.";
    } else {
      results.forEach((p, i) => {
        resultText += `**${i + 1}.** <@${p.userId}> - ${p.serverName}\n-# <:00:1360567203325542431>Link: [Klik Disini](${p.serverLink})\n`;
      });
    }
    await interaction.reply({ ...buildV2Message([textComponent(resultText), separatorComponent(), textComponent("-# © Guild Partnership - EmpireBS")]), ephemeral: true });
  }

  // ==================== DM TOGGLE ====================
  async handleDmToggle(interaction) {
    const customId = interaction.customId;
    const userId = interaction.user.id;
    const partnership = await getCollection("partnerships").findOne({ userId, status: "accepted" });
    if (partnership) {
      await getCollection("partnerships").updateOne({ _id: partnership._id }, { $set: { dmNotifications: customId === "partnership_dm_yes" } });
    }
    const isYes = customId === "partnership_dm_yes";
    await interaction.update({ ...this.getDmToggleTemplate(isYes), ephemeral: true });
  }

  // ==================== MESSAGE SENDERS ====================
  async sendPartnerMessage(channel, data) {
    const isEmbed = data.useEmbed !== false;
    const accentColor = data.sidebarColor || 0x3498db;
    if (isEmbed) {
      const components = [
        textComponent(`# ${data.serverName}`),
        separatorComponent(),
        textComponent(data.serverDescription),
        separatorComponent()
      ];
      if (data.bannerUrls && data.bannerUrls.length > 0) {
        components.push(mediaGalleryComponent(data.bannerUrls));
        components.push(separatorComponent());
      }
      components.push(
        textComponent(`📎 | Server Link: [Invite](<${data.serverLink}>)\n🏷️ | Partner By: <@${data.userId}>`),
        separatorComponent(),
        textComponent("-# © Guild Partnership - EmpireBS")
      );
      return await channel.send(buildV2MessageWithAccent(components, accentColor));
    } else {
      const plainText = `# ${data.serverName}\n**${data.serverDescription}**\n\n📎 | Server Link: [Invite](<${data.serverLink}>)\n🏷️ | Partner By: <@${data.userId}>`;
      return await channel.send({ content: `-# [.](${data.serverLink})`, ...buildV2Message([textComponent(plainText), separatorComponent(), textComponent("-# © Guild Partnership - EmpireBS")]) });
    }
  }

  async sendEventMessage(channel, data) {
    const isEmbed = data.useEmbed !== false;
    const accentColor = data.sidebarColor || 0x3498db;
    if (isEmbed) {
      const components = [
        textComponent(`# ${data.serverName}`),
        separatorComponent(),
        textComponent(data.eventDescription),
        separatorComponent()
      ];
      if (data.bannerUrls && data.bannerUrls.length > 0) {
        components.push(mediaGalleryComponent(data.bannerUrls));
        components.push(separatorComponent());
      }
      components.push(
        textComponent(`📎 | Server Link: [Invite](<${data.serverLink}>)\n🎉 | Event Link: [Klik Disini](<${data.eventLink || data.serverLink}>)\n🏷️ | Partner By: <@${data.userId}>`),
        separatorComponent(),
        textComponent("-# © Guild Partnership - EmpireBS")
      );
      return await channel.send(buildV2MessageWithAccent(components, accentColor));
    } else {
      const plainText = `# ${data.serverName}\n**${data.eventDescription}**\n\n📎 | Server Link: [Invite](<${data.serverLink}>)\n🎉 | Event Link: [Klik Disini](<${data.eventLink || data.serverLink}>)\n🏷️ | Partner By: <@${data.userId}>`;
      return await channel.send({ content: `-# [.](${data.serverLink})`, ...buildV2Message([textComponent(plainText), separatorComponent(), textComponent("-# © Guild Partnership - EmpireBS")]) });
    }
  }

  async createForumLog(interaction, data, type, startTime) {
    try {
      const forumChannel = await this.client.channels.fetch(CONFIG.FORUM_LOG_CHANNEL_ID);
      if (!forumChannel || forumChannel.type !== ChannelType.GuildForum) return;

      const duration = this.formatDuration(Date.now() - startTime);
      const user = await this.client.users.fetch(data.userId);
      const acceptor = interaction.user;
      const threadName = `1) ${data.serverName}`;

      const logComponents = [
        textComponent(`## ✅ ${user.username} Success ${type}`),
        separatorComponent(),
        textComponent(`**👤 Informasi User**\n> **Username:** [${user.username}](https://discord.com/users/${user.id})\n> **ID:** \`${user.id}\``),
        separatorComponent(),
        textComponent(`**📊 Detail**\n> **Waktu:** ${new Date().toLocaleString("id-ID")}\n> **Accept:** ${acceptor.username}\n> **Link:** ${data.serverLink}`),
        separatorComponent(),
        textComponent("-# © Guild Partnership - EmpireBS")
      ];

      // Find or create thread
      let thread = null;
      const activeThreads = await forumChannel.threads.fetchActive();
      thread = activeThreads.threads.find(t => t.name === threadName);
      if (!thread) {
        const archived = await forumChannel.threads.fetchArchived();
        thread = archived.threads.find(t => t.name === threadName);
      }
      if (thread) {
        await thread.send(buildV2Message(logComponents));
      } else {
        const newThread = await forumChannel.threads.create({
          name: threadName,
          message: buildV2Message(logComponents),
        });
        // Store thread ID in partnership data for later renaming
        if (type === "partnership" || type === "repost") {
          await getCollection("partnerships").updateOne({ _id: data._id }, { $set: { forumThreadId: newThread.id } });
        }
      }
    } catch (err) {
      console.error("Forum log error:", err);
    }
  }

  async sendAcceptDm(userId, data, acceptor, type) {
    try {
      const user = await this.client.users.fetch(userId);
      if (!user) return;
      const title = type === "partnership" ? "Partnership Diterima" : (type === "event" ? "Events Diterima" : "Re-Posting Diterima");
      await user.send({
        ...this.buildSimpleMessage(`✅ ${title}`, `Selamat! Pengajuan Anda telah diterima.\n\n**Detail:**\n> Nama Server: ${data.serverName}\n> Link: ${data.serverLink}\n> Diterima oleh: ${acceptor.username}`)
      });
    } catch (err) {}
  }

  async sendEventDm(eventPost, acceptor, startTime) {
    try {
      const user = await this.client.users.fetch(eventPost.userId);
      if (!user) return;
      const partnership = await getCollection("partnerships").findOne({ userId: eventPost.userId, status: "accepted" });
      if (partnership && partnership.dmNotifications) {
        await user.send({
          ...this.buildSimpleMessage("📨 Notifikasi", `Postingan Events kamu sudah dikirim di <#${CONFIG.EVENT_PARTNER_CHANNEL_ID}>\nDi Accept oleh: ${acceptor.username}`)
        });
      }
    } catch (err) {}
  }

  // ==================== TEMPLATES ====================
  getAlreadyPartnerTemplate() {
    return buildV2Message([
      textComponent("## Kamu Sudah Berpartnership"),
      separatorComponent(),
      textComponent("Anda telah terdaftar sebagai partner. Silakan gunakan fitur Posting Events atau Re-Posting."),
      separatorComponent(),
      textComponent("-# © Guild Partnership - EmpireBS")
    ]);
  }

  getNeedPartnerFirstTemplate() {
    return buildV2Message([
      textComponent("## Berpartnership Terlebih dahulu"),
      separatorComponent(),
      textComponent("Anda harus menjadi partner terlebih dahulu untuk mengakses fitur ini."),
      separatorComponent(),
      textComponent("-# © Guild Partnership - EmpireBS")
    ]);
  }

  getOpenPartnershipTemplate() {
    return buildV2Message([
      textComponent("## 🔍 Pengajuan Partnership"),
      separatorComponent(),
      textComponent("> - Pencet tombol **Open Tiket** di bawah dan pilih Request Partner\n> - Antri dan tertib tunggu diproses sesuai urutan\n> - Dilarang spam pesan berulang atau mention"),
      separatorComponent(),
      actionRowComponent([
        buttonComponent({ style: 5, label: "Open Ticket", emoji: { name: "📫" }, url: "https://discord.com/channels/1347233781391560837/1498935151441219584", customId: null }),
        buttonComponent({ style: 3, label: "Benefit", emoji: { name: "🎀" }, customId: "partnership_benefit" }),
        buttonComponent({ style: 1, label: "Ketentuan Partner", emoji: { name: "📋" }, customId: "partnership_rules" })
      ]),
      separatorComponent(),
      textComponent("-# © Guild Partnership - EmpireBS")
    ]);
  }

  getPostingEventsTemplate() {
    return buildV2Message([
      textComponent("## 📥 Posting Events"),
      separatorComponent(),
      textComponent("### Ketentuan Events:\n> - Wajib gunakan mention khusus\n> - Ditinjau admin\n### Prosedur:\n> - Pilih Yes/No untuk embed\n> - Klik tombol di bawah"),
      separatorComponent(),
      actionRowComponent([
        buttonComponent({ style: 1, label: "Isi Formulir Disini", emoji: { name: "📩" }, customId: "partnership_event_form" }),
        buttonComponent({ style: 3, label: "Yes", customId: "partnership_event_yes", disabled: true }),
        buttonComponent({ style: 4, label: "No", customId: "partnership_event_no" })
      ]),
      separatorComponent(),
      textComponent("-# © Guild Partnership - EmpireBS")
    ]);
  }

  getRepostingTemplate() {
    return buildV2Message([
      textComponent("## 🔃 Re-Posting Partnership"),
      separatorComponent(),
      textComponent("### Ketentuan Utama:\n> - Cooldown 1 minggu\n### Prosedur:\n> - Pilih Yes/No\n> - Klik tombol di bawah"),
      separatorComponent(),
      actionRowComponent([
        buttonComponent({ style: 1, label: "Isi Formulir Disini", emoji: { name: "📩" }, customId: "partnership_repost_form" }),
        buttonComponent({ style: 3, label: "Yes", customId: "partnership_repost_yes", disabled: true }),
        buttonComponent({ style: 4, label: "No", customId: "partnership_repost_no" })
      ]),
      separatorComponent(),
      textComponent("-# © Guild Partnership - EmpireBS")
    ]);
  }

  getBenefitTemplate() {
    return buildV2Message([
      textComponent("## 🎀 Benefit Partnership"),
      separatorComponent(),
      textComponent("> - Relasi: Membangun koneksi antar-server\n> - Promosi Event: Kesempatan membagikan event\n> - Kolaborasi: Mengadakan proyek bersama\n> - Role Eksklusif: Mendapatkan role khusus Partnership"),
      separatorComponent(),
      textComponent("-# © Guild Partnership - EmpireBS")
    ]);
  }

  getRulesTemplate() {
    return buildV2Message([
      textComponent("## 📋 Ketentuan Partnership"),
      separatorComponent(),
      textComponent("> - Perwakilan staff wajib bergabung\n> - Gunakan tiket untuk pengajuan event\n> - Wajib memposting deskripsi/event server kami\n> - Perwakilan dilarang keluar server tanpa koordinasi\n> - Admin berhak mengedit konten postingan"),
      separatorComponent(),
      textComponent("-# © Guild Partnership - EmpireBS")
    ]);
  }

  getStopPartnershipTemplate() {
    return buildV2Message([
      textComponent("## 🛑 Berhenti Partnership"),
      separatorComponent(),
      textComponent("Silakan isi formulir di bawah untuk mengajukan penghentian partnership."),
      separatorComponent(),
      actionRowComponent([buttonComponent({ style: 2, label: "Ajukan Berhenti", customId: "partnership_stop_form" })]),
      separatorComponent()
    ]);
  }

  getDmToggleTemplate(isYes) {
    return buildV2Message([
      textComponent("## 🔈 Notifikasi DM"),
      separatorComponent(),
      textComponent(`> Saat pilih tombol **Iya Pake** bot akan kirim DM notifikasi.\n> postingan events sudah kekirim di <#${CONFIG.EVENT_PARTNER_CHANNEL_ID}>\n\nNote: Saat ini tombol **${isYes ? "Iya Pake" : "Tidak Pake"}**`),
      separatorComponent(),
      actionRowComponent([
        buttonComponent({ style: 3, label: "Iya Pake", customId: "partnership_dm_yes", disabled: isYes }),
        buttonComponent({ style: 4, label: "Tidak Pake", customId: "partnership_dm_no", disabled: !isYes })
      ]),
      separatorComponent(),
      textComponent("-# © Guild Partnership - EmpireBS")
    ]);
  }

  buildSimpleMessage(title, description) {
    return buildV2Message([
      textComponent(`## ${title}`),
      separatorComponent(),
      textComponent(description),
      separatorComponent(),
      textComponent("-# © Guild Partnership - EmpireBS")
    ]);
  }

  // Utility methods
  parseBannerUrls(bannerString) {
    if (!bannerString) return [];
    return bannerString.split(",").map(u => u.trim()).filter(u => u.length > 0);
  }

  parseColor(colorString) {
    if (!colorString) return 0x3498db; // default blue
    const color = parseInt(colorString);
    return isNaN(color) ? 0x3498db : color;
  }

  formatDuration(ms) {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    if (hours > 0) return `${hours}j ${minutes % 60}m ${seconds % 60}d`;
    if (minutes > 0) return `${minutes}m ${seconds % 60}s`;
    return `${seconds}s`;
  }
}

module.exports = PartnershipSystem;
