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
  PARTNER_CMD_COOLDOWN: 5 * 60 * 1000, // 5 menit
  PARTNER_CMD_MAX_USES: 3,
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
  const btn = { type: 2, style, label, disabled };
  if (customId) btn.custom_id = customId;
  if (url) btn.url = url;
  if (emoji) btn.emoji = emoji;
  return btn;
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

// ==================== TEMPLATES ====================
function getDashboardTemplate() {
  return buildV2Message([
    textComponent("## <:1_:1486297322848653425> Partnership Requirement<:00:1360567203325542431><:00:1360567203325542431><:00:1360567203325542431><:00:1360567203325542431>"),
    separatorComponent(),
    textComponent("> - Member dan Staff server aktif\n> - Tidak mengandung konten NSFW.\n> - Tiada minimal jumlah member server.\n> - Gunakan channels partner bukan forum.\n> - Tidak menerima server khusus berjualan.\n> - Bebas dari konflik dengan komunitas lain."),
    separatorComponent(),
    actionRowComponent([{
      type: 3,
      custom_id: "p_301362246674550785",
      options: [
        { label: "Open Partnership", value: "2X4OAiLrez", emoji: { name: "🔍" } },
        { label: "Posting Events", value: "5rSW3aoXFw", emoji: { name: "📥" } },
        { label: "Re-Posting Partner", value: "Vrv9pE1vwp", emoji: { name: "🔃" } },
        { label: "List Partnership", value: "IoA1YxsT8u", emoji: { name: "📜" } },
        { label: "Berhenti Partnership", value: "ASH11sgG4x", emoji: { name: "🛑" } }
      ],
      placeholder: "Pilih menu partnership...",
      min_values: 1,
      max_values: 1
    }]),
    separatorComponent(),
    textComponent("-# © Guild Partnership - EmpireBS")
  ]);
}

function getStopPartnershipTemplate() {
  return buildV2Message([
    textComponent("## 🛑 Berhenti Partnership"),
    separatorComponent(),
    textComponent("Silakan isi formulir di bawah ini untuk mengajukan penghentian partnership."),
    separatorComponent(),
    actionRowComponent([buttonComponent({ style: 2, label: "Ajukan Berhenti", customId: "partnership_stop_form" })]),
    separatorComponent()
  ]);
}

function getOpenPartnershipTemplate() {
  return buildV2Message([
    textComponent("## 🔍 Pengajuan Partnership"),
    separatorComponent(),
    textComponent("> - Pencet tombol **Open Tiket** di bawah dan pilih Request Partner\n> - Antri dan tertib tunggu diproses sesuai urutan, mohon bersabar\n> - Dilarang spam pesan berulang atau mention, demi kenyamanan"),
    separatorComponent(),
    actionRowComponent([
      buttonComponent({ style: 5, label: "Open Ticket", emoji: { name: "📫" }, url: "https://discord.com/channels/1347233781391560837/1498935151441219584" }),
      buttonComponent({ style: 3, label: "Benefit", emoji: { name: "🎀" }, customId: "partnership_benefit" }),
      buttonComponent({ style: 1, label: "Ketentuan Partner", emoji: { name: "📋" }, customId: "partnership_rules" })
    ]),
    separatorComponent(),
    textComponent("-# © Guild Partnership - EmpireBS")
  ]);
}

