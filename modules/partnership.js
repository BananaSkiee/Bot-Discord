const { MongoClient } = require('mongodb');
const { 
  ModalBuilder, TextInputBuilder, TextInputStyle, ActionRowBuilder,
  PermissionFlagsBits, ChannelType
} = require('discord.js');

// ==================== KONFIGURASI ====================
const CFG = {
  GUILD_ID: '1347233781391560837',
  CH_DASHBOARD: '1498934645096448010',
  CH_SERVER_PARTNER: '1498934926630850693',
  CH_EVENT_PARTNER: '1502206484489175101',
  CH_FORUM_LOG: '1503130728278392853',
  CH_TICKET: '1498935151441219584',
  CAT_PARTNER: '1498933997005443082',
  ROLE_PARTNER: '1357693246268244209',
  ROLE_PARTNER_CMD: '1352286232779948144',
  BOT_ID: '1447102808900898887',
  MONGO_URI: 'mongodb+srv://AeroX:AeroX@aerox.cgfxn4x.mongodb.net/?retryWrites=true&w=majority&appName=AeroX',
  DB_NAME: 'partnership_akira'
};

// ==================== REST API HELPERS (V2 COMPONENTS) ====================
async function sendV2(channel, payload) {
  return await channel.client.rest.post(
    `/channels/${channel.id}/messages`,
    { body: payload }
  );
}

async function editV2(channel, messageId, payload) {
  return await channel.client.rest.patch(
    `/channels/${channel.id}/messages/${messageId}`,
    { body: payload }
  );
}

async function createForumThreadV2(forumChannel, name, payload, appliedTags = []) {
  return await forumChannel.client.rest.post(
    `/channels/${forumChannel.id}/threads`,
    {
      body: {
        name: name.substring(0, 100),
        message: payload,
        applied_tags: appliedTags
      }
    }
  );
}

async function replyV2Ephemeral(interaction, template) {
  return await interaction.client.rest.post(
    `/interactions/${interaction.id}/${interaction.token}/callback`,
    {
      body: {
        type: 4,
        data: { flags: 32768 | 64, ...template }
      }
    }
  );
}

async function updateV2(interaction, template) {
  return await interaction.client.rest.post(
    `/interactions/${interaction.id}/${interaction.token}/callback`,
    {
      body: { type: 7, data: template }
    }
  );
}

async function deferEphemeral(interaction) {
  return await interaction.client.rest.post(
    `/interactions/${interaction.id}/${interaction.token}/callback`,
    {
      body: { type: 5, data: { flags: 64 } }
    }
  );
}

