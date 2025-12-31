const schedule = require("node-schedule");

// Database sementara (Data Hari Ini)
let currentStats = {
    hourlyActivity: new Array(24).fill(0),
    messages: {}, 
    voice: {}
};

// Snapshot data kemarin (Agar tombol tetap berfungsi setelah jam 00:00)
let lastDayStats = {
    hourlyActivity: new Array(24).fill(0),
    messages: {},
    voice: {}
};

module.exports = (client) => {
    const CHANNEL_ID = "1455791109446832240";

    // --- TRACKING MESSAGES ---
    client.on("messageCreate", (message) => {
        if (message.author.bot || !message.guild) return;

        // Command Test Prefix !teststats
        if (message.content.startsWith("!teststats") && message.member.permissions.has("Administrator")) {
            lastDayStats = JSON.parse(JSON.stringify(currentStats)); // Copy data saat ini ke snapshot
            const peakData = getPeaks(lastDayStats.hourlyActivity);
            const topChat = getTop(lastDayStats.messages, "count");
            const topVoice = getTop(lastDayStats.voice, "seconds");
            
            message.reply("✅ **Mengirim Test Analytics (Data Real-time)...**");
            return message.channel.send(generateMainLayout(peakData, topChat, topVoice));
        }

        // Simpan data pesan
        currentStats.hourlyActivity[new Date().getHours()]++;
        const userId = message.author.id;
        if (!currentStats.messages[userId]) {
            currentStats.messages[userId] = { name: message.member?.displayName || message.author.username, count: 0, id: userId };
        }
        currentStats.messages[userId].count++;
    });

    // --- TRACKING VOICE ---
    client.on("voiceStateUpdate", (oldState, newState) => {
        if (newState.member?.user.bot) return;
        const userId = newState.id;
        if (!oldState.channelId && newState.channelId) {
            if (!currentStats.voice[userId]) {
                currentStats.voice[userId] = { name: newState.member?.displayName || newState.user.username, seconds: 0, id: userId };
            }
            currentStats.voice[userId].lastJoin = Date.now();
        } else if (oldState.channelId && !newState.channelId) {
            if (currentStats.voice[userId]?.lastJoin) {
                currentStats.voice[userId].seconds += Math.floor((Date.now() - currentStats.voice[userId].lastJoin) / 1000);
                currentStats.voice[userId].lastJoin = null;
            }
        }
    });

    // --- CRON JOB JAM 00:00 ---
    schedule.scheduleJob("0 0 * * *", async () => {
        const channel = client.channels.cache.get(CHANNEL_ID);
        if (!channel) return;

        lastDayStats = JSON.parse(JSON.stringify(currentStats));
        currentStats = { hourlyActivity: new Array(24).fill(0), messages: {}, voice: {} };

        const peakData = getPeaks(lastDayStats.hourlyActivity);
        const topChat = getTop(lastDayStats.messages, "count");
        const topVoice = getTop(lastDayStats.voice, "seconds");

        await channel.send(generateMainLayout(peakData, topChat, topVoice));
    });

    // --- INTERACTION HANDLER (Leaderboard & Grafik) ---
    client.on("interactionCreate", async (interaction) => {
        if (!interaction.isButton()) return;

        const [action, type, pageStr] = interaction.custom_id.split("_");
        
        // Logic Grafik Jam (Online/Offline)
        if (action === "st" && (type === "online" || type === "offline")) {
            return interaction.reply({
                flags: 64,
                content: `## 📈 Grafik Aktivitas Jam\n\`\`\`text\n${renderGraph(lastDayStats.hourlyActivity)}\n\`\`\``
            });
        }

        if (!["prev", "next", "first", "last", "top", "myrank", "st"].includes(action)) return;

        let dataArray = (type === "msg") 
            ? Object.values(lastDayStats.messages).sort((a, b) => b.count - a.count)
            : Object.values(lastDayStats.voice).sort((a, b) => b.seconds - a.seconds);

        const totalPages = Math.ceil(dataArray.length / 10) || 1;
        let currentPage = parseInt(pageStr) || 1;

        // Logic Navigasi Advanced
        if (action === "next") currentPage = (currentPage >= totalPages) ? 1 : currentPage + 1;
        if (action === "prev") currentPage = (currentPage <= 1) ? totalPages : currentPage - 1;
        if (action === "last") currentPage = (currentPage + 5 > totalPages) ? totalPages : currentPage + 5;
        if (action === "first") currentPage = (currentPage - 5 < 1) ? 1 : currentPage - 5;
        if (action === "top") currentPage = 1;
        
        if (action === "myrank") {
            const index = dataArray.findIndex(u => u.id === interaction.user.id);
            if (index === -1) return interaction.reply({ content: "Kamu belum masuk dalam data hari ini.", ephemeral: true });
            currentPage = Math.floor(index / 10) + 1;
        }

        const payload = generateLBLayout(dataArray, type, currentPage, totalPages, interaction.user.id);
        
        if (interaction.message.flags.has(64)) {
            await interaction.update(payload);
        } else {
            await interaction.reply({ ...payload, ephemeral: true });
        }
    });
};

