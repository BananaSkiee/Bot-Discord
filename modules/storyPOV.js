// FILE: modules/storyPOV.js
// Logika Inti untuk mengelola perubahan Sudut Pandang (POV) cerita 
// serta penanganan Role Assignment untuk Bot Discord.

const ROLE_ID_KEMBALI = '1354161955669147649'; // Role ID yang diminta

/**
 * Segmen Cerita dan Konfigurasi Embed
 */
const storySegments = {
    '1': {
        title: 'POV 1: [INTERNAL] Ruangan Siaga (CMD !1)',
        description: 'Anda sendirian di dalam ruangan, diterangi cahaya minim. Pintu kayu adalah variabel utama. Status: Siaga.',
        color: 0x3498db, 
        action: 'Menunggu & Siaga',
        emoji: '👤'
    },
    '2': {
        title: 'POV 2: [EKSTERNAL] Momen Sosok Keluar (CMD !2)',
        description: 'Dari koridor, pintu terbuka, sosok melangkah keluar, dan pintu tertutup kembali. Subjek telah meninggalkan area.',
        color: 0xe74c3c, 
        action: 'Observasi Pergerakan Keluar',
        emoji: '🏃'
    },
    '3': {
        title: 'POV 3: [EKSTERNAL] Momen Sosok Masuk Kembali (CMD !3)',
        description: 'Pintu terbuka mendadak, sosok masuk dengan tergesa-gesa. Perilaku anomali. Pintu terkunci dari dalam. Subjek telah kembali.',
        color: 0xf1c40f, 
        action: 'Observasi Re-entry & Penugasan Role',
        emoji: '🚨'
    }
};

/**
 * Membuat Embed Discord yang sangat rapi untuk laporan POV.
 * @param {string} povId ID POV (1, 2, atau 3).
 * @returns {object} Objek Embed.
 */
function createPOVEmbed(povId) {
    const segment = storySegments[povId];
    if (!segment) return null;

    let footerNote = 'Logika aksi simulasi diaktifkan.';
    if (povId === '3') {
        footerNote = `AKSI KRITIS: Role ID \`${ROLE_ID_KEMBALI}\` harus ditambahkan karena Re-entry.`;
    }

    return {
        title: `${segment.emoji} ${segment.title}`,
        description: `> ${segment.description}`,
        color: segment.color, 
        timestamp: new Date().toISOString(),
        author: {
            name: 'Pusat Komando (PK) Laporan POV',
            icon_url: 'https://placehold.co/128x128/5865F2/ffffff?text=PK',
        },
        fields: [
            {
                name: '🌐 Sudut Pandang Aktif',
                value: `**${segment.title.split(': ')[1].split(' (')[0]}**`,
                inline: true,
            },
            {
                name: '📝 Logika Aksi',
                value: `\`${segment.action}\``,
                inline: true,
            }
        ],
        footer: {
            text: footerNote,
        }
    };
}

module.exports = {
    createPOVEmbed,
    storySegments,
    ROLE_ID_KEMBALI
};
