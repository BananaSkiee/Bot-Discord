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
const mongoose = require("mongoose");
const { ObjectId } = require("mongodb");

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

// ==================== MONGOOSE SCHEMAS ====================
let isConnected = false;

const partnershipSchema = new mongoose.Schema({
  userId: String,
  username: String,
  serverName: String,
  serverDescription: String,
  serverLink: String,
  bannerUrls: [String],
  sidebarColor: { type: Number, default: null },
  useEmbed: { type: Boolean, default: true },
  messageId: String,
  channelId: String,
  forumThreadId: String,
  status: { type: String, enum: ["pending", "accepted", "rejected"], default: "pending" },
  acceptedBy: String,
  acceptedAt: Date,
  createdAt: { type: Date, default: Date.now },
  repostCount: { type: Number, default: 0 },
  lastRepostAt: Date,
  dmNotifications: { type: Boolean, default: false }
});

const eventSchema = new mongoose.Schema({
  userId: String,
  username: String,
  serverName: String,
  eventDescription: String,
  serverLink: String,
  bannerUrls: [String],
  sidebarColor: { type: Number, default: null },
  useEmbed: { type: Boolean, default: true },
  eventLink: String,
  messageId: String,
  channelId: String,
  status: { type: String, enum: ["pending", "accepted", "rejected"], default: "pending" },
  acceptedBy: String,
  acceptedAt: Date,
  createdAt: { type: Date, default: Date.now }
});

const stopRequestSchema = new mongoose.Schema({
  userId: String,
  username: String,
  userTag: String,
  serverName: String,
  serverLink: String,
  reason: String,
  status: { type: String, enum: ["pending", "accepted", "rejected"], default: "pending" },
  discussionChannelId: String,
  handledBy: String,
  createdAt: { type: Date, default: Date.now }
});

const logSchema = new mongoose.Schema({
  type: { type: String, enum: ["partnership", "event", "repost", "stop"], required: true },
  userId: String,
  username: String,
  serverName: String,
  action: String,
  performedBy: String,
  duration: String,
  messageId: String,
  createdAt: { type: Date, default: Date.now }
});

let Partnership, EventPost, StopRequest, PartnershipLog;

// ==================== DATABASE CONNECTION ====================
async function connectDatabase() {
  if (isConnected) return;
  try {
    await mongoose.connect(CONFIG.MONGODB_URI);
    isConnected = true;
    console.log("✅ Partnership MongoDB Connected");

    Partnership = mongoose.model("Partnership", partnershipSchema);
    EventPost = mongoose.model("EventPost", eventSchema);
    StopRequest = mongoose.model("StopRequest", stopRequestSchema);
    PartnershipLog = mongoose.model("PartnershipLog", logSchema);
  } catch (err) {
    console.error("❌ Partnership MongoDB Error:", err.message);
    throw err;
  }
}

// ==================== COMPONENT V2 HELPERS ====================
function createContainer(components, accentColor = null) {
  const container = {
    type: 17,
    components: components
  };
  if (accentColor !== null) {
    container.accent_color = accentColor;
  }
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
  const btn = {
    type: 2,
    style,
    label,
    custom_id: customId,
    disabled,
    flow: { actions: [] }
  };
  if (url) btn.url = url;
  if (emoji) btn.emoji = emoji;
  return btn;
}

function selectMenuComponent({ customId, options, placeholder, minValues = 1, maxValues = 1 }) {
  return {
    type: 3,
    custom_id: customId,
    options,
    placeholder,
    min_values: minValues,
    max_values: maxValues,
    flows: {}
  };
}

function sectionComponent(textComponents, accessory = null) {
  const section = {
    type: 9,
    components: textComponents.map(t => typeof t === "string" ? textComponent(t) : t)
  };
  if (accessory) section.accessory = accessory;
  return section;
}

function mediaGalleryComponent(urls) {
  return {
    type: 12,
    items: urls.map(url => ({ media: { url } }))
  };
}

function buildV2Message(components, flags = MessageFlags.IsComponentsV2) {
  return {
    flags,
    components: [createContainer(components)]
  };
}

function buildV2MessageWithAccent(components, accentColor, flags = MessageFlags.IsComponentsV2) {
  return {
    flags,
    components: [createContainer(components, accentColor)]
  };
}