function getPostingEventsTemplate() {
  return buildV2Message([
    textComponent("## 📥 Posting Events"),
    separatorComponent(),
    textComponent("### Ketentuan Events: <:00:1360567203325542431><:00:1360567203325542431><:00:1360567203325542431><:00:1360567203325542431><:00:1360567203325542431><:00:1360567203325542431><:00:1360567203325542431><:00:1360567203325542431><:00:1360567203325542431><:00:1360567203325542431><:00:1360567203325542431><:00:1360567203325542431><:00:1360567203325542431><:00:1360567203325542431>\n> - Wajib gunakan mention khusus yang tersedia.\n> - Postingan ditinjau admin sebelum dipublikasikan.\n> - Admin berhak menyesuaikan teks sesuai ketentuan.\n### Prosedur:\n> - Pilih Yes/No untuk memakai embed atau tidak.\n> - Klik tombol di bawah dan lengkapi detail acara anda."),
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

function getRepostingTemplate() {
  return buildV2Message([
    textComponent("## 🔃 Re-Posting Partnership"),
    separatorComponent(),
    textComponent("### Ketentuan Utama:<:00:1360567203325542431><:00:1360567203325542431><:00:1360567203325542431><:00:1360567203325542431><:00:1360567203325542431><:00:1360567203325542431><:00:1360567203325542431><:00:1360567203325542431><:00:1360567203325542431><:00:1360567203325542431><:00:1360567203325542431><:00:1360567203325542431><:00:1360567203325542431><:00:1360567203325542431>\n> - Cooldown 1 minggu sekali.\n> - Saling memposting ulang deskripsi.\n> - Gunakan mention khusus yang tersedia.\n### Prosedur:\n> - Pilih Yes/No untuk memakai embed atau tidak.\n> - Postingan ditinjau admin sebelum dipublikasikan.\n> - Admin berhak menyesuaikan teks sesuai ketentuan.\n> - Klik tombol di bawah dan lengkapi data server anda."),
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

function getBenefitTemplate() {
  return buildV2Message([
    textComponent("## 🎀 Benefit Partnership <:00:1360567203325542431><:00:1360567203325542431><:00:1360567203325542431><:00:1360567203325542431><:00:1360567203325542431><:00:1360567203325542431><:00:1360567203325542431><:00:1360567203325542431><:00:1360567203325542431>"),
    separatorComponent(),
    textComponent("> - Relasi: Membangun koneksi antar-server secara resmi\n\n> - Promosi Event: Kesempatan membagikan event Anda\n\n> - Kolaborasi: Mengadakan proyek bersama EmpireBS\n\n> - Role Eksklusif: Mendapatkan role khusus Partnership"),
    separatorComponent(),
    textComponent("-# © Guild Partnership - EmpireBS")
  ]);
}

function getRulesTemplate() {
  return buildV2Message([
    textComponent("## 📋 Ketentuan Partnership"),
    separatorComponent(),
    textComponent("> -  Perwakilan staff wajib bergabung sebagai perwakilan. Saling post event bersifat timbal balik.\n\n> - Gunakan tiket untuk pengajuan event. Dilarang menggunakan mention everyone tanpa izin.\n\n> - Wajib memposting deskripsi/event server kami. Kelalaian dalam posting dapat mengakibatkan pemutusan kerja sama.\n\n> - Perwakilan dilarang keluar server tanpa koordinasi. Jika perwakilan keluar tanpa alasan, partner akan diputus.\n\n> - Admin berhak mengedit konten postingan dan memutus kerja sama jika melanggar ketentuan di atas."),
    separatorComponent(),
    textComponent("-# © Guild Partnership - EmpireBS")
  ]);
}

function getAlreadyPartnerTemplate() {
  return buildV2Message([
    textComponent("## Kamu Sudah Berpartnership"),
    separatorComponent(),
    textComponent("Anda telah terdaftar sebagai partner. Silakan gunakan fitur Posting Events atau Re-Posting jika diperlukan."),
    separatorComponent(),
    textComponent("-# © Guild Partnership - EmpireBS")
  ]);
}

function getNeedPartnerFirstTemplate() {
  return buildV2Message([
    textComponent("## Berpartnership Terlebih dahulu"),
    separatorComponent(),
    textComponent("Anda harus menjadi partner terlebih dahulu untuk mengakses fitur ini. Silakan ajukan partnership melalui menu Open Partnership."),
    separatorComponent(),
    textComponent("-# © Guild Partnership - EmpireBS")
  ]);
}

function getNoPermissionTemplate() {
  return buildV2Message([
    textComponent("## Akses Ditolak"),
    separatorComponent(),
    textComponent("Maaf, Anda tidak memiliki izin untuk menggunakan perintah ini. Hanya admin partnership yang dapat mengakses fitur ini."),
    separatorComponent(),
    textComponent("-# © Guild Partnership - EmpireBS")
  ]);
}

function getMaxChannelTemplate() {
  return buildV2Message([
    textComponent("## Batas Maksimum Tercapai"),
    separatorComponent(),
    textComponent("Anda telah mencapai batas maksimal pengajuan partnership (3/3). Silakan tunggu hingga salah satu pengajuan diproses atau hubungi admin partnership."),
    separatorComponent(),
    textComponent("-# © Guild Partnership - EmpireBS")
  ]);
}

function getPartnerCommandTemplate() {
  return buildV2Message([
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
  ]);
}

function getPartnerCooldownTemplate(remainingTime) {
  const minutes = Math.ceil(remainingTime / 60000);
  return buildV2Message([
    textComponent("## ⏳ Cooldown Aktif"),
    separatorComponent(),
    textComponent(`Mohon tunggu **${minutes} menit** lagi sebelum menggunakan perintah \`!partner\` kembali.\n\nTombol pengajuan partnership akan aktif kembali setelah cooldown berakhir.`),
    separatorComponent(),
    textComponent("-# © Guild Partnership - EmpireBS")
  ]);
}

function getPartnerLimitTemplate() {
  return buildV2Message([
    textComponent("## ⚠️ Batas Penggunaan Tercapai"),
    separatorComponent(),
    textComponent("Maaf, Anda telah mencapai batas maksimal penggunaan perintah `!partner` (**3 kali**).\n\nJika Anda membutuhkan bantuan lebih lanjut, silakan hubungi admin partnership melalui tiket support."),
    separatorComponent(),
    textComponent("-# © Guild Partnership - EmpireBS")
  ]);
}

function getPartnerAlreadySubmittedTemplate() {
  return buildV2Message([
    textComponent("## ✅ Pengajuan Sudah Dikirim"),
    separatorComponent(),
    textComponent("Anda sudah mengirimkan pengajuan partnership. Mohon tunggu review dari admin.\n\nAnda tidak dapat mengirim pengajuan baru hingga pengajuan sebelumnya diproses."),
    separatorComponent(),
    textComponent("-# © Guild Partnership - EmpireBS")
  ]);
}

function getDmNotificationTemplate(messageId, acceptorId) {
  return buildV2Message([
    sectionComponent(["## <:1_:1486297322848653425> Notifikasi DM"],
      buttonComponent({ style: 5, label: "Messages", url: `https://discord.com/channels/1347233781391560837/1502206484489175101/${messageId}`, customId: "p_301426364286767106" })
    ),
    separatorComponent(),
    textComponent(`Postingan Events kamu sudah kekirim di <#1502206484489175101>\nDi Accept oleh: <@${acceptorId}>`),
    separatorComponent(),
    textComponent("-# © Guild Partnership - EmpireBS")
  ]);
}

function getDmToggleTemplate() {
  return buildV2Message([
    textComponent("## 🔈 Notifikasi DM"),
    separatorComponent(),
    textComponent("> Saat pilih tombol **Iya Pake** bot <@1364585069812912148> akan kirim DM notifikasi.\n> postingan events sudah kekirim di <#1502206484489175101>\n\nNote: Saat ini tombol **Tidak Pake**"),
    separatorComponent(),
    actionRowComponent([
      buttonComponent({ style: 3, label: "Iya Pake", customId: "partnership_dm_yes" }),
      buttonComponent({ style: 4, label: "Tidak Pake", customId: "partnership_dm_no", disabled: true })
    ]),
    separatorComponent(),
    textComponent("-# © Guild Partnership - EmpireBS")
  ]);
}

function getNoEmbedNoticeTemplate() {
  return buildV2Message([
    textComponent("## ℹ️ Tanpa Embed"),
    separatorComponent(),
    textComponent("Anda memilih untuk **tidak menggunakan embed**. Postingan akan ditampilkan dalam format teks biasa tanpa Component V2 Embed."),
    separatorComponent(),
    textComponent("-# © Guild Partnership - EmpireBS")
  ]);
}

// NEW: Stop command templates
function getStopCommandTemplate() {
  return buildV2Message([
    textComponent("## 🛑 Pengajuan Berhenti Partnership"),
    separatorComponent(),
    textComponent("Kami mohon maaf atas ketidaknyamanan ini. Jika Anda memutuskan untuk berhenti partnership, silakan klik tombol di bawah untuk mengisi formulir penghentian.\n\n**Catatan:** Setelah disetujui, role partnership Anda akan dicabut dan semua postingan partner/events akan dihapus."),
    separatorComponent(),
    actionRowComponent([
      buttonComponent({ style: 4, label: "Isi Formulir Berhenti", emoji: { name: "📝" }, customId: "stop_cmd_form" })
    ]),
    separatorComponent(),
    textComponent("-# © Guild Partnership - EmpireBS")
  ]);
}

function getContinueCommandTemplate() {
  return buildV2Message([
    textComponent("## ✅ Pembatalan Penghentian Partnership"),
    separatorComponent(),
    textComponent("Terima kasih atas keputusan Anda untuk tetap melanjutkan partnership dengan komunitas kami. Kami sangat menghargai kerjasama yang telah terjalin.\n\nSilakan klik tombol di bawah untuk mengkonfirmasi bahwa Anda membatalkan pengajuan berhenti partnership."),
    separatorComponent(),
    actionRowComponent([
      buttonComponent({ style: 3, label: "Konfirmasi Lanjut Partnership", emoji: { name: "🤝" }, customId: "continue_cmd_form" })
    ]),
    separatorComponent(),
    textComponent("-# © Guild Partnership - EmpireBS")
  ]);
}

function getStopFormModalTemplate() {
  return buildV2Message([
    textComponent("## 📝 Formulir Berhenti Partnership"),
    separatorComponent(),
    textComponent("Terima kasih banyak atas penjelasan dan kerjasama yang telah terjalin selama ini. Mohon isi formulir di bawah ini dengan alasan penghentian partnership Anda."),
    separatorComponent(),
    actionRowComponent([
      buttonComponent({ style: 1, label: "Isi Formulir", emoji: { name: "📝" }, customId: "stop_cmd_modal" })
    ]),
    separatorComponent(),
    textComponent("-# © Guild Partnership - EmpireBS")
  ]);
}

function getContinueFormModalTemplate() {
  return buildV2Message([
    textComponent("## 📝 Formulir Pembatalan Berhenti"),
    separatorComponent(),
    textComponent("Terima kasih telah memutuskan untuk tetap berpartnership dengan kami. Kami sangat menghargai kepercayaan Anda. Mohon isi formulir konfirmasi di bawah ini."),
    separatorComponent(),
    actionRowComponent([
      buttonComponent({ style: 1, label: "Isi Formulir Konfirmasi", emoji: { name: "✅" }, customId: "continue_cmd_modal" })
    ]),
    separatorComponent(),
    textComponent("-# © Guild Partnership - EmpireBS")
  ]);
}

function getWrongCategoryTemplate() {
  return buildV2Message([
    textComponent("## ⚠️ Salah Channel"),
    separatorComponent(),
    textComponent("Perintah ini hanya dapat digunakan di channel khusus partnership. Silakan gunakan channel yang berada dalam kategori partnership yang telah ditentukan."),
    separatorComponent(),
    textComponent("-# © Guild Partnership - EmpireBS")
  ]);
}

// ==================== PARTNERSHIP CLASS ====================
class PartnershipSystem {
  constructor(client) {
    this.client = client;
    this.userChannels = new Map();
    // Cooldown tracking: { userId: { lastUsed: timestamp, count: number } }
    this.partnerCmdTracker = new Map();
    // Track submitted users: { userId: { submitted: boolean, messageId: string } }
    this.partnerSubmitted = new Map();
  }

  async initialize() {
    await connectDatabase();
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
      { type: 10, content: "## <:1_:1486297322848653425> Partnership Requirement<:00:1360567203325542431><:00:1360567203325542431><:00:1360567203325542431><:00:1360567203325542431>" },
      { type: 14 },
      { type: 10, content: "> - Member dan Staff server aktif\n> - Tidak mengandung konten NSFW.\n> - Tiada minimal jumlah member server.\n> - Gunakan channels partner bukan forum.\n> - Tidak menerima server khusus berjualan.\n> - Bebas dari konflik dengan komunitas lain." },
      { type: 14 },
      { type: 1, components: [{ type: 3, options: [
        { label: "Open Partnership", value: "2X4OAiLrez", emoji: { name: "🔍" } },
        { label: "Posting Events", value: "5rSW3aoXFw", emoji: { name: "📥" } },
        { label: "Re-Posting Partner", value: "Vrv9pE1vwp", emoji: { name: "🔃" } },
        { label: "List Partnership", value: "IoA1YxsT8u", emoji: { name: "📜" } },
        { label: "Berhenti Partnership", value: "ASH11sgG4x", emoji: { name: "🛑" } }
      ], custom_id: "p_301362246674550785", min_values: 1, max_values: 1 }] },
      { type: 14 },
      { type: 10, content: "-# © Guild Partnership - EmpireBS" }
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

    // Handle command-based interactions
    if (customId === "partnership_cmd_form" || customId === "partnership_cmd_form_noembed") {
      await this.handleCommandButton(interaction);
      return true;
    }

    if (customId === "stop_cmd_form" || customId === "stop_cmd_modal") {
      await this.handleStopCommandButton(interaction);
      return true;
    }

    if (customId === "continue_cmd_form" || customId === "continue_cmd_modal") {
      await this.handleContinueCommandButton(interaction);
      return true;
    }

    if (customId === "p_301362246674550785") {
      await this.handleDashboardSelect(interaction);
      return true;
    }

    if (customId.startsWith("partnership_")) {
      await this.handlePartnershipButton(interaction);
      return true;
    }

    if (customId.startsWith("admin_accept_") || customId.startsWith("admin_reject_") || customId.startsWith("admin_edit_")) {
      await this.handleAdminAction(interaction);
      return true;
    }

    if (customId.startsWith("stop_accept_") || customId.startsWith("stop_reject_")) {
      await this.handleStopAdminAction(interaction);
      return true;
    }

    if (customId.startsWith("list_page_")) {
      await this.handleListPagination(interaction);
      return true;
    }

    if (customId === "partnership_search") {
      await this.handleSearch(interaction);
      return true;
    }

    if (customId === "partnership_dm_yes" || customId === "partnership_dm_no") {
      await this.handleDmToggle(interaction);
      return true;
    }

    return false;
  }

  // NEW: Handle !partner command button clicks with cooldown and submission tracking
  async handleCommandButton(interaction) {
    const userId = interaction.user.id;
    const customId = interaction.customId;

    // Check if user already submitted
    if (this.partnerSubmitted.has(userId) && this.partnerSubmitted.get(userId).submitted) {
      await interaction.reply({ ...getPartnerAlreadySubmittedTemplate(), ephemeral: true });
      return;
    }

    if (customId === "partnership_cmd_form" || customId === "partnership_cmd_form_noembed") {
      await this.showFormModal(interaction, customId);
    }
  }

  // NEW: Handle !berhenti command button
  async handleStopCommandButton(interaction) {
    const customId = interaction.customId;

    if (customId === "stop_cmd_form") {
      await interaction.reply({ ...getStopFormModalTemplate(), ephemeral: true });
      return;
    }

    if (customId === "stop_cmd_modal") {
      const modal = new ModalBuilder()
        .setCustomId("stop_cmd_modal_submit")
        .setTitle("Formulir Berhenti Partnership");

      modal.addComponents(
        new ActionRowBuilder().addComponents(
          new TextInputBuilder().setCustomId("reason").setLabel("Alasan Berhenti Partnership").setStyle(TextInputStyle.Paragraph).setRequired(true).setPlaceholder("Jelaskan dengan detail alasan penghentian partnership...")
        )
      );
      await interaction.showModal(modal);
    }
  }

  // NEW: Handle !lanjut command button
  async handleContinueCommandButton(interaction) {
    const customId = interaction.customId;

    if (customId === "continue_cmd_form") {
      await interaction.reply({ ...getContinueFormModalTemplate(), ephemeral: true });
      return;
    }

    if (customId === "continue_cmd_modal") {
      const modal = new ModalBuilder()
        .setCustomId("continue_cmd_modal_submit")
        .setTitle("Konfirmasi Lanjut Partnership");

      modal.addComponents(
        new ActionRowBuilder().addComponents(
          new TextInputBuilder().setCustomId("confirmation").setLabel("Pesan Konfirmasi (Opsional)").setStyle(TextInputStyle.Paragraph).setRequired(false).setPlaceholder("Tuliskan pesan Anda jika ingin menyampaikan sesuatu...")
        )
      );
      await interaction.showModal(modal);
    }
  }

  async handleDashboardSelect(interaction) {
    const value = interaction.values[0];
    const member = interaction.member;

    switch (value) {
      case "2X4OAiLrez":
        if (this.hasPartnerRole(member)) {
          await interaction.reply({ ...getAlreadyPartnerTemplate(), ephemeral: true });
        } else {
          await interaction.reply({ ...getOpenPartnershipTemplate(), ephemeral: true });
        }
        break;

      case "5rSW3aoXFw":
        if (!this.hasPartnerRole(member)) {
          await interaction.reply({ ...getNeedPartnerFirstTemplate(), ephemeral: true });
        } else {
          await interaction.reply({ ...getPostingEventsTemplate(), ephemeral: true });
        }
        break;

      case "Vrv9pE1vwp":
        if (!this.hasPartnerRole(member)) {
          await interaction.reply({ ...getNeedPartnerFirstTemplate(), ephemeral: true });
        } else {
          await interaction.reply({ ...getRepostingTemplate(), ephemeral: true });
        }
        break;

      case "IoA1YxsT8u":
        await this.showList(interaction, 1);
        break;

      case "ASH11sgG4x":
        if (!this.hasPartnerRole(member)) {
          await interaction.reply({ ...getNeedPartnerFirstTemplate(), ephemeral: true });
        } else {
          await interaction.reply({ ...getStopPartnershipTemplate(), ephemeral: true });
        }
        break;
    }
  }

  async handlePartnershipButton(interaction) {
    const customId = interaction.customId;

    if (customId === "partnership_benefit") {
      await interaction.reply({ ...getBenefitTemplate(), ephemeral: true });
      return;
    }

    if (customId === "partnership_rules") {
      await interaction.reply({ ...getRulesTemplate(), ephemeral: true });
      return;
    }

    // Event Yes/No toggles
    if (customId === "partnership_event_yes") {
      await interaction.update({
        ...buildV2Message([
          textComponent("## 📥 Posting Events"),
          separatorComponent(),
          textComponent("### Ketentuan Events: <:00:1360567203325542431><:00:1360567203325542431><:00:1360567203325542431><:00:1360567203325542431><:00:1360567203325542431><:00:1360567203325542431><:00:1360567203325542431><:00:1360567203325542431><:00:1360567203325542431><:00:1360567203325542431><:00:1360567203325542431><:00:1360567203325542431><:00:1360567203325542431><:00:1360567203325542431>\n> - Wajib gunakan mention khusus yang tersedia.\n> - Postingan ditinjau admin sebelum dipublikasikan.\n> - Admin berhak menyesuaikan teks sesuai ketentuan.\n### Prosedur:\n> - Pilih Yes/No untuk memakai embed atau tidak.\n> - Klik tombol di bawah dan lengkapi detail acara anda."),
          separatorComponent(),
          actionRowComponent([
            buttonComponent({ style: 1, label: "Isi Formulir Disini", emoji: { name: "📩" }, customId: "partnership_event_form" }),
            buttonComponent({ style: 3, label: "Yes", customId: "partnership_event_yes", disabled: true }),
            buttonComponent({ style: 4, label: "No", customId: "partnership_event_no" })
          ]),
          separatorComponent(),
          textComponent("-# © Guild Partnership - EmpireBS")
        ]),
        ephemeral: true
      });
      return;
    }

    if (customId === "partnership_event_no") {
      await interaction.update({
        ...buildV2Message([
          textComponent("## 📥 Posting Events"),
          separatorComponent(),
          textComponent("### Ketentuan Events: <:00:1360567203325542431><:00:1360567203325542431><:00:1360567203325542431><:00:1360567203325542431><:00:1360567203325542431><:00:1360567203325542431><:00:1360567203325542431><:00:1360567203325542431><:00:1360567203325542431><:00:1360567203325542431><:00:1360567203325542431><:00:1360567203325542431><:00:1360567203325542431><:00:1360567203325542431>\n> - Wajib gunakan mention khusus yang tersedia.\n> - Postingan ditinjau admin sebelum dipublikasikan.\n> - Admin berhak menyesuaikan teks sesuai ketentuan.\n### Prosedur:\n> - Pilih Yes/No untuk memakai embed atau tidak.\n> - Klik tombol di bawah dan lengkapi detail acara anda."),
          separatorComponent(),
          actionRowComponent([
            buttonComponent({ style: 1, label: "Isi Formulir Disini", emoji: { name: "📩" }, customId: "partnership_event_form_noembed" }),
            buttonComponent({ style: 3, label: "Yes", customId: "partnership_event_yes" }),
            buttonComponent({ style: 4, label: "No", customId: "partnership_event_no", disabled: true })
          ]),
          separatorComponent(),
          textComponent("-# © Guild Partnership - EmpireBS")
        ]),
        ephemeral: true
      });
      return;
    }

    // Repost Yes/No toggles
    if (customId === "partnership_repost_yes") {
      await interaction.update({
        ...buildV2Message([
          textComponent("## 🔃 Re-Posting Partnership"),
          separatorComponent(),
          textComponent("### Ketentuan Utama:<:00:1360567203325542431><:00:1360567203325542431><:00:1360567203325542431><:00:1360567203325542431><:00:1360567203325542431><:00:1360567203325542431><:00:1360567203325542431><:00:1360567203325542431><:00:1360567203325542431><:00:1360567203325542431><:00:1360567203325542431><:00:1360567203325542431><:00:1360567203325542431><:00:1360567203325542431>\n> - Cooldown 1 minggu sekali.\n> - Saling memposting ulang deskripsi.\n> - Gunakan mention khusus yang tersedia.\n### Prosedur:\n> - Pilih Yes/No untuk memakai embed atau tidak.\n> - Postingan ditinjau admin sebelum dipublikasikan.\n> - Admin berhak menyesuaikan teks sesuai ketentuan.\n> - Klik tombol di bawah dan lengkapi data server anda."),
          separatorComponent(),
          actionRowComponent([
            buttonComponent({ style: 1, label: "Isi Formulir Disini", emoji: { name: "📩" }, customId: "partnership_repost_form" }),
            buttonComponent({ style: 3, label: "Yes", customId: "partnership_repost_yes", disabled: true }),
            buttonComponent({ style: 4, label: "No", customId: "partnership_repost_no" })
          ]),
          separatorComponent(),
          textComponent("-# © Guild Partnership - EmpireBS")
        ]),
        ephemeral: true
      });
      return;
    }

    if (customId === "partnership_repost_no") {
      await interaction.update({
        ...buildV2Message([
          textComponent("## 🔃 Re-Posting Partnership"),
          separatorComponent(),
          textComponent("### Ketentuan Utama:<:00:1360567203325542431><:00:1360567203325542431><:00:1360567203325542431><:00:1360567203325542431><:00:1360567203325542431><:00:1360567203325542431><:00:1360567203325542431><:00:1360567203325542431><:00:1360567203325542431><:00:1360567203325542431><:00:1360567203325542431><:00:1360567203325542431><:00:1360567203325542431><:00:1360567203325542431>\n> - Cooldown 1 minggu sekali.\n> - Saling memposting ulang deskripsi.\n> - Gunakan mention khusus yang tersedia.\n### Prosedur:\n> - Pilih Yes/No untuk memakai embed atau tidak.\n> - Postingan ditinjau admin sebelum dipublikasikan.\n> - Admin berhak menyesuaikan teks sesuai ketentuan.\n> - Klik tombol di bawah dan lengkapi data server anda."),
          separatorComponent(),
          actionRowComponent([
            buttonComponent({ style: 1, label: "Isi Formulir Disini", emoji: { name: "📩" }, customId: "partnership_repost_form_noembed" }),
            buttonComponent({ style: 3, label: "Yes", customId: "partnership_repost_yes" }),
            buttonComponent({ style: 4, label: "No", customId: "partnership_repost_no", disabled: true })
          ]),
          separatorComponent(),
          textComponent("-# © Guild Partnership - EmpireBS")
        ]),
        ephemeral: true
      });
      return;
    }

    // Cmd Yes/No toggles
    if (customId === "partnership_cmd_yes") {
      await interaction.update({
        ...buildV2Message([
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
        ]),
        ephemeral: true
      });
      return;
    }

    if (customId === "partnership_cmd_no") {
      await interaction.update({
        ...buildV2Message([
          textComponent("## ✉️ Pengajuan Partnership"),
          separatorComponent(),
          textComponent("> Click dibawah ini untuk isi deskripsi server kamu\n\n**Note:** Pilih Yes/No untuk menggunakan embed atau tidak."),
          separatorComponent(),
          actionRowComponent([
            buttonComponent({ style: 1, label: "Isi Formulir Disini", emoji: { name: "📩" }, customId: "partnership_cmd_form_noembed" }),
            buttonComponent({ style: 3, label: "Yes", customId: "partnership_cmd_yes" }),
            buttonComponent({ style: 4, label: "No", customId: "partnership_cmd_no", disabled: true })
          ]),
          separatorComponent(),
          textComponent("-# © Guild Partnership - EmpireBS")
        ]),
        ephemeral: true
      });
      return;
    }

    // Form buttons - Show modals
    if (customId.includes("_form")) {
      await this.showFormModal(interaction, customId);
      return;
    }
  }

  async showFormModal(interaction, customId) {
    let modal;

    // Event form WITH embed (Yes selected)
    if (customId === "partnership_event_form") {
      modal = new ModalBuilder()
        .setCustomId("modal_event_yes")
        .setTitle("Formulir Posting Events (Dengan Embed)");

      modal.addComponents(
        new ActionRowBuilder().addComponents(
          new TextInputBuilder().setCustomId("server_name").setLabel("Nama Server").setStyle(TextInputStyle.Short).setRequired(true).setPlaceholder("Contoh: EmpireBS V2")
        ),
        new ActionRowBuilder().addComponents(
          new TextInputBuilder().setCustomId("description").setLabel("Deskripsi Server/Event").setStyle(TextInputStyle.Paragraph).setRequired(true).setPlaceholder("Jelaskan detail event/server Anda")
        ),
        new ActionRowBuilder().addComponents(
          new TextInputBuilder().setCustomId("banner").setLabel("Banner Server (Opsional)").setStyle(TextInputStyle.Short).setRequired(false).setPlaceholder("URL Banner, pisahkan dengan koma jika lebih dari 1")
        ),
        new ActionRowBuilder().addComponents(
          new TextInputBuilder().setCustomId("server_link").setLabel("Link Server").setStyle(TextInputStyle.Short).setRequired(true).setPlaceholder("https://discord.gg/...")
        ),
        new ActionRowBuilder().addComponents(
          new TextInputBuilder().setCustomId("sidebar_color").setLabel("Sidebar Color (Opsional)").setStyle(TextInputStyle.Short).setRequired(false).setPlaceholder("Contoh: 16711685 (hex integer). Kosong = default biru.")
        )
      );
    }

    // Event form WITHOUT embed (No selected)
    if (customId === "partnership_event_form_noembed") {
      modal = new ModalBuilder()
        .setCustomId("modal_event_no")
        .setTitle("Formulir Posting Events (Tanpa Embed)");

      modal.addComponents(
        new ActionRowBuilder().addComponents(
          new TextInputBuilder().setCustomId("server_name").setLabel("Nama Server").setStyle(TextInputStyle.Short).setRequired(true).setPlaceholder("Contoh: EmpireBS V2")
        ),
        new ActionRowBuilder().addComponents(
          new TextInputBuilder().setCustomId("description").setLabel("Deskripsi Server/Event").setStyle(TextInputStyle.Paragraph).setRequired(true).setPlaceholder("Jelaskan detail event/server Anda")
        ),
        new ActionRowBuilder().addComponents(
          new TextInputBuilder().setCustomId("server_link").setLabel("Link Server").setStyle(TextInputStyle.Short).setRequired(true).setPlaceholder("https://discord.gg/...")
        ),
        new ActionRowBuilder().addComponents(
          new TextInputBuilder().setCustomId("event_link").setLabel("Link Event (Opsional)").setStyle(TextInputStyle.Short).setRequired(false).setPlaceholder("URL event jika ada")
        )
      );
    }

    // Repost form WITH embed
    if (customId === "partnership_repost_form") {
      modal = new ModalBuilder()
        .setCustomId("modal_repost_yes")
        .setTitle("Formulir Re-Posting (Dengan Embed)");

      modal.addComponents(
        new ActionRowBuilder().addComponents(
          new TextInputBuilder().setCustomId("server_name").setLabel("Nama Server").setStyle(TextInputStyle.Short).setRequired(true).setPlaceholder("Contoh: EmpireBS V2")
        ),
        new ActionRowBuilder().addComponents(
          new TextInputBuilder().setCustomId("description").setLabel("Deskripsi Server").setStyle(TextInputStyle.Paragraph).setRequired(true).setPlaceholder("Deskripsi lengkap server Anda")
        ),
        new ActionRowBuilder().addComponents(
          new TextInputBuilder().setCustomId("banner").setLabel("Banner Server (Opsional)").setStyle(TextInputStyle.Short).setRequired(false).setPlaceholder("URL Banner, pisahkan dengan koma jika lebih dari 1")
        ),
        new ActionRowBuilder().addComponents(
          new TextInputBuilder().setCustomId("server_link").setLabel("Link Server").setStyle(TextInputStyle.Short).setRequired(true).setPlaceholder("https://discord.gg/...")
        ),
        new ActionRowBuilder().addComponents(
          new TextInputBuilder().setCustomId("sidebar_color").setLabel("Sidebar Color (Opsional)").setStyle(TextInputStyle.Short).setRequired(false).setPlaceholder("Contoh: 16711685 (hex integer). Kosong = default biru.")
        )
      );
    }

    // Repost form WITHOUT embed
    if (customId === "partnership_repost_form_noembed") {
      modal = new ModalBuilder()
        .setCustomId("modal_repost_no")
        .setTitle("Formulir Re-Posting (Tanpa Embed)");

      modal.addComponents(
        new ActionRowBuilder().addComponents(
          new TextInputBuilder().setCustomId("server_name").setLabel("Nama Server").setStyle(TextInputStyle.Short).setRequired(true).setPlaceholder("Contoh: EmpireBS V2")
        ),
        new ActionRowBuilder().addComponents(
          new TextInputBuilder().setCustomId("description").setLabel("Deskripsi Server").setStyle(TextInputStyle.Paragraph).setRequired(true).setPlaceholder("Deskripsi lengkap server Anda")
        ),
        new ActionRowBuilder().addComponents(
          new TextInputBuilder().setCustomId("server_link").setLabel("Link Server").setStyle(TextInputStyle.Short).setRequired(true).setPlaceholder("https://discord.gg/...")
        ),
        new ActionRowBuilder().addComponents(
          new TextInputBuilder().setCustomId("banner").setLabel("Banner Server (Opsional)").setStyle(TextInputStyle.Short).setRequired(false).setPlaceholder("URL Banner, pisahkan dengan koma jika lebih dari 1")
        )
      );
    }

    // Partner command form WITH embed
    if (customId === "partnership_cmd_form") {
      modal = new ModalBuilder()
        .setCustomId("modal_partner_yes")
        .setTitle("Formulir Pengajuan Partnership (Dengan Embed)");

      modal.addComponents(
        new ActionRowBuilder().addComponents(
          new TextInputBuilder().setCustomId("server_name").setLabel("Nama Server").setStyle(TextInputStyle.Short).setRequired(true).setPlaceholder("Contoh: EmpireBS V2")
        ),
        new ActionRowBuilder().addComponents(
          new TextInputBuilder().setCustomId("description").setLabel("Deskripsi Server").setStyle(TextInputStyle.Paragraph).setRequired(true).setPlaceholder("Deskripsi lengkap server Anda")
        ),
        new ActionRowBuilder().addComponents(
          new TextInputBuilder().setCustomId("banner").setLabel("Banner Server (Opsional)").setStyle(TextInputStyle.Short).setRequired(false).setPlaceholder("URL Banner, pisahkan dengan koma jika lebih dari 1")
        ),
        new ActionRowBuilder().addComponents(
          new TextInputBuilder().setCustomId("server_link").setLabel("Link Server").setStyle(TextInputStyle.Short).setRequired(true).setPlaceholder("https://discord.gg/...")
        ),
        new ActionRowBuilder().addComponents(
          new TextInputBuilder().setCustomId("sidebar_color").setLabel("Sidebar Color (Opsional)").setStyle(TextInputStyle.Short).setRequired(false).setPlaceholder("Contoh: 16711685 (hex integer). Kosong = default biru.")
        )
      );
    }

    // Partner command form WITHOUT embed
    if (customId === "partnership_cmd_form_noembed") {
      modal = new ModalBuilder()
        .setCustomId("modal_partner_no")
        .setTitle("Formulir Pengajuan Partnership (Tanpa Embed)");

      modal.addComponents(
        new ActionRowBuilder().addComponents(
          new TextInputBuilder().setCustomId("server_name").setLabel("Nama Server").setStyle(TextInputStyle.Short).setRequired(true).setPlaceholder("Contoh: EmpireBS V2")
        ),
        new ActionRowBuilder().addComponents(
          new TextInputBuilder().setCustomId("description").setLabel("Deskripsi Server").setStyle(TextInputStyle.Paragraph).setRequired(true).setPlaceholder("Deskripsi lengkap server Anda")
        ),
        new ActionRowBuilder().addComponents(
          new TextInputBuilder().setCustomId("server_link").setLabel("Link Server").setStyle(TextInputStyle.Short).setRequired(true).setPlaceholder("https://discord.gg/...")
        ),
        new ActionRowBuilder().addComponents(
          new TextInputBuilder().setCustomId("banner").setLabel("Banner Server (Opsional)").setStyle(TextInputStyle.Short).setRequired(false).setPlaceholder("URL Banner, pisahkan dengan koma jika lebih dari 1")
        )
      );
    }

    // Stop partnership form (dashboard)
    if (customId === "partnership_stop_form") {
      modal = new ModalBuilder()
        .setCustomId("stop_modal_submit")
        .setTitle("Formulir Berhenti Partnership");

      modal.addComponents(
        new ActionRowBuilder().addComponents(
          new TextInputBuilder().setCustomId("server_name").setLabel("Nama Server").setStyle(TextInputStyle.Short).setRequired(true).setPlaceholder("Nama server partner Anda")
        ),
        new ActionRowBuilder().addComponents(
          new TextInputBuilder().setCustomId("server_link").setLabel("Link Server").setStyle(TextInputStyle.Short).setRequired(true).setPlaceholder("https://discord.gg/...")
        ),
        new ActionRowBuilder().addComponents(
          new TextInputBuilder().setCustomId("reason").setLabel("Alasan Berhenti Partnership").setStyle(TextInputStyle.Paragraph).setRequired(true).setPlaceholder("Jelaskan dengan detail alasan penghentian partnership")
        )
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

    if (customId === "stop_cmd_modal_submit") {
      await this.processStopCommandSubmission(interaction);
      return true;
    }

    if (customId === "continue_cmd_modal_submit") {
      await this.processContinueCommandSubmission(interaction);
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

    return false;
  }

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
          sidebarColor: useEmbed ? this.parseColor(fields.getTextInputValue("sidebar_color")) : null,
          useEmbed,
          eventLink: useEmbed ? "" : (fields.getTextInputValue("event_link") || ""),
          status: "pending",
          createdAt: new Date()
        };

        const result = await getCollection("event_posts").insertOne(data);
        data._id = result.insertedId;

        await this.sendToAdminReview(interaction, data, "event");

        await interaction.reply({
          ...buildV2Message([
            textComponent("## ✅ Pengajuan Events Terkirim"),
            separatorComponent(),
            textComponent("Pengajuan posting events Anda telah dikirim dan sedang menunggu review admin."),
            separatorComponent(),
            textComponent("-# © Guild Partnership - EmpireBS")
          ]),
          ephemeral: true
        });
      }

      if (customId.startsWith("modal_repost_")) {
        const useEmbed = customId.endsWith("yes");
        const existing = await getCollection("partnerships").findOne({ userId: user.id, status: "accepted" });

        if (!existing) {
          await interaction.reply({
            ...buildV2Message([
              textComponent("## ❌ Tidak Ditemukan"),
              separatorComponent(),
              textComponent("Anda belum memiliki partnership yang aktif untuk di-repost."),
              separatorComponent(),
              textComponent("-# © Guild Partnership - EmpireBS")
            ]),
            ephemeral: true
          });
          return;
        }

        if (existing.lastRepostAt && (Date.now() - existing.lastRepostAt.getTime()) < 7 * 24 * 60 * 60 * 1000) {
          await interaction.reply({
            ...buildV2Message([
              textComponent("## ⏳ Cooldown Aktif"),
              separatorComponent(),
              textComponent("Anda baru saja melakukan re-post. Mohon tunggu 1 minggu sebelum re-post kembali."),
              separatorComponent(),
              textComponent("-# © Guild Partnership - EmpireBS")
            ]),
            ephemeral: true
          });
          return;
        }

        const data = {
          userId: user.id,
          username: user.username,
          serverName: fields.getTextInputValue("server_name"),
          serverDescription: fields.getTextInputValue("description"),
          serverLink: fields.getTextInputValue("server_link"),
          bannerUrls: this.parseBannerUrls(fields.getTextInputValue("banner")),
          sidebarColor: useEmbed ? this.parseColor(fields.getTextInputValue("sidebar_color")) : null,
          useEmbed,
          status: "pending",
          originalId: existing._id,
          createdAt: new Date()
        };

        const result = await getCollection("partnerships").insertOne(data);
        data._id = result.insertedId;

        await this.sendToAdminReview(interaction, data, "repost");

        await interaction.reply({
          ...buildV2Message([
            textComponent("## ✅ Re-Posting Terkirim"),
            separatorComponent(),
            textComponent("Pengajuan re-posting partnership Anda telah dikirim dan sedang menunggu review admin."),
            separatorComponent(),
            textComponent("-# © Guild Partnership - EmpireBS")
          ]),
          ephemeral: true
        });
      }

      if (customId.startsWith("modal_partner_")) {
        const useEmbed = customId.endsWith("yes");
        const data = {
          userId: user.id,
          username: user.username,
          serverName: fields.getTextInputValue("server_name"),
          serverDescription: fields.getTextInputValue("description"),
          serverLink: fields.getTextInputValue("server_link"),
          bannerUrls: this.parseBannerUrls(fields.getTextInputValue("banner")),
          sidebarColor: useEmbed ? this.parseColor(fields.getTextInputValue("sidebar_color")) : null,
          useEmbed,
          status: "pending",
          createdAt: new Date()
        };

        const result = await getCollection("partnerships").insertOne(data);
        data._id = result.insertedId;

        await this.sendToAdminReview(interaction, data, "partnership");

        // Mark user as submitted for command-based submissions
        if (customId === "modal_partner_yes" || customId === "modal_partner_no") {
          this.partnerSubmitted.set(user.id, { submitted: true, messageId: interaction.message?.id });
        }

        await interaction.reply({
          ...buildV2Message([
            textComponent("## ✅ Pengajuan Partnership Terkirim"),
            separatorComponent(),
            textComponent("Pengajuan partnership Anda telah dikirim dan sedang menunggu review admin."),
            separatorComponent(),
            textComponent("-# © Guild Partnership - EmpireBS")
          ]),
          ephemeral: true
        });
      }
    } catch (err) {
      console.error("Form submission error:", err);
      await interaction.reply({
        ...buildV2Message([
          textComponent("## ❌ Error"),
          separatorComponent(),
          textComponent("Terjadi kesalahan saat memproses formulir. Silakan coba lagi."),
          separatorComponent(),
          textComponent("-# © Guild Partnership - EmpireBS")
        ]),
        ephemeral: true
      });
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
      handledBy: null,
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

    await interaction.reply({
      ...buildV2Message([
        textComponent("## ✅ Permintaan Terkirim"),
        separatorComponent(),
        textComponent("Permintaan penghentian partnership Anda telah dikirim ke admin. Silakan tunggu konfirmasi."),
        separatorComponent(),
        textComponent("-# © Guild Partnership - EmpireBS")
      ]),
      ephemeral: true
    });
  }

  // NEW: Process !berhenti command modal submission
  async processStopCommandSubmission(interaction) {
    const fields = interaction.fields;
    const user = interaction.user;
    const member = interaction.member;
    const channel = interaction.channel;

    try {
      // Defer immediately to prevent timeout
      await interaction.deferReply({ ephemeral: true });

      const reason = fields.getTextInputValue("reason");

      // Remove partnership role
      if (member && member.roles.cache.has(CONFIG.PARTNER_ROLE_ID)) {
        await member.roles.remove(CONFIG.PARTNER_ROLE_ID).catch(() => {});
      }

      // Delete user's posts from partner and event channels
      await this.deleteUserPosts(user.id);

      // Update forum log - add "Mantan" to server name
      await this.updateForumLogToMantan(user.id);

      // Delete the channel after 5 seconds
      setTimeout(async () => {
        try {
          if (channel && channel.deletable) {
            await channel.delete("User mengajukan berhenti partnership");
          }
        } catch (err) {
          console.error("Error deleting channel:", err);
        }
      }, 5000);

      await interaction.editReply({
        ...buildV2Message([
          textComponent("## ✅ Partnership Dihentikan"),
          separatorComponent(),
          textComponent("Terima kasih atas kerjasama yang telah terjalin. Partnership Anda telah dihentikan dan role partnership telah dicabut.\n\nSemoga sukses selalu!"),
          separatorComponent(),
          textComponent("-# © Guild Partnership - EmpireBS")
        ])
      });

    } catch (err) {
      console.error("Stop command submission error:", err);
      if (!interaction.replied && !interaction.deferred) {
        await interaction.reply({
          ...buildV2Message([
            textComponent("## ❌ Error"),
            separatorComponent(),
            textComponent("Terjadi kesalahan saat memproses penghentian partnership."),
            separatorComponent(),
            textComponent("-# © Guild Partnership - EmpireBS")
          ]),
          ephemeral: true
        });
      }
    }
  }

  // NEW: Process !lanjut command modal submission
  async processContinueCommandSubmission(interaction) {
    const user = interaction.user;
    const channel = interaction.channel;

    try {
      // Defer immediately to prevent timeout
      await interaction.deferReply({ ephemeral: true });

      // Delete the channel after 5 seconds
      setTimeout(async () => {
        try {
          if (channel && channel.deletable) {
            await channel.delete("User membatalkan penghentian partnership");
          }
        } catch (err) {
          console.error("Error deleting channel:", err);
        }
      }, 5000);

      await interaction.editReply({
        ...buildV2Message([
          textComponent("## ✅ Partnership Dilanjutkan"),
          separatorComponent(),
          textComponent("Terima kasih atas keputusan Anda untuk tetap berpartnership dengan kami. Kerjasama ini sangat kami hargai.\n\nSemoga partnership ini semakin berkembang!"),
          separatorComponent(),
          textComponent("-# © Guild Partnership - EmpireBS")
        ])
      });

    } catch (err) {
      console.error("Continue command submission error:", err);
      if (!interaction.replied && !interaction.deferred) {
        await interaction.reply({
          ...buildV2Message([
            textComponent("## ❌ Error"),
            separatorComponent(),
            textComponent("Terjadi kesalahan saat memproses pembatalan."),
            separatorComponent(),
            textComponent("-# © Guild Partnership - EmpireBS")
          ]),
          ephemeral: true
        });
      }
    }
  }

  // NEW: Delete user's posts from partner and event channels
  async deleteUserPosts(userId) {
    try {
      const partnerChannel = await this.client.channels.fetch(CONFIG.SERVER_PARTNER_CHANNEL_ID);
      const eventChannel = await this.client.channels.fetch(CONFIG.EVENT_PARTNER_CHANNEL_ID);

      if (partnerChannel) {
        const messages = await partnerChannel.messages.fetch({ limit: 100 });
        const userMessages = messages.filter(m => {
          // Check if message mentions the user or contains their info
          const content = JSON.stringify(m.components);
          return content.includes(userId);
        });
        for (const msg of userMessages.values()) {
          await msg.delete().catch(() => {});
        }
      }

      if (eventChannel) {
        const messages = await eventChannel.messages.fetch({ limit: 100 });
        const userMessages = messages.filter(m => {
          const content = JSON.stringify(m.components);
          return content.includes(userId);
        });
        for (const msg of userMessages.values()) {
          await msg.delete().catch(() => {});
        }
      }

      // Also delete from database records
      await getCollection("partnerships").deleteMany({ userId, status: "accepted" });
      await getCollection("event_posts").deleteMany({ userId, status: "accepted" });
    } catch (err) {
      console.error("Error deleting user posts:", err);
    }
  }

  // NEW: Update forum log to add "Mantan"
  async updateForumLogToMantan(userId) {
    try {
      const forumChannel = await this.client.channels.fetch(CONFIG.FORUM_LOG_CHANNEL_ID);
      if (!forumChannel || forumChannel.type !== ChannelType.GuildForum) return;

      const partnership = await getCollection("partnerships").findOne({ userId, status: "accepted" });
      if (!partnership) return;

      const activeThreads = await forumChannel.threads.fetchActive();
      const archivedThreads = await forumChannel.threads.fetchArchived();

      const serverName = partnership.serverName;
      const oldThreadName = `1) ${serverName}`;
      const newThreadName = `1) ${serverName} Mantan`;

      const thread = activeThreads.threads.find(t => t.name === oldThreadName) || 
                     archivedThreads.threads.find(t => t.name === oldThreadName);

      if (thread) {
        await thread.setName(newThreadName, "User berhenti partnership");
      }
    } catch (err) {
      console.error("Error updating forum log:", err);
    }
  }

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

  // ==================== FIXED ADMIN ACTIONS ====================
  async handleAdminAction(interaction) {
    // DEFER IMMEDIATELY to prevent Unknown interaction (10062)
    try {
      await interaction.deferReply({ ephemeral: true });
    } catch (err) {
      console.error("Failed to defer admin action:", err);
      return;
    }

    const customId = interaction.customId;
    const parts = customId.replace("admin_", "").split("_");
    const type = parts[0];
    const id = parts[parts.length - 1];

    if (!interaction.memberPermissions?.has(PermissionFlagsBits.ManageMessages) && !this.hasAdminRole(interaction.member)) {
      await interaction.editReply({
        ...buildV2Message([
          textComponent("## Akses Ditolak"),
          separatorComponent(),
          textComponent("Hanya admin partnership yang dapat melakukan tindakan ini."),
          separatorComponent(),
          textComponent("-# © Guild Partnership - EmpireBS")
        ])
      });
      return;
    }

    try {
      if (parts[0] === "accept") {
        await this.handleAccept(interaction, type, id);
      } else if (parts[0] === "reject") {
        await this.handleReject(interaction, type, id);
      } else if (parts[0] === "edit") {
        await this.handleEdit(interaction, type, id);
      }
    } catch (err) {
      console.error("Admin action error:", err);
      await interaction.editReply({
        ...buildV2Message([
          textComponent("## ❌ Error"),
          separatorComponent(),
          textComponent("Terjadi kesalahan saat memproses tindakan admin."),
          separatorComponent(),
          textComponent("-# © Guild Partnership - EmpireBS")
        ])
      });
    }
  }

  async handleAccept(interaction, type, id) {
    const startTime = Date.now();
    let objId;
    try {
      objId = new ObjectId(id);
    } catch (e) {
      console.error("Invalid ObjectId:", id);
      await interaction.editReply({
        ...buildV2Message([
          textComponent("## ❌ Error"),
          separatorComponent(),
          textComponent("ID tidak valid."),
          separatorComponent(),
          textComponent("-# © Guild Partnership - EmpireBS")
        ])
      });
      return;
    }

    if (type === "partnership") {
      const partnership = await getCollection("partnerships").findOne({ _id: objId });
      if (!partnership) {
        await interaction.editReply({
          ...buildV2Message([
            textComponent("## ❌ Data Tidak Ditemukan"),
            separatorComponent(),
            textComponent("Data partnership tidak ditemukan di database."),
            separatorComponent(),
            textComponent("-# © Guild Partnership - EmpireBS")
          ])
        });
        return;
      }

      await getCollection("partnerships").updateOne(
        { _id: objId },
        { $set: { status: "accepted", acceptedBy: interaction.user.id, acceptedAt: new Date() } }
      );

      const partnerChannel = await this.client.channels.fetch(CONFIG.SERVER_PARTNER_CHANNEL_ID);
      if (partnerChannel) {
        const message = await this.sendPartnerMessage(partnerChannel, partnership);
        await getCollection("partnerships").updateOne(
          { _id: objId },
          { $set: { messageId: message.id, channelId: message.channelId } }
        );
        partnership.messageId = message.id;
        partnership.channelId = message.channelId;
      }

      const guild = interaction.guild;
      const member = await guild.members.fetch(partnership.userId).catch(() => null);
      if (member) {
        await member.roles.add(CONFIG.PARTNER_ROLE_ID).catch(() => {});
      }

      await this.createForumLog(interaction, partnership, "partnership", startTime);
      await this.sendAcceptDm(partnership.userId, partnership, interaction.user, "partnership");

    } else if (type === "event") {
      const eventPost = await getCollection("event_posts").findOne({ _id: objId });
      if (!eventPost) {
        await interaction.editReply({
          ...buildV2Message([
            textComponent("## ❌ Data Tidak Ditemukan"),
            separatorComponent(),
            textComponent("Data event tidak ditemukan di database."),
            separatorComponent(),
            textComponent("-# © Guild Partnership - EmpireBS")
          ])
        });
        return;
      }

      await getCollection("event_posts").updateOne(
        { _id: objId },
        { $set: { status: "accepted", acceptedBy: interaction.user.id, acceptedAt: new Date() } }
      );

      const eventChannel = await this.client.channels.fetch(CONFIG.EVENT_PARTNER_CHANNEL_ID);
      if (eventChannel) {
        const message = await this.sendEventMessage(eventChannel, eventPost);
        await getCollection("event_posts").updateOne(
          { _id: objId },
          { $set: { messageId: message.id, channelId: message.channelId } }
        );
        eventPost.messageId = message.id;
        eventPost.channelId = message.channelId;
      }

      await this.createForumLog(interaction, eventPost, "event", startTime);
      await this.sendEventDm(eventPost, interaction.user, startTime);

    } else if (type === "repost") {
      const repostData = await getCollection("partnerships").findOne({ _id: objId });
      if (!repostData) {
        await interaction.editReply({
          ...buildV2Message([
            textComponent("## ❌ Data Tidak Ditemukan"),
            separatorComponent(),
            textComponent("Data repost tidak ditemukan di database."),
            separatorComponent(),
            textComponent("-# © Guild Partnership - EmpireBS")
          ])
        });
        return;
      }

      const partnership = await getCollection("partnerships").findOne({ userId: repostData.userId, status: "accepted" });
      if (!partnership) {
        await interaction.editReply({
          ...buildV2Message([
            textComponent("## ❌ Data Tidak Ditemukan"),
            separatorComponent(),
            textComponent("Partnership aktif tidak ditemukan di database."),
            separatorComponent(),
            textComponent("-# © Guild Partnership - EmpireBS")
          ])
        });
        return;
      }

      if (partnership.messageId && partnership.channelId) {
        const oldMessage = await this.findMessageById(partnership.messageId, partnership.channelId);
        if (oldMessage) {
          await oldMessage.delete().catch(() => {});
        }
      }

      await getCollection("partnerships").updateOne(
        { _id: partnership._id },
        { $inc: { repostCount: 1 }, $set: { lastRepostAt: new Date() } }
      );

      const partnerChannel = await this.client.channels.fetch(CONFIG.SERVER_PARTNER_CHANNEL_ID);
      if (partnerChannel) {
        const newMessage = await this.sendPartnerMessage(partnerChannel, partnership);
        await getCollection("partnerships").updateOne(
          { _id: partnership._id },
          { $set: { messageId: newMessage.id, channelId: newMessage.channelId } }
        );
      }

      await this.createForumLog(interaction, partnership, "repost", startTime);
      await this.sendAcceptDm(partnership.userId, partnership, interaction.user, "repost");
    }

    // Update the original admin message to show accepted status
    try {
      const originalMessage = interaction.message;
      if (originalMessage) {
        const acceptedComponents = [
          textComponent("## ✅ Diterima"),
          separatorComponent(),
          textComponent(`Diterima oleh: <@${interaction.user.id}>\nWaktu: <t:${Math.floor(Date.now() / 1000)}:R>`),
          separatorComponent(),
          textComponent("-# © Guild Partnership - EmpireBS")
        ];
        await originalMessage.edit(buildV2Message(acceptedComponents));
      }
    } catch (err) {
      console.error("Error updating original message:", err);
    }

    await interaction.editReply({
      ...buildV2Message([
        textComponent("## ✅ Berhasil"),
        separatorComponent(),
        textComponent(`Pengajuan ${type} telah berhasil diterima.`),
        separatorComponent(),
        textComponent("-# © Guild Partnership - EmpireBS")
      ])
    });
  }

  async handleReject(interaction, type, id) {
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

    // DEFER IMMEDIATELY
    try {
      await interaction.deferUpdate();
    } catch (err) {
      console.error("Failed to defer rejection:", err);
    }

    let collectionName;
    if (type === "partnership") collectionName = "partnerships";
    else if (type === "event") collectionName = "event_posts";
    else if (type === "repost") collectionName = "partnerships";

    let objId;
    try {
      objId = new ObjectId(id);
    } catch (e) {
      await interaction.followUp({ content: "❌ ID tidak valid.", ephemeral: true });
      return;
    }

    const data = await getCollection(collectionName).findOne({ _id: objId });

    if (data) {
      await getCollection(collectionName).updateOne(
        { _id: objId },
        { $set: { status: "rejected", rejectedBy: interaction.user.id, rejectedAt: new Date(), rejectReason: reason } }
      );

      try {
        const user = await this.client.users.fetch(data.userId);
        if (user) {
          await user.send({
            ...buildV2Message([
              textComponent("## ❌ Pengajuan Ditolak"),
              separatorComponent(),
              textComponent(`Maaf, pengajuan ${type === "partnership" ? "partnership" : type === "event" ? "posting events" : "re-posting"} Anda telah ditolak.\n\n**Alasan:**\n${reason}`),
              separatorComponent(),
              textComponent("-# © Guild Partnership - EmpireBS")
            ])
          });
        }
      } catch (err) {
        console.error("Failed to send DM:", err);
      }
    }

    // Update original message
    try {
      const originalMessage = interaction.message;
      if (originalMessage) {
        const rejectedComponents = [
          textComponent("## ❌ Ditolak"),
          separatorComponent(),
          textComponent(`Ditolak oleh: <@${interaction.user.id}>\nAlasan: ${reason}\nWaktu: <t:${Math.floor(Date.now() / 1000)}:R>`),
          separatorComponent(),
          textComponent("-# © Guild Partnership - EmpireBS")
        ];
        await originalMessage.edit(buildV2Message(rejectedComponents));
      }
    } catch (err) {
      console.error("Error updating original message:", err);
    }

    try {
      await interaction.followUp({
        ...buildV2Message([
          textComponent("## ✅ Berhasil"),
          separatorComponent(),
          textComponent("Pengajuan telah ditolak."),
          separatorComponent(),
          textComponent("-# © Guild Partnership - EmpireBS")
        ]),
        ephemeral: true
      });
    } catch (err) {
      console.error("Failed to send rejection followup:", err);
    }
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
      await interaction.reply({
        ...buildV2Message([
          textComponent("## ❌ Data Tidak Ditemukan"),
          separatorComponent(),
          textComponent("Data tidak ditemukan di database. Pastikan data masih tersedia.\n\n**Note:** Sidebar color kosong akan menggunakan warna default (biru)."),
          separatorComponent(),
          textComponent("-# © Guild Partnership - EmpireBS")
        ]),
        ephemeral: true
      });
      return;
    }

    const modal = new ModalBuilder()
      .setCustomId(`edit_modal_${type}_${id}`)
      .setTitle("Edit Pesan Partnership");

    const currentContent = data.serverDescription || data.eventDescription || "";

    modal.addComponents(
      new ActionRowBuilder().addComponents(
        new TextInputBuilder()
          .setCustomId("edit_content")
          .setLabel("Konten Baru")
          .setStyle(TextInputStyle.Paragraph)
          .setRequired(true)
          .setValue(currentContent)
          .setPlaceholder("Masukkan konten baru...")
      )
    );

    await interaction.showModal(modal);
  }

  async processEditSubmission(interaction) {
    // DEFER IMMEDIATELY
    try {
      await interaction.deferReply({ ephemeral: true });
    } catch (err) {
      console.error("Failed to defer edit:", err);
    }

    const customId = interaction.customId;
    const parts = customId.replace("edit_modal_", "").split("_");
    const type = parts[0];
    const id = parts[1];
    const newContent = interaction.fields.getTextInputValue("edit_content");

    let objId;
    try {
      objId = new ObjectId(id);
    } catch (e) {
      await interaction.editReply({
        ...buildV2Message([
          textComponent("## ❌ ID Tidak Valid"),
          separatorComponent(),
          textComponent("Format ID tidak valid."),
          separatorComponent(),
          textComponent("-# © Guild Partnership - EmpireBS")
        ])
      });
      return;
    }

    let data;
    let collectionName;
    if (type === "partnership" || type === "repost") {
      data = await getCollection("partnerships").findOne({ _id: objId });
      collectionName = "partnerships";
    } else if (type === "event") {
      data = await getCollection("event_posts").findOne({ _id: objId });
      collectionName = "event_posts";
    }

    if (!data) {
      await interaction.editReply({
        ...buildV2Message([
          textComponent("## ❌ Data Tidak Ditemukan"),
          separatorComponent(),
          textComponent("Data tidak ditemukan di database. Mungkin data sudah dihapus atau ID salah.\n\n**Note:** Sidebar color kosong = default biru (#3498db)."),
          separatorComponent(),
          textComponent("-# © Guild Partnership - EmpireBS")
        ])
      });
      return;
    }

    // Update database
    const updateField = type === "event" ? "eventDescription" : "serverDescription";
    await getCollection(collectionName).updateOne(
      { _id: objId },
      { $set: { [updateField]: newContent, editedAt: new Date(), editedBy: interaction.user.id } }
    );

    // Update message if exists
    if (data.messageId && data.channelId) {
      try {
        const channel = await this.client.channels.fetch(data.channelId);
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
      } catch (err) {
        console.error("Error updating message:", err);
      }
    }

    await interaction.editReply({
      ...buildV2Message([
        textComponent("## ✅ Berhasil Diedit"),
        separatorComponent(),
        textComponent("Pesan telah berhasil diperbarui di database dan channel."),
        separatorComponent(),
        textComponent("-# © Guild Partnership - EmpireBS")
      ])
    });
  }

  async handleStopAdminAction(interaction) {
    // DEFER IMMEDIATELY
    try {
      await interaction.deferReply({ ephemeral: true });
    } catch (err) {
      console.error("Failed to defer stop admin action:", err);
    }

    const customId = interaction.customId;
    const parts = customId.replace("stop_", "").split("_");
    const action = parts[0];
    const id = parts[1];

    if (!this.hasAdminRole(interaction.member)) {
      await interaction.editReply({
        ...buildV2Message([
          textComponent("## Akses Ditolak"),
          separatorComponent(),
          textComponent("Hanya admin partnership yang dapat melakukan tindakan ini."),
          separatorComponent(),
          textComponent("-# © Guild Partnership - EmpireBS")
        ])
      });
      return;
    }

    let objId;
    try {
      objId = new ObjectId(id);
    } catch (e) {
      await interaction.editReply({ content: "❌ ID tidak valid.", ephemeral: true });
      return;
    }

    const stopRequest = await getCollection("stop_requests").findOne({ _id: objId });
    if (!stopRequest) {
      await interaction.editReply({ content: "❌ Permintaan tidak ditemukan.", ephemeral: true });
      return;
    }

    // Check if already handled
    if (stopRequest.status !== "pending") {
      await interaction.editReply({
        ...buildV2Message([
          textComponent("## ⚠️ Sudah Diproses"),
          separatorComponent(),
          textComponent("Permintaan ini sudah diproses sebelumnya. Tidak dapat diproses lagi."),
          separatorComponent(),
          textComponent("-# © Guild Partnership - EmpireBS")
        ])
      });
      return;
    }

    if (action === "accept") {
      // Show modal for thank you message
      const modal = new ModalBuilder()
        .setCustomId(`stop_admin_modal_${id}`)
        .setTitle("Pesan Terima Kasih");

      modal.addComponents(
        new ActionRowBuilder().addComponents(
          new TextInputBuilder()
            .setCustomId("thank_you_msg")
            .setLabel("Pesan Terima Kasih")
            .setStyle(TextInputStyle.Paragraph)
            .setRequired(true)
            .setValue("Terima kasih telah berpartnership dengan kami. Semoga sukses selalu!")
            .setPlaceholder("Masukkan pesan terima kasih...")
        )
      );

      await interaction.followUp({ content: "Silakan isi pesan terima kasih.", ephemeral: true });
      await interaction.showModal(modal);
    } else if (action === "reject") {
      // Check if discussion channel already exists
      if (stopRequest.discussionChannelId) {
        await interaction.editReply({
          ...buildV2Message([
            textComponent("## ⚠️ Diskusi Sudah Ada"),
            separatorComponent(),
            textComponent(`Channel diskusi sudah dibuat sebelumnya: <#${stopRequest.discussionChannelId}>`),
            separatorComponent(),
            textComponent("-# © Guild Partnership - EmpireBS")
          ])
        });
        return;
      }

      const category = await this.client.channels.fetch(CONFIG.STOP_DISCUSSION_CATEGORY_ID);
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

        await channel.send({
          ...buildV2Message([
            textComponent("## 💬 Diskusi Penghentian Partnership"),
            separatorComponent(),
            textComponent(`Halo <@${stopRequest.userId}>, admin ingin mendiskusikan lebih lanjut mengenai permintaan penghentian partnership Anda.\n\nSilakan jelaskan kembali alasan Anda ingin berhenti partnership dengan komunitas kami.`),
            separatorComponent(),
            textComponent("-# © Guild Partnership - EmpireBS")
          ])
        });

        try {
          const user = await this.client.users.fetch(stopRequest.userId);
          if (user) {
            await user.send({
              ...buildV2Message([
                textComponent("## 💬 Diskusi Dibuka"),
                separatorComponent(),
                textComponent(`Admin telah membuka channel diskusi untuk membahas permintaan penghentian partnership Anda.\n\nSilakan menuju ke <#${channel.id}> untuk berdiskusi.`),
                separatorComponent(),
                textComponent("-# © Guild Partnership - EmpireBS")
              ])
            });
          }
        } catch (err) {
          console.error("Failed to send DM:", err);
        }
      }

      // Update original message
      try {
        const originalMessage = interaction.message;
        if (originalMessage) {
          const rejectedComponents = [
            textComponent("## ❌ Rejected - Diskusi Dibuka"),
            separatorComponent(),
            textComponent(`Ditolak oleh: <@${interaction.user.id}>\nChannel diskusi telah dibuat.\n**Handle By:** <@${interaction.user.id}>`),
            separatorComponent(),
            textComponent("-# © Guild Partnership - EmpireBS")
          ];
          await originalMessage.edit(buildV2Message(rejectedComponents));
        }
      } catch (err) {
        console.error("Error updating original message:", err);
      }

      await interaction.editReply({
        ...buildV2Message([
          textComponent("## ✅ Berhasil"),
          separatorComponent(),
          textComponent("Permintaan ditolak dan channel diskusi telah dibuat."),
          separatorComponent(),
          textComponent("-# © Guild Partnership - EmpireBS")
        ])
      });
    }
  }

  async processStopAdminSubmission(interaction) {
    const id = interaction.customId.replace("stop_admin_modal_", "");
    const thankYouMsg = interaction.fields.getTextInputValue("thank_you_msg");

    // Defer reply immediately to avoid Unknown interaction timeout
    try {
      await interaction.deferUpdate();
    } catch (err) {
      console.error("Failed to defer stop admin submission:", err);
    }

    let objId;
    try {
      objId = new ObjectId(id);
    } catch (e) {
      await interaction.followUp({ content: "❌ ID tidak valid.", ephemeral: true });
      return;
    }

    const stopRequest = await getCollection("stop_requests").findOne({ _id: objId });
    if (!stopRequest) {
      await interaction.followUp({ content: "❌ Permintaan tidak ditemukan.", ephemeral: true });
      return;
    }

    // Check if already handled
    if (stopRequest.status !== "pending") {
      await interaction.followUp({
        ...buildV2Message([
          textComponent("## ⚠️ Sudah Diproses"),
          separatorComponent(),
          textComponent("Permintaan ini sudah diproses sebelumnya. Tidak dapat diproses lagi."),
          separatorComponent(),
          textComponent("-# © Guild Partnership - EmpireBS")
        ]),
        ephemeral: true
      });
      return;
    }

    await getCollection("stop_requests").updateOne(
      { _id: objId },
      { $set: { status: "accepted", handledBy: interaction.user.id } }
    );

    const guild = interaction.guild;
    const member = await guild.members.fetch(stopRequest.userId).catch(() => null);
    if (member) {
      await member.roles.remove(CONFIG.PARTNER_ROLE_ID).catch(() => {});
    }

    await getCollection("partnerships").deleteOne({ userId: stopRequest.userId, status: "accepted" });

    // Delete user's posts and update forum log
    await this.deleteUserPosts(stopRequest.userId);
    await this.updateForumLogToMantan(stopRequest.userId);

    try {
      const user = await this.client.users.fetch(stopRequest.userId);
      if (user) {
        await user.send({
          ...buildV2Message([
            textComponent("## 🛑 Partnership Dihentikan"),
            separatorComponent(),
            textComponent(`${thankYouMsg}\n\nRole partnership Anda telah dicabut. Terima kasih atas kerjasamanya selama ini.`),
            separatorComponent(),
            textComponent("-# © Guild Partnership - EmpireBS")
          ])
        });
      }
    } catch (err) {
      console.error("Failed to send DM:", err);
    }

    // Update original message
    try {
      const originalMessage = interaction.message;
      if (originalMessage) {
        const acceptedComponents = [
          textComponent("## ✅ Diterima - Partnership Dihentikan"),
          separatorComponent(),
          textComponent(`Diterima oleh: <@${interaction.user.id}>\nRole partnership telah dicabut.\n**Handle By:** <@${interaction.user.id}>`),
          separatorComponent(),
          textComponent("-# © Guild Partnership - EmpireBS")
        ];
        await originalMessage.edit(buildV2Message(acceptedComponents));
      }
    } catch (err) {
      console.error("Error editing reply:", err);
    }

    try {
      await interaction.followUp({
        ...buildV2Message([
          textComponent("## ✅ Berhasil"),
          separatorComponent(),
          textComponent("Partnership telah dihentikan dan role telah dicabut."),
          separatorComponent(),
          textComponent("-# © Guild Partnership - EmpireBS")
        ]),
        ephemeral: true
      });
    } catch (err) {
      console.error("Failed to send followup:", err);
    }
  }

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

      // FIXED: Use unique custom_ids for pagination buttons
      const components = [
        textComponent("## 📜 List Partnership"),
        separatorComponent(),
        sectionComponent([listText], buttonComponent({
          style: 2,
          label: "Search",
          customId: "partnership_search"
        })),
        separatorComponent(),
        textComponent(`-# Terakhir diperbarui: <t:${Math.floor(Date.now() / 1000)}:R> • Total partnership: ${total}`),
        actionRowComponent([
          buttonComponent({ style: 2, label: "◀◀", customId: `list_page_first_${page}` }),
          buttonComponent({ style: 2, label: "◀", customId: `list_page_prev_${page}` }),
          buttonComponent({ style: 2, label: `${page}/${totalPages}`, customId: `list_page_info_${page}`, disabled: true }),
          buttonComponent({ style: 2, label: "▶", customId: `list_page_next_${page}` }),
          buttonComponent({ style: 2, label: "▶▶", customId: `list_page_last_${page}` })
        ]),
        separatorComponent(),
        textComponent("-# © Guild Partnership - EmpireBS")
      ];

      await interaction.reply({ ...buildV2Message(components), ephemeral: true });
    } catch (err) {
      console.error("List error:", err);
      await interaction.reply({
        ...buildV2Message([
          textComponent("## ❌ Error"),
          separatorComponent(),
          textComponent("Terjadi kesalahan saat memuat daftar partnership."),
          separatorComponent(),
          textComponent("-# © Guild Partnership - EmpireBS")
        ]),
        ephemeral: true
      });
    }
  }

  async handleListPagination(interaction) {
    const customId = interaction.customId;
    let page;

    if (customId.startsWith("list_page_prev_")) {
      page = parseInt(customId.replace("list_page_prev_", "")) - 1;
    } else if (customId.startsWith("list_page_next_")) {
      page = parseInt(customId.replace("list_page_next_", "")) + 1;
    } else if (customId.startsWith("list_page_first_")) {
      page = 1;
    } else if (customId.startsWith("list_page_last_")) {
      const currentPage = parseInt(customId.replace("list_page_last_", ""));
      const total = await getCollection("partnerships").countDocuments({ status: "accepted" });
      page = Math.ceil(total / 10) || 1;
    } else if (customId.startsWith("list_page_info_")) {
      return; // disabled button, should not trigger
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
      new ActionRowBuilder().addComponents(
        new TextInputBuilder().setCustomId("search_name").setLabel("Nama Server (Opsional)").setStyle(TextInputStyle.Short).setRequired(false)
      ),
      new ActionRowBuilder().addComponents(
        new TextInputBuilder().setCustomId("search_link").setLabel("Link Server (Opsional)").setStyle(TextInputStyle.Short).setRequired(false)
      ),
      new ActionRowBuilder().addComponents(
        new TextInputBuilder().setCustomId("search_by").setLabel("Partnership By (Opsional)").setStyle(TextInputStyle.Short).setRequired(false)
      )
    );

    await interaction.showModal(modal);
  }

  async processSearchSubmission(interaction) {
    const name = interaction.fields.getTextInputValue("search_name");
    const link = interaction.fields.getTextInputValue("search_link");
    const by = interaction.fields.getTextInputValue("search_by");

    if (!name && !link && !by) {
      await interaction.reply({
        ...buildV2Message([
          textComponent("## ⚠️ Input Diperlukan"),
          separatorComponent(),
          textComponent("Minimal satu field harus diisi untuk melakukan pencarian."),
          separatorComponent(),
          textComponent("-# © Guild Partnership - EmpireBS")
        ]),
        ephemeral: true
      });
      return;
    }

    const query = { status: "accepted" };
    if (name) query.serverName = { $regex: name, $options: "i" };
    if (link) query.serverLink = { $regex: link, $options: "i" };
    if (by) query.username = { $regex: by, $options: "i" };

    const results = await getCollection("partnerships").find(query).limit(10).toArray();

    let resultText = "## 🔍 Hasil Pencarian\n\n";
    if (results.length === 0) {
      resultText += "Tidak ditemukan hasil untuk pencarian Anda.";
    } else {
      results.forEach((p, i) => {
        resultText += `**${i + 1}.** <@${p.userId}> - ${p.serverName}\n-# <:00:1360567203325542431>Link: [Klik Disini](${p.serverLink})\n`;
      });
    }

    await interaction.reply({
      ...buildV2Message([
        textComponent(resultText),
        separatorComponent(),
        textComponent("-# © Guild Partnership - EmpireBS")
      ]),
      ephemeral: true
    });
  }

  async handleDmToggle(interaction) {
    const customId = interaction.customId;
    const userId = interaction.user.id;

    const partnership = await getCollection("partnerships").findOne({ userId, status: "accepted" });
    if (partnership) {
      await getCollection("partnerships").updateOne(
        { _id: partnership._id },
        { $set: { dmNotifications: customId === "partnership_dm_yes" } }
      );
    }

    const isYes = customId === "partnership_dm_yes";
    await interaction.update({
      ...buildV2Message([
        textComponent("## 🔈 Notifikasi DM"),
        separatorComponent(),
        textComponent(`> Saat pilih tombol **Iya Pake** bot <@1364585069812912148> akan kirim DM notifikasi.\n> postingan events sudah kekirim di <#1502206484489175101>\n\nNote: Saat ini tombol **${isYes ? "Iya Pake" : "Tidak Pake"}**`),
        separatorComponent(),
        actionRowComponent([
          buttonComponent({ style: 3, label: "Iya Pake", customId: "partnership_dm_yes", disabled: isYes }),
          buttonComponent({ style: 4, label: "Tidak Pake", customId: "partnership_dm_no", disabled: !isYes })
        ]),
        separatorComponent(),
        textComponent("-# © Guild Partnership - EmpireBS")
      ]),
      ephemeral: true
    });
  }

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

      return await channel.send({
        content: `-# [.](${data.serverLink})`,
        ...buildV2Message([
          textComponent(plainText),
          separatorComponent(),
          textComponent("-# © Guild Partnership - EmpireBS")
        ])
      });
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

      return await channel.send({
        content: `-# [.](${data.serverLink})`,
        ...buildV2Message([
          textComponent(plainText),
          separatorComponent(),
          textComponent("-# © Guild Partnership - EmpireBS")
        ])
      });
    }
  }

  async createForumLog(interaction, data, type, startTime) {
    try {
      const forumChannel = await this.client.channels.fetch(CONFIG.FORUM_LOG_CHANNEL_ID);
      if (!forumChannel || forumChannel.type !== ChannelType.GuildForum) return;

      const duration = this.formatDuration(Date.now() - startTime);
      const user = await this.client.users.fetch(data.userId);
      const acceptor = interaction.user;
      const createdAt = Math.floor(user.createdTimestamp / 1000);
      const daysSince = Math.floor((Date.now() - user.createdTimestamp) / (1000 * 60 * 60 * 24));

      const threadName = `1) ${data.serverName}`;
      let thread;

      const activeThreads = await forumChannel.threads.fetchActive();
      const archivedThreads = await forumChannel.threads.fetchArchived();

      thread = activeThreads.threads.find(t => t.name === threadName) || 
               archivedThreads.threads.find(t => t.name === threadName);

      const logComponents = [
        textComponent(`## ✅ ${user.username} Success ${type === "partnership" ? "Partnership" : type === "event" ? "Events Posts" : "Re-Posting Partnership"}`),
        separatorComponent(),
        textComponent(`**👤 Informasi User**\n> **Username:** [${user.username}](https://discord.com/users/${user.id})\n> **ID:** \`${user.id}\`\n> **Display Name:** ${interaction.guild.members.cache.get(user.id)?.displayName || user.username}\n> **Akun Dibuat:** <t:${createdAt}:R> (${daysSince} hari)`),
        separatorComponent(),
        textComponent(`**📊 Detail Verifikasi**\n> **Waktu Selesai:** ${new Date().toLocaleString("id-ID")}\n> **Total Durasi:** ${duration}\n> **Accept Partner:** [${acceptor.username}](https://discord.com/users/${acceptor.id})\n> **Pesan Partner:** [Go To Messages](https://discord.com/channels/1347233781391560837/${data.channelId}/${data.messageId})\n> **Link Server:** ${data.serverLink}`),
        separatorComponent(),
        textComponent(`**🛡️ Security Info**\n> **Status:** Yes\n> **Edit Pesan:** No\n> **Boost:** No\n> **System:** Component V2 + MongoDB${type !== "partnership" ? `\n> **Nama Server:** ${data.serverName}` : ""}`),
        separatorComponent(),
        textComponent("\n-# Log ID:")
      ];

      if (thread) {
        await thread.send(buildV2Message(logComponents));
      } else {
        const newThread = await forumChannel.threads.create({
          name: threadName,
          message: buildV2Message(logComponents),
          reason: `Partnership log for ${data.serverName}`
        });

        if (type === "partnership") {
          await getCollection("partnerships").updateOne(
            { _id: data._id },
            { $set: { forumThreadId: newThread.id } }
          );
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

      const title = type === "partnership" ? "Partnership Diterima" : 
                    type === "event" ? "Events Diterima" : "Re-Posting Diterima";

      await user.send({
        ...buildV2Message([
          textComponent(`## ✅ ${title}`),
          separatorComponent(),
          textComponent(`Selamat! Pengajuan ${type === "partnership" ? "partnership" : type === "event" ? "posting events" : "re-posting"} Anda telah **diterima** oleh admin.\n\n**Detail:**\n> Nama Server: ${data.serverName}\n> Link: ${data.serverLink}\n> Diterima oleh: ${acceptor.username}`),
          separatorComponent(),
          textComponent("-# © Guild Partnership - EmpireBS")
        ])
      });
    } catch (err) {
      console.error("DM send error:", err);
    }
  }

  async sendEventDm(eventPost, acceptor, startTime) {
    try {
      const user = await this.client.users.fetch(eventPost.userId);
      if (!user) return;

      const partnership = await getCollection("partnerships").findOne({ userId: eventPost.userId, status: "accepted" });
      if (partnership && partnership.dmNotifications) {
        await user.send({
          ...getDmNotificationTemplate(eventPost.messageId, acceptor.id)
        });
      }
    } catch (err) {
      console.error("Event DM error:", err);
    }
  }

  // ==================== FIXED COMMAND HANDLER ====================
  async handleCommand(message) {
    if (!message.content.toLowerCase().startsWith("!partner") && 
        !message.content.toLowerCase().startsWith("!berhenti") && 
        !message.content.toLowerCase().startsWith("!lanjut")) return false;

    const member = message.member;
    const channel = message.channel;
    const guild = message.guild;

    // Handle !partner command
    if (message.content.toLowerCase().startsWith("!partner")) {
      // Check if in correct category
      if (!channel.parentId || channel.parentId !== CONFIG.PARTNER_CATEGORY_ID) {
        await message.reply({
          ...getWrongCategoryTemplate(),
          allowedMentions: { parse: [] }
        });
        return true;
      }

      const userId = message.author.id;
      const now = Date.now();

      // Check cooldown and usage count
      let tracker = this.partnerCmdTracker.get(userId);
      if (!tracker) {
        tracker = { lastUsed: 0, count: 0 };
      }

      // Reset count if cooldown has passed
      if (now - tracker.lastUsed > CONFIG.PARTNER_CMD_COOLDOWN) {
        tracker.count = 0;
      }

      // Check if max uses reached
      if (tracker.count >= CONFIG.PARTNER_CMD_MAX_USES) {
        await message.reply({
          ...getPartnerLimitTemplate(),
          allowedMentions: { parse: [] }
        });
        return true;
      }

      // Check cooldown
      if (now - tracker.lastUsed < CONFIG.PARTNER_CMD_COOLDOWN && tracker.count > 0) {
        const remaining = CONFIG.PARTNER_CMD_COOLDOWN - (now - tracker.lastUsed);
        await message.reply({
          ...getPartnerCooldownTemplate(remaining),
          allowedMentions: { parse: [] }
        });
        return true;
      }

      // Check if already submitted
      if (this.partnerSubmitted.has(userId) && this.partnerSubmitted.get(userId).submitted) {
        await message.reply({
          ...getPartnerAlreadySubmittedTemplate(),
          allowedMentions: { parse: [] }
        });
        return true;
      }

      // Update tracker
      tracker.lastUsed = now;
      tracker.count += 1;
      this.partnerCmdTracker.set(userId, tracker);

      // Send template
      await message.reply({
        ...getPartnerCommandTemplate(),
        allowedMentions: { parse: [] }
      });

      return true;
    }

    // Handle !berhenti command
    if (message.content.toLowerCase().startsWith("!berhenti")) {
      // Check if in correct category
      if (!channel.parentId || channel.parentId !== CONFIG.STOP_DISCUSSION_CATEGORY_ID) {
        await message.reply({
          ...getWrongCategoryTemplate(),
          allowedMentions: { parse: [] }
        });
        return true;
      }

      // Check if user has partner role
      if (!this.hasPartnerRole(member)) {
        await message.reply({
          ...getNeedPartnerFirstTemplate(),
          allowedMentions: { parse: [] }
        });
        return true;
      }

      await message.reply({
        ...getStopCommandTemplate(),
        allowedMentions: { parse: [] }
      });
      return true;
    }

    // Handle !lanjut command
    if (message.content.toLowerCase().startsWith("!lanjut")) {
      // Check if in correct category
      if (!channel.parentId || channel.parentId !== CONFIG.STOP_DISCUSSION_CATEGORY_ID) {
        await message.reply({
          ...getWrongCategoryTemplate(),
          allowedMentions: { parse: [] }
        });
        return true;
      }

      // Check if user has partner role
      if (!this.hasPartnerRole(member)) {
        await message.reply({
          ...getNeedPartnerFirstTemplate(),
          allowedMentions: { parse: [] }
        });
        return true;
      }

      await message.reply({
        ...getContinueCommandTemplate(),
        allowedMentions: { parse: [] }
      });
      return true;
    }

    return false;
  }

  parseBannerUrls(bannerString) {
    if (!bannerString) return [];
    return bannerString.split(",").map(url => url.trim()).filter(url => url.length > 0);
  }

  parseColor(colorString) {
    if (!colorString) return null;
    const color = parseInt(colorString);
    return isNaN(color) ? null : color;
  }

  formatDuration(ms) {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);

    if (hours > 0) return `${hours}j ${minutes % 60}m ${seconds % 60}d`;
    if (minutes > 0) return `${minutes}m ${seconds % 60}s`;
    return `${seconds}s`;
  }

  async findMessageById(messageId, channelId) {
    try {
      const channel = await this.client.channels.fetch(channelId);
      if (!channel) return null;
      return await channel.messages.fetch(messageId).catch(() => null);
    } catch (err) {
      return null;
    }
  }

  async extractDataFromMessage(message) {
    try {
      const container = message.components?.[0];
      if (!container || container.type !== 17) return null;

      const textComponents = container.components?.filter(c => c.type === 10);
      const firstText = textComponents?.[0]?.content || "";
      const serverName = firstText.replace(/^#\s*/, "").trim();

      return {
        serverName,
        description: textComponents?.[1]?.content || "",
        bannerUrls: [],
        sidebarColor: container.accent_color
      };
    } catch (err) {
      return null;
    }
  }
}

module.exports = PartnershipSystem;
