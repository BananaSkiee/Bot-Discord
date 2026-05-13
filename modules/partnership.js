// modules/partnership.js
const { MongoClient } = require("mongodb");

// ─── CONSTANTS ───────────────────────────────────────────────────────────────
const MONGO_URI = "mongodb+srv://AeroX:AeroX@aerox.cgfxn4x.mongodb.net/?retryWrites=true&w=majority&appName=AeroX";
const DB_NAME   = "partnership_akira";

const CHANNEL = {
  DASHBOARD:   "1498934645096448010",
  LOG_ADMIN:   "1503704709779820605",
  PARTNER_POST:"1498934926630850693",
  EVENTS_POST: "1502206484489175101",
  PARTNER_FORUM:"1503130728278392853",
  TICKET_CAT:  "1498933997005443082",
  STOP_CAT:    "1504152063154847955",
};

const ROLE = {
  PARTNER:   "1357693246268244209",
  STAFF:     "1352286232779948144",
};

const BOT_ID = "1447102808900898887";

// ─── MONGO ───────────────────────────────────────────────────────────────────
let db;
async function getDb() {
  if (db) return db;
  const client = new MongoClient(MONGO_URI);
  await client.connect();
  db = client.db(DB_NAME);
  return db;
}

// ─── HELPERS ─────────────────────────────────────────────────────────────────
function hasPartnerRole(member) {
  return member.roles.cache.has(ROLE.PARTNER);
}
function hasStaffRole(member) {
  return member.roles.cache.has(ROLE.STAFF);
}
function formatDuration(ms) {
  const secs  = Math.floor(ms / 1000);
  const mins  = Math.floor(secs / 60);
  const hours = Math.floor(mins / 60);
  if (hours > 0) return `${hours}j ${mins % 60}m ${secs % 60}s`;
  if (mins  > 0) return `${mins}m ${secs % 60}s`;
  return `${secs}s`;
}
function formatDate(date) {
  return new Intl.DateTimeFormat("id-ID", {
    day: "2-digit", month: "long", year: "numeric",
    hour: "2-digit", minute: "2-digit", timeZone: "Asia/Jakarta"
  }).format(date).replace(".", ".");
}
function accountAgeText(createdAt) {
  const days = Math.floor((Date.now() - createdAt.getTime()) / 86400000);
  return `${days} hari`;
}
function parseColorHex(str) {
  if (!str) return null;
  const clean = str.replace(/^#/, "");
  const num = parseInt(clean, 16);
  return isNaN(num) ? null : num;
}
function parseBanners(str) {
  if (!str) return [];
  return str.split(",").map(s => s.trim()).filter(Boolean);
}

// ─── CV2 MESSAGE BUILDER ─────────────────────────────────────────────────────
function cv2(components, accentColor) {
  const container = { type: 17, components };
  if (accentColor !== undefined && accentColor !== null) container.accent_color = accentColor;
  return { flags: 32768, components: [container] };
}
const SEP  = { type: 14 };
const text = (content) => ({ type: 10, content });

// ─── DASHBOARD ───────────────────────────────────────────────────────────────
async function sendDashboard(channel) {
  await channel.send(cv2([
    text("## <:1_:1486297322848653425> Partnership Requirement<:00:1360567203325542431><:00:1360567203325542431><:00:1360567203325542431><:00:1360567203325542431>"),
    SEP,
    text("> - Member dan Staff server aktif\n> - Tidak mengandung konten NSFW.\n> - Tiada minimal jumlah member server.\n> - Gunakan channels partner bukan forum.\n> - Tidak menerima server khusus berjualan.\n> - Bebas dari konflik dengan komunitas lain."),
    SEP,
    {
      type: 1,
      components: [{
        type: 3,
        custom_id: "partner_menu",
        min_values: 1,
        max_values: 1,
        options: [
          { label: "Open Partnership",    value: "open_partnership",    emoji: { name: "🔍" } },
          { label: "Posting Events",      value: "posting_events",      emoji: { name: "📥" } },
          { label: "Re-Posting Partner",  value: "reposting_partner",   emoji: { name: "🔃" } },
          { label: "List Partnership",    value: "list_partnership",    emoji: { name: "📜" } },
          { label: "Berhenti Partnership",value: "stop_partnership",    emoji: { name: "🛑" } },
        ]
      }]
    },
    SEP,
    text("-# © Guild Partnership - EmpireBS"),
  ]));
}

// ─── MENU HANDLER ────────────────────────────────────────────────────────────
async function handleMenu(interaction) {
  if (!interaction.isStringSelectMenu()) return false;
  if (interaction.customId !== "partner_menu") return false;

  const val = interaction.values[0];
  const member = interaction.member;

  await interaction.deferUpdate();

  switch (val) {
    case "open_partnership":    return handleOpenPartnership(interaction, member);
    case "posting_events":      return handlePostingEvents(interaction, member);
    case "reposting_partner":   return handleRepostingPartner(interaction, member);
    case "list_partnership":    return handleListPartnership(interaction, member);
    case "stop_partnership":    return handleStopPartnership(interaction, member);
  }
  return true;
}

// ─── OPEN PARTNERSHIP ────────────────────────────────────────────────────────
async function handleOpenPartnership(interaction, member) {
  if (hasPartnerRole(member)) {
    return interaction.followUp({
      ...cv2([
        text("## Kamu Sudah Berpartnership"),
        SEP,
        text("Kamu sudah memiliki role **Partner**. Gunakan menu **Re-Posting Partner** atau **Posting Events** untuk kegiatan partnership selanjutnya."),
        SEP,
        text("-# © Guild Partnership - EmpireBS"),
      ]),
      flags: 64
    });
  }

  await interaction.followUp({
    ...cv2([
      text("## 🔍 Pengajuan Partnership"),
      SEP,
      text("> - Pencet tombol **Open Tiket** di bawah dan pilih Request Partner\n> - Antri dan tertib tunggu diproses sesuai urutan, mohon bersabar\n> - Dilarang spam pesan berulang atau mention, demi kenyamanan"),
      SEP,
      {
        type: 1,
        components: [
          { type: 2, style: 5, label: "Open Ticket", emoji: { name: "📫" }, url: "https://discord.com/channels/1347233781391560837/1498935151441219584", custom_id: "p_open_ticket_link" },
          { type: 2, style: 3, label: " Benefit",         emoji: { name: "🎀" }, custom_id: "partner_benefit" },
          { type: 2, style: 1, label: "Ketentuan Partner", emoji: { name: "📋" }, custom_id: "partner_ketentuan" },
        ]
      },
      SEP,
      text("-# © Guild Partnership - EmpireBS"),
    ]),
    flags: 64
  });
  return true;
}

// ─── KETENTUAN / BENEFIT ─────────────────────────────────────────────────────
async function handleKetentuan(interaction) {
  await interaction.reply({
    ...cv2([
      text("## 📋 Ketentuan Partnership"),
      SEP,
      text("> -  Perwakilan staff wajib bergabung sebagai perwakilan. Saling post event bersifat timbal balik.\n\n> - Gunakan tiket untuk pengajuan event. Dilarang menggunakan mention everyone tanpa izin.\n\n> - Wajib memposting deskripsi/event server kami. Kelalaian dalam posting dapat mengakibatkan pemutusan kerja sama.\n\n> - Perwakilan dilarang keluar server tanpa koordinasi. Jika perwakilan keluar tanpa alasan, partner akan diputus.\n\n> - Admin berhak mengedit konten postingan dan memutus kerja sama jika melanggar ketentuan di atas."),
      SEP,
      text("-# © Guild Partnership - EmpireBS"),
    ]),
    flags: 64
  });
  return true;
}
async function handleBenefit(interaction) {
  await interaction.reply({
    ...cv2([
      text("## 🎀 Benefit Partnership <:00:1360567203325542431><:00:1360567203325542431><:00:1360567203325542431><:00:1360567203325542431><:00:1360567203325542431><:00:1360567203325542431><:00:1360567203325542431><:00:1360567203325542431><:00:1360567203325542431>"),
      SEP,
      text("> - Relasi: Membangun koneksi antar-server secara resmi\n\n> - Promosi Event: Kesempatan membagikan event Anda\n\n> - Kolaborasi: Mengadakan proyek bersama EmpireBS\n\n> - Role Eksklusif: Mendapatkan role khusus Partnership"),
      SEP,
      text("-# © Guild Partnership - EmpireBS"),
    ]),
    flags: 64
  });
  return true;
}

// ─── POSTING EVENTS ──────────────────────────────────────────────────────────
const eventsEmbedState = new Map();

async function handlePostingEvents(interaction, member) {
  if (!hasPartnerRole(member)) {
    return interaction.followUp({
      ...cv2([
        text("## Berpartnership Terlebih dahulu"),
        SEP,
        text("Kamu belum memiliki role **Partner**. Silakan lakukan **Open Partnership** terlebih dahulu melalui menu."),
        SEP,
        text("-# © Guild Partnership - EmpireBS"),
      ]),
      flags: 64
    });
  }

  eventsEmbedState.set(interaction.user.id, true);

  await interaction.followUp({
    ...cv2([
      text("## 📥 Posting Events"),
      SEP,
      text("### Ketentuan Events: <:00:1360567203325542431><:00:1360567203325542431><:00:1360567203325542431><:00:1360567203325542431><:00:1360567203325542431><:00:1360567203325542431><:00:1360567203325542431><:00:1360567203325542431><:00:1360567203325542431><:00:1360567203325542431><:00:1360567203325542431><:00:1360567203325542431><:00:1360567203325542431><:00:1360567203325542431>\n> - Wajib gunakan mention khusus yang tersedia.\n> - Postingan ditinjau admin sebelum dipublikasikan.\n> - Admin berhak menyesuaikan teks sesuai ketentuan.\n### Prosedur:\n> - Pilih Yes/No untuk memakai embed atau tidak.\n> - Klik tombol di bawah dan lengkapi detail acara anda."),
      SEP,
      {
        type: 1,
        components: [
          { type: 2, style: 1, label: "Isi Formulir Disini", emoji: { name: "📩" }, custom_id: "events_form" },
          { type: 2, style: 3, label: "Yes", custom_id: "events_yes", disabled: true },
          { type: 2, style: 4, label: "No",  custom_id: "events_no",  disabled: false },
        ]
      },
      SEP,
      text("-# © Guild Partnership - EmpireBS"),
    ]),
    flags: 64
  });
  return true;
}

async function handleEventsYesNo(interaction) {
  const isYes = interaction.customId === "events_yes";
  eventsEmbedState.set(interaction.user.id, isYes);
  await interaction.update({
    ...cv2([
      text("## 📥 Posting Events"),
      SEP,
      text("### Ketentuan Events: <:00:1360567203325542431><:00:1360567203325542431><:00:1360567203325542431><:00:1360567203325542431><:00:1360567203325542431><:00:1360567203325542431><:00:1360567203325542431><:00:1360567203325542431><:00:1360567203325542431><:00:1360567203325542431><:00:1360567203325542431><:00:1360567203325542431><:00:1360567203325542431><:00:1360567203325542431>\n> - Wajib gunakan mention khusus yang tersedia.\n> - Postingan ditinjau admin sebelum dipublikasikan.\n> - Admin berhak menyesuaikan teks sesuai ketentuan.\n### Prosedur:\n> - Pilih Yes/No untuk memakai embed atau tidak.\n> - Klik tombol di bawah dan lengkapi detail acara anda."),
      SEP,
      {
        type: 1,
        components: [
          { type: 2, style: 1, label: "Isi Formulir Disini", emoji: { name: "📩" }, custom_id: "events_form" },
          { type: 2, style: 3, label: "Yes", custom_id: "events_yes", disabled:  isYes },
          { type: 2, style: 4, label: "No",  custom_id: "events_no",  disabled: !isYes },
        ]
      },
      SEP,
      text("-# © Guild Partnership - EmpireBS"),
    ])
  });
  return true;
}

async function handleEventsForm(interaction) {
  const useEmbed = eventsEmbedState.get(interaction.user.id) !== false;

  if (useEmbed) {
    await interaction.showModal({
      title: "Formulir Posting Events (Embed)",
      custom_id: "events_modal_embed",
      components: [
        { type: 1, components: [{ type: 4, custom_id: "f_nama",   label: "Nama Server",          style: 1, placeholder: "Masukkan nama server kamu", required: true,  min_length: 1, max_length: 50 }] },
        { type: 1, components: [{ type: 4, custom_id: "f_desc",   label: "Deskripsi Server",      style: 2, placeholder: "Tuliskan deskripsi lengkap server kamu", required: true }] },
        { type: 1, components: [{ type: 4, custom_id: "f_banner", label: "Banner Server (Opsional)", style: 1, placeholder: "Link banner, jika >1 pisahkan dengan koma", required: false }] },
        { type: 1, components: [{ type: 4, custom_id: "f_link",   label: "Link Server",           style: 1, placeholder: "https://discord.gg/...", required: true }] },
        { type: 1, components: [{ type: 4, custom_id: "f_color",  label: "Sidebar Color (Opsional)", style: 1, placeholder: "Contoh: FF0000 atau #FF0000", required: false }] },
      ]
    });
  } else {
    await interaction.showModal({
      title: "Formulir Posting Events (Tanpa Embed)",
      custom_id: "events_modal_plain",
      components: [
        { type: 1, components: [{ type: 4, custom_id: "f_nama",    label: "Nama Server",          style: 1, placeholder: "Masukkan nama server kamu", required: true }] },
        { type: 1, components: [{ type: 4, custom_id: "f_desc",    label: "Deskripsi Server",      style: 2, placeholder: "Tuliskan deskripsi lengkap server kamu", required: true }] },
        { type: 1, components: [{ type: 4, custom_id: "f_link",    label: "Link Server",           style: 1, placeholder: "https://discord.gg/...", required: true }] },
        { type: 1, components: [{ type: 4, custom_id: "f_events",  label: "Link Events (Opsional)", style: 1, placeholder: "Link events jika ada", required: false }] },
      ]
    });
  }
  return true;
}

async function handleEventsModalSubmit(interaction, isEmbed) {
  const user      = interaction.user;
  const member    = interaction.member;
  const nama      = interaction.fields.getTextInputValue("f_nama");
  const desc      = interaction.fields.getTextInputValue("f_desc");
  const link      = interaction.fields.getTextInputValue("f_link");
  const startedAt = Date.now();

  let banners = [], color = null, eventsLink = "";

  if (isEmbed) {
    banners = parseBanners(interaction.fields.getTextInputValue("f_banner") || "");
    color   = parseColorHex(interaction.fields.getTextInputValue("f_color") || "");
  } else {
    eventsLink = interaction.fields.getTextInputValue("f_events") || "";
  }

  const database = await getDb();
  const logId = `EVT-${Date.now()}-${user.id}`;
  await database.collection("pending_events").insertOne({
    logId, userId: user.id, userName: user.username, displayName: member.displayName,
    guildId: interaction.guild.id, nama, desc, link, banners, color, eventsLink,
    isEmbed, startedAt, type: "posting_events"
  });

  await interaction.reply({
    ...cv2([
      text("## 🔈 Notifikasi DM"),
      SEP,
      text("> Saat pilih tombol **Iya Pake** bot <@1364585069812912148> akan kirim DM notifikasi.\n> postingan events sudah kekirim di <#1502206484489175101>\n\nNote: Saat ini tombol **Tidak Pake**"),
      SEP,
      {
        type: 1,
        components: [
          { type: 2, style: 3, label: "Iya Pake",   custom_id: `notif_yes_${logId}`, disabled: false },
          { type: 2, style: 4, label: "Tidak Pake", custom_id: `notif_no_${logId}`,  disabled: true  },
        ]
      },
      SEP,
      text("-# © Guild Partnership - EmpireBS"),
    ]),
    flags: 64
  });

  await sendAdminReview(interaction.guild, logId, user, member, { nama, desc, link, banners, color, isEmbed, type: "posting_events" });
  return true;
}

// ─── RE-POSTING PARTNER ──────────────────────────────────────────────────────
const repostEmbedState = new Map();

async function handleRepostingPartner(interaction, member) {
  if (!hasPartnerRole(member)) {
    return interaction.followUp({
      ...cv2([
        text("## Berpartnership Terlebih dahulu"),
        SEP,
        text("Kamu belum memiliki role **Partner**. Silakan lakukan **Open Partnership** terlebih dahulu melalui menu."),
        SEP,
        text("-# © Guild Partnership - EmpireBS"),
      ]),
      flags: 64
    });
  }

  const database = await getDb();
  const lastRepost = await database.collection("repost_cooldown").findOne({ userId: interaction.user.id });
  if (lastRepost) {
    const diff = Date.now() - lastRepost.lastAt;
    const week = 7 * 24 * 60 * 60 * 1000;
    if (diff < week) {
      const remaining = week - diff;
      const nextTs = Math.floor((Date.now() + remaining) / 1000);
      return interaction.followUp({
        ...cv2([
          text("## ⏳ Cooldown Re-Posting"),
          SEP,
          text(`Kamu masih dalam cooldown re-posting. Silakan coba lagi <t:${nextTs}:R>.`),
          SEP,
          text("-# © Guild Partnership - EmpireBS"),
        ]),
        flags: 64
      });
    }
  }

  repostEmbedState.set(interaction.user.id, true);

  await interaction.followUp({
    ...cv2([
      text("## 🔃 Re-Posting Partnership"),
      SEP,
      text("### Ketentuan Utama:<:00:1360567203325542431><:00:1360567203325542431><:00:1360567203325542431><:00:1360567203325542431><:00:1360567203325542431><:00:1360567203325542431><:00:1360567203325542431><:00:1360567203325542431><:00:1360567203325542431><:00:1360567203325542431><:00:1360567203325542431><:00:1360567203325542431><:00:1360567203325542431><:00:1360567203325542431>\n> - Cooldown 1 minggu sekali.\n> - Saling memposting ulang deskripsi.\n> - Gunakan mention khusus yang tersedia.\n### Prosedur:\n> - Pilih Yes/No untuk memakai embed atau tidak.\n> - Postingan ditinjau admin sebelum dipublikasikan.\n> - Admin berhak menyesuaikan teks sesuai ketentuan.\n> - Klik tombol di bawah dan lengkapi data server anda."),
      SEP,
      {
        type: 1,
        components: [
          { type: 2, style: 1, label: "Isi Formulir Disini", emoji: { name: "📩" }, custom_id: "repost_form" },
          { type: 2, style: 3, label: "Yes", custom_id: "repost_yes", disabled: true  },
          { type: 2, style: 4, label: "No",  custom_id: "repost_no",  disabled: false },
        ]
      },
      SEP,
      text("-# © Guild Partnership - EmpireBS"),
    ]),
    flags: 64
  });
  return true;
}

async function handleRepostYesNo(interaction) {
  const isYes = interaction.customId === "repost_yes";
  repostEmbedState.set(interaction.user.id, isYes);
  await interaction.update({
    ...cv2([
      text("## 🔃 Re-Posting Partnership"),
      SEP,
      text("### Ketentuan Utama:<:00:1360567203325542431><:00:1360567203325542431><:00:1360567203325542431><:00:1360567203325542431><:00:1360567203325542431><:00:1360567203325542431><:00:1360567203325542431><:00:1360567203325542431><:00:1360567203325542431><:00:1360567203325542431><:00:1360567203325542431><:00:1360567203325542431><:00:1360567203325542431><:00:1360567203325542431>\n> - Cooldown 1 minggu sekali.\n> - Saling memposting ulang deskripsi.\n> - Gunakan mention khusus yang tersedia.\n### Prosedur:\n> - Pilih Yes/No untuk memakai embed atau tidak.\n> - Postingan ditinjau admin sebelum dipublikasikan.\n> - Admin berhak menyesuaikan teks sesuai ketentuan.\n> - Klik tombol di bawah dan lengkapi data server anda."),
      SEP,
      {
        type: 1,
        components: [
          { type: 2, style: 1, label: "Isi Formulir Disini", emoji: { name: "📩" }, custom_id: "repost_form" },
          { type: 2, style: 3, label: "Yes", custom_id: "repost_yes", disabled:  isYes },
          { type: 2, style: 4, label: "No",  custom_id: "repost_no",  disabled: !isYes },
        ]
      },
      SEP,
      text("-# © Guild Partnership - EmpireBS"),
    ])
  });
  return true;
}

async function handleRepostForm(interaction) {
  const useEmbed = repostEmbedState.get(interaction.user.id) !== false;
  if (useEmbed) {
    await interaction.showModal({
      title: "Formulir Re-Posting Partnership (Embed)",
      custom_id: "repost_modal_embed",
      components: [
        { type: 1, components: [{ type: 4, custom_id: "f_nama",   label: "Nama Server",              style: 1, placeholder: "Masukkan nama server kamu", required: true }] },
        { type: 1, components: [{ type: 4, custom_id: "f_desc",   label: "Deskripsi Server",          style: 2, placeholder: "Tuliskan deskripsi server kamu", required: true }] },
        { type: 1, components: [{ type: 4, custom_id: "f_banner", label: "Banner Server (Opsional)",  style: 1, placeholder: "Link banner, jika >1 pisahkan koma", required: false }] },
        { type: 1, components: [{ type: 4, custom_id: "f_link",   label: "Link Server",               style: 1, placeholder: "https://discord.gg/...", required: true }] },
        { type: 1, components: [{ type: 4, custom_id: "f_color",  label: "Sidebar Color (Opsional)",  style: 1, placeholder: "Contoh: FF0000 atau #FF0000", required: false }] },
      ]
    });
  } else {
    await interaction.showModal({
      title: "Formulir Re-Posting Partnership",
      custom_id: "repost_modal_plain",
      components: [
        { type: 1, components: [{ type: 4, custom_id: "f_nama",  label: "Nama Server",          style: 1, placeholder: "Masukkan nama server kamu", required: true }] },
        { type: 1, components: [{ type: 4, custom_id: "f_desc",  label: "Deskripsi Server",      style: 2, placeholder: "Tuliskan deskripsi server kamu", required: true }] },
        { type: 1, components: [{ type: 4, custom_id: "f_link",  label: "Link Server",           style: 1, placeholder: "https://discord.gg/...", required: true }] },
        { type: 1, components: [{ type: 4, custom_id: "f_events",label: "Link Events (Opsional)", style: 1, placeholder: "Link events jika ada", required: false }] },
      ]
    });
  }
  return true;
}

async function handleRepostModalSubmit(interaction, isEmbed) {
  const user      = interaction.user;
  const member    = interaction.member;
  const nama      = interaction.fields.getTextInputValue("f_nama");
  const desc      = interaction.fields.getTextInputValue("f_desc");
  const link      = interaction.fields.getTextInputValue("f_link");
  const startedAt = Date.now();

  let banners = [], color = null, eventsLink = "";
  if (isEmbed) {
    banners = parseBanners(interaction.fields.getTextInputValue("f_banner") || "");
    color   = parseColorHex(interaction.fields.getTextInputValue("f_color") || "");
  } else {
    eventsLink = interaction.fields.getTextInputValue("f_events") || "";
  }

  const database = await getDb();
  const logId = `RPT-${Date.now()}-${user.id}`;
  await database.collection("pending_repost").insertOne({
    logId, userId: user.id, userName: user.username, displayName: member.displayName,
    guildId: interaction.guild.id, nama, desc, link, banners, color, eventsLink,
    isEmbed, startedAt, type: "reposting_partner"
  });

  await interaction.reply({
    ...cv2([
      text("## ✅ Formulir Terkirim"),
      SEP,
      text("Pengajuan **Re-Posting Partnership** kamu sudah diterima dan sedang ditinjau oleh admin. Harap bersabar menunggu."),
      SEP,
      text("-# © Guild Partnership - EmpireBS"),
    ]),
    flags: 64
  });

  await sendAdminReview(interaction.guild, logId, user, member, { nama, desc, link, banners, color, isEmbed, type: "reposting_partner" });
  return true;
}

// ─── PARTNER TICKET (!partner command) ───────────────────────────────────────
const partnerUsageCache = new Map();

async function handlePartnerCommand(message) {
  if (!message.guild) return;
  if (message.content.toLowerCase() !== "!partner") return;
  if (message.channel.parentId !== CHANNEL.TICKET_CAT) return;
  if (!hasStaffRole(message.member)) {
    await message.reply({
      ...cv2([
        text("## ⛔ Akses Ditolak"),
        SEP,
        text("Perintah `!partner` hanya dapat digunakan oleh **Staff Partnership**. Jika kamu ingin melakukan pengajuan, gunakan menu Partnership di <#" + CHANNEL.DASHBOARD + ">."),
        SEP,
        text("-# © Guild Partnership - EmpireBS"),
      ])
    });
    return;
  }

  const channelId = message.channel.id;
  const count     = partnerUsageCache.get(channelId) || 0;

  if (count >= 3) {
    await message.reply({
      ...cv2([
        text("## ⚠️ Batas Penggunaan Tercapai"),
        SEP,
        text("Kanal ini sudah menggunakan perintah `!partner` sebanyak **3 kali**. Batas maksimal telah tercapai. Silakan hubungi admin jika diperlukan."),
        SEP,
        text("-# © Guild Partnership - EmpireBS"),
      ])
    });
    return;
  }

  partnerUsageCache.set(channelId, count + 1);

  await message.channel.send({
    ...cv2([
      text("## ✉️ Pengajuan Partnership"),
      SEP,
      text("> Click dibawah ini untuk isi deskripsi server kamu\n\n**Note:** Pilih Yes/No untuk menggunakan embed atau tidak."),
      SEP,
      {
        type: 1,
        components: [
          { type: 2, style: 1, label: "Isi Formulir Disini", emoji: { name: "📩" }, custom_id: "ticket_partner_form" },
          { type: 2, style: 3, label: "Yes", custom_id: "ticket_partner_yes", disabled: true  },
          { type: 2, style: 4, label: "No",  custom_id: "ticket_partner_no",  disabled: false },
        ]
      },
      SEP,
      text("-# © Guild Partnership - EmpireBS"),
    ])
  });
}

const ticketEmbedState = new Map();

async function handleTicketYesNo(interaction) {
  const isYes = interaction.customId === "ticket_partner_yes";
  ticketEmbedState.set(interaction.channel.id, isYes);
  await interaction.update({
    ...cv2([
      text("## ✉️ Pengajuan Partnership"),
      SEP,
      text("> Click dibawah ini untuk isi deskripsi server kamu\n\n**Note:** Pilih Yes/No untuk menggunakan embed atau tidak."),
      SEP,
      {
        type: 1,
        components: [
          { type: 2, style: 1, label: "Isi Formulir Disini", emoji: { name: "📩" }, custom_id: "ticket_partner_form" },
          { type: 2, style: 3, label: "Yes", custom_id: "ticket_partner_yes", disabled:  isYes },
          { type: 2, style: 4, label: "No",  custom_id: "ticket_partner_no",  disabled: !isYes },
        ]
      },
      SEP,
      text("-# © Guild Partnership - EmpireBS"),
    ])
  });
  return true;
}

async function handleTicketPartnerForm(interaction) {
  const useEmbed = ticketEmbedState.get(interaction.channel.id) !== false;
  if (useEmbed) {
    await interaction.showModal({
      title: "Formulir Pengajuan Partnership (Embed)",
      custom_id: "ticket_partner_modal_embed",
      components: [
        { type: 1, components: [{ type: 4, custom_id: "f_nama",   label: "Nama Server",              style: 1, placeholder: "Masukkan nama server kamu", required: true }] },
        { type: 1, components: [{ type: 4, custom_id: "f_desc",   label: "Deskripsi Server",          style: 2, placeholder: "Tuliskan deskripsi lengkap server kamu", required: true }] },
        { type: 1, components: [{ type: 4, custom_id: "f_banner", label: "Banner Server (Opsional)",  style: 1, placeholder: "Link banner, jika >1 pisahkan koma", required: false }] },
        { type: 1, components: [{ type: 4, custom_id: "f_link",   label: "Link Server",               style: 1, placeholder: "https://discord.gg/...", required: true }] },
        { type: 1, components: [{ type: 4, custom_id: "f_color",  label: "Sidebar Color (Opsional)",  style: 1, placeholder: "Contoh: FF0000 atau #FF0000", required: false }] },
      ]
    });
  } else {
    await interaction.showModal({
      title: "Formulir Pengajuan Partnership (Tanpa Embed)",
      custom_id: "ticket_partner_modal_plain",
      components: [
        { type: 1, components: [{ type: 4, custom_id: "f_nama",    label: "Nama Server",          style: 1, placeholder: "Masukkan nama server kamu", required: true }] },
        { type: 1, components: [{ type: 4, custom_id: "f_desc",    label: "Deskripsi Server",      style: 2, placeholder: "Tuliskan deskripsi lengkap server kamu", required: true }] },
        { type: 1, components: [{ type: 4, custom_id: "f_link",    label: "Link Server",           style: 1, placeholder: "https://discord.gg/...", required: true }] },
        { type: 1, components: [{ type: 4, custom_id: "f_events",  label: "Link Events (Opsional)", style: 1, placeholder: "Link events jika ada", required: false }] },
      ]
    });
  }
  return true;
}

async function handleTicketPartnerModalSubmit(interaction, isEmbed) {
  const user      = interaction.user;
  const member    = interaction.member;
  const nama      = interaction.fields.getTextInputValue("f_nama");
  const desc      = interaction.fields.getTextInputValue("f_desc");
  const link      = interaction.fields.getTextInputValue("f_link");
  const startedAt = Date.now();

  let banners = [], color = null, eventsLink = "";
  if (isEmbed) {
    banners = parseBanners(interaction.fields.getTextInputValue("f_banner") || "");
    color   = parseColorHex(interaction.fields.getTextInputValue("f_color") || "");
  } else {
    eventsLink = interaction.fields.getTextInputValue("f_events") || "";
  }

  const database = await getDb();
  const logId = `PKP-${Date.now()}-${user.id}`;
  await database.collection("pending_partnership").insertOne({
    logId, userId: user.id, userName: user.username, displayName: member.displayName,
    guildId: interaction.guild.id, channelId: interaction.channel.id,
    nama, desc, link, banners, color, eventsLink,
    isEmbed, startedAt, type: "pengajuan_partnership"
  });

  await interaction.reply({
    ...cv2([
      text("## ✅ Formulir Terkirim"),
      SEP,
      text("Pengajuan **Partnership** kamu sudah diterima dan sedang ditinjau oleh admin. Harap bersabar menunggu."),
      SEP,
      text("-# © Guild Partnership - EmpireBS"),
    ]),
    flags: 64
  });

  await sendAdminReview(interaction.guild, logId, user, member, { nama, desc, link, banners, color, isEmbed, type: "pengajuan_partnership", channelId: interaction.channel.id });
  return true;
}

// ─── ADMIN REVIEW ────────────────────────────────────────────────────────────
async function sendAdminReview(guild, logId, user, member, data) {
  const logChannel = guild.channels.cache.get(CHANNEL.LOG_ADMIN);
  if (!logChannel) return;

  const typeLabel = {
    posting_events:       "📥 Posting Events",
    reposting_partner:    "🔃 Re-Posting Partnership",
    pengajuan_partnership:"✉️ Pengajuan Partnership",
  }[data.type] || data.type;

  const previewComponents = [];

  if (data.isEmbed) {
    previewComponents.push(text(`# ${data.nama}`));
    previewComponents.push(SEP);
    previewComponents.push(text(data.desc));
    if (data.banners && data.banners.length > 0) {
      previewComponents.push(SEP);
      for (const url of data.banners) {
        previewComponents.push({ type: 12, items: [{ media: { url } }] });
      }
    }
    previewComponents.push(SEP);
    previewComponents.push(text("-# © Guild Partnership - EmpireBS"));
  } else {
    previewComponents.push(text(`**Preview (Plain Text):**\n\n${data.desc}`));
  }

  const accentColor = data.color || null;

  const adminMsg = cv2([
    text(`## ${typeLabel}`),
    SEP,
    text(`**👤 Informasi Pengaju**\n> **Username:** [${user.username}](https://discord.com/users/${user.id})\n> **ID:** \`${user.id}\`\n> **Display Name:** ${member.displayName}\n> **Log ID:** \`${logId}\``),
    SEP,
    text(`**📋 Detail Pengajuan**\n> **Nama Server:** ${data.nama}\n> **Link Server:** ${data.link}\n> **Tipe:** ${typeLabel}\n> **Format:** ${data.isEmbed ? "Component V2 Embed" : "Plain Text"}`),
    SEP,
    {
      type: 1,
      components: [
        { type: 2, style: 3, label: "Accept",      custom_id: `admin_accept_${logId}` },
        { type: 2, style: 4, label: "Reject",       custom_id: `admin_reject_${logId}` },
        { type: 2, style: 1, label: "Edit Pesan",   custom_id: `admin_edit_${logId}`   },
        { type: 2, style: 2, label: data.nama,      custom_id: `admin_info_${logId}`,  disabled: true },
      ]
    },
    SEP,
    text("-# © Guild Partnership - EmpireBS"),
  ]);

  await logChannel.send(adminMsg);

  if (data.isEmbed) {
    const previewPayload = cv2(previewComponents, accentColor);
    await logChannel.send(previewPayload);
  }
}

// ─── ADMIN ACCEPT ─────────────────────────────────────────────────────────────
async function handleAdminAccept(interaction, logId) {
  const database = await getDb();
  
  let record = await database.collection("pending_partnership").findOne({ logId });
  let coll = "pending_partnership";
  if (!record) { record = await database.collection("pending_events").findOne({ logId }); coll = "pending_events"; }
  if (!record) { record = await database.collection("pending_repost").findOne({ logId }); coll = "pending_repost"; }
  if (!record) {
    return interaction.reply({ content: "❌ Data tidak ditemukan!", flags: 64 });
  }

  const acceptedAt = Date.now();
  const duration   = formatDuration(acceptedAt - record.startedAt);
  const admin      = interaction.user;

  let targetChannelId;
  if (record.type === "posting_events")   targetChannelId = CHANNEL.EVENTS_POST;
  else                                     targetChannelId = CHANNEL.PARTNER_POST;

  const targetChannel = interaction.guild.channels.cache.get(targetChannelId);
  let postedMsg = null;

  if (targetChannel) {
    let postPayload;
    const accentColor = record.color || null;

    if (record.isEmbed) {
      const comps = [
        text(`# ${record.nama}`),
        SEP,
        text(record.desc),
      ];
      if (record.banners && record.banners.length > 0) {
        comps.push(SEP);
        for (const url of record.banners) comps.push({ type: 12, items: [{ media: { url } }] });
      }
      comps.push(SEP);
      comps.push(text("-# © Guild Partnership - EmpireBS"));
      postPayload = { ...cv2(comps, accentColor), content: `-# [.](${record.link})` };
    } else {
      postPayload = { content: record.desc };
    }

    if (record.type === "reposting_partner") {
      const prev = await database.collection("posted_messages").findOne({ userId: record.userId, type: "reposting_partner" });
      if (prev) {
        try {
          const prevCh = interaction.guild.channels.cache.get(targetChannelId);
          const prevMsg = await prevCh?.messages.fetch(prev.messageId).catch(() => null);
          if (prevMsg) await prevMsg.delete().catch(() => {});
        } catch (_) {}
      }
    }

    postedMsg = await targetChannel.send(postPayload);

    await database.collection("posted_messages").updateOne(
      { userId: record.userId, type: record.type },
      { $set: { messageId: postedMsg.id, channelId: targetChannelId, postedAt: Date.now() } },
      { upsert: true }
    );
  }

  const forumChannel = interaction.guild.channels.cache.get(CHANNEL.PARTNER_FORUM);
  let forumThread = null;
  let serverName = record.nama;

  if (forumChannel) {
    const threads = await forumChannel.threads.fetchActive();
    forumThread = threads.threads.find(t => t.name.toLowerCase().includes(serverName.toLowerCase()));

    const forumLogType = {
      pengajuan_partnership: "pengajuan_partnership",
      reposting_partner:     "reposting_partner",
      posting_events:        "posting_events",
    }[record.type];

    const forumTemplate = buildForumLog(record, admin, duration, acceptedAt, postedMsg, forumLogType);

    if (!forumThread && record.type === "pengajuan_partnership") {
      forumThread = await forumChannel.threads.create({
        name: `1) ${serverName}`,
        message: forumTemplate,
      });
    } else if (forumThread) {
      if (record.type === "reposting_partner") {
        const msgs = await forumThread.messages.fetch({ limit: 50 });
        for (const [, m] of msgs) {
          if (m.author.id === interaction.client.user.id && !m.id.endsWith("0")) {
            await m.delete().catch(() => {});
            break;
          }
        }
      }
      await forumThread.send(forumTemplate);
    }
  }

  const guild = interaction.guild;
  const targetMember = await guild.members.fetch(record.userId).catch(() => null);
  let hasRole = false;
  if (targetMember) {
    await targetMember.roles.add(ROLE.PARTNER).catch(() => {});
    hasRole = targetMember.roles.cache.has(ROLE.PARTNER);
  }

  if (record.type === "reposting_partner") {
    await database.collection("repost_cooldown").updateOne(
      { userId: record.userId },
      { $set: { lastAt: Date.now() } },
      { upsert: true }
    );
  }

  const dmUser = await interaction.client.users.fetch(record.userId).catch(() => null);
  if (dmUser) {
    const acceptTs = Math.floor(acceptedAt / 1000);
    const startTs  = Math.floor(record.startedAt / 1000);
    const postLink = postedMsg
      ? `https://discord.com/channels/${guild.id}/${targetChannelId}/${postedMsg.id}`
      : null;

    await dmUser.send({
      ...cv2([
        {
          type: 9,
          components: [text("## <:1_:1486297322848653425> Notifikasi DM")],
          accessory: postLink ? {
            type: 2, style: 5, label: "Messages", url: postLink,
            custom_id: "dm_link_msg"
          } : undefined
        },
        SEP,
        text(`Postingan ${record.type === "posting_events" ? "Events" : "Partnership"} kamu sudah kekirim di <#${targetChannelId}>\nDi Accept oleh: <@${admin.id}>`),
        SEP,
        text(`-# © Guild Partnership - EmpireBS <t:${startTs}:R>`),
      ])
    }).catch(() => {});
  }

  await database.collection(coll).deleteOne({ logId });

  await interaction.update({
    ...cv2([
      text(`## ✅ ${record.type === "posting_events" ? "Posting Events" : record.type === "reposting_partner" ? "Re-Posting Partnership" : "Pengajuan Partnership"} — Diterima`),
      SEP,
      text(`**Accept oleh:** [${admin.username}](https://discord.com/users/${admin.id})\n**Waktu:** <t:${Math.floor(acceptedAt / 1000)}:F>\n**Durasi:** ${duration}`),
      SEP,
      text("-# © Guild Partnership - EmpireBS"),
    ])
  });
  return true;
}

function buildForumLog(record, admin, duration, acceptedAt, postedMsg, type) {
  const guild      = record.guildId;
  const postLink   = postedMsg
    ? `https://discord.com/channels/${guild}/${postedMsg.channelId || CHANNEL.PARTNER_POST}/${postedMsg.id}`
    : null;
  const acceptTs   = Math.floor(acceptedAt / 1000);
  const createdTs  = record.createdAt ? Math.floor(new Date(record.createdAt).getTime() / 1000) : null;

  const typeLabel  = {
    pengajuan_partnership: "Success Partnership",
    reposting_partner:     "Success Re-Posting Partnership",
    posting_events:        "Success Events Posts",
  }[type];

  const securityExtra = type === "pengajuan_partnership"
    ? `> **System:** Component V2 + MongoDB`
    : `> **Nama Server:** ${record.nama}`;

  return cv2([
    text(`## ✅ <@${record.userId}> ${typeLabel}`),
    SEP,
    text(`**👤 Informasi User**\n> **Username:** [${record.userName}](https://discord.com/users/${record.userId})\n> **ID:** \`${record.userId}\`\n> **Display Name:** ${record.displayName}${createdTs ? `\n> **Akun Dibuat:** <t:${createdTs}:R>` : ""}`),
    SEP,
    text(`**📊 Detail Verifikasi**\n> **Waktu Selesai:** <t:${acceptTs}:F>\n> **Total Durasi:** ${duration}\n> **Accept Partner:** [${admin.username}](https://discord.com/users/${admin.id})${postLink ? `\n> **Pesan Partner:** [Go To Messages](${postLink})` : ""}\n> **Link Server:** ${record.link}`),
    SEP,
    text(`**🛡️ Security Info**\n> **Status:** Yes (role <@&${ROLE.PARTNER}> diberikan)\n> **Edit Pesan:** No\n> **Boost:** No\n${securityExtra}`),
    SEP,
    text(`\n-# Log ID: \`${record.logId}\``),
  ]);
}

// ─── ADMIN REJECT ─────────────────────────────────────────────────────────────
async function handleAdminReject(interaction, logId) {
  await interaction.showModal({
    title: "Alasan Penolakan",
    custom_id: `admin_reject_modal_${logId}`,
    components: [
      { type: 1, components: [{
        type: 4, custom_id: "f_reason",
        label: "Alasan Penolakan (min. 10 kata)",
        style: 2,
        placeholder: "Jelaskan alasan penolakan pengajuan ini dengan detail...",
        required: true, min_length: 50
      }]}
    ]
  });
  return true;
}

async function handleRejectModalSubmit(interaction, logId) {
  const reason   = interaction.fields.getTextInputValue("f_reason");
  const database = await getDb();

  let record = await database.collection("pending_partnership").findOne({ logId });
  let coll   = "pending_partnership";
  if (!record) { record = await database.collection("pending_events").findOne({ logId }); coll = "pending_events"; }
  if (!record) { record = await database.collection("pending_repost").findOne({ logId }); coll = "pending_repost"; }

  if (!record) return interaction.reply({ content: "❌ Data tidak ditemukan!", flags: 64 });

  const dmUser = await interaction.client.users.fetch(record.userId).catch(() => null);
  if (dmUser) {
    await dmUser.send({
      ...cv2([
        text("## ❌ Pengajuan Ditolak"),
        SEP,
        text(`Pengajuan **${record.type === "posting_events" ? "Posting Events" : record.type === "reposting_partner" ? "Re-Posting Partnership" : "Partnership"}** kamu telah ditolak.\n\n**Alasan:**\n> ${reason}`),
        SEP,
        text("-# © Guild Partnership - EmpireBS"),
      ])
    }).catch(() => {});
  }

  await database.collection(coll).deleteOne({ logId });

  await interaction.update({
    ...cv2([
      text("## ❌ Ditolak"),
      SEP,
      text(`**Reject oleh:** [${interaction.user.username}](https://discord.com/users/${interaction.user.id})\n**Alasan:** ${reason}`),
      SEP,
      text("-# © Guild Partnership - EmpireBS"),
    ])
  });
  return true;
}

// ─── ADMIN EDIT PESAN ─────────────────────────────────────────────────────────
async function handleAdminEdit(interaction, logId) {
  const database = await getDb();
  let record = await database.collection("pending_partnership").findOne({ logId });
  if (!record) { record = await database.collection("pending_events").findOne({ logId }); }
  if (!record) { record = await database.collection("pending_repost").findOne({ logId }); }
  if (!record) return interaction.reply({ content: "❌ Data tidak ditemukan!", flags: 64 });

  await interaction.showModal({
    title: "Edit Pesan",
    custom_id: `admin_edit_modal_${logId}`,
    components: [
      { type: 1, components: [{ type: 4, custom_id: "f_nama",  label: "Nama Server",     style: 1, value: record.nama,  required: true }] },
      { type: 1, components: [{ type: 4, custom_id: "f_desc",  label: "Deskripsi",        style: 2, value: record.desc,  required: true }] },
      { type: 1, components: [{ type: 4, custom_id: "f_link",  label: "Link Server",      style: 1, value: record.link,  required: true }] },
      { type: 1, components: [{ type: 4, custom_id: "f_banner",label: "Banner (opsional)",style: 1, value: record.banners?.join(", ") || "", required: false }] },
      { type: 1, components: [{ type: 4, custom_id: "f_color", label: "Sidebar Color",    style: 1, value: record.color ? record.color.toString(16) : "", required: false }] },
    ]
  });
  return true;
}

async function handleEditModalSubmit(interaction, logId) {
  const database = await getDb();
  const update = {
    nama:    interaction.fields.getTextInputValue("f_nama"),
    desc:    interaction.fields.getTextInputValue("f_desc"),
    link:    interaction.fields.getTextInputValue("f_link"),
    banners: parseBanners(interaction.fields.getTextInputValue("f_banner") || ""),
    color:   parseColorHex(interaction.fields.getTextInputValue("f_color") || ""),
  };

  for (const coll of ["pending_partnership", "pending_events", "pending_repost"]) {
    const r = await database.collection(coll).findOne({ logId });
    if (r) { await database.collection(coll).updateOne({ logId }, { $set: update }); break; }
  }

  await interaction.reply({
    ...cv2([
      text("## ✅ Pesan Diperbarui"),
      SEP,
      text("Pesan pengajuan berhasil diedit. Gunakan tombol **Accept** untuk mempostingnya."),
      SEP,
      text("-# © Guild Partnership - EmpireBS"),
    ]),
    flags: 64
  });
  return true;
}

// ─── STOP PARTNERSHIP ────────────────────────────────────────────────────────
async function handleStopPartnership(interaction, member) {
  if (!hasPartnerRole(member)) {
    return interaction.followUp({
      ...cv2([
        text("## Berpartnership Terlebih dahulu"),
        SEP,
        text("Kamu belum memiliki role **Partner**. Tidak ada partnership yang perlu dihentikan."),
        SEP,
        text("-# © Guild Partnership - EmpireBS"),
      ]),
      flags: 64
    });
  }

  await interaction.followUp({
    ...cv2([
      text("## 🛑 Berhenti Partnership"),
      SEP,
      text("Apakah kamu yakin ingin mengakhiri partnership?\nSilakan isi formulir alasan di bawah ini."),
      SEP,
      {
        type: 1,
        components: [
          { type: 2, style: 2, label: "Alasan Berhenti", custom_id: "stop_form" }
        ]
      },
      SEP,
    ]),
    flags: 64
  });
  return true;
}

async function handleStopForm(interaction) {
  await interaction.showModal({
    title: "Formulir Berhenti Partnership",
    custom_id: "stop_modal",
    components: [
      { type: 1, components: [{ type: 4, custom_id: "f_nama",   label: "Nama Server",   style: 1, placeholder: "Nama server kamu", required: true }] },
      { type: 1, components: [{ type: 4, custom_id: "f_link",   label: "Link Server",   style: 1, placeholder: "https://discord.gg/...", required: true }] },
      { type: 1, components: [{ type: 4, custom_id: "f_reason", label: "Alasan Berhenti Partnership", style: 2,
        placeholder: "Pilih alasan: Tidak aktif/Fokus sendiri/Beda visi/Lainnya", // ✅ dipotong max 100
        required: true }] },
    ]
  });
  return true;
}

async function handleStopModalSubmit(interaction) {
  const user    = interaction.user;
  const member  = interaction.member;
  const nama    = interaction.fields.getTextInputValue("f_nama");
  const link    = interaction.fields.getTextInputValue("f_link");
  const reason  = interaction.fields.getTextInputValue("f_reason");
  const logId   = `STP-${Date.now()}-${user.id}`;

  const database = await getDb();
  await database.collection("stop_requests").insertOne({
    logId, userId: user.id, userName: user.username, displayName: member.displayName,
    nama, link, reason, requestedAt: Date.now()
  });

  const logChannel = interaction.guild.channels.cache.get(CHANNEL.LOG_ADMIN);
  if (logChannel) {
    await logChannel.send({
      ...cv2([
        text("## 🛑 Permintaan Berhenti Partnership"),
        SEP,
        text(`**👤 Informasi User**\n> **Username:** [${user.username}](https://discord.com/users/${user.id})\n> **ID:** \`${user.id}\`\n> **Display Name:** ${member.displayName}`),
        SEP,
        text(`**📋 Detail**\n> **Nama Server:** ${nama}\n> **Link Server:** ${link}\n> **Alasan:**\n${reason}`),
        SEP,
        {
          type: 1,
          components: [
            { type: 2, style: 3, label: "Accept (Berhenti)", custom_id: `stop_accept_${logId}` },
            { type: 2, style: 4, label: "Reject",            custom_id: `stop_reject_${logId}` },
          ]
        },
        SEP,
        text("-# © Guild Partnership - EmpireBS"),
      ])
    });
  }

  await interaction.reply({
    ...cv2([
      text("## ✅ Permintaan Terkirim"),
      SEP,
      text("Permintaan berhenti partnership kamu telah dikirim ke admin. Harap tunggu konfirmasi."),
      SEP,
      text("-# © Guild Partnership - EmpireBS"),
    ]),
    flags: 64
  });
  return true;
}

// ... (stop accept/reject functions tetap sama, hanya tambahkan flags:64 jika perlu)

// ─── LIST PARTNERSHIP ─────────────────────────────────────────────────────────
const LIST_PER_PAGE = 10;

async function handleListPartnership(interaction, member) {
  const database   = await getDb();
  const partners   = await database.collection("partners").find({}).toArray();
  const total      = partners.length;
  const totalPages = Math.max(1, Math.ceil(total / LIST_PER_PAGE));
  const page       = 0;

  await interaction.followUp({
    ...buildListEmbed(partners, page, totalPages, total),
    flags: 64
  });
  return true;
}

function buildListEmbed(partners, page, totalPages, total) {
  const start  = page * LIST_PER_PAGE;
  const slice  = partners.slice(start, start + LIST_PER_PAGE);

  let listText = "";
  for (let i = 0; i < LIST_PER_PAGE; i++) {
    const idx = start + i + 1;
    const p   = slice[i];
    if (p) {
      listText += `**${idx}.** <@${p.userId}>\n-# <:00:1360567203325542431>Server Link: [${p.nama}](${p.link})\n`;
    } else {
      listText += `**${idx}.** @none\n-# <:00:1360567203325542431>Server Link: \`none\`\n`;
    }
  }

  const nowTs = Math.floor(Date.now() / 1000);
  const pageStr = `${page + 1}/${totalPages}`;

  return cv2([
    text("## 📜 List Partnership"),
    SEP,
    {
      type: 9,
      components: [text(listText.trimEnd())],
      accessory: { type: 2, style: 2, label: "Search", custom_id: `list_search_${page}` }
    },
    SEP,
    text(`-# Terakhir diperbarui: <t:${nowTs}:R> • Total partnership: ${total}`),
    {
      type: 1,
      components: [
        { type: 2, style: 2, label: "◀◀", custom_id: `list_page_first_${page}_${totalPages}` },
        { type: 2, style: 2, label: "◀",  custom_id: `list_page_prev_${page}_${totalPages}`  },
        { type: 2, style: 2, label: pageStr, custom_id: `list_page_info`, disabled: true },
        { type: 2, style: 2, label: "▶",  custom_id: `list_page_next_${page}_${totalPages}`  },
        { type: 2, style: 2, label: "▶▶", custom_id: `list_page_last_${page}_${totalPages}`  },
      ]
    },
    SEP,
    text("-# © Guild Partnership - EmpireBS"),
  ]);
}

async function handleListPage(interaction, action, page, totalPages) {
  // defer dulu agar aman
  await interaction.deferUpdate();

  const database = await getDb();
  const partners = await database.collection("partners").find({}).toArray();
  const total    = partners.length;
  const maxPage  = Math.max(0, Math.ceil(total / LIST_PER_PAGE) - 1);
  let newPage    = page;

  if      (action === "next")  newPage = page >= maxPage ? maxPage : page + 1;
  else if (action === "prev")  newPage = page <= 0       ? 0       : page - 1;
  else if (action === "first") newPage = page <= 0       ? maxPage : Math.max(0, page - 5);
  else if (action === "last")  newPage = page >= maxPage ? 0       : Math.min(maxPage, page + 5);

  await interaction.editReply(buildListEmbed(partners, newPage, totalPages, total));
  return true;
}

async function handleListSearch(interaction) {
  await interaction.showModal({
    title: "Cari Partnership",
    custom_id: "list_search_modal",
    components: [
      { type: 1, components: [{ type: 4, custom_id: "f_nama",   label: "Nama Server (Opsional)",         style: 1, required: false, placeholder: "Cari berdasarkan nama server" }] },
      { type: 1, components: [{ type: 4, custom_id: "f_link",   label: "Link Server (Opsional)",         style: 1, required: false, placeholder: "https://discord.gg/..." }] },
      { type: 1, components: [{ type: 4, custom_id: "f_partby", label: "Partnership By (Opsional)", style: 1, required: false, placeholder: "Username yang accept" }] },
    ]
  });
  return true;
}

// ... (handleListSearchModal tetap sama, tambahkan flags:64)

// ─── DM NOTIF YES/NO ─────────────────────────────────────────────────────────
async function handleNotifYesNo(interaction, logId, isYes) {
  await interaction.update({
    ...cv2([
      text("## 🔈 Notifikasi DM"),
      SEP,
      text(`> Saat pilih tombol **Iya Pake** bot <@1364585069812912148> akan kirim DM notifikasi.\n> postingan events sudah kekirim di <#1502206484489175101>\n\nNote: Saat ini tombol **${isYes ? "Iya Pake" : "Tidak Pake"}**`),
      SEP,
      {
        type: 1,
        components: [
          { type: 2, style: 3, label: "Iya Pake",   custom_id: `notif_yes_${logId}`, disabled:  isYes },
          { type: 2, style: 4, label: "Tidak Pake", custom_id: `notif_no_${logId}`,  disabled: !isYes },
        ]
      },
      SEP,
      text("-# © Guild Partnership - EmpireBS"),
    ])
  });
  return true;
}

// ─── MAIN INTERACTION ROUTER ─────────────────────────────────────────────────
async function handlePartnershipInteraction(interaction) {
  try {
    const id = interaction.customId || "";

    // SELECT MENU
    if (interaction.isStringSelectMenu() && id === "partner_menu") return handleMenu(interaction);

    // BUTTONS
    if (interaction.isButton()) {
      if (id === "partner_ketentuan")   return handleKetentuan(interaction);
      if (id === "partner_benefit")     return handleBenefit(interaction);
      if (id === "events_yes" || id === "events_no")     return handleEventsYesNo(interaction);
      if (id === "events_form")         return handleEventsForm(interaction);
      if (id === "repost_yes" || id === "repost_no")     return handleRepostYesNo(interaction);
      if (id === "repost_form")         return handleRepostForm(interaction);
      if (id === "stop_form")           return handleStopForm(interaction);
      if (id === "ticket_partner_yes" || id === "ticket_partner_no") return handleTicketYesNo(interaction);
      if (id === "ticket_partner_form") return handleTicketPartnerForm(interaction);

      if (id.startsWith("admin_accept_")) return handleAdminAccept(interaction, id.replace("admin_accept_", ""));
      if (id.startsWith("admin_reject_")) return handleAdminReject(interaction, id.replace("admin_reject_", ""));
      if (id.startsWith("admin_edit_"))   return handleAdminEdit(interaction,   id.replace("admin_edit_",   ""));

      if (id.startsWith("stop_accept_")) return handleStopAccept(interaction, id.replace("stop_accept_", ""));
      if (id.startsWith("stop_reject_")) return handleStopReject(interaction, id.replace("stop_reject_", ""));

      if (id.startsWith("notif_yes_")) return handleNotifYesNo(interaction, id.replace("notif_yes_", ""), true);
      if (id.startsWith("notif_no_"))  return handleNotifYesNo(interaction, id.replace("notif_no_",  ""), false);

      if (id.startsWith("list_page_")) {
        const parts  = id.split("_");
        const action = parts[2];
        const page   = parseInt(parts[3]);
        const total  = parseInt(parts[4]);
        return handleListPage(interaction, action, page, total);
      }
      if (id.startsWith("list_search_")) return handleListSearch(interaction);
    }

    // MODALS
    if (interaction.isModalSubmit()) {
      if (id === "events_modal_embed")           return handleEventsModalSubmit(interaction, true);
      if (id === "events_modal_plain")           return handleEventsModalSubmit(interaction, false);
      if (id === "repost_modal_embed")           return handleRepostModalSubmit(interaction, true);
      if (id === "repost_modal_plain")           return handleRepostModalSubmit(interaction, false);
      if (id === "ticket_partner_modal_embed")   return handleTicketPartnerModalSubmit(interaction, true);
      if (id === "ticket_partner_modal_plain")   return handleTicketPartnerModalSubmit(interaction, false);
      if (id === "stop_modal")                   return handleStopModalSubmit(interaction);
      if (id === "list_search_modal")            return handleListSearchModal(interaction);

      if (id.startsWith("admin_reject_modal_"))  return handleRejectModalSubmit(interaction, id.replace("admin_reject_modal_", ""));
      if (id.startsWith("admin_edit_modal_"))    return handleEditModalSubmit(interaction,   id.replace("admin_edit_modal_",   ""));
      if (id.startsWith("stop_accept_modal_"))   return handleStopAcceptModal(interaction,   id.replace("stop_accept_modal_",  ""));
    }
  } catch (err) {
    console.error("❌ Partnership interaction error:", err);
    try {
      if (!interaction.replied && !interaction.deferred) {
        await interaction.reply({ content: "❌ Terjadi kesalahan. Coba lagi.", flags: 64 });
      } else {
        await interaction.followUp({ content: "❌ Terjadi kesalahan. Coba lagi.", flags: 64 });
      }
    } catch (_) {}
  }
  return false;
}

// ─── INIT ─────────────────────────────────────────────────────────────────────
async function initPartnership(client) {
  console.log("✅ Partnership Module Initializing...");
  client.partnershipReady = true;

  try {
    const guild = client.guilds.cache.get("1347233781391560837");
    if (!guild) return;
    const dashCh = guild.channels.cache.get(CHANNEL.DASHBOARD);
    if (dashCh) {
      const msgs = await dashCh.messages.fetch({ limit: 10 });
      const existing = msgs.find(m => m.author.id === client.user.id && m.flags.has(32768));
      if (!existing) await sendDashboard(dashCh);
    }
  } catch (err) {
    console.error("❌ Partnership dashboard error:", err.message);
  }

  console.log("✅ Partnership Module Active");
}

module.exports = {
  initPartnership,
  handlePartnershipInteraction,
  handlePartnerCommand,
  sendDashboard,
};
