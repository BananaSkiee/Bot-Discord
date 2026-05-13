// modules/partnership.js
// Guild Partnership System - EmpireBS
// Component V2 + MongoDB | Fixed: defer-first, exports, pagination

const { MongoClient } = require("mongodb");
const { ModalBuilder, TextInputBuilder, TextInputStyle, ActionRowBuilder } = require("discord.js");

// ─── CONFIG ───────────────────────────────────────────────────────────────────
const MONGO_URI = "mongodb+srv://AeroX:AeroX@aerox.cgfxn4x.mongodb.net/?retryWrites=true&w=majority&appName=AeroX";
const DB_NAME   = "partnership_akira";

const CHANNEL = {
  DASHBOARD:      "1498934645096448010",
  SERVER_PARTNER: "1498934926630850693",
  EVENTS:         "1502206484489175101",
};

const FORUM = {
  LOG_FORUM: "1503130728278392853",
};

const ROLE = {
  PARTNER: "1357693246268244209",
  STAFF:   "1352286232779948144",
};

const CATEGORY_ID          = "1498933997005443082";
const PARTNER_CHANNEL_LIMIT = 3;
const ITEMS_PER_PAGE        = 10;

// ─── MONGODB ──────────────────────────────────────────────────────────────────
let _db = null;
async function getDB() {
  if (_db) return _db;
  const client = new MongoClient(MONGO_URI);
  await client.connect();
  _db = client.db(DB_NAME);
  return _db;
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
  const parsed = parseInt(input.replace("#", ""), 16);
  return isNaN(parsed) ? 0x5865f2 : parsed;
}

function formatDuration(ms) {
  const s = Math.floor(ms / 1000);
  const m = Math.floor(s / 60);
  return m > 0 ? `${m}m ${s % 60}s` : `${s}s`;
}

function accountAgeDays(user) {
  return Math.floor((Date.now() - user.createdTimestamp) / 86400000);
}

// ─── COMPONENT V2 BUILDER ─────────────────────────────────────────────────────
function makeV2(components, accentColor) {
  const container = { type: 17, components };
  if (accentColor !== undefined) container.accent_color = accentColor;
  return { flags: 32768, components: [container] };
}

const SEP = { type: 14 };
const txt = (content) => ({ type: 10, content });

// ─── MESSAGE BUILDERS ─────────────────────────────────────────────────────────
function msgDashboard() {
  return makeV2([
    txt("## <:1_:1486297322848653425> Partnership Requirement<:00:1360567203325542431><:00:1360567203325542431><:00:1360567203325542431><:00:1360567203325542431>"),
    SEP,
    txt("> - Member dan Staff server aktif\n> - Tidak mengandung konten NSFW.\n> - Tiada minimal jumlah member server.\n> - Gunakan channels partner bukan forum.\n> - Tidak menerima server khusus berjualan.\n> - Bebas dari konflik dengan komunitas lain."),
    SEP,
    {
      type: 1,
      components: [{
        type: 3,
        custom_id: "partner_select_menu",
        min_values: 1,
        max_values: 1,
        options: [
          { label: "Open Partnership",   value: "open_partnership",   emoji: { name: "🔍" } },
          { label: "Posting Events",     value: "posting_events",     emoji: { name: "📥" } },
          { label: "Re-Posting Partner", value: "reposting_partner",  emoji: { name: "🔃" } },
          { label: "List Partnership",   value: "list_partnership",   emoji: { name: "📜" } },
        ],
      }],
    },
    SEP,
    txt("-# © Guild Partnership - EmpireBS"),
  ]);
}

function msgOpenPartnership() {
  return makeV2([
    txt("## 🔍 Pengajuan Partnership"),
    SEP,
    txt("> - Pencet tombol **Open Tiket** di bawah dan pilih Request Partner\n> - Antri dan tertib tunggu diproses sesuai urutan, mohon bersabar\n> - Dilarang spam pesan berulang atau mention, demi kenyamanan"),
    SEP,
    {
      type: 1,
      components: [
        { type: 2, style: 5, label: "Open Ticket", emoji: { name: "📫" }, url: "https://discord.com/channels/1347233781391560837/1498935151441219584" },
        { type: 2, style: 3, label: " Benefit",          emoji: { name: "🎀" }, custom_id: "partner_benefit" },
        { type: 2, style: 1, label: "Ketentuan Partner", emoji: { name: "📋" }, custom_id: "partner_ketentuan" },
      ],
    },
    SEP,
    txt("-# © Guild Partnership - EmpireBS"),
  ]);
}