// ==================== TEMPLATES ====================
function getDashboardTemplate() {
  return buildV2Message([
    textComponent("## <:1_:1486297322848653425> Partnership Requirement<:00:1360567203325542431><:00:1360567203325542431><:00:1360567203325542431><:00:1360567203325542431>"),
    separatorComponent(),
    textComponent("> - Member dan Staff server aktif\n> - Tidak mengandung konten NSFW.\n> - Tiada minimal jumlah member server.\n> - Gunakan channels partner bukan forum.\n> - Tidak menerima server khusus berjualan.\n> - Bebas dari konflik dengan komunitas lain."
    ),
    separatorComponent(),
    actionRowComponent([
      {
        type: 3,
        options: [
          { label: "Open Partnership", value: "2X4OAiLrez", emoji: { name: "🔍" } },
          { label: "Posting Events", value: "5rSW3aoXFw", emoji: { name: "📥" } },
          { label: "Re-Posting Partner", value: "Vrv9pE1vwp", emoji: { name: "🔃" } },
          { label: "List Partnership", value: "IoA1YxsT8u", emoji: { name: "📜" } },
          { label: "Berhenti Partnership", value: "ASH11sgG4x", emoji: { name: "🛑" } }
        ],
        flows: {},
        custom_id: "p_301362246674550785",
        min_values: 1,
        max_values: 1
      }
    ]),
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
    actionRowComponent([
      buttonComponent({
        style: 2,
        label: "Ajukan Berhenti",
        customId: "partnership_stop_form"
      })
    ]),
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
      buttonComponent({
        style: 5,
        label: "Open Ticket",
        emoji: { name: "📫" },
        url: "https://discord.com/channels/1347233781391560837/1498935151441219584",
        customId: "p_301255507480416258"
      }),
      buttonComponent({
        style: 3,
        label: "Benefit",
        emoji: { name: "🎀" },
        customId: "partnership_benefit"
      }),
      buttonComponent({
        style: 1,
        label: "Ketentuan Partner",
        emoji: { name: "📋" },
        customId: "partnership_rules"
      })
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
      buttonComponent({
        style: 1,
        label: "Isi Formulir Disini",
        emoji: { name: "📩" },
        customId: "partnership_event_form"
      }),
      buttonComponent({
        style: 3,
        label: "Yes",
        customId: "partnership_event_yes",
        disabled: true
      }),
      buttonComponent({
        style: 4,
        label: "No",
        customId: "partnership_event_no"
      })
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
      buttonComponent({
        style: 1,
        label: "Isi Formulir Disini",
        emoji: { name: "📩" },
        customId: "partnership_repost_form"
      }),
      buttonComponent({
        style: 3,
        label: "Yes",
        customId: "partnership_repost_yes",
        disabled: true
      }),
      buttonComponent({
        style: 4,
        label: "No",
        customId: "partnership_repost_no"
      })
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
      buttonComponent({
        style: 1,
        label: "Isi Formulir Disini",
        emoji: { name: "📩" },
        customId: "partnership_cmd_form"
      }),
      buttonComponent({
        style: 3,
        label: "Yes",
        customId: "partnership_cmd_yes",
        disabled: true
      }),
      buttonComponent({
        style: 4,
        label: "No",
        customId: "partnership_cmd_no"
      })
    ]),
    separatorComponent(),
    textComponent("-# © Guild Partnership - EmpireBS")
  ]);
}

function getDmNotificationTemplate(messageId, acceptorId) {
  return buildV2Message([
    sectionComponent(
      ["## <:1_:1486297322848653425> Notifikasi DM"],
      buttonComponent({
        style: 5,
        label: "Messages",
        url: `https://discord.com/channels/1347233781391560837/1502206484489175101/${messageId}`,
        customId: "p_301426364286767106"
      })
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
      buttonComponent({
        style: 3,
        label: "Iya Pake",
        customId: "partnership_dm_yes"
      }),
      buttonComponent({
        style: 4,
        label: "Tidak Pake",
        customId: "partnership_dm_no",
        disabled: true
      })
    ]),
    separatorComponent(),
    textComponent("-# © Guild Partnership - EmpireBS")
  ]);
}

// ==================== PARTNERSHIP CLASS ====================
class PartnershipSystem {
  constructor(client) {
    this.client = client;
    this.userChannels = new Map(); // Track user created channels count
  }

  async initialize() {
    await connectDatabase();
    console.log("✅ Partnership System Initialized");
  }

  async close() {
    if (isConnected) {
      await mongoose.disconnect();
      isConnected = false;
    }
  }

  // ==================== ROLE CHECKERS ====================
  hasPartnerRole(member) {
    return member.roles.cache.has(CONFIG.PARTNER_ROLE_ID);
  }

