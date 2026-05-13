// modules/partnership.js
// Guild Partnership System - EmpireBS
// Profesional, terstruktur, Component V2 + MongoDB

const { MongoClient } = require("mongodb");
const { ModalBuilder, TextInputBuilder, TextInputStyle, ActionRowBuilder } = require("discord.js");

// ─── CONFIG ──────────────────────────────────────────────────────────────────
const MONGO_URI = "mongodb+srv://AeroX:AeroX@aerox.cgfxn4x.mongodb.net/?retryWrites=true&w=majority&appName=AeroX";
const DB_NAME   = "partnership_akira";

const CHANNEL = {
  DASHBOARD:       "1498934645096448010",
  SERVER_PARTNER:  "1498934926630850693",
  EVENTS:          "1502206484489175101",
  ADMIN_LOG:       "1352800131933802547",
};

const FORUM = {
  LOG_FORUM:       "1503130728278392853",
};

const ROLE = {
  PARTNER:   "1357693246268244209",
  STAFF:     "1352286232779948144",
};

const BOT_ID = "1447102808900898887";
const CATEGORY_ID = "1498933997005443082";
const PARTNER_CHANNEL_LIMIT = 3;

// ─── MONGODB CLIENT ───────────────────────────────────────────────────────────
let db = null;
async function getDB() {
  if (db) return db;
  const client = new MongoClient(MONGO_URI);
  await client.connect();
  db = client.db(DB_NAME);
  return db;
}

// ─── HELPERS ──────────────────────────────────────────────────────────────────
function generateLogId(userId) {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let rand = "";
  for (let i = 0; i < 8; i++) rand += chars[Math.floor(Math.random() * chars.length)];
  return `PARTNER-${userId}-${rand}`;
}

function parseSidebarColor(input) {
  if (!input) return 0x5865f2;
  const hex = input.replace("#", "");
  const parsed = parseInt(hex, 16);
  return isNaN(parsed) ? 0x5865f2 : parsed;
}