function msgPostingEvents(useEmbed) {
  return makeV2([
    txt("## 📥 Posting Events"),
    SEP,
    txt("### Ketentuan Events: <:00:1360567203325542431><:00:1360567203325542431><:00:1360567203325542431><:00:1360567203325542431><:00:1360567203325542431><:00:1360567203325542431><:00:1360567203325542431><:00:1360567203325542431><:00:1360567203325542431><:00:1360567203325542431><:00:1360567203325542431><:00:1360567203325542431><:00:1360567203325542431><:00:1360567203325542431>\n> - Wajib gunakan mention khusus yang tersedia.\n> - Postingan ditinjau admin sebelum dipublikasikan.\n> - Admin berhak menyesuaikan teks sesuai ketentuan.\n### Prosedur:\n> - Pilih Yes/No untuk memakai embed atau tidak.\n> - Klik tombol di bawah dan lengkapi detail acara anda."),
    SEP,
    {
      type: 1,
      components: [
        { type: 2, style: 1, label: "Isi Formulir Disini", emoji: { name: "📩" }, custom_id: "partner_form_events" },
        { type: 2, style: 3, label: "Yes", custom_id: "partner_events_yes", disabled: useEmbed === true },
        { type: 2, style: 4, label: "No",  custom_id: "partner_events_no",  disabled: useEmbed === false },
      ],
    },
    SEP,
    txt("-# © Guild Partnership - EmpireBS"),
  ]);
}

function msgRepostingPartner(useEmbed) {
  return makeV2([
    txt("## 🔃 Re-Posting Partnership"),
    SEP,
    txt("### Ketentuan Utama:<:00:1360567203325542431><:00:1360567203325542431><:00:1360567203325542431><:00:1360567203325542431><:00:1360567203325542431><:00:1360567203325542431><:00:1360567203325542431><:00:1360567203325542431><:00:1360567203325542431><:00:1360567203325542431><:00:1360567203325542431><:00:1360567203325542431><:00:1360567203325542431><:00:1360567203325542431>\n> - Cooldown 1 minggu sekali.\n> - Saling memposting ulang deskripsi.\n> - Gunakan mention khusus yang tersedia.\n### Prosedur:\n> - Pilih Yes/No untuk memakai embed atau tidak.\n> - Postingan ditinjau admin sebelum dipublikasikan.\n> - Admin berhak menyesuaikan teks sesuai ketentuan.\n> - Klik tombol di bawah dan lengkapi data server anda."),
    SEP,
    {
      type: 1,
      components: [
        { type: 2, style: 1, label: "Isi Formulir Disini", emoji: { name: "📩" }, custom_id: "partner_form_repost" },
        { type: 2, style: 3, label: "Yes", custom_id: "partner_repost_yes", disabled: useEmbed === true },
        { type: 2, style: 4, label: "No",  custom_id: "partner_repost_no",  disabled: useEmbed === false },
      ],
    },
    SEP,
    txt("-# © Guild Partnership - EmpireBS"),
  ]);
}

function msgKetentuan() {
  return makeV2([
    txt("## 📋 Ketentuan Partnership"),
    SEP,
    txt("> -  Perwakilan staff wajib bergabung sebagai perwakilan. Saling post event bersifat timbal balik.\n\n> - Gunakan tiket untuk pengajuan event. Dilarang menggunakan mention everyone tanpa izin.\n\n> - Wajib memposting deskripsi/event server kami. Kelalaian dalam posting dapat mengakibatkan pemutusan kerja sama.\n\n> - Perwakilan dilarang keluar server tanpa koordinasi. Jika perwakilan keluar tanpa alasan, partner akan diputus.\n\n> - Admin berhak mengedit konten postingan dan memutus kerja sama jika melanggar ketentuan di atas."),
    SEP,
    txt("-# © Guild Partnership - EmpireBS"),
  ]);
}

function msgBenefit() {
  return makeV2([
    txt("## 🎀 Benefit Partnership <:00:1360567203325542431><:00:1360567203325542431><:00:1360567203325542431><:00:1360567203325542431><:00:1360567203325542431><:00:1360567203325542431><:00:1360567203325542431><:00:1360567203325542431><:00:1360567203325542431>"),
    SEP,
    txt("> - Relasi: Membangun koneksi antar-server secara resmi\n\n> - Promosi Event: Kesempatan membagikan event Anda\n\n> - Kolaborasi: Mengadakan proyek bersama EmpireBS\n\n> - Role Eksklusif: Mendapatkan role khusus Partnership"),
    SEP,
    txt("-# © Guild Partnership - EmpireBS"),
  ]);
}

function msgAlreadyPartner() {
  return makeV2([
    txt("## Kamu Sudah Berpartnership"),
    SEP,
    txt("Kamu sudah memiliki role Partnership. Untuk pengajuan baru tidak diperlukan, namun kamu tetap bisa menggunakan fitur **Posting Events** dan **Re-Posting Partnership**."),
    SEP,
    txt("-# © Guild Partnership - EmpireBS"),
  ]);
}

function msgNeedPartner() {
  return makeV2([
    txt("## Berpartnership Terlebih dahulu"),
    SEP,
    txt("Kamu belum memiliki role Partnership. Silakan lakukan pengajuan melalui menu **Open Partnership** terlebih dahulu sebelum menggunakan fitur ini."),
    SEP,
    txt("-# © Guild Partnership - EmpireBS"),
  ]);
}

function msgNotStaff() {
  return makeV2([
    txt("## ⚠️ Akses Terbatas"),
    SEP,
    txt("Maaf, perintah `!partner` hanya dapat digunakan oleh **Staff** yang memiliki role yang sesuai. Jika kamu merasa ini adalah kesalahan, silakan hubungi admin server."),
    SEP,
    txt("-# © Guild Partnership - EmpireBS"),
  ]);
}