  hasAdminRole(member) {
    return member.roles.cache.has(CONFIG.ADMIN_ROLE_ID);
  }

  // ==================== INTERACTION HANDLER ====================
  async handleInteraction(interaction) {
    if (!interaction.isStringSelectMenu() && !interaction.isButton() && !interaction.isModalSubmit()) return false;

    const customId = interaction.customId;

    // Dashboard select menu
    if (customId === "p_301362246674550785") {
      await this.handleDashboardSelect(interaction);
      return true;
    }

    // Button handlers
    if (customId.startsWith("partnership_")) {
      await this.handlePartnershipButton(interaction);
      return true;
    }

    // Admin action buttons
    if (customId.startsWith("admin_accept_") || customId.startsWith("admin_reject_") || customId.startsWith("admin_edit_")) {
      await this.handleAdminAction(interaction);
      return true;
    }

    // Stop request admin buttons
    if (customId.startsWith("stop_accept_") || customId.startsWith("stop_reject_")) {
      await this.handleStopAdminAction(interaction);
      return true;
    }

    // Pagination buttons
    if (customId.startsWith("list_page_")) {
      await this.handleListPagination(interaction);
      return true;
    }

    // Search button
    if (customId === "partnership_search") {
      await this.handleSearch(interaction);
      return true;
    }

    // DM toggle
    if (customId === "partnership_dm_yes" || customId === "partnership_dm_no") {
      await this.handleDmToggle(interaction);
      return true;
    }

    return false;
  }

  // ==================== DASHBOARD SELECT ====================
  async handleDashboardSelect(interaction) {
    const value = interaction.values[0];
    const member = interaction.member;

    switch (value) {
      case "2X4OAiLrez": // Open Partnership
        if (this.hasPartnerRole(member)) {
          await interaction.reply({ ...getAlreadyPartnerTemplate(), ephemeral: true });
        } else {
          await interaction.reply({ ...getOpenPartnershipTemplate(), ephemeral: true });
        }
        break;

      case "5rSW3aoXFw": // Posting Events
        if (!this.hasPartnerRole(member)) {
          await interaction.reply({ ...getNeedPartnerFirstTemplate(), ephemeral: true });
        } else {
          await interaction.reply({ ...getPostingEventsTemplate(), ephemeral: true });
        }
        break;

      case "Vrv9pE1vwp": // Re-Posting Partner
        if (!this.hasPartnerRole(member)) {
          await interaction.reply({ ...getNeedPartnerFirstTemplate(), ephemeral: true });
        } else {
          await interaction.reply({ ...getRepostingTemplate(), ephemeral: true });
        }
        break;

      case "IoA1YxsT8u": // List Partnership
        await this.showList(interaction, 1);
        break;

      case "ASH11sgG4x": // Berhenti Partnership
        if (!this.hasPartnerRole(member)) {
          await interaction.reply({ ...getNeedPartnerFirstTemplate(), ephemeral: true });
        } else {
          await interaction.reply({ ...getStopPartnershipTemplate(), ephemeral: true });
        }
        break;
    }
  }

  // ==================== BUTTON HANDLER ====================
  async handlePartnershipButton(interaction) {
    const customId = interaction.customId;
    const member = interaction.member;

    // Open Partnership buttons
    if (customId === "partnership_benefit") {
      await interaction.reply({ ...getBenefitTemplate(), ephemeral: true });
      return;
    }

    if (customId === "partnership_rules") {
      await interaction.reply({ ...getRulesTemplate(), ephemeral: true });
      return;
    }

    // Yes/No toggles for Event
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

    // Yes/No toggles for Repost
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

    // Yes/No toggles for Command
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

  // ==================== MODAL HANDLER ====================
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

    return false;
  }