// ==================== TEMPLATES V2 (100% SAMA PERSIS) ====================
const T = {
  dashboard() {
    return {
      flags: 32768,
      components: [{
        type: 17, spoiler: false,
        components: [
          { type: 10, content: '## <:1_:1486297322848653425> Partnership Requirement<<:00:1360567203325542431><:00:1360567203325542431><:00:1360567203325542431><:00:1360567203325542431>' },
          { type: 14 },
          { type: 10, content: '> - Member dan Staff server aktif\n> - Tidak mengandung konten NSFW.\n> - Tiada minimal jumlah member server.\n> - Gunakan channels partner bukan forum.\n> - Tidak menerima server khusus berjualan.\n> - Bebas dari konflik dengan komunitas lain.' },
          { type: 14 },
          { type: 1, components: [{
            type: 3,
            options: [
              { label: 'Open Partnership', value: 'open', emoji: { name: '🔍' } },
              { label: 'Posting Events', value: 'event', emoji: { name: '📥' } },
              { label: 'Re-Posting Partner', value: 'repost', emoji: { name: '🔃' } },
              { label: 'List Partnership', value: 'list', emoji: { name: '📜' } }
            ],
            custom_id: 'p_select_menu',
            min_values: 1, max_values: 1
          }] },
          { type: 14 },
          { type: 10, content: '-# © Guild Partnership - EmpireBS' }
        ]
      }]
    };
  },

  openPartner(hasRole) {
    if (hasRole) {
      return {
        flags: 32768,
        components: [{
          type: 17,
          components: [
            { type: 10, content: '## Kamu Sudah Berpartnership' },
            { type: 14 },
            { type: 10, content: 'Anda telah menjadi partner resmi EmpireBS. Silakan gunakan fitur Posting Events atau Re-Posting untuk kebutuhan promosi server Anda.' },
            { type: 14 },
            { type: 10, content: '-# © Guild Partnership - EmpireBS' }
          ]
        }]
      };
    }
    return {
      flags: 32768,
      components: [{
        type: 17,
        components: [
          { type: 10, content: '## 🔍 Pengajuan Partnership' },
          { type: 14 },
          { type: 10, content: '> - Pencet tombol **Open Tiket** di bawah dan pilih Request Partner\n> - Antri dan tertib tunggu diproses sesuai urutan, mohon bersabar\n> - Dilarang spam pesan berulang atau mention, demi kenyamanan' },
          { type: 14 },
          { type: 1, components: [
            { type: 2, style: 5, label: 'Open Ticket', emoji: { name: '📫' }, url: `https://discord.com/channels/${CFG.GUILD_ID}/${CFG.CH_TICKET}`, custom_id: 'p_btn_ticket' },
            { type: 2, style: 3, label: 'Benefit', emoji: { name: '🎀' }, custom_id: 'p_btn_benefit', flow: { actions: [] } },
            { type: 2, style: 1, label: 'Ketentuan Partner', emoji: { name: '📋' }, custom_id: 'p_btn_rules', flow: { actions: [] } }
          ] },
          { type: 14 },
          { type: 10, content: '-# © Guild Partnership - EmpireBS' }
        ]
      }]
    };
  },

  postingEvents(hasRole) {
    if (!hasRole) {
      return {
        flags: 32768,
        components: [{
          type: 17,
          components: [
            { type: 10, content: '## Berpartnership Terlebih dahulu' },
            { type: 14 },
            { type: 10, content: 'Anda harus menjadi partner resmi EmpireBS terlebih dahulu sebelum dapat mengakses fitur Posting Events. Silakan ajukan partnership melalui menu Open Partnership.' },
            { type: 14 },
            { type: 10, content: '-# © Guild Partnership - EmpireBS' }
          ]
        }]
      };
    }
    return {
      flags: 32768,
      components: [{
        type: 17,
        components: [
          { type: 10, content: '## 📥 Posting Events' },
          { type: 14 },
          { type: 10, content: '### Ketentuan Events: <:00:1360567203325542431><:00:1360567203325542431><:00:1360567203325542431><:00:1360567203325542431><:00:1360567203325542431><:00:1360567203325542431><:00:1360567203325542431><:00:1360567203325542431><:00:1360567203325542431><:00:1360567203325542431><:00:1360567203325542431><:00:1360567203325542431><:00:1360567203325542431><:00:1360567203325542431>\n> - Wajib gunakan mention khusus yang tersedia.\n> - Postingan ditinjau admin sebelum dipublikasikan.\n> - Admin berhak menyesuaikan teks sesuai ketentuan.\n### Prosedur:\n> - Pilih Yes/No untuk memakai embed atau tidak.\n> - Klik tombol di bawah dan lengkapi detail acara anda.' },
          { type: 14 },
          { type: 1, components: [
            { type: 2, style: 1, label: 'Isi Formulir Disini', emoji: { name: '📩' }, custom_id: 'p_form_event', flow: { actions: [] } },
            { type: 2, style: 3, label: 'Yes', emoji: { name: '' }, custom_id: 'p_yes_event', disabled: true, flow: { actions: [] } },
            { type: 2, style: 4, label: 'No', emoji: { name: '' }, custom_id: 'p_no_event', flow: { actions: [] } }
          ] },
          { type: 14 },
          { type: 10, content: '-# © Guild Partnership - EmpireBS' }
        ]
      }]
    };
  },

  repostPartner(hasRole) {
    if (!hasRole) {
      return {
        flags: 32768,
        components: [{
          type: 17,
          components: [
            { type: 10, content: '## Berpartnership Terlebih dahulu' },
            { type: 14 },
            { type: 10, content: 'Anda harus menjadi partner resmi EmpireBS terlebih dahulu sebelum dapat mengakses fitur Re-Posting Partnership. Silakan ajukan partnership melalui menu Open Partnership.' },
            { type: 14 },
            { type: 10, content: '-# © Guild Partnership - EmpireBS' }
          ]
        }]
      };
    }
    return {
      flags: 32768,
      components: [{
        type: 17,
        components: [
          { type: 10, content: '## 🔃 Re-Posting Partnership' },
          { type: 14 },
          { type: 10, content: '### Ketentuan Utama:<:00:1360567203325542431><:00:1360567203325542431><:00:1360567203325542431><:00:1360567203325542431><:00:1360567203325542431><:00:1360567203325542431><:00:1360567203325542431><:00:1360567203325542431><:00:1360567203325542431><:00:1360567203325542431><:00:1360567203325542431><:00:1360567203325542431><:00:1360567203325542431><:00:1360567203325542431>\n> - Cooldown 1 minggu sekali.\n> - Saling memposting ulang deskripsi.\n> - Gunakan mention khusus yang tersedia.\n### Prosedur:\n> - Pilih Yes/No untuk memakai embed atau tidak.\n> - Postingan ditinjau admin sebelum dipublikasikan.\n> - Admin berhak menyesuaikan teks sesuai ketentuan.\n> - Klik tombol di bawah dan lengkapi data server anda.' },
          { type: 14 },
          { type: 1, components: [
            { type: 2, style: 1, label: 'Isi Formulir Disini', emoji: { name: '📩' }, custom_id: 'p_form_repost', flow: { actions: [] } },
            { type: 2, style: 3, label: 'Yes', emoji: { name: '' }, custom_id: 'p_yes_repost', disabled: true, flow: { actions: [] } },
            { type: 2, style: 4, label: 'No', emoji: { name: '' }, custom_id: 'p_no_repost', flow: { actions: [] } }
          ] },
          { type: 14 },
          { type: 10, content: '-# © Guild Partnership - EmpireBS' }
        ]
      }]
    };
  },

  benefit() {
    return {
      flags: 32768,
      components: [{
        type: 17,
        components: [
          { type: 10, content: '## 🎀 Benefit Partnership <:00:1360567203325542431><:00:1360567203325542431><:00:1360567203325542431><:00:1360567203325542431><:00:1360567203325542431><:00:1360567203325542431><:00:1360567203325542431><:00:1360567203325542431><:00:1360567203325542431>' },
          { type: 14 },
          { type: 10, content: '> - Relasi: Membangun koneksi antar-server secara resmi\n\n> - Promosi Event: Kesempatan membagikan event Anda\n\n> - Kolaborasi: Mengadakan proyek bersama EmpireBS\n\n> - Role Eksklusif: Mendapatkan role khusus Partnership' },
          { type: 14 },
          { type: 10, content: '-# © Guild Partnership - EmpireBS' }
        ]
      }]
    };
  },

  rules() {
    return {
      flags: 32768,
      components: [{
        type: 17,
        components: [
          { type: 10, content: '## 📋 Ketentuan Partnership' },
          { type: 14 },
          { type: 10, content: '> -  Perwakilan staff wajib bergabung sebagai perwakilan. Saling post event bersifat timbal balik.\n\n> - Gunakan tiket untuk pengajuan event. Dilarang menggunakan mention everyone tanpa izin.\n\n> - Wajib memposting deskripsi/event server kami. Kelalaian dalam posting dapat mengakibatkan pemutusan kerja sama.\n\n> - Perwakilan dilarang keluar server tanpa koordinasi. Jika perwakilan keluar tanpa alasan, partner akan diputus.\n\n> - Admin berhak mengedit konten postingan dan memutus kerja sama jika melanggar ketentuan di atas.' },
          { type: 14 },
          { type: 10, content: '-# © Guild Partnership - EmpireBS' }
        ]
      }]
    };
  },

  partnerCmdForm(useV2) {
    return {
      flags: 32768,
      components: [{
        type: 17,
        components: [
          { type: 10, content: '## ✉️ Pengajuan Partnership' },
          { type: 14 },
          { type: 10, content: '> Click dibawah ini untuk isi deskripsi server kamu\n\n**Note:** Pilih Yes/No untuk menggunakan embed atau tidak.' },
          { type: 14 },
          { type: 1, components: [
            { type: 2, style: 1, label: 'Isi Formulir Disini', emoji: { name: '📩' }, custom_id: 'p_cmd_form', flow: { actions: [] } },
            { type: 2, style: 3, label: 'Yes', custom_id: 'p_cmd_yes', disabled: useV2, flow: { actions: [] } },
            { type: 2, style: 4, label: 'No', custom_id: 'p_cmd_no', disabled: !useV2, flow: { actions: [] } }
          ] },
          { type: 14 },
          { type: 10, content: '-# © Guild Partnership - EmpireBS' }
        ]
      }]
    };
  },

  warningNoRole() {
    return {
      flags: 32768,
      components: [{
        type: 17,
        components: [
          { type: 10, content: '## ⛔ Akses Ditolak' },
          { type: 14 },
          { type: 10, content: 'Maaf, Anda tidak memiliki izin untuk menggunakan perintah ini. Fitur partnership hanya dapat diakses oleh staff dengan role khusus. Silakan hubungi admin server untuk informasi lebih lanjut.' },
          { type: 14 },
          { type: 10, content: '-# © Guild Partnership - EmpireBS' }
        ]
      }]
    };
  },

  warningLimit() {
    return {
      flags: 32768,
      components: [{
        type: 17,
        components: [
          { type: 10, content: '## ⚠️ Batas Penggunaan Tercapai' },
          { type: 14 },
          { type: 10, content: 'Maaf, channel ini telah mencapai batas maksimal pengajuan partnership (3 kali). Silakan gunakan channel lain atau hubungi admin untuk bantuan lebih lanjut.' },
          { type: 14 },
          { type: 10, content: '-# © Guild Partnership - EmpireBS' }
        ]
      }]
    };
  },

  dmToggle(current) {
    const yesDisabled = current === 'yes';
    const noDisabled = current === 'no';
    const note = current === 'yes'
      ? 'Saat ini tombol **Iya Pake**'
      : 'Saat ini tombol **Tidak Pake**';
    return {
      flags: 32768,
      components: [{
        type: 17,
        components: [
          { type: 10, content: '## 🔈 Notifikasi DM' },
          { type: 14 },
          { type: 10, content: `> Saat pilih tombol **Iya Pake** bot <@${CFG.BOT_ID}> akan kirim DM notifikasi.\n> postingan events sudah kekirim di <#${CFG.CH_EVENT_PARTNER}>\n\nNote: ${note}` },
          { type: 14 },
          { type: 1, components: [
            { type: 2, style: 3, label: 'Iya Pake', custom_id: 'p_dm_yes', disabled: yesDisabled, flow: { actions: [] } },
            { type: 2, style: 4, label: 'Tidak Pake', custom_id: 'p_dm_no', disabled: noDisabled, flow: { actions: [] } }
          ] },
          { type: 14 },
          { type: 10, content: '-# © Guild Partnership - EmpireBS' }
        ]
      }]
    };
  },

  dmNotification(userId, accepterId, messageId, duration) {
    return {
      flags: 32768,
      components: [{
        type: 17,
        components: [
          { type: 9, components: [{ type: 10, content: '## <:1_:1486297322848653425> Notifikasi DM' }], accessory: {
            type: 2, style: 5, label: 'Messages',
            url: `https://discord.com/channels/${CFG.GUILD_ID}/${CFG.CH_EVENT_PARTNER}/${messageId}`,
            custom_id: 'p_dm_link'
          }},
          { type: 14 },
          { type: 10, content: `Postingan Events kamu sudah kekirim di <#${CFG.CH_EVENT_PARTNER}>\nDi Accept oleh: <@${accepterId}>` },
          { type: 14 },
          { type: 10, content: `-# © Guild Partnership - EmpireBS • ${duration}` }
        ]
      }]
    };
  },

  listPartners(partners, page, totalPages, totalCount) {
    let content = '';
    partners.forEach((p, i) => {
      const num = (page - 1) * 10 + i + 1;
      const mention = p.userId ? `<@${p.userId}>` : '@none';
      const link = p.link ? `[${p.serverName || 'Nama server'}](${p.link})` : '`none`';
      content += `**${num}.** ${mention}\n-# <:00:1360567203325542431>Server Link: ${link}\n`;
    });
    for (let i = partners.length; i < 10; i++) {
      const num = (page - 1) * 10 + i + 1;
      content += `**${num}.** @none\n-# <:00:1360567203325542431>Server Link: \\`none\\`\n`;
    }
    const now = Math.floor(Date.now() / 1000);
    return {
      flags: 32768,
      components: [{
        type: 17,
        components: [
          { type: 10, content: '## 📜 List Partnership' },
          { type: 14 },
          { type: 9, components: [{ type: 10, content: content }], accessory: {
            type: 2, style: 2, flow: { actions: [] }, custom_id: 'p_search', label: 'Search'
          }},
          { type: 14 },
          { type: 10, content: `-# Terakhir diperbarui: <t:${now}:R> • Total partnership: ${totalCount}` },
          { type: 1, components: [
            { type: 2, style: 2, flow: { actions: [] }, custom_id: `p_list_first_${page}_${totalPages}`, label: '◀◀' },
            { type: 2, style: 2, flow: { actions: [] }, custom_id: `p_list_prev_${page}_${totalPages}`, label: '◀' },
            { type: 2, style: 2, flow: { actions: [] }, custom_id: `p_list_page_${page}_${totalPages}`, label: `${page}/${totalPages}`, disabled: true },
            { type: 2, style: 2, flow: { actions: [] }, custom_id: `p_list_next_${page}_${totalPages}`, label: '▶' },
            { type: 2, style: 2, flow: { actions: [] }, custom_id: `p_list_last_${page}_${totalPages}`, label: '▶▶' }
          ] },
          { type: 14 },
          { type: 10, content: '-# © Guild Partnership - EmpireBS' }
        ]
      }]
    };
  },

  pendingReview(data, type) {
    const label = type === 'partnership' ? 'Pengajuan Partnership' : type === 'event' ? 'Posting Events' : 'Re-Posting Partnership';
    const serverName = data.serverName || 'Unknown';
    if (data.useV2) {
      const color = data.sidebarColor ? parseInt(data.sidebarColor.replace('#', ''), 16) || 16711685 : 16711685;
      return {
        flags: 32768,
        components: [{
          type: 17,
          accent_color: color,
          components: [
            { type: 10, content: `# ${data.title || serverName}` },
            { type: 14 },
            { type: 10, content: data.description },
            { type: 14 },
            ...(data.banner ? [{ type: 12, items: [{ media: { url: data.banner } }] }] : []),
            { type: 14 },
            { type: 1, components: [
              { type: 2, style: 3, label: 'Accept', custom_id: `p_accept_${type}_${data.userId}`, flow: { actions: [] } },
              { type: 2, style: 4, label: 'Reject', custom_id: `p_reject_${type}_${data.userId}`, flow: { actions: [] } },
              { type: 2, style: 1, label: 'Edit Pesan', custom_id: `p_edit_${type}_${data.userId}`, flow: { actions: [] } },
              { type: 2, style: 2, label: serverName, custom_id: `p_name_${type}_${data.userId}`, flow: { actions: [] } }
            ] },
            { type: 14 },
            { type: 10, content: '-# © Guild Partnership - EmpireBS' }
          ]
        }]
      };
    } else {
      return {
        content: `${data.description}\n\n📎 | Server Link: [${data.link}](<<${data.link}>)\n🏷️ | Partner By: <@${data.userId}>\n\n-# © Guild Partnership - EmpireBS`,
        components: [{
          type: 1,
          components: [
            { type: 2, style: 3, label: 'Accept', custom_id: `p_accept_${type}_${data.userId}` },
            { type: 2, style: 4, label: 'Reject', custom_id: `p_reject_${type}_${data.userId}` },
            { type: 2, style: 1, label: 'Edit Pesan', custom_id: `p_edit_${type}_${data.userId}` },
            { type: 2, style: 2, label: serverName, custom_id: `p_name_${type}_${data.userId}` }
          ]
        }]
      };
    }
  },

  forumLog(data, type, accepter, duration, messageId) {
    const user = data.user;
    const createdTimestamp = user?.createdAt ? Math.floor(user.createdAt / 1000) : Math.floor(Date.now() / 1000);
    const daysSince = user?.createdAt ? Math.floor((Date.now() - user.createdAt) / 86400000) : 0;
    const now = new Date();
    const timeStr = now.toLocaleString('id-ID', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' }).replace('.', ':');
    const titles = { partnership: 'Success Partnership', repost: 'Success Re-Posting Partnership', event: 'Success Events Posts' };
    const logId = `PARTNER-${data.userId}-${Math.random().toString(36).substring(2, 10).toUpperCase()}`;
    return {
      flags: 32768,
      components: [{
        type: 17,
        components: [
          { type: 10, content: `## ✅ ${data.serverName} ${titles[type]}` },
          { type: 14 },
          { type: 10, content: `**👤 Informasi User**\n> **Username:** [${user?.username || 'Unknown'}](https://discord.com/users/${data.userId})\n> **ID:** \\`${data.userId}\\`\n> **Display Name:** ${user?.displayName || 'Unknown'}\n> **Akun Dibuat:** <t:${createdTimestamp}:R> (${daysSince} hari)` },
          { type: 14 },
          { type: 10, content: `**📊 Detail Verifikasi**\n> **Waktu Selesai:** ${timeStr}\n> **Total Durasi:** ${duration}\n> **Accept Partner:** [${accepter?.username || 'Unknown'}](https://discord.com/users/${accepter?.id || '0'})\n> **Pesan Partner:** [Go To Messages](https://discord.com/channels/${CFG.GUILD_ID}/${data.channelId || CFG.CH_SERVER_PARTNER}/${messageId})\n> **Link Server:** ${data.link || 'N/A'}` },
          { type: 14 },
          { type: 10, content: `**🛡️ Security Info**\n> **Status:** ${data.partnerRoleGiven ? 'Yes' : 'No'}\n> **Edit Pesan:** ${data.edited ? 'Yes' : 'No'}\n> **Boost:** ${data.boost ? 'Yes' : 'No'}\n> **System:** Component V2 + MongoDB${type !== 'partnership' ? `\n> **Nama Server:** ${data.serverName}` : ''}` },
          { type: 14 },
          { type: 10, content: `\n-# Log ID: ${logId}` }
        ]
      }]
    };
  }
};

// ==================== MAIN CLASS ====================
class PartnershipSystem {
  constructor(client) {
    this.client = client;
    this.db = null;
    this.partners = null;
    this.posts = null;
    this.limits = null;
    this.dmSettings = null;
  }

  async connect() {
    const mongo = new MongoClient(CFG.MONGO_URI);
    await mongo.connect();
    this.db = mongo.db(CFG.DB_NAME);
    this.partners = this.db.collection('partners');
    this.posts = this.db.collection('posts');
    this.limits = this.db.collection('limits');
    this.dmSettings = this.db.collection('dm_settings');
    await this.partners.createIndex({ userId: 1 });
    await this.partners.createIndex({ serverName: 1 });
    await this.posts.createIndex({ userId: 1, type: 1 });
    await this.limits.createIndex({ channelId: 1 });
    console.log('✅ Partnership MongoDB Connected');
  }

  async initDashboard() {
    const channel = await this.client.channels.fetch(CFG.CH_DASHBOARD).catch(() => null);
    if (!channel) return console.error('❌ Dashboard channel not found');
    const messages = await channel.messages.fetch({ limit: 10 });
    const botMsgs = messages.filter(m => m.author.id === this.client.user.id);
    await channel.bulkDelete(botMsgs).catch(() => {});
    await sendV2(channel, T.dashboard());
    console.log('✅ Partnership Dashboard deployed');
  }

  async handleInteraction(interaction) {
    if (!interaction.guild || interaction.guild.id !== CFG.GUILD_ID) return false;
    if (!interaction.customId?.startsWith('p_')) return false;
    try {
      if (interaction.isStringSelectMenu()) await this.handleSelectMenu(interaction);
      else if (interaction.isButton()) await this.handleButton(interaction);
      else if (interaction.isModalSubmit()) await this.handleModal(interaction);
      return true;
    } catch (err) {
      console.error('❌ Partnership interaction error:', err);
      try {
        if (!interaction.replied && !interaction.deferred) {
          await replyV2Ephemeral(interaction, {
            components: [{
              type: 17,
              components: [
                { type: 10, content: '❌ Terjadi kesalahan. Silakan coba lagi.' },
                { type: 14 },
                { type: 10, content: '-# © Guild Partnership - EmpireBS' }
              ]
            }]
          });
        }
      } catch {}
      return true;
    }
  }

  async handleSelectMenu(interaction) {
    const value = interaction.values[0];
    const member = interaction.member;
    const hasPartnerRole = member.roles.cache.has(CFG.ROLE_PARTNER);
    switch (value) {
      case 'open': await replyV2Ephemeral(interaction, T.openPartner(hasPartnerRole)); break;
      case 'event': await replyV2Ephemeral(interaction, T.postingEvents(hasPartnerRole)); break;
      case 'repost': await replyV2Ephemeral(interaction, T.repostPartner(hasPartnerRole)); break;
      case 'list': await this.showList(interaction, 1); break;
    }
  }

  async handleButton(interaction) {
    const cid = interaction.customId;
    const member = interaction.member;

    if (cid.startsWith('p_yes_') || cid.startsWith('p_no_')) {
      const type = cid.replace('p_yes_', '').replace('p_no_', '');
      const isYes = cid.startsWith('p_yes_');
      await this.toggleYesNo(interaction, type, isYes);
      return;
    }

    if (cid === 'p_cmd_yes' || cid === 'p_cmd_no') {
      await this.toggleCmdYesNo(interaction, cid === 'p_cmd_yes');
      return;
    }

    if (cid === 'p_form_event' || cid === 'p_form_repost' || cid === 'p_cmd_form') {
      const type = cid === 'p_form_event' ? 'event' : cid === 'p_form_repost' ? 'repost' : 'partnership';
      await this.showFormModal(interaction, type);
      return;
    }

    if (cid === 'p_btn_benefit') { await replyV2Ephemeral(interaction, T.benefit()); return; }
    if (cid === 'p_btn_rules') { await replyV2Ephemeral(interaction, T.rules()); return; }

    if (cid.startsWith('p_accept_')) {
      const [, , type, userId] = cid.split('_');
      await this.handleAccept(interaction, type, userId);
      return;
    }
    if (cid.startsWith('p_reject_')) {
      const [, , type, userId] = cid.split('_');
      await this.handleReject(interaction, type, userId);
      return;
    }
    if (cid.startsWith('p_edit_')) {
      const [, , type, userId] = cid.split('_');
      await this.handleEdit(interaction, type, userId);
      return;
    }
    if (cid.startsWith('p_name_')) {
      await replyV2Ephemeral(interaction, {
        components: [{
          type: 17,
          components: [
            { type: 10, content: 'ℹ️ Informasi server partner.' },
            { type: 14 },
            { type: 10, content: '-# © Guild Partnership - EmpireBS' }
          ]
        }]
      });
      return;
    }

    if (cid === 'p_dm_yes' || cid === 'p_dm_no') {
      await this.handleDmToggle(interaction, cid === 'p_dm_yes');
      return;
    }

    if (cid.startsWith('p_list_')) {
      await this.handlePagination(interaction, cid);
      return;
    }

    if (cid === 'p_search') {
      await this.showSearchModal(interaction);
      return;
    }

    await replyV2Ephemeral(interaction, {
      components: [{
        type: 17,
        components: [
          { type: 10, content: '❌ Aksi tidak dikenal.' },
          { type: 14 },
          { type: 10, content: '-# © Guild Partnership - EmpireBS' }
        ]
      }]
    });
  }

  async toggleYesNo(interaction, type, isYes) {
    const template = type === 'event' ? T.postingEvents(true) : T.repostPartner(true);
    const container = template.components[0];
    const row = container.components.find(c => c.type === 1);
    row.components.forEach(btn => {
      if (btn.custom_id === `p_yes_${type}`) btn.disabled = isYes;
      if (btn.custom_id === `p_no_${type}`) btn.disabled = !isYes;
    });
    await updateV2(interaction, template);
  }

  async toggleCmdYesNo(interaction, isYes) {
    await updateV2(interaction, T.partnerCmdForm(isYes));
  }

  async showFormModal(interaction, type) {
    const yesBtn = interaction.message.components?.[0]?.components
      ?.find(c => c.type === 1)?.components
      ?.find(b => b.custom_id?.includes('yes'));
    const isV2 = yesBtn?.disabled || false;

    const modal = new ModalBuilder()
      .setCustomId(`p_modal_${type}_${isV2}`)
      .setTitle(type === 'event' ? 'Formulir Posting Events' : type === 'repost' ? 'Formulir Re-Posting' : 'Formulir Partnership');

    const inputs = [];
    inputs.push(new ActionRowBuilder().addComponents(
      new TextInputBuilder().setCustomId('judul').setLabel('Judul (Nama Server)').setPlaceholder('Masukkan nama server Anda').setStyle(TextInputStyle.Short).setRequired(true).setMaxLength(100)
    ));
    inputs.push(new ActionRowBuilder().addComponents(
      new TextInputBuilder().setCustomId('deskripsi').setLabel('Deskripsi Server').setPlaceholder('Jelaskan deskripsi server Anda secara detail').setStyle(TextInputStyle.Paragraph).setRequired(true).setMaxLength(4000)
    ));

    if (isV2) {
      inputs.push(new ActionRowBuilder().addComponents(
        new TextInputBuilder().setCustomId('banner').setLabel('Banner (Link Banner)').setPlaceholder('https://cdn.discordapp.com/attachments/.../banner.gif').setStyle(TextInputStyle.Short).setRequired(true)
      ));
    }

    inputs.push(new ActionRowBuilder().addComponents(
      new TextInputBuilder().setCustomId('link').setLabel('Link Server').setPlaceholder('https://discord.gg/invite').setStyle(TextInputStyle.Short).setRequired(true)
    ));

    if (isV2) {
      inputs.push(new ActionRowBuilder().addComponents(
        new TextInputBuilder().setCustomId('color').setLabel('Sidebar Color (Opsional)').setPlaceholder('#FF5733 atau kosongkan untuk default').setStyle(TextInputStyle.Short).setRequired(false)
      ));
    }

    modal.addComponents(...inputs);
    await interaction.showModal(modal);
  }

  async handleModal(interaction) {
    const cid = interaction.customId;
    if (cid.startsWith('p_modal_')) {
      const [, , type, isV2] = cid.split('_');
      await this.handleFormSubmit(interaction, type, isV2 === 'true');
    } else if (cid.startsWith('p_reject_modal_')) {
      const [, , , type, userId] = cid.split('_');
      await this.handleRejectSubmit(interaction, type, userId);
    } else if (cid.startsWith('p_edit_modal_')) {
      const [, , , type, userId] = cid.split('_');
      await this.handleEditSubmit(interaction, type, userId);
    } else if (cid === 'p_search_modal') {
      await this.handleSearchSubmit(interaction);
    }
  }

  async handleFormSubmit(interaction, type, isV2) {
    // Cek limit channel (!partner)
    const limit = await this.limits.findOne({ channelId: interaction.channel.id });
    if (limit && limit.count >= 3) {
      return replyV2Ephemeral(interaction, T.warningLimit());
    }

    const judul = interaction.fields.getTextInputValue('judul');
    const deskripsi = interaction.fields.getTextInputValue('deskripsi');
    const link = interaction.fields.getTextInputValue('link');
    const banner = isV2 ? interaction.fields.getTextInputValue('banner') : null;
    const color = isV2 ? (interaction.fields.getTextInputValue('color') || '') : '';

    const data = {
      userId: interaction.user.id,
      serverName: judul,
      title: judul,
      description: deskripsi,
      link,
      banner,
      sidebarColor: color,
      useV2: isV2,
      type,
      status: 'pending',
      createdAt: new Date(),
      edited: false,
      boost: false,
      partnerRoleGiven: false
    };

    await this.partners.updateOne(
      { userId: interaction.user.id, type, status: 'pending' },
      { $set: data },
      { upsert: true }
    );

    // Increment limit jika ada
    if (limit) {
      await this.limits.updateOne({ channelId: interaction.channel.id }, { $inc: { count: 1 } });
    }

    const reviewChannelId = type === 'event' ? CFG.CH_EVENT_PARTNER : CFG.CH_SERVER_PARTNER;
    const reviewChannel = await this.client.channels.fetch(reviewChannelId).catch(() => null);

    if (reviewChannel) {
      const payload = T.pendingReview(data, type);
      const msg = await sendV2(reviewChannel, payload);
      await this.partners.updateOne(
        { userId: interaction.user.id, type, status: 'pending' },
        { $set: { reviewMessageId: msg.id, reviewChannelId } }
      );

      if (type === 'event') {
        const dmMsg = await sendV2(reviewChannel, { ...T.dmToggle('no'), content: `-# [.](${link})` });
        await this.partners.updateOne(
          { userId: interaction.user.id, type, status: 'pending' },
          { $set: { dmToggleMessageId: dmMsg.id } }
        );
      }
    }

    await replyV2Ephemeral(interaction, {
      components: [{
        type: 17,
        components: [
          { type: 10, content: `✅ Formulir ${type === 'event' ? 'Posting Events' : type === 'repost' ? 'Re-Posting' : 'Partnership'} berhasil dikirim! Silakan tunggu review dari admin.` },
          { type: 14 },
          { type: 10, content: '-# © Guild Partnership - EmpireBS' }
        ]
      }]
    });
  }

  async handleAccept(interaction, type, userId) {
    await deferEphemeral(interaction);
    const partner = await this.partners.findOne({ userId, type, status: 'pending' });
    if (!partner) {
      return editV2(interaction.channel, interaction.message.id, {
        flags: 32768 | 64,
        components: [{
          type: 17,
          components: [
            { type: 10, content: '❌ Data partnership tidak ditemukan atau sudah diproses.' },
            { type: 14 },
            { type: 10, content: '-# © Guild Partnership - EmpireBS' }
          ]
        }]
      });
    }

    const startTime = partner.createdAt.getTime();
    const durationMs = Date.now() - startTime;
    const duration = this.formatDuration(durationMs);

    // Beri role partner
    const guild = interaction.guild;
    const member = await guild.members.fetch(userId).catch(() => null);
    if (member && !member.roles.cache.has(CFG.ROLE_PARTNER)) {
      await member.roles.add(CFG.ROLE_PARTNER).catch(() => {});
      partner.partnerRoleGiven = true;
    } else {
      partner.partnerRoleGiven = member?.roles.cache.has(CFG.ROLE_PARTNER) || false;
    }

    partner.status = 'accepted';
    partner.acceptedAt = new Date();
    partner.acceptedBy = interaction.user.id;
    partner.edited = false;
    partner.boost = false;

    const targetChannelId = type === 'event' ? CFG.CH_EVENT_PARTNER : CFG.CH_SERVER_PARTNER;
    const targetChannel = await this.client.channels.fetch(targetChannelId).catch(() => null);

    let publicMessageId = null;

    if (targetChannel) {
      // Hapus post lama jika repost
      if (type === 'repost') {
        const oldPosts = await this.posts.find({ userId, channelId: CFG.CH_SERVER_PARTNER }).toArray();
        for (const old of oldPosts) {
          const oldMsg = await targetChannel.messages.fetch(old.messageId).catch(() => null);
          if (oldMsg) await oldMsg.delete().catch(() => {});
        }
      }

      let publicMessage;
      if (partner.useV2) {
        const color = partner.sidebarColor ? parseInt(partner.sidebarColor.replace('#', ''), 16) || 16711685 : 16711685;
        const payload = {
          flags: 32768,
          components: [{
            type: 17,
            accent_color: color,
            components: [
              { type: 10, content: `# ${partner.title}` },
              { type: 14 },
              { type: 10, content: partner.description },
              { type: 14 },
              ...(partner.banner ? [{ type: 12, items: [{ media: { url: partner.banner } }] }] : []),
              { type: 14 },
              { type: 10, content: `📎 | Server Link: [${partner.link}](<<${partner.link}>)\n🏷️ | Partner By: <@${userId}>` },
              { type: 14 },
              { type: 10, content: '-# © Guild Partnership - EmpireBS' }
            ]
          }]
        };
        publicMessage = await sendV2(targetChannel, payload);
      } else {
        let content = `${partner.description}\n\n📎 | Server Link: [${partner.link}](<<${partner.link}>)\n🏷️ | Partner By: <@${userId}>\n\n-# © Guild Partnership - EmpireBS`;
        if (type === 'event') content += `\n-# [.](${partner.link})`;
        publicMessage = await targetChannel.send({ content });
      }

      publicMessageId = publicMessage.id;
      if ((type === 'partnership' || type === 'repost') && publicMessage.pin) {
        await publicMessage.pin().catch(() => {});
      }
    }

    await this.posts.updateOne(
      { userId, type },
      { $set: { messageId: publicMessageId, channelId: targetChannelId, serverName: partner.serverName, acceptedAt: new Date() } },
      { upsert: true }
    );

    await this.partners.updateOne(
      { _id: partner._id },
      { $set: { status: 'accepted', partnerRoleGiven: partner.partnerRoleGiven, publicMessageId, publicChannelId: targetChannelId } }
    );

    // Forum Log
    const user = await this.client.users.fetch(userId).catch(() => null);
    await this.createOrUpdateForumLog({
      ...partner,
      user: user ? { username: user.username, displayName: user.displayName || user.username, createdAt: user.createdAt } : null,
      channelId: targetChannelId
    }, type, interaction.user, duration, publicMessageId);

    // DM Notifikasi untuk Events
    if (type === 'event') {
      const dmSetting = await this.dmSettings.findOne({ userId });
      if (dmSetting?.dmEnabled) {
        const targetUser = await this.client.users.fetch(userId).catch(() => null);
        if (targetUser) {
          const dmCh = targetUser.dmChannel || await targetUser.createDM().catch(() => null);
          if (dmCh) {
            await sendV2(dmCh, T.dmNotification(userId, interaction.user.id, publicMessageId, duration)).catch(() => {});
          }
        }
      }
    }

    // Hapus review message
    if (partner.reviewMessageId && partner.reviewChannelId) {
      const ch = await this.client.channels.fetch(partner.reviewChannelId).catch(() => null);
      if (ch) {
        const msg = await ch.messages.fetch(partner.reviewMessageId).catch(() => null);
        if (msg) await msg.delete().catch(() => {});
      }
    }

    await editV2(interaction.channel, interaction.message.id, {
      flags: 32768 | 64,
      components: [{
        type: 17,
        components: [
          { type: 10, content: `✅ ${type === 'event' ? 'Event' : 'Partnership'} telah di-accept!` },
          { type: 14 },
          { type: 10, content: '-# © Guild Partnership - EmpireBS' }
        ]
      }]
    });
  }

  async handleReject(interaction, type, userId) {
    const modal = new ModalBuilder()
      .setCustomId(`p_reject_modal_${type}_${userId}`)
      .setTitle('Alasan Penolakan');
    modal.addComponents(new ActionRowBuilder().addComponents(
      new TextInputBuilder()
        .setCustomId('reason')
        .setLabel('Alasan Penolakan')
        .setPlaceholder('Jelaskan minimal 10 kata mengapa partnership ini ditolak...')
        .setStyle(TextInputStyle.Paragraph)
        .setRequired(true)
        .setMinLength(20)
    ));
    await interaction.showModal(modal);
  }

  async handleRejectSubmit(interaction, type, userId) {
    const reason = interaction.fields.getTextInputValue('reason');
    const wordCount = reason.trim().split(/\s+/).length;
    if (wordCount < 10) {
      return replyV2Ephemeral(interaction, {
        components: [{
          type: 17,
          components: [
            { type: 10, content: '❌ Alasan penolakan minimal harus 10 kata.' },
            { type: 14 },
            { type: 10, content: '-# © Guild Partnership - EmpireBS' }
          ]
        }]
      });
    }

    await deferEphemeral(interaction);

    await this.partners.updateOne(
      { userId, type, status: 'pending' },
      { $set: { status: 'rejected', rejectedReason: reason, rejectedAt: new Date(), rejectedBy: interaction.user.id } }
    );

    const user = await this.client.users.fetch(userId).catch(() => null);
    if (user) {
      const dm = user.dmChannel || await user.createDM().catch(() => null);
      if (dm) {
        await sendV2(dm, {
          flags: 32768,
          components: [{
            type: 17,
            components: [
              { type: 10, content: '## ❌ Partnership Ditolak' },
              { type: 14 },
              { type: 10, content: `Maaf, pengajuan ${type === 'event' ? 'Posting Events' : type === 'repost' ? 'Re-Posting Partnership' : 'Partnership'} Anda telah ditolak.\n\n**Alasan:**\n> ${reason}\n\nSilakan perbaiki sesuai ketentuan dan ajukan kembali.` },
              { type: 14 },
              { type: 10, content: '-# © Guild Partnership - EmpireBS' }
            ]
          }]
        }).catch(() => {});
      }
    }

    const partner = await this.partners.findOne({ userId, type, status: 'rejected' });
    if (partner?.reviewMessageId && partner?.reviewChannelId) {
      const ch = await this.client.channels.fetch(partner.reviewChannelId).catch(() => null);
      if (ch) {
        const msg = await ch.messages.fetch(partner.reviewMessageId).catch(() => null);
        if (msg) await msg.delete().catch(() => {});
      }
    }

    await editV2(interaction.channel, interaction.message.id, {
      flags: 32768 | 64,
      components: [{
        type: 17,
        components: [
          { type: 10, content: '✅ Partnership telah ditolak dan user telah diberitahu via DM.' },
          { type: 14 },
          { type: 10, content: '-# © Guild Partnership - EmpireBS' }
        ]
      }]
    });
  }

  async handleEdit(interaction, type, userId) {
    const partner = await this.partners.findOne({ userId, type, status: 'pending' });
    if (!partner) {
      return replyV2Ephemeral(interaction, {
        components: [{
          type: 17,
          components: [
            { type: 10, content: '❌ Data tidak ditemukan.' },
            { type: 14 },
            { type: 10, content: '-# © Guild Partnership - EmpireBS' }
          ]
        }]
      });
    }
    const modal = new ModalBuilder()
      .setCustomId(`p_edit_modal_${type}_${userId}`)
      .setTitle('Edit Pesan Partnership');
    modal.addComponents(new ActionRowBuilder().addComponents(
      new TextInputBuilder()
        .setCustomId('new_desc')
        .setLabel('Deskripsi Baru')
        .setValue(partner.description.substring(0, 4000))
        .setPlaceholder('Masukkan deskripsi baru...')
        .setStyle(TextInputStyle.Paragraph)
        .setRequired(true)
    ));
    await interaction.showModal(modal);
  }

  async handleEditSubmit(interaction, type, userId) {
    const newDesc = interaction.fields.getTextInputValue('new_desc');
    await deferEphemeral(interaction);

    await this.partners.updateOne(
      { userId, type, status: 'pending' },
      { $set: { description: newDesc, edited: true } }
    );

    const partner = await this.partners.findOne({ userId, type, status: 'pending' });
    if (partner?.reviewMessageId && partner?.reviewChannelId) {
      const ch = await this.client.channels.fetch(partner.reviewChannelId).catch(() => null);
      if (ch) {
        const payload = T.pendingReview({ ...partner, description: newDesc }, type);
        await editV2(ch, partner.reviewMessageId, payload).catch(() => {});
      }
    }

    await editV2(interaction.channel, interaction.message.id, {
      flags: 32768 | 64,
      components: [{
        type: 17,
        components: [
          { type: 10, content: '✅ Pesan berhasil diupdate!' },
          { type: 14 },
          { type: 10, content: '-# © Guild Partnership - EmpireBS' }
        ]
      }]
    });
  }

  async handleDmToggle(interaction, enable) {
    await this.dmSettings.updateOne(
      { userId: interaction.user.id },
      { $set: { dmEnabled: enable } },
      { upsert: true }
    );
    await updateV2(interaction, T.dmToggle(enable ? 'yes' : 'no'));
  }

  async showList(interaction, page, searchQuery = null) {
    await deferEphemeral(interaction);
    const query = searchQuery ? { status: 'accepted', serverName: { $regex: searchQuery, $options: 'i' } } : { status: 'accepted' };
    const total = await this.partners.countDocuments(query);
    const totalPages = Math.max(1, Math.ceil(total / 10));
    page = Math.max(1, Math.min(page, totalPages));
    const partners = await this.partners.find(query).skip((page - 1) * 10).limit(10).toArray();
    const payload = T.listPartners(partners, page, totalPages, total);
    await editV2(interaction.channel, interaction.message.id, { flags: 32768 | 64, ...payload });
  }

  async handlePagination(interaction, cid) {
    const parts = cid.split('_');
    const action = parts[2];
    let page = parseInt(parts[3]);
    const total = parseInt(parts[4]);
    if (action === 'first') {
      page = page === 1 ? total : Math.max(1, page - 5);
    } else if (action === 'prev') {
      page = Math.max(1, page - 1);
    } else if (action === 'next') {
      page = Math.min(total, page + 1);
    } else if (action === 'last') {
      page = page === total ? 1 : Math.min(total, page + 5);
    } else if (action === 'page') {
      return;
    }
    await this.showList(interaction, page);
  }

  async showSearchModal(interaction) {
    const modal = new ModalBuilder()
      .setCustomId('p_search_modal')
      .setTitle('Cari Partnership');
    modal.addComponents(new ActionRowBuilder().addComponents(
      new TextInputBuilder()
        .setCustomId('query')
        .setLabel('Nama Server atau User')
        .setPlaceholder('Masukkan kata kunci pencarian...')
        .setStyle(TextInputStyle.Short)
        .setRequired(true)
    ));
    await interaction.showModal(modal);
  }

  async handleSearchSubmit(interaction) {
    const query = interaction.fields.getTextInputValue('query');
    await this.showList(interaction, 1, query);
  }

  async createOrUpdateForumLog(data, type, accepter, duration, messageId) {
    const forum = await this.client.channels.fetch(CFG.CH_FORUM_LOG).catch(() => null);
    if (!forum) return;
    const serverName = data.serverName;
    const threadName = `1) ${serverName}`;
    const existingThread = forum.threads.cache.find(t => t.name === threadName);

    const payload = T.forumLog(data, type, accepter, duration, messageId);

    if (existingThread) {
      await sendV2(existingThread, payload).catch(() => {});
    } else {
      await createForumThreadV2(forum, threadName, payload).catch(() => {});
    }
  }

  async handlePartnerCommand(message) {
    if (!message.guild || message.guild.id !== CFG.GUILD_ID) return;
    const member = message.member;
    const hasRole = member.roles.cache.has(CFG.ROLE_PARTNER_CMD);
    if (!hasRole) {
      await sendV2(message.channel, T.warningNoRole());
      return;
    }

    const category = message.guild.channels.cache.get(CFG.CAT_PARTNER);
    if (!category) {
      return message.reply('❌ Category partner tidak ditemukan.');
    }

    const currentLimit = await this.limits.findOne({ channelId: message.channel.id });
    if (currentLimit && currentLimit.count >= 3) {
      await sendV2(message.channel, T.warningLimit());
      return;
    }

    const partnerChannels = await this.limits.find({ guildId: message.guild.id }).toArray();
    if (partnerChannels.length >= 3 && !currentLimit) {
      await sendV2(message.channel, T.warningLimit());
      return;
    }

    let targetChannel = message.channel;
    if (!currentLimit) {
      const count = partnerChannels.length + 1;
      targetChannel = await message.guild.channels.create({
        name: `partner-request-${count}`,
        type: ChannelType.GuildText,
        parent: CFG.CAT_PARTNER,
        permissionOverwrites: [
          { id: message.guild.id, deny: [PermissionFlagsBits.ViewChannel] },
          { id: member.id, allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages, PermissionFlagsBits.ReadMessageHistory] },
          { id: CFG.ROLE_PARTNER_CMD, allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages, PermissionFlagsBits.ReadMessageHistory] },
          { id: this.client.user.id, allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages, PermissionFlagsBits.ManageMessages, PermissionFlagsBits.ManageChannels] }
        ]
      });
      await this.limits.insertOne({
        channelId: targetChannel.id,
        guildId: message.guild.id,
        count: 0,
        createdAt: new Date(),
        createdBy: member.id
      });
    }

    await sendV2(targetChannel, T.partnerCmdForm(true));
    if (targetChannel.id !== message.channel.id) {
      await message.reply(`✅ Channel partnership dibuat: ${targetChannel}`);
    }
  }

  formatDuration(ms) {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);
    if (days > 0) return `${days}h ${minutes % 60}m ${seconds % 60}s`;
    if (hours > 0) return `${hours}j ${minutes % 60}m ${seconds % 60}s`;
    if (minutes > 0) return `${minutes}m ${seconds % 60}s`;
    return `${seconds}s`;
  }
}

module.exports = PartnershipSystem;