function formatDuration(ms) {
  const totalSeconds = Math.floor(ms / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  if (minutes > 0) return `${minutes}m ${seconds}s`;
  return `${seconds}s`;
}

function accountAgeDays(user) {
  const created = user.createdTimestamp;
  return Math.floor((Date.now() - created) / 86400000);
}

// ─── COMPONENT V2 BUILDERS ────────────────────────────────────────────────────
function makeV2(components, accentColor) {
  const container = { type: 17, components };
  if (accentColor !== undefined) container.accent_color = accentColor;
  return {
    flags: 32768,
    components: [container],
  };
}

const SEPARATOR = { type: 14 };
function text(content) { return { type: 10, content }; }

// ─── MODALS ───────────────────────────────────────────────────────────────────
function buildPartnerModal(useEmbed, type) {
  // type: 'open' | 'repost' | 'events'
  const modal = new ModalBuilder()
    .setTitle(
      type === "open"
        ? "Formulir Pengajuan Partnership"
        : type === "repost"
        ? "Formulir Re-Posting Partnership"
        : "Formulir Posting Events"
    )
    .setCustomId(`partner_modal_${type}_${useEmbed ? "yes" : "no"}`);

  const fields = [];

  // Field 1: Judul / Nama Server
  fields.push(
    new ActionRowBuilder().addComponents(
      new TextInputBuilder()
        .setCustomId("field_title")
        .setLabel("Judul / Nama Server")
        .setPlaceholder("Contoh: EmpireBS — Free Hosting Server")
        .setStyle(TextInputStyle.Short)
        .setRequired(true)
    )
  );

  // Field 2: Deskripsi
  fields.push(
    new ActionRowBuilder().addComponents(
      new TextInputBuilder()
        .setCustomId("field_desc")
        .setLabel("Deskripsi Server")
        .setPlaceholder("Tulis deskripsi lengkap server kamu di sini...")
        .setStyle(TextInputStyle.Paragraph)
        .setRequired(true)
    )
  );

  if (useEmbed) {
    // Field 3: Banner URL
    fields.push(
      new ActionRowBuilder().addComponents(
        new TextInputBuilder()
          .setCustomId("field_banner")
          .setLabel("Banner / Gambar (URL)")
          .setPlaceholder("https://cdn.discordapp.com/...")
          .setStyle(TextInputStyle.Short)
          .setRequired(true)
      )
    );

    // Field 4: Link Server
    fields.push(
      new ActionRowBuilder().addComponents(
        new TextInputBuilder()
          .setCustomId("field_link")
          .setLabel("Link Server")
          .setPlaceholder("https://discord.gg/xxxxxxx")
          .setStyle(TextInputStyle.Short)
          .setRequired(true)
      )
    );

    // Field 5: Sidebar Color
    fields.push(
      new ActionRowBuilder().addComponents(
        new TextInputBuilder()
          .setCustomId("field_color")
          .setLabel("Sidebar Color (Hex)")
          .setPlaceholder("Contoh: #FF0055 atau FF0055")
          .setStyle(TextInputStyle.Short)
          .setRequired(true)
      )
    );
  } else {
    // No embed: hanya 3 field
    fields.push(
      new ActionRowBuilder().addComponents(
        new TextInputBuilder()
          .setCustomId("field_link")
          .setLabel("Link Server")
          .setPlaceholder("https://discord.gg/xxxxxxx")
          .setStyle(TextInputStyle.Short)
          .setRequired(true)
      )
    );
  }

  modal.addComponents(...fields);
  return modal;
}

function buildRejectModal() {
  const modal = new ModalBuilder()
    .setTitle("Alasan Penolakan")
    .setCustomId("partner_reject_modal");
  modal.addComponents(
    new ActionRowBuilder().addComponents(
      new TextInputBuilder()
        .setCustomId("reject_reason")
        .setLabel("Alasan Penolakan (min. 10 kata)")
        .setPlaceholder("Tuliskan alasan penolakan dengan jelas dan sopan...")
        .setStyle(TextInputStyle.Paragraph)
        .setRequired(true)
        .setMinLength(40)
    )
  );
  return modal;
}

function buildEditModal(currentDesc) {
  const modal = new ModalBuilder()
    .setTitle("Edit Pesan Partnership")
    .setCustomId("partner_edit_modal");
  modal.addComponents(
    new ActionRowBuilder().addComponents(
      new TextInputBuilder()
        .setCustomId("edit_desc")
        .setLabel("Deskripsi Baru")
        .setPlaceholder("Edit deskripsi sesuai ketentuan...")
        .setStyle(TextInputStyle.Paragraph)
        .setRequired(true)
        .setValue(currentDesc || "")
    )
  );
  return modal;
}

// ─── MESSAGES ─────────────────────────────────────────────────────────────────
function msgDashboard() {
  return makeV2([
    text("## <:1_:1486297322848653425> Partnership Requirement<:00:1360567203325542431><:00:1360567203325542431><:00:1360567203325542431><:00:1360567203325542431>"),
    SEPARATOR,
    text("> - Member dan Staff server aktif\n> - Tidak mengandung konten NSFW.\n> - Tiada minimal jumlah member server.\n> - Gunakan channels partner bukan forum.\n> - Tidak menerima server khusus berjualan.\n> - Bebas dari konflik dengan komunitas lain."),
    SEPARATOR,
    {
      type: 1,
      components: [
        {
          type: 3,
          custom_id: "partner_select_menu",
          min_values: 1,
          max_values: 1,
          options: [
            { label: "Open Partnership", value: "open_partnership", emoji: { name: "🔍" } },
            { label: "Posting Events",   value: "posting_events",   emoji: { name: "📥" } },
            { label: "Re-Posting Partner", value: "reposting_partner", emoji: { name: "🔃" } },
            { label: "List Partnership", value: "list_partnership", emoji: { name: "📜" } },
          ],
        },
      ],
    },
    SEPARATOR,
    text("-# © Guild Partnership - EmpireBS"),
  ]);
}

function msgOpenPartnership() {
  return makeV2([
    text("## 🔍 Pengajuan Partnership"),
    SEPARATOR,
    text("> - Pencet tombol **Open Tiket** di bawah dan pilih Request Partner\n> - Antri dan tertib tunggu diproses sesuai urutan, mohon bersabar\n> - Dilarang spam pesan berulang atau mention, demi kenyamanan"),
    SEPARATOR,
    {
      type: 1,
      components: [
        { type: 2, style: 5, label: "Open Ticket", emoji: { name: "📫" }, url: "https://discord.com/channels/1347233781391560837/1498935151441219584" },
        { type: 2, style: 3, label: " Benefit",          emoji: { name: "🎀" }, custom_id: "partner_benefit" },
        { type: 2, style: 1, label: "Ketentuan Partner", emoji: { name: "📋" }, custom_id: "partner_ketentuan" },
      ],
    },
    SEPARATOR,
    text("-# © Guild Partnership - EmpireBS"),
  ]);
}

function msgPostingEvents(useEmbedState) {
  // useEmbedState: true = Yes selected (Yes disabled), false = No selected (No disabled)
  // At start: Yes disabled, No enabled → useEmbedState = true (Yes is active choice)
  return makeV2([
    text("## 📥 Posting Events"),
    SEPARATOR,
    text("### Ketentuan Events: <:00:1360567203325542431><:00:1360567203325542431><:00:1360567203325542431><:00:1360567203325542431><:00:1360567203325542431><:00:1360567203325542431><:00:1360567203325542431><:00:1360567203325542431><:00:1360567203325542431><:00:1360567203325542431><:00:1360567203325542431><:00:1360567203325542431><:00:1360567203325542431><:00:1360567203325542431>\n> - Wajib gunakan mention khusus yang tersedia.\n> - Postingan ditinjau admin sebelum dipublikasikan.\n> - Admin berhak menyesuaikan teks sesuai ketentuan.\n### Prosedur:\n> - Pilih Yes/No untuk memakai embed atau tidak.\n> - Klik tombol di bawah dan lengkapi detail acara anda."),
    SEPARATOR,
    {
      type: 1,
      components: [
        { type: 2, style: 1, label: "Isi Formulir Disini", emoji: { name: "📩" }, custom_id: "partner_form_events" },
        { type: 2, style: 3, label: "Yes", custom_id: "partner_events_yes", disabled: useEmbedState === true },
        { type: 2, style: 4, label: "No",  custom_id: "partner_events_no",  disabled: useEmbedState === false },
      ],
    },
    SEPARATOR,
    text("-# © Guild Partnership - EmpireBS"),
  ]);
}

function msgRepostingPartner(useEmbedState) {
  return makeV2([
    text("## 🔃 Re-Posting Partnership"),
    SEPARATOR,
    text("### Ketentuan Utama:<:00:1360567203325542431><:00:1360567203325542431><:00:1360567203325542431><:00:1360567203325542431><:00:1360567203325542431><:00:1360567203325542431><:00:1360567203325542431><:00:1360567203325542431><:00:1360567203325542431><:00:1360567203325542431><:00:1360567203325542431><:00:1360567203325542431><:00:1360567203325542431><:00:1360567203325542431>\n> - Cooldown 1 minggu sekali.\n> - Saling memposting ulang deskripsi.\n> - Gunakan mention khusus yang tersedia.\n### Prosedur:\n> - Pilih Yes/No untuk memakai embed atau tidak.\n> - Postingan ditinjau admin sebelum dipublikasikan.\n> - Admin berhak menyesuaikan teks sesuai ketentuan.\n> - Klik tombol di bawah dan lengkapi data server anda."),
    SEPARATOR,
    {
      type: 1,
      components: [
        { type: 2, style: 1, label: "Isi Formulir Disini", emoji: { name: "📩" }, custom_id: "partner_form_repost" },
        { type: 2, style: 3, label: "Yes", custom_id: "partner_repost_yes", disabled: useEmbedState === true },
        { type: 2, style: 4, label: "No",  custom_id: "partner_repost_no",  disabled: useEmbedState === false },
      ],
    },
    SEPARATOR,
    text("-# © Guild Partnership - EmpireBS"),
  ]);
}

function msgKetentuan() {
  return makeV2([
    text("## 📋 Ketentuan Partnership"),
    SEPARATOR,
    text("> -  Perwakilan staff wajib bergabung sebagai perwakilan. Saling post event bersifat timbal balik.\n\n> - Gunakan tiket untuk pengajuan event. Dilarang menggunakan mention everyone tanpa izin.\n\n> - Wajib memposting deskripsi/event server kami. Kelalaian dalam posting dapat mengakibatkan pemutusan kerja sama.\n\n> - Perwakilan dilarang keluar server tanpa koordinasi. Jika perwakilan keluar tanpa alasan, partner akan diputus.\n\n> - Admin berhak mengedit konten postingan dan memutus kerja sama jika melanggar ketentuan di atas."),
    SEPARATOR,
    text("-# © Guild Partnership - EmpireBS"),
  ]);
}

function msgBenefit() {
  return makeV2([
    text("## 🎀 Benefit Partnership <:00:1360567203325542431><:00:1360567203325542431><:00:1360567203325542431><:00:1360567203325542431><:00:1360567203325542431><:00:1360567203325542431><:00:1360567203325542431><:00:1360567203325542431><:00:1360567203325542431>"),
    SEPARATOR,
    text("> - Relasi: Membangun koneksi antar-server secara resmi\n\n> - Promosi Event: Kesempatan membagikan event Anda\n\n> - Kolaborasi: Mengadakan proyek bersama EmpireBS\n\n> - Role Eksklusif: Mendapatkan role khusus Partnership"),
    SEPARATOR,
    text("-# © Guild Partnership - EmpireBS"),
  ]);
}

function msgAlreadyPartner() {
  return makeV2([
    text("## Kamu Sudah Berpartnership"),
    SEPARATOR,
    text("Kamu sudah memiliki role Partnership. Untuk pengajuan baru tidak diperlukan, namun kamu tetap bisa menggunakan fitur **Posting Events** dan **Re-Posting Partnership**."),
    SEPARATOR,
    text("-# © Guild Partnership - EmpireBS"),
  ]);
}

function msgNeedPartner() {
  return makeV2([
    text("## Berpartnership Terlebih dahulu"),
    SEPARATOR,
    text("Kamu belum memiliki role Partnership. Silakan lakukan pengajuan melalui menu **Open Partnership** terlebih dahulu sebelum menggunakan fitur ini."),
    SEPARATOR,
    text("-# © Guild Partnership - EmpireBS"),
  ]);
}

function msgNotStaff() {
  return makeV2([
    text("## ⚠️ Akses Terbatas"),
    SEPARATOR,
    text("Maaf, perintah `!partner` hanya dapat digunakan oleh **Staff** yang memiliki role yang sesuai. Jika kamu merasa ini adalah kesalahan, silakan hubungi admin server."),
    SEPARATOR,
    text("-# © Guild Partnership - EmpireBS"),
  ]);
}

function msgPartnerLimit() {
  return makeV2([
    text("## ⚠️ Batas Penggunaan Tercapai"),
    SEPARATOR,
    text("Kamu telah mencapai batas maksimal **3 kali** penggunaan perintah `!partner` di channel ini. Setiap channel hanya diperbolehkan 3 kali pengiriman formulir partnership.\n\nUntuk informasi lebih lanjut, silakan hubungi admin server."),
    SEPARATOR,
    text("-# © Guild Partnership - EmpireBS"),
  ]);
}

function msgGuildForm() {
  return makeV2([
    text("## ✉️ Pengajuan Partnership"),
    SEPARATOR,
    text("> Click dibawah ini untuk isi deskripsi server kamu\n\n**Note:** Pilih Yes/No untuk menggunakan embed atau tidak."),
    SEPARATOR,
    {
      type: 1,
      components: [
        { type: 2, style: 1, label: "Isi Formulir Disini", emoji: { name: "📩" }, custom_id: "partner_form_open" },
        { type: 2, style: 3, label: "Yes", custom_id: "partner_open_yes", disabled: true },
        { type: 2, style: 4, label: "No",  custom_id: "partner_open_no",  disabled: false },
      ],
    },
    SEPARATOR,
    text("-# © Guild Partnership - EmpireBS"),
  ]);
}

function msgDMNotifikasi() {
  return makeV2([
    text("## 🔈 Notifikasi DM"),
    SEPARATOR,
    text("Saat pilih tombol **Iya Pake** bot <@1364585069812912148> akan kirim DM notifikasi.\n> postingan events sudah kekirim di <#1502206484489175101>\n\nNote: Saat ini tombol **Tidak Pake**, (nnti sesuaikan ya, kalo pencet tombol yes nnti berubah jadi, \"Saat ini tombol **Iya Pake**\")"),
    SEPARATOR,
    {
      type: 1,
      components: [
        { type: 2, style: 3, label: "Iya Pake",   custom_id: "partner_dm_yes", disabled: false },
        { type: 2, style: 4, label: "Tidak Pake", custom_id: "partner_dm_no",  disabled: true  },
      ],
    },
    SEPARATOR,
    text("-# © Guild Partnership - EmpireBS"),
  ]);
}

// Admin review message (sent to staff channel for review)
function msgAdminReview(data) {
  // data: { title, desc, banner, link, color, senderTag, senderId, useEmbed, type }
  const components = [
    text(data.useEmbed ? `# ${data.title}` : `# ${data.title}\n`),
    SEPARATOR,
    text(data.desc),
    SEPARATOR,
  ];

  if (data.useEmbed && data.banner) {
    components.push({ type: 12, items: [{ media: { url: data.banner } }] });
    components.push(SEPARATOR);
  }

  components.push({
    type: 1,
    components: [
      { type: 2, style: 3, label: "Accept",     custom_id: `partner_accept_${data.type}_${data.senderId}_${data.logId}` },
      { type: 2, style: 4, label: "Reject",     custom_id: `partner_reject_${data.type}_${data.senderId}_${data.logId}` },
      { type: 2, style: 1, label: "Edit Pesan", custom_id: `partner_edit_${data.type}_${data.senderId}_${data.logId}` },
      { type: 2, style: 2, label: data.senderTag, custom_id: `partner_info_${data.senderId}`, disabled: true },
    ],
  });

  components.push(SEPARATOR);
  components.push(text("-# © Guild Partnership - EmpireBS"));

  const msg = makeV2(components, data.useEmbed ? parseSidebarColor(data.color) : undefined);
  return msg;
}

// Final published message (no embed version)
function msgPublishNoEmbed(data) {
  return {
    content: data.desc,
  };
}

// Final published message (embed version) - sent to partner/events channel
function msgPublishEmbed(data) {
  const components = [
    text(`# ${data.title}`),
    SEPARATOR,
    text(data.desc),
    SEPARATOR,
    { type: 12, items: [{ media: { url: data.banner } }] },
    SEPARATOR,
    text("-# © Guild Partnership - EmpireBS"),
  ];

  const msg = makeV2(components, parseSidebarColor(data.color));

  // Additional link annotation
  return [msg, { content: `-# [.](${data.link})` }];
}

// List Partnership paginated
function msgListPartnership(partners, page, totalPages, totalCount, lastUpdated) {
  const ITEMS_PER_PAGE = 10;
  const start = page * ITEMS_PER_PAGE;
  const slice = partners.slice(start, start + ITEMS_PER_PAGE);

  let listContent = "";
  slice.forEach((p, i) => {
    const num = start + i + 1;
    listContent += `**${num}.** <@${p.userId}>\n-# <:00:1360567203325542431>Server Link: [${p.serverName}](${p.serverLink})\n`;
  });

  if (!listContent) listContent = "*Belum ada partnership terdaftar.*";

  const pageLabel = `${page + 1}/${totalPages || 1}`;

  return makeV2([
    text("## 📜 List Partnership"),
    SEPARATOR,
    {
      type: 9,
      components: [text(listContent.trim())],
      accessory: { type: 2, style: 2, custom_id: "partner_search", label: "Search" },
    },
    SEPARATOR,
    text(`-# Terakhir diperbarui: <t:${Math.floor((lastUpdated || Date.now()) / 1000)}:R> • Total partnership: ${totalCount}`),
    {
      type: 1,
      components: [
        { type: 2, style: 2, custom_id: `partner_list_first_${page}`,    label: "◀◀" },
        { type: 2, style: 2, custom_id: `partner_list_prev_${page}`,     label: "◀" },
        { type: 2, style: 2, custom_id: `partner_list_page_${page}`,     label: pageLabel, disabled: true },
        { type: 2, style: 2, custom_id: `partner_list_next_${page}`,     label: "▶" },
        { type: 2, style: 2, custom_id: `partner_list_last_${page}`,     label: "▶▶" },
      ],
    },
    SEPARATOR,
    text("-# © Guild Partnership - EmpireBS"),
  ]);
}

// Log forum post content
function msgForumLog(data, actionType) {
  // actionType: 'open' | 'repost' | 'events'
  const title =
    actionType === "open"   ? "Success Partnership" :
    actionType === "repost" ? "Success Re-Posting Partnership" :
                              "Success Events Posts";

  const ageDays = accountAgeDays(data.user);
  const duration = formatDuration(data.duration);
  const now = Math.floor(Date.now() / 1000);

  const securityExtra =
    actionType === "open" || actionType === "repost"
      ? `> **System:** Component V2 + MongoDB`
      : `> **Nama Server:** ${data.serverName || data.title}`;

  const detailExtra =
    actionType === "open"
      ? `> **Pesan Partner:** [Go To Messages](https://discord.com/channels/1347233781391560837/1498934926630850693/${data.messageId})`
      : `> **Pesan Partner:** [Go To Messages](https://discord.com/channels/1347233781391560837/1502206484489175101/${data.messageId})`;

  return makeV2([
    text(`## ✅ <@${data.user.id}> ${title}`),
    SEPARATOR,
    text(`**👤 Informasi User**\n> **Username:** [${data.user.username}](https://discord.com/users/${data.user.id})\n> **ID:** \`${data.user.id}\`\n> **Display Name:** ${data.user.displayName || data.user.username}\n> **Akun Dibuat:** <t:${Math.floor(data.user.createdTimestamp / 1000)}:R> (${ageDays} hari)`),
    SEPARATOR,
    text(`**📊 Detail Verifikasi**\n> **Waktu Selesai:** <t:${now}:f>\n> **Total Durasi:** ${duration}\n> **Accept Partner:** [${data.acceptorUsername}](https://discord.com/users/${data.acceptorId})\n${detailExtra}\n> **Link Server:** ${data.serverLink}`),
    SEPARATOR,
    text(`**🛡️ Security Info**\n> **Status:** ${data.hasRole ? "Yes" : "No"} (user yg Berpartner sudah di kasih role id <@&${ROLE.PARTNER}>)\n> **Edit Pesan:** ${data.wasEdited ? "Yes" : "No"}\n> **Boost:** ${data.isBoosting ? "Yes" : "No"}\n${securityExtra}`),
    SEPARATOR,
    text(`\n-# Log ID: ${data.logId}`),
  ]);
}

// DM notification after accept
function msgDMAccepted(data) {
  const now = Math.floor(Date.now() / 1000);
  const duration = formatDuration(data.duration);
  return makeV2([
    {
      type: 9,
      components: [text("## <:1_:1486297322848653425> Notifikasi DM")],
      accessory: {
        type: 2, style: 5, label: "Messages",
        url: `https://discord.com/channels/1347233781391560837/${data.channelId}/${data.messageId}`,
      },
    },
    SEPARATOR,
    text(`Postingan Events kamu sudah kekirim di <#${data.channelId}>\nDi Accept oleh: <@${data.acceptorId}>`),
    SEPARATOR,
    text(`-# © Guild Partnership - EmpireBS <t:${now}:R>`),
  ]);
}

// ─── STATE STORE (in-memory for embed toggle) ─────────────────────────────────
// Map<userId, { useEmbed: bool, type: string, messageId: string }>
const embedStateStore = new Map();

// Map<channelId, Map<userId, count>>
const channelUseCount = new Map();

// ─── MAIN HANDLER ─────────────────────────────────────────────────────────────
async function handlePartnership(interaction) {
  if (!interaction.guild) return false;

  const id = interaction.customId;

  // ── Select Menu ──────────────────────────────────────────────────────────────
  if (interaction.isStringSelectMenu() && id === "partner_select_menu") {
    const val = interaction.values[0];
    const hasPartnerRole = interaction.member.roles.cache.has(ROLE.PARTNER);

    if (val === "open_partnership") {
      if (hasPartnerRole) {
        return interaction.reply({ ...msgAlreadyPartner(), ephemeral: true });
      }
      return interaction.reply({ ...msgOpenPartnership(), ephemeral: true });
    }

    if (val === "posting_events") {
      if (!hasPartnerRole) {
        return interaction.reply({ ...msgNeedPartner(), ephemeral: true });
      }
      embedStateStore.set(`events_${interaction.user.id}`, true);
      return interaction.reply({ ...msgPostingEvents(true), ephemeral: true });
    }

    if (val === "reposting_partner") {
      if (!hasPartnerRole) {
        return interaction.reply({ ...msgNeedPartner(), ephemeral: true });
      }
      embedStateStore.set(`repost_${interaction.user.id}`, true);
      return interaction.reply({ ...msgRepostingPartner(true), ephemeral: true });
    }

    if (val === "list_partnership") {
      return handleListPartnership(interaction, 0);
    }

    return false;
  }

  // ── Ketentuan ─────────────────────────────────────────────────────────────────
  if (interaction.isButton() && id === "partner_ketentuan") {
    return interaction.reply({ ...msgKetentuan(), ephemeral: true });
  }

  // ── Benefit ───────────────────────────────────────────────────────────────────
  if (interaction.isButton() && id === "partner_benefit") {
    return interaction.reply({ ...msgBenefit(), ephemeral: true });
  }

  // ── Yes/No Toggle for Events ──────────────────────────────────────────────────
  if (interaction.isButton() && id === "partner_events_yes") {
    embedStateStore.set(`events_${interaction.user.id}`, true);
    return interaction.update(msgPostingEvents(true));
  }
  if (interaction.isButton() && id === "partner_events_no") {
    embedStateStore.set(`events_${interaction.user.id}`, false);
    return interaction.update(msgPostingEvents(false));
  }

  // ── Yes/No Toggle for Repost ──────────────────────────────────────────────────
  if (interaction.isButton() && id === "partner_repost_yes") {
    embedStateStore.set(`repost_${interaction.user.id}`, true);
    return interaction.update(msgRepostingPartner(true));
  }
  if (interaction.isButton() && id === "partner_repost_no") {
    embedStateStore.set(`repost_${interaction.user.id}`, false);
    return interaction.update(msgRepostingPartner(false));
  }

  // ── Yes/No Toggle for Open Partner (guild form) ───────────────────────────────
  if (interaction.isButton() && id === "partner_open_yes") {
    embedStateStore.set(`open_${interaction.user.id}`, true);
    // Update: Yes disabled, No enabled
    return interaction.update(makeV2([
      text("## ✉️ Pengajuan Partnership"),
      SEPARATOR,
      text("> Click dibawah ini untuk isi deskripsi server kamu\n\n**Note:** Pilih Yes/No untuk menggunakan embed atau tidak."),
      SEPARATOR,
      {
        type: 1,
        components: [
          { type: 2, style: 1, label: "Isi Formulir Disini", emoji: { name: "📩" }, custom_id: "partner_form_open" },
          { type: 2, style: 3, label: "Yes", custom_id: "partner_open_yes", disabled: true },
          { type: 2, style: 4, label: "No",  custom_id: "partner_open_no",  disabled: false },
        ],
      },
      SEPARATOR,
      text("-# © Guild Partnership - EmpireBS"),
    ]));
  }
  if (interaction.isButton() && id === "partner_open_no") {
    embedStateStore.set(`open_${interaction.user.id}`, false);
    return interaction.update(makeV2([
      text("## ✉️ Pengajuan Partnership"),
      SEPARATOR,
      text("> Click dibawah ini untuk isi deskripsi server kamu\n\n**Note:** Pilih Yes/No untuk menggunakan embed atau tidak."),
      SEPARATOR,
      {
        type: 1,
        components: [
          { type: 2, style: 1, label: "Isi Formulir Disini", emoji: { name: "📩" }, custom_id: "partner_form_open" },
          { type: 2, style: 3, label: "Yes", custom_id: "partner_open_yes", disabled: false },
          { type: 2, style: 4, label: "No",  custom_id: "partner_open_no",  disabled: true },
        ],
      },
      SEPARATOR,
      text("-# © Guild Partnership - EmpireBS"),
    ]));
  }

  // ── DM Notifikasi Toggle ──────────────────────────────────────────────────────
  if (interaction.isButton() && id === "partner_dm_yes") {
    return interaction.update(makeV2([
      text("## 🔈 Notifikasi DM"),
      SEPARATOR,
      text("Saat pilih tombol **Iya Pake** bot <@1364585069812912148> akan kirim DM notifikasi.\n> postingan events sudah kekirim di <#1502206484489175101>\n\nNote: Saat ini tombol **Iya Pake**"),
      SEPARATOR,
      {
        type: 1,
        components: [
          { type: 2, style: 3, label: "Iya Pake",   custom_id: "partner_dm_yes", disabled: true  },
          { type: 2, style: 4, label: "Tidak Pake", custom_id: "partner_dm_no",  disabled: false },
        ],
      },
      SEPARATOR,
      text("-# © Guild Partnership - EmpireBS"),
    ]));
  }
  if (interaction.isButton() && id === "partner_dm_no") {
    return interaction.update(msgDMNotifikasi());
  }

  // ── Open Form Modal: Open Partnership ─────────────────────────────────────────
  if (interaction.isButton() && id === "partner_form_open") {
    const useEmbed = embedStateStore.get(`open_${interaction.user.id}`) ?? true;
    return interaction.showModal(buildPartnerModal(useEmbed, "open"));
  }

  // ── Open Form Modal: Events ───────────────────────────────────────────────────
  if (interaction.isButton() && id === "partner_form_events") {
    const useEmbed = embedStateStore.get(`events_${interaction.user.id}`) ?? true;
    return interaction.showModal(buildPartnerModal(useEmbed, "events"));
  }

  // ── Open Form Modal: Repost ───────────────────────────────────────────────────
  if (interaction.isButton() && id === "partner_form_repost") {
    const useEmbed = embedStateStore.get(`repost_${interaction.user.id}`) ?? true;
    return interaction.showModal(buildPartnerModal(useEmbed, "repost"));
  }

  // ── Modal Submits ─────────────────────────────────────────────────────────────
  if (interaction.isModalSubmit() && id.startsWith("partner_modal_")) {
    return handleFormSubmit(interaction);
  }

  // ── Admin: Accept ─────────────────────────────────────────────────────────────
  if (interaction.isButton() && id.startsWith("partner_accept_")) {
    return handleAccept(interaction);
  }

  // ── Admin: Reject ─────────────────────────────────────────────────────────────
  if (interaction.isButton() && id.startsWith("partner_reject_")) {
    // First open modal for reason
    return interaction.showModal(buildRejectModal());
  }

  // ── Admin: Reject Modal Submit ────────────────────────────────────────────────
  if (interaction.isModalSubmit() && id === "partner_reject_modal") {
    return handleRejectModal(interaction);
  }

  // ── Admin: Edit Pesan ─────────────────────────────────────────────────────────
  if (interaction.isButton() && id.startsWith("partner_edit_")) {
    const db2 = await getDB();
    const parts = id.split("_");
    // format: partner_edit_{type}_{userId}_{logId}
    const logId = parts[parts.length - 1];
    const pending = await db2.collection("pending").findOne({ logId });
    return interaction.showModal(buildEditModal(pending?.desc || ""));
  }

  // ── Admin: Edit Modal Submit ──────────────────────────────────────────────────
  if (interaction.isModalSubmit() && id === "partner_edit_modal") {
    return handleEditModal(interaction);
  }

  // ── List Pagination ───────────────────────────────────────────────────────────
  if (interaction.isButton() && id.startsWith("partner_list_")) {
    return handleListPagination(interaction);
  }

  return false;
}

// ─── FORM SUBMIT HANDLER ──────────────────────────────────────────────────────
async function handleFormSubmit(interaction) {
  await interaction.deferReply({ ephemeral: true });

  const parts = interaction.customId.split("_");
  // partner_modal_{type}_{embed}
  const type     = parts[2]; // open | events | repost
  const useEmbed = parts[3] === "yes";

  const title  = interaction.fields.getTextInputValue("field_title");
  const desc   = interaction.fields.getTextInputValue("field_desc");
  const link   = interaction.fields.getTextInputValue("field_link");
  const banner = useEmbed ? interaction.fields.getTextInputValue("field_banner") : null;
  const color  = useEmbed ? interaction.fields.getTextInputValue("field_color")  : null;

  const logId    = generateLogId(interaction.user.id);
  const startTime = Date.now();

  const db2 = await getDB();
  await db2.collection("pending").insertOne({
    logId,
    type,
    useEmbed,
    title,
    desc,
    link,
    banner,
    color,
    senderId:    interaction.user.id,
    senderTag:   interaction.user.username,
    guildId:     interaction.guildId,
    startTime,
    wasEdited:   false,
    dmNotif:     false,
  });

  // Determine review channel
  const reviewChannelId =
    type === "events" ? CHANNEL.EVENTS :
    CHANNEL.SERVER_PARTNER; // for open + repost, staff reviews in partner channel

  const reviewChannel = await interaction.client.channels.fetch(reviewChannelId).catch(() => null);
  if (!reviewChannel) {
    return interaction.editReply({ content: "❌ Channel review tidak ditemukan. Hubungi admin.", ephemeral: true });
  }

  const reviewData = {
    title,
    desc,
    banner,
    link,
    color,
    senderTag:   interaction.user.username,
    senderId:    interaction.user.id,
    useEmbed,
    type,
    logId,
  };

  const reviewMsg = await reviewChannel.send(msgAdminReview(reviewData));

  // Store review message ID
  await db2.collection("pending").updateOne({ logId }, { $set: { reviewMessageId: reviewMsg.id, reviewChannelId } });

  // If events type: show DM Notif toggle to user
  if (type === "events") {
    await interaction.editReply({ ...msgDMNotifikasi(), ephemeral: true });
  } else {
    await interaction.editReply({ content: "✅ Formulir kamu sudah terkirim! Tunggu review dari admin.", ephemeral: true });
  }
}

// ─── ACCEPT HANDLER ───────────────────────────────────────────────────────────
async function handleAccept(interaction) {
  await interaction.deferReply({ ephemeral: true });

  const parts = interaction.customId.split("_");
  // partner_accept_{type}_{userId}_{logId}
  const type   = parts[2];
  const userId = parts[3];
  const logId  = parts[4];

  const db2 = await getDB();
  const pending = await db2.collection("pending").findOne({ logId });
  if (!pending) {
    return interaction.editReply({ content: "❌ Data tidak ditemukan atau sudah diproses.", ephemeral: true });
  }

  const guild   = interaction.guild;
  const member  = await guild.members.fetch(userId).catch(() => null);
  const duration = Date.now() - pending.startTime;

  // Give partner role if Open Partnership
  let hasRole = member?.roles.cache.has(ROLE.PARTNER) || false;
  if (type === "open" && member && !hasRole) {
    await member.roles.add(ROLE.PARTNER).catch(console.error);
    hasRole = true;
  }

  const isBoosting = member?.premiumSince ? true : false;

  // Determine target channel
  const targetChannelId = type === "events" ? CHANNEL.EVENTS : CHANNEL.SERVER_PARTNER;
  const targetChannel   = await interaction.client.channels.fetch(targetChannelId).catch(() => null);

  let publishedMsgId = null;
  if (targetChannel) {
    if (pending.useEmbed) {
      const [mainMsg, linkMsg] = msgPublishEmbed(pending);
      const sent = await targetChannel.send(mainMsg);
      await targetChannel.send(linkMsg);
      publishedMsgId = sent.id;
    } else {
      const sent = await targetChannel.send(msgPublishNoEmbed(pending));
      publishedMsgId = sent.id;
    }

    // If repost: delete previous message for this user
    if (type === "repost") {
      const prevRecord = await db2.collection("published").findOne({ senderId: userId, type: "repost" });
      if (prevRecord) {
        const prevMsg = await targetChannel.messages.fetch(prevRecord.messageId).catch(() => null);
        if (prevMsg) await prevMsg.delete().catch(console.error);
      }
    }
  }

  // Save to published collection
  await db2.collection("published").updateOne(
    { senderId: userId, type },
    { $set: { senderId: userId, type, messageId: publishedMsgId, serverName: pending.title, serverLink: pending.link, timestamp: Date.now() } },
    { upsert: true }
  );

  // Update partners list if open
  if (type === "open") {
    await db2.collection("partners").updateOne(
      { userId },
      { $set: { userId, serverName: pending.title, serverLink: pending.link, addedAt: Date.now() } },
      { upsert: true }
    );
  }

  // Create/update forum log
  await handleForumLog({
    client: interaction.client,
    user: member?.user || { id: userId, username: pending.senderTag, createdTimestamp: Date.now(), displayName: pending.senderTag },
    type,
    logId,
    duration,
    acceptorUsername: interaction.user.username,
    acceptorId: interaction.user.id,
    serverLink: pending.link,
    serverName: pending.title,
    hasRole,
    isBoosting,
    wasEdited: pending.wasEdited,
    messageId: publishedMsgId,
    channelId: targetChannelId,
  });

  // Send DM if events and user opted in
  if (type === "events" && pending.dmNotif) {
    const dmUser = await interaction.client.users.fetch(userId).catch(() => null);
    if (dmUser) {
      await dmUser.send(msgDMAccepted({
        channelId: targetChannelId,
        messageId: publishedMsgId,
        acceptorId: interaction.user.id,
        duration,
      })).catch(console.error);
    }
  }

  // Delete pending record
  await db2.collection("pending").deleteOne({ logId });

  // Disable review message buttons
  const reviewChannel = await interaction.client.channels.fetch(pending.reviewChannelId).catch(() => null);
  if (reviewChannel && pending.reviewMessageId) {
    const reviewMsg = await reviewChannel.messages.fetch(pending.reviewMessageId).catch(() => null);
    if (reviewMsg) {
      await reviewMsg.edit({ components: [] }).catch(console.error);
    }
  }

  return interaction.editReply({ content: `✅ Berhasil di-accept! Postingan sudah terkirim ke <#${targetChannelId}>.`, ephemeral: true });
}

// ─── REJECT MODAL HANDLER ─────────────────────────────────────────────────────
async function handleRejectModal(interaction) {
  await interaction.deferReply({ ephemeral: true });

  const reason = interaction.fields.getTextInputValue("reject_reason");

  // Find logId from the message this modal was triggered from
  // We store pending logId in the button customId, but modal doesn't carry it
  // So we use the message reference stored per-user
  // (Better: store in DB keyed by interactionId - let's use a simpler approach:
  //  embed the logId into the reject button and retrieve it from the message)
  // For now, find the most recent pending for this guild
  const db2 = await getDB();
  // We'll rely on the message's embed having no logId readily accessible here.
  // The best approach: store current "active action" per acceptor in memory
  // (Since reject modal is triggered per-interaction, we match by guild + recent)
  const pending = rejectContextStore.get(interaction.user.id);
  if (!pending) {
    return interaction.editReply({ content: "❌ Tidak ada pengajuan yang sedang diproses.", ephemeral: true });
  }
  rejectContextStore.delete(interaction.user.id);

  const userId = pending.userId;

  // Send DM to the submitter
  const dmUser = await interaction.client.users.fetch(userId).catch(() => null);
  if (dmUser) {
    await dmUser.send(makeV2([
      text("## ❌ Pengajuan Ditolak"),
      SEPARATOR,
      text(`Pengajuan **${pending.type === "events" ? "Posting Events" : pending.type === "repost" ? "Re-Posting Partnership" : "Partnership"}** kamu telah ditolak.\n\n**Alasan:**\n> ${reason}`),
      SEPARATOR,
      text("-# © Guild Partnership - EmpireBS"),
    ])).catch(console.error);
  }

  // Delete pending record
  await db2.collection("pending").deleteOne({ logId: pending.logId });

  // Disable review message buttons
  const reviewChannel = await interaction.client.channels.fetch(pending.reviewChannelId).catch(() => null);
  if (reviewChannel && pending.reviewMessageId) {
    const reviewMsg = await reviewChannel.messages.fetch(pending.reviewMessageId).catch(() => null);
    if (reviewMsg) await reviewMsg.edit({ components: [] }).catch(console.error);
  }

  return interaction.editReply({ content: "✅ Pengajuan berhasil ditolak dan notifikasi sudah dikirim ke user.", ephemeral: true });
}

// ─── REJECT CONTEXT STORE ─────────────────────────────────────────────────────
// Map<adminUserId, pending record>
const rejectContextStore = new Map();

// Override reject button to store context before showing modal
async function handleRejectButton(interaction) {
  const parts = interaction.customId.split("_");
  const type   = parts[2];
  const userId = parts[3];
  const logId  = parts[4];

  const db2 = await getDB();
  const pending = await db2.collection("pending").findOne({ logId });
  if (!pending) {
    return interaction.reply({ content: "❌ Data tidak ditemukan.", ephemeral: true });
  }
  rejectContextStore.set(interaction.user.id, { ...pending, userId, type, logId });
  return interaction.showModal(buildRejectModal());
}

// ─── EDIT MODAL HANDLER ───────────────────────────────────────────────────────
async function handleEditModal(interaction) {
  await interaction.deferReply({ ephemeral: true });
  const newDesc = interaction.fields.getTextInputValue("edit_desc");

  const editCtx = editContextStore.get(interaction.user.id);
  if (!editCtx) {
    return interaction.editReply({ content: "❌ Konteks edit tidak ditemukan.", ephemeral: true });
  }
  editContextStore.delete(interaction.user.id);

  const db2 = await getDB();
  await db2.collection("pending").updateOne(
    { logId: editCtx.logId },
    { $set: { desc: newDesc, wasEdited: true } }
  );

  // Update review message
  const reviewChannel = await interaction.client.channels.fetch(editCtx.reviewChannelId).catch(() => null);
  if (reviewChannel && editCtx.reviewMessageId) {
    const reviewMsg = await reviewChannel.messages.fetch(editCtx.reviewMessageId).catch(() => null);
    if (reviewMsg) {
      const updatedData = { ...editCtx, desc: newDesc };
      await reviewMsg.edit(msgAdminReview(updatedData)).catch(console.error);
    }
  }

  return interaction.editReply({ content: "✅ Pesan berhasil diedit.", ephemeral: true });
}

const editContextStore = new Map();

// ─── FORUM LOG HANDLER ────────────────────────────────────────────────────────
async function handleForumLog(data) {
  // data: { client, user, type, logId, duration, acceptorUsername, acceptorId,
  //         serverLink, serverName, hasRole, isBoosting, wasEdited, messageId, channelId }
  try {
    const forumChannel = await data.client.channels.fetch(FORUM.LOG_FORUM).catch(() => null);
    if (!forumChannel) return;

    const forumTitle = `1) ${data.serverName}`;

    // Check if thread already exists for this server
    const threads = await forumChannel.threads.fetchActive();
    let thread = threads.threads.find(t => t.name === forumTitle);

    const logMsg = msgForumLog(data, data.type);

    if (data.type === "open") {
      // Create new forum thread
      if (!thread) {
        thread = await forumChannel.threads.create({
          name: forumTitle,
          message: logMsg,
        });
      } else {
        await thread.send(logMsg);
      }
    } else {
      // events or repost: find existing thread and post there
      if (!thread) {
        // Also check archived threads
        const archived = await forumChannel.threads.fetchArchived();
        thread = archived.threads.find(t => t.name === forumTitle);
      }

      if (thread) {
        if (data.type === "repost") {
          // Delete the previous post in this thread (first message after starter)
          const db2 = await getDB();
          const prevThread = await db2.collection("forumPosts").findOne({ serverName: data.serverName, type: "repost" });
          if (prevThread) {
            const prevMsg = await thread.messages.fetch(prevThread.msgId).catch(() => null);
            if (prevMsg) await prevMsg.delete().catch(console.error);
          }
        }
        const sent = await thread.send(logMsg);
        const db2 = await getDB();
        await db2.collection("forumPosts").updateOne(
          { serverName: data.serverName, type: data.type },
          { $set: { serverName: data.serverName, type: data.type, msgId: sent.id, threadId: thread.id } },
          { upsert: true }
        );
      }
    }
  } catch (err) {
    console.error("❌ Forum log error:", err);
  }
}

// ─── LIST PARTNERSHIP PAGINATION ─────────────────────────────────────────────
async function handleListPartnership(interaction, page) {
  await interaction.deferReply({ ephemeral: true });

  const db2 = await getDB();
  const partners = await db2.collection("partners").find({}).toArray();
  const totalCount = partners.length;
  const ITEMS_PER_PAGE = 10;
  const totalPages = Math.max(1, Math.ceil(totalCount / ITEMS_PER_PAGE));
  const lastUpdated = Date.now();

  return interaction.editReply(msgListPartnership(partners, page, totalPages, totalCount, lastUpdated));
}

async function handleListPagination(interaction) {
  const parts = interaction.customId.split("_");
  // partner_list_{action}_{currentPage}
  const action      = parts[2]; // first | prev | page | next | last
  const currentPage = parseInt(parts[3]) || 0;

  const db2 = await getDB();
  const partners = await db2.collection("partners").find({}).toArray();
  const ITEMS_PER_PAGE = 10;
  const totalPages = Math.max(1, Math.ceil(partners.length / ITEMS_PER_PAGE));

  let newPage = currentPage;
  if (action === "first") {
    // ◀◀: go back 5 pages, wrap around
    newPage = currentPage - 5;
    if (newPage < 0) {
      newPage = currentPage === 0 ? totalPages - 1 : Math.max(0, currentPage - 5);
      if (currentPage === 0) newPage = totalPages - 1;
    }
  } else if (action === "prev") {
    newPage = currentPage <= 0 ? totalPages - 1 : currentPage - 1;
  } else if (action === "next") {
    newPage = currentPage >= totalPages - 1 ? 0 : currentPage + 1;
  } else if (action === "last") {
    // ▶▶: go forward 5 pages, wrap around
    newPage = currentPage + 5;
    if (newPage >= totalPages) {
      newPage = currentPage === totalPages - 1 ? 0 : Math.min(totalPages - 1, currentPage + 5);
      if (currentPage === totalPages - 1) newPage = 0;
    }
  }

  const lastUpdated = Date.now();
  return interaction.update(msgListPartnership(partners, newPage, totalPages, partners.length, lastUpdated));
}

// ─── !partner COMMAND (in channel under category) ────────────────────────────
async function handlePartnerCommand(message) {
  // Only in channels under CATEGORY_ID created by BOT_ID
  if (!message.guild) return false;
  if (message.content.toLowerCase() !== "!partner") return false;

  const channel = message.channel;
  if (!channel.parentId || channel.parentId !== CATEGORY_ID) return false;

  // Check if channel was created by bot
  // (We check if channel name starts with "partner-" or we just trust the category)
  // Role check: only STAFF role
  if (!message.member.roles.cache.has(ROLE.STAFF)) {
    await message.reply(msgNotStaff());
    return true;
  }

  // Count usage per channel per user
  if (!channelUseCount.has(channel.id)) channelUseCount.set(channel.id, new Map());
  const chMap = channelUseCount.get(channel.id);
  const count  = chMap.get(message.author.id) || 0;

  if (count >= PARTNER_CHANNEL_LIMIT) {
    await message.reply(msgPartnerLimit());
    return true;
  }

  chMap.set(message.author.id, count + 1);

  await message.reply(msgGuildForm());
  return true;
}

// ─── SEND DASHBOARD ───────────────────────────────────────────────────────────
async function sendDashboard(client) {
  try {
    const channel = await client.channels.fetch(CHANNEL.DASHBOARD);
    if (!channel) return;
    await channel.send(msgDashboard());
    console.log("✅ Partnership Dashboard terkirim.");
  } catch (err) {
    console.error("❌ Gagal kirim dashboard partnership:", err);
  }
}

// ─── MAIN EXPORT ──────────────────────────────────────────────────────────────
module.exports = {
  /**
   * Attach all partnership event listeners to the client.
   * Call this in events/ready.js: partnershipModule(client);
   */
  init(client) {
    // Hook into messageCreate for !partner command
    client.on("messageCreate", async (message) => {
      if (message.author.bot || !message.guild) return;
      try { await handlePartnerCommand(message); } catch (err) { console.error("❌ !partner error:", err); }
    });

    console.log("✅ Partnership Module Active");
  },

  /**
   * Handle interactionCreate — call this from your interactionCreate handler.
   * Returns true if the interaction was handled by this module.
   */
  async handleInteraction(interaction) {
    // Intercept reject button before showing modal (need to store context)
    if (interaction.isButton() && interaction.customId.startsWith("partner_reject_") &&
        !interaction.customId.startsWith("partner_reject_modal")) {
      try { await handleRejectButton(interaction); return true; } catch (err) { console.error("❌ Reject btn error:", err); return true; }
    }

    // Intercept edit button before showing modal (need to store context)
    if (interaction.isButton() && interaction.customId.startsWith("partner_edit_")) {
      try {
        const parts = interaction.customId.split("_");
        const logId = parts[parts.length - 1];
        const db2 = await getDB();
        const pending = await db2.collection("pending").findOne({ logId });
        if (pending) {
          editContextStore.set(interaction.user.id, pending);
        }
        await interaction.showModal(buildEditModal(pending?.desc || ""));
        return true;
      } catch (err) { console.error("❌ Edit btn error:", err); return true; }
    }

    try {
      const handled = await handlePartnership(interaction);
      return handled !== false;
    } catch (err) {
      console.error("❌ Partnership interaction error:", err);
      if (!interaction.replied && !interaction.deferred) {
        await interaction.reply({ content: "❌ Terjadi kesalahan. Coba lagi.", ephemeral: true }).catch(() => {});
      }
      return true;
    }
  },

  sendDashboard,
};