  // ==================== SHOW FORM MODAL ====================
  async showFormModal(interaction, customId) {
    let modal;

    if (customId === "partnership_event_form" || customId === "partnership_event_form_noembed") {
      modal = new ModalBuilder()
        .setCustomId(`modal_event_${customId.includes("noembed") ? "no" : "yes"}`)
        .setTitle("Formulir Posting Events");

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
          new TextInputBuilder().setCustomId("event_link").setLabel("Link Event (Opsional)").setStyle(TextInputStyle.Short).setRequired(false).setPlaceholder("URL event jika ada")
        )
      );
    }

    if (customId === "partnership_repost_form" || customId === "partnership_repost_form_noembed") {
      modal = new ModalBuilder()
        .setCustomId(`modal_repost_${customId.includes("noembed") ? "no" : "yes"}`)
        .setTitle("Formulir Re-Posting Partnership");

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
          new TextInputBuilder().setCustomId("sidebar_color").setLabel("Sidebar Color (Opsional)").setStyle(TextInputStyle.Short).setRequired(false).setPlaceholder("Contoh: 16711685 (hex integer)")
        )
      );
    }

    if (customId === "partnership_cmd_form" || customId === "partnership_cmd_form_noembed") {
      modal = new ModalBuilder()
        .setCustomId(`modal_partner_${customId.includes("noembed") ? "no" : "yes"}`)
        .setTitle("Formulir Pengajuan Partnership");

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
          new TextInputBuilder().setCustomId("sidebar_color").setLabel("Sidebar Color (Opsional)").setStyle(TextInputStyle.Short).setRequired(false).setPlaceholder("Contoh: 16711685 (hex integer)")
        )
      );
    }

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

  // ==================== PROCESS FORM SUBMISSIONS ====================
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
          bannerUrls: this.parseBannerUrls(fields.getTextInputValue("banner")),
          sidebarColor: this.parseColor(fields.getTextInputValue("sidebar_color")),
          useEmbed,
          eventLink: fields.getTextInputValue("event_link") || "",
          status: "pending"
        };

        const eventPost = new EventPost(data);
        await eventPost.save();

        // Send to admin review
        await this.sendToAdminReview(interaction, eventPost, "event");

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
        const existing = await Partnership.findOne({ userId: user.id, status: "accepted" });

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

        // Check cooldown (1 week)
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
          sidebarColor: this.parseColor(fields.getTextInputValue("sidebar_color")),
          useEmbed,
          status: "pending",
          originalId: existing._id
        };

        // Create temporary repost object for review
        const repostData = { ...data, _id: new ObjectId() };
        await this.sendToAdminReview(interaction, repostData, "repost");

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
          sidebarColor: this.parseColor(fields.getTextInputValue("sidebar_color")),
          useEmbed,
          status: "pending"
        };

        const partnership = new Partnership(data);
        await partnership.save();

        await this.sendToAdminReview(interaction, partnership, "partnership");

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

  // ==================== PROCESS STOP SUBMISSION ====================
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
      status: "pending"
    };

    const stopRequest = new StopRequest(data);
    await stopRequest.save();

    // Send to admin channel
    const adminChannel = await this.client.channels.fetch(CONFIG.ADMIN_REVIEW_CHANNEL_ID);
    if (adminChannel) {
      const components = [
        textComponent("## 🛑 Permintaan Berhenti Partnership"),
        separatorComponent(),
        textComponent(`**👤 Informasi User**\n> **Username:** [${user.username}](https://discord.com/users/${user.id})\n> **ID:** \`${user.id}\`\n> **Display Name:** ${interaction.member.displayName}\n> **Akun Dibuat:** <t:${Math.floor(user.createdTimestamp / 1000)}:R>`),
        separatorComponent(),
        textComponent(`**📊 Detail Permintaan**\n> **Nama Server:** ${data.serverName}\n> **Link Server:** ${data.serverLink}\n> **Alasan:** ${data.reason}`),
        separatorComponent(),
        actionRowComponent([
          buttonComponent({ style: 3, label: "Accept", customId: `stop_accept_${stopRequest._id}` }),
          buttonComponent({ style: 4, label: "Reject", customId: `stop_reject_${stopRequest._id}` })
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

  // ==================== ADMIN REVIEW SENDER ====================
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
      // No embed - plain text format
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

  // ==================== ADMIN ACTION HANDLER ====================
  async handleAdminAction(interaction) {
    const customId = interaction.customId;
    const [action, type, id] = customId.replace("admin_", "").split("_");

    if (!interaction.memberPermissions?.has(PermissionFlagsBits.ManageMessages) && !this.hasAdminRole(interaction.member)) {
      await interaction.reply({
        ...buildV2Message([
          textComponent("## Akses Ditolak"),
          separatorComponent(),
          textComponent("Hanya admin partnership yang dapat melakukan tindakan ini."),
          separatorComponent(),
          textComponent("-# © Guild Partnership - EmpireBS")
        ]),
        ephemeral: true
      });
      return;
    }

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
      await interaction.reply({
        ...buildV2Message([
          textComponent("## ❌ Error"),
          separatorComponent(),
          textComponent("Terjadi kesalahan saat memproses tindakan admin."),
          separatorComponent(),
          textComponent("-# © Guild Partnership - EmpireBS")
        ]),
        ephemeral: true
      });
    }
  }

  // ==================== ACCEPT HANDLER ====================
  async handleAccept(interaction, type, id) {
    const startTime = Date.now();

    if (type === "partnership") {
      const partnership = await Partnership.findById(id);
      if (!partnership) return;

      partnership.status = "accepted";
      partnership.acceptedBy = interaction.user.id;
      partnership.acceptedAt = new Date();
      await partnership.save();

      // Send to partner channel
      const partnerChannel = await this.client.channels.fetch(CONFIG.SERVER_PARTNER_CHANNEL_ID);
      if (partnerChannel) {
        const message = await this.sendPartnerMessage(partnerChannel, partnership);
        partnership.messageId = message.id;
        partnership.channelId = message.channelId;
        await partnership.save();
      }

      // Add partner role
      const guild = interaction.guild;
      const member = await guild.members.fetch(partnership.userId).catch(() => null);
      if (member) {
        await member.roles.add(CONFIG.PARTNER_ROLE_ID).catch(() => {});
      }

      // Create forum log
      await this.createForumLog(interaction, partnership, "partnership", startTime);

      // DM User
      await this.sendAcceptDm(partnership.userId, partnership, interaction.user, "partnership");

    } else if (type === "event") {
      const eventPost = await EventPost.findById(id);
      if (!eventPost) return;

      eventPost.status = "accepted";
      eventPost.acceptedBy = interaction.user.id;
      eventPost.acceptedAt = new Date();
      await eventPost.save();

      // Send to event channel
      const eventChannel = await this.client.channels.fetch(CONFIG.EVENT_PARTNER_CHANNEL_ID);
      if (eventChannel) {
        const message = await this.sendEventMessage(eventChannel, eventPost);
        eventPost.messageId = message.id;
        eventPost.channelId = message.channelId;
        await eventPost.save();
      }

      // Create forum log
      await this.createForumLog(interaction, eventPost, "event", startTime);

      // DM User with notification toggle
      await this.sendEventDm(eventPost, interaction.user, startTime);

    } else if (type === "repost") {
      const partnership = await Partnership.findOne({ userId: interaction.message?.interaction?.user?.id || interaction.user.id, status: "accepted" });
      if (!partnership) return;

      // Update partnership data
      const message = await this.findMessageById(partnership.messageId, partnership.channelId);
      if (message) {
        await message.delete().catch(() => {});
      }

      // Get data from the interaction message
      const newData = await this.extractDataFromMessage(interaction.message);
      if (newData) {
        partnership.serverDescription = newData.description || partnership.serverDescription;
        partnership.bannerUrls = newData.bannerUrls || partnership.bannerUrls;
        partnership.sidebarColor = newData.sidebarColor || partnership.sidebarColor;
        partnership.useEmbed = newData.useEmbed !== undefined ? newData.useEmbed : partnership.useEmbed;
      }

      partnership.repostCount += 1;
      partnership.lastRepostAt = new Date();
      await partnership.save();

      // Send new message
      const partnerChannel = await this.client.channels.fetch(CONFIG.SERVER_PARTNER_CHANNEL_ID);
      if (partnerChannel) {
        const newMessage = await this.sendPartnerMessage(partnerChannel, partnership);
        partnership.messageId = newMessage.id;
        partnership.channelId = newMessage.channelId;
        await partnership.save();
      }

      // Create forum log (comment in existing thread)
      await this.createForumLog(interaction, partnership, "repost", startTime);

      // DM User
      await this.sendAcceptDm(partnership.userId, partnership, interaction.user, "repost");
    }

    // Update admin message
    await interaction.update({
      ...buildV2Message([
        textComponent("## ✅ Diterima"),
        separatorComponent(),
        textComponent(`Diterima oleh: <@${interaction.user.id}>\nWaktu: <t:${Math.floor(Date.now() / 1000)}:R>`),
        separatorComponent(),
        textComponent("-# © Guild Partnership - EmpireBS")
      ]),
      components: []
    });
  }

  // ==================== REJECT HANDLER ====================
  async handleReject(interaction, type, id) {
    const modal = new ModalBuilder()
      .setCustomId(`reject_modal_${type}_${id}`)
      .setTitle("Alasan Penolakan");

    modal.addComponents(
      new ActionRowBuilder().addComponents(
        new TextInputBuilder()
          .setCustomId("reject_reason")
          .setLabel("Alasan Penolakan (Min. 10 kata)")
          .setStyle(TextInputStyle.Paragraph)
          .setRequired(true)
          .setPlaceholder("Jelaskan dengan detail mengapa pengajuan ini ditolak...")
      )
    );

    await interaction.showModal(modal);
  }

  // ==================== PROCESS REJECTION ====================
  async processRejectionSubmission(interaction) {
    const customId = interaction.customId;
    const [type, id] = customId.replace("reject_modal_", "").split("_");
    const reason = interaction.fields.getTextInputValue("reject_reason");

    if (reason.split(/\s+/).length < 10) {
      await interaction.reply({
        ...buildV2Message([
          textComponent("## ⚠️ Alasan Terlalu Singkat"),
          separatorComponent(),
          textComponent("Alasan penolakan harus minimal 10 kata. Silakan coba lagi."),
          separatorComponent(),
          textComponent("-# © Guild Partnership - EmpireBS")
        ]),
        ephemeral: true
      });
      return;
    }

    let data, collection;
    if (type === "partnership") {
      data = await Partnership.findById(id);
      collection = Partnership;
    } else if (type === "event") {
      data = await EventPost.findById(id);
      collection = EventPost;
    } else if (type === "repost") {
      data = await Partnership.findById(id);
      collection = Partnership;
    }

    if (data) {
      data.status = "rejected";
      await data.save();

      // DM User
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

    await interaction.reply({
      ...buildV2Message([
        textComponent("## ✅ Ditolak"),
        separatorComponent(),
        textComponent(`Ditolak oleh: <@${interaction.user.id}>\nAlasan: ${reason}`),
        separatorComponent(),
        textComponent("-# © Guild Partnership - EmpireBS")
      ]),
      ephemeral: true
    });

    // Update original message
    await interaction.message.edit({
      ...buildV2Message([
        textComponent("## ❌ Ditolak"),
        separatorComponent(),
        textComponent(`Ditolak oleh: <@${interaction.user.id}>\nAlasan: ${reason}\nWaktu: <t:${Math.floor(Date.now() / 1000)}:R>`),
        separatorComponent(),
        textComponent("-# © Guild Partnership - EmpireBS")
      ]),
      components: []
    });
  }

  // ==================== EDIT HANDLER ====================
  async handleEdit(interaction, type, id) {
    const modal = new ModalBuilder()
      .setCustomId(`edit_modal_${type}_${id}`)
      .setTitle("Edit Pesan Partnership");

    modal.addComponents(
      new ActionRowBuilder().addComponents(
        new TextInputBuilder()
          .setCustomId("edit_content")
          .setLabel("Konten Baru")
          .setStyle(TextInputStyle.Paragraph)
          .setRequired(true)
          .setPlaceholder("Masukkan konten baru...")
      )
    );

    await interaction.showModal(modal);
  }

  // ==================== PROCESS EDIT ====================
  async processEditSubmission(interaction) {
    const customId = interaction.customId;
    const [type, id] = customId.replace("edit_modal_", "").split("_");
    const newContent = interaction.fields.getTextInputValue("edit_content");

    let data;
    if (type === "partnership" || type === "repost") {
      data = await Partnership.findById(id);
    } else if (type === "event") {
      data = await EventPost.findById(id);
    }

    if (data && data.messageId && data.channelId) {
      const channel = await this.client.channels.fetch(data.channelId);
      if (channel) {
        const message = await channel.messages.fetch(data.messageId).catch(() => null);
        if (message) {
          // Update the message with new content
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

    await interaction.reply({
      ...buildV2Message([
        textComponent("## ✅ Berhasil Diedit"),
        separatorComponent(),
        textComponent("Pesan telah berhasil diperbarui."),
        separatorComponent(),
        textComponent("-# © Guild Partnership - EmpireBS")
      ]),
      ephemeral: true
    });
  }

  // ==================== STOP ADMIN HANDLER ====================
  async handleStopAdminAction(interaction) {
    const customId = interaction.customId;
    const [action, id] = customId.replace("stop_", "").split("_");

    if (!this.hasAdminRole(interaction.member)) {
      await interaction.reply({
        ...buildV2Message([
          textComponent("## Akses Ditolak"),
          separatorComponent(),
          textComponent("Hanya admin partnership yang dapat melakukan tindakan ini."),
          separatorComponent(),
          textComponent("-# © Guild Partnership - EmpireBS")
        ]),
        ephemeral: true
      });
      return;
    }

    const stopRequest = await StopRequest.findById(id);
    if (!stopRequest) return;

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

      await interaction.showModal(modal);
    } else if (action === "reject") {
      // Create discussion channel
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

        stopRequest.discussionChannelId = channel.id;
        stopRequest.status = "rejected";
        stopRequest.handledBy = interaction.user.id;
        await stopRequest.save();

        // Send message in channel
        await channel.send({
          ...buildV2Message([
            textComponent("## 💬 Diskusi Penghentian Partnership"),
            separatorComponent(),
            textComponent(`Halo <@${stopRequest.userId}>, admin ingin mendiskusikan lebih lanjut mengenai permintaan penghentian partnership Anda.\n\nSilakan jelaskan kembali alasan Anda ingin berhenti partnership dengan komunitas kami.`),
            separatorComponent(),
            textComponent("-# © Guild Partnership - EmpireBS")
          ])
        });

        // DM User
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

      await interaction.update({
        ...buildV2Message([
          textComponent("## ❌ Rejected - Diskusi Dibuka"),
          separatorComponent(),
          textComponent(`Ditolak oleh: <@${interaction.user.id}>\nChannel diskusi telah dibuat.`),
          separatorComponent(),
          textComponent("-# © Guild Partnership - EmpireBS")
        ]),
        components: []
      });
    }
  }

  // ==================== PROCESS STOP ACCEPT ====================
  async processStopAdminSubmission(interaction) {
    const id = interaction.customId.replace("stop_admin_modal_", "");
    const thankYouMsg = interaction.fields.getTextInputValue("thank_you_msg");

    const stopRequest = await StopRequest.findById(id);
    if (!stopRequest) return;

    stopRequest.status = "accepted";
    stopRequest.handledBy = interaction.user.id;
    await stopRequest.save();

    // Remove partner role
    const guild = interaction.guild;
    const member = await guild.members.fetch(stopRequest.userId).catch(() => null);
    if (member) {
      await member.roles.remove(CONFIG.PARTNER_ROLE_ID).catch(() => {});
    }

    // Delete partnership data
    await Partnership.deleteOne({ userId: stopRequest.userId, status: "accepted" });

    // DM User
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

    await interaction.update({
      ...buildV2Message([
        textComponent("## ✅ Diterima - Partnership Dihentikan"),
        separatorComponent(),
        textComponent(`Diterima oleh: <@${interaction.user.id}>\nRole partnership telah dicabut.`),
        separatorComponent(),
        textComponent("-# © Guild Partnership - EmpireBS")
      ]),
      components: []
    });
  }

  // ==================== LIST PARTNERSHIP ====================
  async showList(interaction, page) {
    const perPage = 10;
    const total = await Partnership.countDocuments({ status: "accepted" });
    const totalPages = Math.ceil(total / perPage) || 1;

    if (page < 1) page = totalPages;
    if (page > totalPages) page = 1;

    const partnerships = await Partnership.find({ status: "accepted" })
      .skip((page - 1) * perPage)
      .limit(perPage);

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
      sectionComponent([listText], buttonComponent({
        style: 2,
        label: "Search",
        customId: "partnership_search"
      })),
      separatorComponent(),
      textComponent(`-# Terakhir diperbarui: <t:${Math.floor(Date.now() / 1000)}:R> • Total partnership: ${total}`),
      actionRowComponent([
        buttonComponent({ style: 2, label: "◀◀", customId: `list_page_${page === 1 ? totalPages : Math.max(1, page - 5)}` }),
        buttonComponent({ style: 2, label: "◀", customId: `list_page_${page - 1}` }),
        buttonComponent({ style: 2, label: `${page}/${totalPages}`, customId: `list_page_current`, disabled: true }),
        buttonComponent({ style: 2, label: "▶", customId: `list_page_${page + 1}` }),
        buttonComponent({ style: 2, label: "▶▶", customId: `list_page_${page === totalPages ? 1 : Math.min(totalPages, page + 5)}` })
      ]),
      separatorComponent(),
      textComponent("-# © Guild Partnership - EmpireBS")
    ];

    await interaction.reply({ ...buildV2Message(components), ephemeral: true });
  }

  async handleListPagination(interaction) {
    const page = parseInt(interaction.customId.replace("list_page_", ""));
    if (isNaN(page)) return;
    await this.showList(interaction, page);
  }

  // ==================== SEARCH ====================
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

    const results = await Partnership.find(query).limit(10);

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

  // ==================== DM TOGGLE ====================
  async handleDmToggle(interaction) {
    const customId = interaction.customId;
    const userId = interaction.user.id;

    const partnership = await Partnership.findOne({ userId, status: "accepted" });
    if (partnership) {
      partnership.dmNotifications = customId === "partnership_dm_yes";
      await partnership.save();
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

  // ==================== FORUM LOG ====================
  async createForumLog(interaction, data, type, startTime) {
    try {
      const forumChannel = await this.client.channels.fetch(CONFIG.FORUM_LOG_CHANNEL_ID);
      if (!forumChannel || forumChannel.type !== ChannelType.GuildForum) return;

      const duration = this.formatDuration(Date.now() - startTime);
      const user = await this.client.users.fetch(data.userId);
      const acceptor = interaction.user;
      const createdAt = Math.floor(user.createdTimestamp / 1000);
      const daysSince = Math.floor((Date.now() - user.createdTimestamp) / (1000 * 60 * 60 * 24));

      // Find or create thread
      const threadName = `1) ${data.serverName}`;
      let thread;

      // Check existing threads
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
        // Post in existing thread
        await thread.send(buildV2Message(logComponents));
      } else {
        // Create new thread
        const newThread = await forumChannel.threads.create({
          name: threadName,
          message: buildV2Message(logComponents),
          reason: `Partnership log for ${data.serverName}`
        });

        if (type === "partnership") {
          data.forumThreadId = newThread.id;
          await data.save();
        }
      }
    } catch (err) {
      console.error("Forum log error:", err);
    }
  }

  // ==================== DM SENDERS ====================
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

      const partnership = await Partnership.findOne({ userId: eventPost.userId, status: "accepted" });
      if (partnership && partnership.dmNotifications) {
        await user.send({
          ...getDmNotificationTemplate(eventPost.messageId, acceptor.id)
        });
      }
    } catch (err) {
      console.error("Event DM error:", err);
    }
  }

  // ==================== COMMAND HANDLER (!partner) ====================
  async handleCommand(message) {
    if (!message.content.toLowerCase().startsWith("!partner")) return false;

    const member = message.member;
    if (!this.hasAdminRole(member)) {
      await message.reply({
        ...getNoPermissionTemplate(),
        allowedMentions: { parse: [] }
      });
      return true;
    }

    // Count user channels in category
    const category = await this.client.channels.fetch(CONFIG.PARTNER_CATEGORY_ID);
    if (!category || category.type !== ChannelType.GuildCategory) {
      await message.reply("Kategori tidak ditemukan!");
      return true;
    }

    const userChannels = category.children.cache.filter(
      ch => ch.name.includes(message.author.username.toLowerCase().replace(/[^a-z0-9]/g, ""))
    );

    if (userChannels.size >= CONFIG.MAX_PARTNER_CHANNELS) {
      await message.reply({
        ...getMaxChannelTemplate(),
        allowedMentions: { parse: [] }
      });
      return true;
    }

    // Create channel
    const channelName = `partner-${message.author.username.toLowerCase().replace(/[^a-z0-9]/g, "")}-${userChannels.size + 1}`;
    const channel = await message.guild.channels.create({
      name: channelName,
      type: ChannelType.GuildText,
      parent: category.id,
      permissionOverwrites: [
        { id: message.guild.id, deny: [PermissionFlagsBits.ViewChannel] },
        { id: message.author.id, allow: [PermissionFlagsBits.ViewChannel] },
        { id: CONFIG.ADMIN_ROLE_ID, allow: [PermissionFlagsBits.ViewChannel] }
      ]
    });

    await channel.send({
      ...getPartnerCommandTemplate(),
      allowedMentions: { parse: [] }
    });

    await message.reply({
      ...buildV2Message([
        textComponent("## ✅ Channel Dibuat"),
        separatorComponent(),
        textComponent(`Channel partnership telah dibuat: <#${channel.id}>\nSisa kesempatan: ${CONFIG.MAX_PARTNER_CHANNELS - userChannels.size - 1}/${CONFIG.MAX_PARTNER_CHANNELS}`),
        separatorComponent(),
        textComponent("-# © Guild Partnership - EmpireBS")
      ]),
      allowedMentions: { parse: [] }
    });

    return true;
  }

  // ==================== UTILITY FUNCTIONS ====================
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
    // Extract data from V2 message components
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

// ==================== EXPORT ====================
module.exports = PartnershipSystem;