function msgPartnerLimit() {
  return makeV2([
    txt("## ⚠️ Batas Penggunaan Tercapai"),
    SEP,
    txt("Kamu telah mencapai batas maksimal **3 kali** penggunaan perintah `!partner` di channel ini. Setiap channel hanya diperbolehkan 3 kali pengiriman formulir partnership.\n\nUntuk informasi lebih lanjut, silakan hubungi admin server."),
    SEP,
    txt("-# © Guild Partnership - EmpireBS"),
  ]);
}

function msgGuildForm(useEmbed) {
  const yesDisabled = useEmbed !== false;
  const noDisabled  = useEmbed === false;
  return makeV2([
    txt("## ✉️ Pengajuan Partnership"),
    SEP,
    txt("> Click dibawah ini untuk isi deskripsi server kamu\n\n**Note:** Pilih Yes/No untuk menggunakan embed atau tidak."),
    SEP,
    {
      type: 1,
      components: [
        { type: 2, style: 1, label: "Isi Formulir Disini", emoji: { name: "📩" }, custom_id: "partner_form_open" },
        { type: 2, style: 3, label: "Yes", custom_id: "partner_open_yes", disabled: yesDisabled },
        { type: 2, style: 4, label: "No",  custom_id: "partner_open_no",  disabled: noDisabled },
      ],
    },
    SEP,
    txt("-# © Guild Partnership - EmpireBS"),
  ]);
}

function msgDMNotifikasi(dmActive) {
  const note = dmActive
    ? "Saat ini tombol **Iya Pake**"
    : "Saat ini tombol **Tidak Pake**, (nnti sesuaikan ya, kalo pencet tombol yes nnti berubah jadi, \"Saat ini tombol **Iya Pake**\")";
  return makeV2([
    txt("## 🔈 Notifikasi DM"),
    SEP,
    txt(`Saat pilih tombol **Iya Pake** bot <@1364585069812912148> akan kirim DM notifikasi.\n> postingan events sudah kekirim di <#${CHANNEL.EVENTS}>\n\nNote: ${note}`),
    SEP,
    {
      type: 1,
      components: [
        { type: 2, style: 3, label: "Iya Pake",   custom_id: "partner_dm_yes", disabled: dmActive === true },
        { type: 2, style: 4, label: "Tidak Pake", custom_id: "partner_dm_no",  disabled: dmActive === false },
      ],
    },
    SEP,
    txt("-# © Guild Partnership - EmpireBS"),
  ]);
}