// --- HELPERS ---
function renderGraph(data) {
    const max = Math.max(...data) || 1;
    return data.map((count, hour) => {
        const barSize = Math.round((count / max) * 10);
        const bar = "🟦".repeat(barSize) + "⬜".repeat(10 - barSize);
        return `${hour.toString().padStart(2, '0')}:00 ${bar} ${count}`;
    }).join("\n");
}

function getPeaks(arr) {
    const max = Math.max(...arr);
    const min = Math.min(...arr);
    return { peak: arr.indexOf(max), low: arr.indexOf(min) };
}

function getTop(obj, key) {
    const sorted = Object.values(obj).sort((a, b) => b[key] - a[key]);
    if (!sorted[0]) return "N/A";
    const val = key === "count" ? `${sorted[0].count} Pesan` : `${Math.floor(sorted[0].seconds/60)} Menit`;
    return `@${sorted[0].name} (${val})`;
}

function generateMainLayout(peak, chat, vc) {
    return {
        components: [{
            type: 17,
            components: [
                {
                    type: 10,
                    content: `## 📊 Server Daily Analytics\n**Laporan aktivitas member BS Community 24 jam terakhir:**\n\n>>> **Stats Online:** Jam ${peak.peak}:00 *(Puncak)*\n**Stats Offline:** Jam ${peak.low}:00 *(Terendah)*\n**Stats Message:** ${chat}\n**Stats Voice:** ${vc}`
                },
                { type: 14 },
                {
                    type: 1,
                    components: [
                        { style: 2, type: 2, label: "Stats Online", custom_id: "st_online_1" },
                        { style: 2, type: 2, label: "Stats Offline", custom_id: "st_offline_1" },
                        { style: 2, type: 2, label: "Stats Message", custom_id: "st_msg_1" },
                        { style: 2, type: 2, label: "Stats Voice", custom_id: "st_vc_1" }
                    ]
                },
                { type: 14 },
                { type: 10, content: "-# © BS Community by BananaSkiee" }
            ]
        }]
    };
}

function generateLBLayout(data, type, page, total, userId) {
    const start = (page - 1) * 10;
    const category = type === "msg" ? "Message" : "Voice";
    
    const list = data.slice(start, start + 10).map((u, i) => {
        const rank = start + i + 1;
        const medal = rank === 1 ? "🥇" : rank === 2 ? "🥈" : rank === 3 ? "🥉" : `**${rank}.**`;
        const score = type === "msg" ? `${u.count} Msg` : `${Math.floor(u.seconds/60)} Min`;
        const line = `${medal} @${u.name} — ${score}`;
        return u.id === userId ? `> ${line} 👈` : line;
    }).join("\n\n");

    return {
        components: [{
            type: 17,
            components: [
                {
                    type: 9,
                    components: [{ type: 10, content: `## Top ${category} Leaderboard\n` }],
                    accessory: { style: 2, type: 2, label: "My Rank", custom_id: `myrank_${type}_${page}` }
                },
                { type: 14 },
                {
                    type: 9,
                    components: [{ type: 10, content: list || "Data Kosong" }],
                    accessory: { style: 2, type: 2, label: "Top", custom_id: `top_${type}_1` }
                },
                { type: 14 },
                {
                    type: 1,
                    components: [
                        { style: 2, type: 2, label: "◀◀", custom_id: `first_${type}_${page}` },
                        { style: 2, type: 2, label: "◀", custom_id: `prev_${type}_${page}` },
                        { style: 2, type: 2, label: `${page}/${total}`, disabled: true, custom_id: "page" },
                        { style: 2, type: 2, label: "▶", custom_id: `next_${type}_${page}` },
                        { style: 2, type: 2, label: "▶▶", custom_id: `last_${type}_${page}` }
                    ]
                },
                { type: 14 },
                { type: 10, content: "-# © BS Community by BananaSkiee" }
            ]
        }]
    };
}