function msgAdminReview(data) {
  const components = [
    txt(data.useEmbed ? `# ${data.title}` : `# ${data.title}`),
    SEP,
    txt(data.desc),
    SEP,
  ];
  if (data.useEmbed && data.banner) {
    components.push({ type: 12, items: [{ media: { url: data.banner } }] });
    components.push(SEP);
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
  components.push(SEP);
  components.push(txt("-# © Guild Partnership - EmpireBS"));
  return makeV2(components, data.useEmbed ? parseSidebarColor(data.color) : undefined);
}

function msgPublishNoEmbed(data) {
  return { content: data.desc };
}

function msgPublishEmbed(data) {
  const msg = makeV2([
    txt(`# ${data.title}`),
    SEP,
    txt(data.desc),
    SEP,
    { type: 12, items: [{ media: { url: data.banner } }] },
    SEP,
    txt("-# © Guild Partnership - EmpireBS"),
  ], parseSidebarColor(data.color));
  return [msg, { content: `-# [.](${data.link})` }];
}

function msgListPartnership(partners, page, totalPages, totalCount, lastUpdated) {
  const start = page * ITEMS_PER_PAGE;
  const slice = partners.slice(start, start + ITEMS_PER_PAGE);
  let listContent = slice.map((p, i) =>
    `**${start + i + 1}.** <@${p.userId}>\n-# <:00:1360567203325542431>Server Link: [${p.serverName}](${p.serverLink})`
  ).join("\n");
  if (!listContent) listContent = "*Belum ada partnership terdaftar.*";

  const pageLabel = `${page + 1}/${totalPages || 1}`;
  const ts = Math.floor((lastUpdated || Date.now()) / 1000);

  return makeV2([
    txt("## 📜 List Partnership"),
    SEP,
    {
      type: 9,
      components: [txt(listContent)],
      accessory: { type: 2, style: 2, custom_id: "partner_search", label: "Search" },
    },
    SEP,
    txt(`-# Terakhir diperbarui: <t:${ts}:R> • Total partnership: ${totalCount}`),
    {
      type: 1,
      components: [
        { type: 2, style: 2, custom_id: `partner_list_first_${page}`, label: "◀◀" },
        { type: 2, style: 2, custom_id: `partner_list_prev_${page}`,  label: "◀" },
        { type: 2, style: 2, custom_id: `partner_list_page_${page}`,  label: pageLabel, disabled: true },
        { type: 2, style: 2, custom_id: `partner_list_next_${page}`,  label: "▶" },
        { type: 2, style: 2, custom_id: `partner_list_last_${page}`,  label: "▶▶" },
      ],
    },
    SEP,
    txt("-# © Guild Partnership - EmpireBS"),
  ]);
}

function msgForumLog(data, actionType) {
  const title =
    actionType === "open"   ? "Success Partnership" :
    actionType === "repost" ? "Success Re-Posting Partnership" :
                              "Success Events Posts";
  const ageDays  = accountAgeDays(data.user);
  const duration = formatDuration(data.duration);
  const now      = Math.floor(Date.now() / 1000);

  const detailLink = actionType === "events"
    ? `https://discord.com/channels/1347233781391560837/${CHANNEL.EVENTS}/${data.messageId}`
    : `https://discord.com/channels/1347233781391560837/${CHANNEL.SERVER_PARTNER}/${data.messageId}`;

  const securityExtra = (actionType === "open")
    ? `> **System:** Component V2 + MongoDB`
    : `> **Nama Server:** ${data.serverName || data.title}`;

  return makeV2([
    txt(`## ✅ <@${data.user.id}> ${title}`),
    SEP,
    txt(`**👤 Informasi User**\n> **Username:** [${data.user.username}](https://discord.com/users/${data.user.id})\n> **ID:** \`${data.user.id}\`\n> **Display Name:** ${data.user.displayName || data.user.username}\n> **Akun Dibuat:** <t:${Math.floor(data.user.createdTimestamp / 1000)}:R> (${ageDays} hari)`),
    SEP,
    txt(`**📊 Detail Verifikasi**\n> **Waktu Selesai:** <t:${now}:f>\n> **Total Durasi:** ${duration}\n> **Accept Partner:** [${data.acceptorUsername}](https://discord.com/users/${data.acceptorId})\n> **Pesan Partner:** [Go To Messages](${detailLink})\n> **Link Server:** ${data.serverLink}`),
    SEP,
    txt(`**🛡️ Security Info**\n> **Status:** ${data.hasRole ? "Yes" : "No"} (user yg Berpartner sudah di kasih role id <@&${ROLE.PARTNER}>)\n> **Edit Pesan:** ${data.wasEdited ? "Yes" : "No"}\n> **Boost:** ${data.isBoosting ? "Yes" : "No"}\n${securityExtra}`),
    SEP,
    txt(`\n-# Log ID: ${data.logId}`),
  ]);
}

function msgDMAccepted(data) {
  const now = Math.floor(Date.now() / 1000);
  return makeV2([
    {
      type: 9,
      components: [txt("## <:1_:1486297322848653425> Notifikasi DM")],
      accessory: {
        type: 2, style: 5, label: "Messages",
        url: `https://discord.com/channels/1347233781391560837/${data.channelId}/${data.messageId}`,
      },
    },
    SEP,
    txt(`Postingan Events kamu sudah kekirim di <#${data.channelId}>\nDi Accept oleh: <@${data.acceptorId}>`),
    SEP,
    txt(`-# © Guild Partnership - EmpireBS <t:${now}:R>`),
  ]);
}

// ─── IN-MEMORY STATE ──────────────────────────────────────────────────────────
const embedState      = new Map();
const rejectCtx       = new Map();
const editCtx         = new Map();
const channelUseCount = new Map();

// ─── MODALS ───────────────────────────────────────────────────────────────────
function buildPartnerModal(useEmbed, type) {
  const titles = { open: "Formulir Pengajuan Partnership", repost: "Formulir Re-Posting Partnership", events: "Formulir Posting Events" };
  const modal = new ModalBuilder()
    .setTitle(titles[type] || "Formulir Partnership")
    .setCustomId(`partner_modal_${type}_${useEmbed ? "yes" : "no"}`);

  const rows = [
    new ActionRowBuilder().addComponents(
      new TextInputBuilder().setCustomId("field_title").setLabel("Judul / Nama Server")
        .setPlaceholder("Contoh: EmpireBS — Free Hosting Server")
        .setStyle(TextInputStyle.Short).setRequired(true)
    ),
    new ActionRowBuilder().addComponents(
      new TextInputBuilder().setCustomId("field_desc").setLabel("Deskripsi Server")
        .setPlaceholder("Tulis deskripsi lengkap server kamu di sini...")
        .setStyle(TextInputStyle.Paragraph).setRequired(true)
    ),
  ];

  if (useEmbed) {
    rows.push(
      new ActionRowBuilder().addComponents(
        new TextInputBuilder().setCustomId("field_banner").setLabel("Banner / Gambar (URL)")
          .setPlaceholder("https://cdn.discordapp.com/...")
          .setStyle(TextInputStyle.Short).setRequired(true)
      ),
      new ActionRowBuilder().addComponents(
        new TextInputBuilder().setCustomId("field_link").setLabel("Link Server")
          .setPlaceholder("https://discord.gg/xxxxxxx")
          .setStyle(TextInputStyle.Short).setRequired(true)
      ),
      new ActionRowBuilder().addComponents(
        new TextInputBuilder().setCustomId("field_color").setLabel("Sidebar Color (Hex)")
          .setPlaceholder("Contoh: #FF0055 atau FF0055")
          .setStyle(TextInputStyle.Short).setRequired(true)
      )
    );
  } else {
    rows.push(
      new ActionRowBuilder().addComponents(
        new TextInputBuilder().setCustomId("field_link").setLabel("Link Server")
          .setPlaceholder("https://discord.gg/xxxxxxx")
          .setStyle(TextInputStyle.Short).setRequired(true)
      )
    );
  }

  modal.addComponents(...rows);
  return modal;
}

function buildRejectModal() {
  const modal = new ModalBuilder().setTitle("Alasan Penolakan").setCustomId("partner_reject_modal");
  modal.addComponents(
    new ActionRowBuilder().addComponents(
      new TextInputBuilder().setCustomId("reject_reason").setLabel("Alasan Penolakan (min. 10 kata)")
        .setPlaceholder("Tuliskan alasan penolakan dengan jelas dan sopan...")
        .setStyle(TextInputStyle.Paragraph).setRequired(true).setMinLength(40)
    )
  );
  return modal;
}

function buildEditModal(currentDesc) {
  const modal = new ModalBuilder().setTitle("Edit Pesan Partnership").setCustomId("partner_edit_modal");
  modal.addComponents(
    new ActionRowBuilder().addComponents(
      new TextInputBuilder().setCustomId("edit_desc").setLabel("Deskripsi Baru")
        .setPlaceholder("Edit deskripsi sesuai ketentuan...")
        .setStyle(TextInputStyle.Paragraph).setRequired(true)
        .setValue(currentDesc || "")
    )
  );
  return modal;
}

// ─── AUTO DEFER ───────────────────────────────────────────────────────────────
async function autoDefer(interaction, id) {
  // never defer modals
  if (interaction.isModalSubmit()) return;

  // buttons that show modal → no defer
  if (interaction.isButton()) {
    if (id === "partner_form_open" || id === "partner_form_events" || id === "partner_form_repost") return;
    if (id.startsWith("partner_reject_") && !id.includes("modal")) return;
    if (id.startsWith("partner_edit_") && !id.includes("modal")) return;

    // toggle embed/dm → update
    if (id.endsWith("_yes") || id.endsWith("_no")) return interaction.deferUpdate();

    // list / search / info → update
    if (id.startsWith("partner_list_") || id === "partner_search" || id.startsWith("partner_info_")) {
      return interaction.deferUpdate();
    }

    // all other buttons (benefit, ketentuan, accept, etc.) → ephemeral reply
    return interaction.deferReply({ flags: 64 });
  }

  // select menu → ephemeral reply
  if (interaction.isStringSelectMenu()) {
    return interaction.deferReply({ flags: 64 });
  }
}

// ─── INTERACTION HANDLER ──────────────────────────────────────────────────────
async function handleInteraction(interaction) {
  if (!interaction.guild) return false;
  const id = interaction.customId;
  if (!id || !id.startsWith("partner_")) return false;

  try {
    await autoDefer(interaction, id);

    if (interaction.isStringSelectMenu()) {
      return handleSelectMenu(interaction);
    }
    if (interaction.isButton()) {
      return handleButton(interaction);
    }
    if (interaction.isModalSubmit()) {
      return handleModalSubmit(interaction);
    }
    return false;
  } catch (err) {
    console.error("❌ Partnership interaction error:", err);
    try {
      if (!interaction.replied && !interaction.deferred) {
        await interaction.reply({ content: "❌ Terjadi kesalahan. Coba lagi.", flags: 64 });
      } else {
        await interaction.followUp({ content: "❌ Terjadi kesalahan. Coba lagi.", flags: 64 });
      }
    } catch (e) {
      console.error("Gagal kirim error reply:", e.message);
    }
    return true;
  }
}

// ─── SELECT MENU ──────────────────────────────────────────────────────────────
async function handleSelectMenu(interaction) {
  const val          = interaction.values[0];
  const hasPartnerRole = interaction.member.roles.cache.has(ROLE.PARTNER);

  if (val === "open_partnership") {
    if (hasPartnerRole) return interaction.editReply(msgAlreadyPartner());
    return interaction.editReply(msgOpenPartnership());
  }
  if (val === "posting_events") {
    if (!hasPartnerRole) return interaction.editReply(msgNeedPartner());
    embedState.set(`events_${interaction.user.id}`, true);
    return interaction.editReply(msgPostingEvents(true));
  }
  if (val === "reposting_partner") {
    if (!hasPartnerRole) return interaction.editReply(msgNeedPartner());
    embedState.set(`repost_${interaction.user.id}`, true);
    return interaction.editReply(msgRepostingPartner(true));
  }
  if (val === "list_partnership") {
    const db2       = await getDB();
    const partners  = await db2.collection("partners").find({}).toArray();
    const totalPages = Math.max(1, Math.ceil(partners.length / ITEMS_PER_PAGE));
    return interaction.editReply(msgListPartnership(partners, 0, totalPages, partners.length, Date.now()));
  }
}

// ─── BUTTON HANDLER ───────────────────────────────────────────────────────────
async function handleButton(interaction) {
  const id = interaction.customId;

  // ── Show Modals ──────────────────────────────────────────────────────────
  if (id === "partner_form_open" || id === "partner_form_events" || id === "partner_form_repost") {
    const typeMap = { partner_form_open: "open", partner_form_events: "events", partner_form_repost: "repost" };
    const type    = typeMap[id];
    const key     = `${type}_${interaction.user.id}`;
    const use     = embedState.get(key) ?? true;
    return interaction.showModal(buildPartnerModal(use, type));
  }

  if (id.startsWith("partner_reject_") && !id.includes("modal")) {
    const parts   = id.split("_");
    const logId   = parts[parts.length - 1];
    const db2     = await getDB();
    const pending = await db2.collection("pending").findOne({ logId });
    if (!pending) return interaction.reply({ content: "❌ Data tidak ditemukan.", flags: 64 });
    rejectCtx.set(interaction.user.id, pending);
    return interaction.showModal(buildRejectModal());
  }

  if (id.startsWith("partner_edit_") && !id.includes("modal")) {
    const parts   = id.split("_");
    const logId   = parts[parts.length - 1];
    const db2     = await getDB();
    const pending = await db2.collection("pending").findOne({ logId });
    if (pending) editCtx.set(interaction.user.id, pending);
    return interaction.showModal(buildEditModal(pending?.desc || ""));
  }

  // ── Toggle Embed / DM ────────────────────────────────────────────────────
  if (id === "partner_events_yes") {
    embedState.set(`events_${interaction.user.id}`, true);
    return interaction.update(msgPostingEvents(true));
  }
  if (id === "partner_events_no") {
    embedState.set(`events_${interaction.user.id}`, false);
    return interaction.update(msgPostingEvents(false));
  }
  if (id === "partner_repost_yes") {
    embedState.set(`repost_${interaction.user.id}`, true);
    return interaction.update(msgRepostingPartner(true));
  }
  if (id === "partner_repost_no") {
    embedState.set(`repost_${interaction.user.id}`, false);
    return interaction.update(msgRepostingPartner(false));
  }
  if (id === "partner_open_yes") {
    embedState.set(`open_${interaction.user.id}`, true);
    return interaction.update(msgGuildForm(true));
  }
  if (id === "partner_open_no") {
    embedState.set(`open_${interaction.user.id}`, false);
    return interaction.update(msgGuildForm(false));
  }
  if (id === "partner_dm_yes") {
    return interaction.update(msgDMNotifikasi(true));
  }
  if (id === "partner_dm_no") {
    return interaction.update(msgDMNotifikasi(false));
  }

  // ── List Pagination ──────────────────────────────────────────────────────
  if (id.startsWith("partner_list_")) {
    return handleListPagination(interaction);
  }

  // ── Static Info / Disabled Buttons ───────────────────────────────────────
  if (id === "partner_search" || id.startsWith("partner_info_")) {
    return interaction.deferUpdate(); // already deferred, just ack
  }

  // ── Ephemeral Message Buttons (ketentuan, benefit, accept) ───────────────
  if (id === "partner_ketentuan") {
    return interaction.editReply(msgKetentuan());
  }
  if (id === "partner_benefit") {
    return interaction.editReply(msgBenefit());
  }
  if (id.startsWith("partner_accept_")) {
    return handleAccept(interaction);
  }

  // Fallback
  return interaction.editReply({ content: "❌ Perintah tidak dikenali." });
}

// ─── LIST PAGINATION ──────────────────────────────────────────────────────────
async function handleListPagination(interaction) {
  const parts       = interaction.customId.split("_");
  const action      = parts[2]; // first | prev | page | next | last
  const currentPage = parseInt(parts[3]) || 0;

  const db2        = await getDB();
  const partners   = await db2.collection("partners").find({}).toArray();
  const totalPages = Math.max(1, Math.ceil(partners.length / ITEMS_PER_PAGE));

  let newPage = currentPage;
  if (action === "prev") {
    newPage = currentPage <= 0 ? totalPages - 1 : currentPage - 1;
  } else if (action === "next") {
    newPage = currentPage >= totalPages - 1 ? 0 : currentPage + 1;
  } else if (action === "first") {
    if (currentPage === 0) {
      newPage = totalPages - 1;
    } else {
      newPage = Math.max(0, currentPage - 5);
    }
  } else if (action === "last") {
    if (currentPage === totalPages - 1) {
      newPage = 0;
    } else {
      newPage = Math.min(totalPages - 1, currentPage + 5);
    }
  }

  return interaction.editReply(msgListPartnership(partners, newPage, totalPages, partners.length, Date.now()));
}

// ─── MODAL SUBMITS ────────────────────────────────────────────────────────────
async function handleModalSubmit(interaction) {
  const id = interaction.customId;
  if (id.startsWith("partner_modal_")) {
    await interaction.deferReply({ flags: 64 });
    return handleFormSubmit(interaction);
  }
  if (id === "partner_reject_modal") {
    await interaction.deferReply({ flags: 64 });
    return handleRejectModal(interaction);
  }
  if (id === "partner_edit_modal") {
    await interaction.deferReply({ flags: 64 });
    return handleEditModal(interaction);
  }
}

// ─── FORM SUBMIT ──────────────────────────────────────────────────────────────
async function handleFormSubmit(interaction) {
  const parts    = interaction.customId.split("_"); // partner_modal_{type}_{embed}
  const type     = parts[2];
  const useEmbed = parts[3] === "yes";

  const title  = interaction.fields.getTextInputValue("field_title");
  const desc   = interaction.fields.getTextInputValue("field_desc");
  const link   = interaction.fields.getTextInputValue("field_link");
  const banner = useEmbed ? interaction.fields.getTextInputValue("field_banner") : null;
  const color  = useEmbed ? interaction.fields.getTextInputValue("field_color")  : null;

  const logId     = generateLogId(interaction.user.id);
  const startTime = Date.now();

  const db2 = await getDB();
  await db2.collection("pending").insertOne({
    logId, type, useEmbed, title, desc, link, banner, color,
    senderId:   interaction.user.id,
    senderTag:  interaction.user.username,
    guildId:    interaction.guildId,
    startTime,
    wasEdited:  false,
    dmNotif:    false,
  });

  const reviewChannelId = type === "events" ? CHANNEL.EVENTS : CHANNEL.SERVER_PARTNER;
  const reviewChannel   = await interaction.client.channels.fetch(reviewChannelId).catch(() => null);
  if (!reviewChannel) {
    return interaction.editReply({ content: "❌ Channel review tidak ditemukan. Hubungi admin." });
  }

  const reviewMsg = await reviewChannel.send(msgAdminReview({
    title, desc, banner, link, color,
    senderTag: interaction.user.username,
    senderId:  interaction.user.id,
    useEmbed, type, logId,
  }));

  await db2.collection("pending").updateOne(
    { logId },
    { $set: { reviewMessageId: reviewMsg.id, reviewChannelId } }
  );

  if (type === "events") {
    return interaction.editReply(msgDMNotifikasi(false));
  }
  return interaction.editReply({ content: "✅ Formulir kamu sudah terkirim! Tunggu review dari admin." });
}

// ─── ACCEPT ───────────────────────────────────────────────────────────────────
async function handleAccept(interaction) {
  const parts  = interaction.customId.split("_"); // partner_accept_{type}_{userId}_{logId}
  const type   = parts[2];
  const userId = parts[3];
  const logId  = parts[4];

  const db2     = await getDB();
  const pending = await db2.collection("pending").findOne({ logId });
  if (!pending) return interaction.editReply({ content: "❌ Data tidak ditemukan atau sudah diproses." });

  const guild    = interaction.guild;
  const member   = await guild.members.fetch(userId).catch(() => null);
  const duration = Date.now() - pending.startTime;

  let hasRole = member?.roles.cache.has(ROLE.PARTNER) || false;
  if (type === "open" && member && !hasRole) {
    await member.roles.add(ROLE.PARTNER).catch(console.error);
    hasRole = true;
  }

  const isBoosting      = !!member?.premiumSince;
  const targetChannelId = type === "events" ? CHANNEL.EVENTS : CHANNEL.SERVER_PARTNER;
  const targetChannel   = await interaction.client.channels.fetch(targetChannelId).catch(() => null);

  let publishedMsgId = null;
  if (targetChannel) {
    if (type === "repost") {
      const prev = await db2.collection("published").findOne({ senderId: userId, type: "repost" });
      if (prev?.messageId) {
        const old = await targetChannel.messages.fetch(prev.messageId).catch(() => null);
        if (old) await old.delete().catch(console.error);
      }
    }

    if (pending.useEmbed) {
      const [mainMsg, linkMsg] = msgPublishEmbed(pending);
      const sent = await targetChannel.send(mainMsg);
      await targetChannel.send(linkMsg);
      publishedMsgId = sent.id;
    } else {
      const sent = await targetChannel.send(msgPublishNoEmbed(pending));
      publishedMsgId = sent.id;
    }
  }

  await db2.collection("published").updateOne(
    { senderId: userId, type },
    { $set: { senderId: userId, type, messageId: publishedMsgId, serverName: pending.title, serverLink: pending.link, timestamp: Date.now() } },
    { upsert: true }
  );

  if (type === "open") {
    await db2.collection("partners").updateOne(
      { userId },
      { $set: { userId, serverName: pending.title, serverLink: pending.link, addedAt: Date.now() } },
      { upsert: true }
    );
  }

  await handleForumLog({
    client:           interaction.client,
    user:             member?.user || { id: userId, username: pending.senderTag, createdTimestamp: Date.now(), displayName: pending.senderTag },
    type, logId, duration,
    acceptorUsername: interaction.user.username,
    acceptorId:       interaction.user.id,
    serverLink:       pending.link,
    serverName:       pending.title,
    hasRole, isBoosting,
    wasEdited:        pending.wasEdited,
    messageId:        publishedMsgId,
    channelId:        targetChannelId,
  });

  if (type === "events" && pending.dmNotif) {
    const dmUser = await interaction.client.users.fetch(userId).catch(() => null);
    if (dmUser) await dmUser.send(msgDMAccepted({ channelId: targetChannelId, messageId: publishedMsgId, acceptorId: interaction.user.id, duration })).catch(console.error);
  }

  await db2.collection("pending").deleteOne({ logId });

  // Disable review message buttons
  const revCh = await interaction.client.channels.fetch(pending.reviewChannelId).catch(() => null);
  if (revCh && pending.reviewMessageId) {
    const revMsg = await revCh.messages.fetch(pending.reviewMessageId).catch(() => null);
    if (revMsg) await revMsg.edit({ components: [] }).catch(console.error);
  }

  return interaction.editReply({ content: `✅ Berhasil di-accept! Postingan sudah terkirim ke <#${targetChannelId}>.` });
}

// ─── REJECT MODAL ─────────────────────────────────────────────────────────────
async function handleRejectModal(interaction) {
  const reason  = interaction.fields.getTextInputValue("reject_reason");
  const pending = rejectCtx.get(interaction.user.id);
  if (!pending) return interaction.editReply({ content: "❌ Tidak ada pengajuan yang sedang diproses." });
  rejectCtx.delete(interaction.user.id);

  const dmUser = await interaction.client.users.fetch(pending.senderId).catch(() => null);
  if (dmUser) {
    await dmUser.send(makeV2([
      txt("## ❌ Pengajuan Ditolak"),
      SEP,
      txt(`Pengajuan **${pending.type === "events" ? "Posting Events" : pending.type === "repost" ? "Re-Posting Partnership" : "Partnership"}** kamu telah ditolak.\n\n**Alasan:**\n> ${reason}`),
      SEP,
      txt("-# © Guild Partnership - EmpireBS"),
    ])).catch(console.error);
  }

  const db2 = await getDB();
  await db2.collection("pending").deleteOne({ logId: pending.logId });

  const revCh = await interaction.client.channels.fetch(pending.reviewChannelId).catch(() => null);
  if (revCh && pending.reviewMessageId) {
    const revMsg = await revCh.messages.fetch(pending.reviewMessageId).catch(() => null);
    if (revMsg) await revMsg.edit({ components: [] }).catch(console.error);
  }

  return interaction.editReply({ content: "✅ Pengajuan berhasil ditolak dan notifikasi sudah dikirim ke user." });
}

// ─── EDIT MODAL ───────────────────────────────────────────────────────────────
async function handleEditModal(interaction) {
  const newDesc = interaction.fields.getTextInputValue("edit_desc");
  const ctx     = editCtx.get(interaction.user.id);
  if (!ctx) return interaction.editReply({ content: "❌ Konteks edit tidak ditemukan." });
  editCtx.delete(interaction.user.id);

  const db2 = await getDB();
  await db2.collection("pending").updateOne({ logId: ctx.logId }, { $set: { desc: newDesc, wasEdited: true } });

  const revCh = await interaction.client.channels.fetch(ctx.reviewChannelId).catch(() => null);
  if (revCh && ctx.reviewMessageId) {
    const revMsg = await revCh.messages.fetch(ctx.reviewMessageId).catch(() => null);
    if (revMsg) await revMsg.edit(msgAdminReview({ ...ctx, desc: newDesc })).catch(console.error);
  }

  return interaction.editReply({ content: "✅ Pesan berhasil diedit." });
}

// ─── FORUM LOG ────────────────────────────────────────────────────────────────
async function handleForumLog(data) {
  try {
    const forumChannel = await data.client.channels.fetch(FORUM.LOG_FORUM).catch(() => null);
    if (!forumChannel) return;

    const forumTitle = `1) ${data.serverName}`;
    const logMsg     = msgForumLog(data, data.type);

    const active   = await forumChannel.threads.fetchActive();
    let thread     = active.threads.find(t => t.name === forumTitle);

    if (!thread) {
      const archived = await forumChannel.threads.fetchArchived();
      thread = archived.threads.find(t => t.name === forumTitle);
    }

    if (data.type === "open") {
      if (!thread) {
        await forumChannel.threads.create({ name: forumTitle, message: logMsg });
      } else {
        await thread.send(logMsg);
      }
      return;
    }

    if (!thread) return;

    if (data.type === "repost") {
      const db2 = await getDB();
      const prev = await db2.collection("forumPosts").findOne({ serverName: data.serverName, type: "repost" });
      if (prev?.msgId) {
        const prevMsg = await thread.messages.fetch(prev.msgId).catch(() => null);
        if (prevMsg) await prevMsg.delete().catch(console.error);
      }
    }

    const sent = await thread.send(logMsg);
    const db2  = await getDB();
    await db2.collection("forumPosts").updateOne(
      { serverName: data.serverName, type: data.type },
      { $set: { serverName: data.serverName, type: data.type, msgId: sent.id, threadId: thread.id } },
      { upsert: true }
    );
  } catch (err) {
    console.error("❌ Forum log error:", err);
  }
}

// ─── !partner COMMAND ─────────────────────────────────────────────────────────
async function handlePartnerCommand(message) {
  if (!message.guild) return false;
  if (message.content.toLowerCase() !== "!partner") return false;

  const channel = message.channel;
  if (!channel.parentId || channel.parentId !== CATEGORY_ID) return false;

  if (!message.member.roles.cache.has(ROLE.STAFF)) {
    await message.reply(msgNotStaff());
    return true;
  }

  if (!channelUseCount.has(channel.id)) channelUseCount.set(channel.id, new Map());
  const chMap = channelUseCount.get(channel.id);
  const count = chMap.get(message.author.id) || 0;

  if (count >= PARTNER_CHANNEL_LIMIT) {
    await message.reply(msgPartnerLimit());
    return true;
  }

  chMap.set(message.author.id, count + 1);

  const useEmbed = embedState.get(`open_${message.author.id}`) ?? true;
  await message.reply(msgGuildForm(useEmbed));
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

// ─── INIT ─────────────────────────────────────────────────────────────────────
function init(client) {
  console.log("✅ Partnership Module Active");
}

// ─── EXPORTS ──────────────────────────────────────────────────────────────────
module.exports = {
  init,
  handleInteraction,
  handlePartnerCommand,
  sendDashboard,
};
