// modules/inviteTracker.js
const { EmbedBuilder, Events } = require("discord.js");
const fs = require("fs");
const path = require("path");

const invitesPath = path.join(__dirname, "../data/invites.json");
let invitesData = fs.existsSync(invitesPath)
    ? JSON.parse(fs.readFileSync(invitesPath, "utf8"))
    : {};

function saveInvites() {
    fs.writeFileSync(invitesPath, JSON.stringify(invitesData, null, 2));
}

function formatDateIndo(date) {
    return new Date(date).toLocaleString("id-ID", { timeZone: "Asia/Jakarta" });
}

module.exports = (client) => {
    client.on(Events.ClientReady, async () => {
        for (const guild of client.guilds.cache.values()) {
            const guildInvites = await guild.invites.fetch();
            invitesData[guild.id] = invitesData[guild.id] || { codes: {}, users: {}, joins: {} };
            guildInvites.forEach(inv => invitesData[guild.id].codes[inv.code] = inv.uses);
        }
        saveInvites();
        console.log("✅ Invite Tracker Siap!");
    });

    // Member Join
    client.on(Events.GuildMemberAdd, async (member) => {
        const newInvites = await member.guild.invites.fetch();
        const oldInvites = invitesData[member.guild.id]?.codes || {};
        const inviteUsed = newInvites.find(inv => (oldInvites[inv.code] || 0) < inv.uses);

        invitesData[member.guild.id] = invitesData[member.guild.id] || { codes: {}, users: {}, joins: {} };
        invitesData[member.guild.id].codes = {};
        newInvites.forEach(inv => invitesData[member.guild.id].codes[inv.code] = inv.uses);

        let inviter = inviteUsed ? inviteUsed.inviter : null;
        let inviteCode = inviteUsed ? `discord.gg/${inviteUsed.code}` : "Vanity / Tidak diketahui";

        if (inviter) {
            invitesData[member.guild.id].users[inviter.id] = (invitesData[member.guild.id].users[inviter.id] || 0) + 1;
            invitesData[member.guild.id].joins[member.id] = inviter.id;
        }
        saveInvites();

        const isVerified = member.roles.cache.has(process.env.ROLE_MEMBER_ID);
        const verifiedStatus = isVerified ? "✅ Verified" : "❌ Belum Verified";

        const embed = new EmbedBuilder()
            .setColor("Green")
            .setTitle("-# . <a:bananacat:1361702933036667111> <a:letter:1361709818083152045> <a:letter0:960426513562472480> <a:letter0:960426513562472480> <a:Letter6:1361695190695416029> <a:Letter7:1361705035704045750> <a:Letter1:1361695421369421956> <a:letter3:1361695449874043021> <a:bananacat:1361702933036667111>")
            .setThumbnail(member.user.displayAvatarURL({ dynamic: true }))
            .setDescription(
                `👤 **Member**        : <@${member.id}>\n` +
                `🏠 **Server**        : BananaSkiee Community\n` +
                `🎁 **Invited by**    : ${inviter ? `<@${inviter.id}>` : "Tidak diketahui"}\n` +
                `🔗 **Link Invite**   : ${inviteCode}\n` +
                `📈 **Total Invites** : ${inviter ? `${invitesData[member.guild.id].users[inviter.id]} (+1)` : "-"}\n` +
                `👥 **Total Members** : ${member.guild.memberCount}\n` +
                `🛡 **Status**        : ${verifiedStatus}\n` +
                `📅 **Bergabung**     : ${formatDateIndo(Date.now())}\n\n` +
                `-# . <a:merah:1361623714541604894> <a:garis:1361628335297527910><a:garis:1361628335297527910><a:garis:1361628335297527910><a:garis:1361628335297527910><a:garis:1361628335297527910><a:garis:1361628335297527910><a:garis:1361628335297527910><a:garis:1361628335297527910><a:garis:1361628335297527910><a:garis:1361628335297527910><a:garis:1361628335297527910><a:garis:1361628335297527910> <a:merah:1361623714541604894>`
            )
            .setFooter({
                text: "© Copyright | BananaSkiee Community",
                iconURL: "https://i.imgur.com/RGp8pqJ.jpeg"
            });

        const welcomeChannel = member.guild.channels.cache.get(process.env.WELCOME_CHANNEL_ID);
        if (welcomeChannel) {
            welcomeChannel.send({ embeds: [embed] })
                .then(msg => msg.react("👋").catch(() => {}));
        }
    });

    // Member Leave
    client.on(Events.GuildMemberRemove, async (member) => {
        const guildData = invitesData[member.guild.id];
        let inviterId = guildData?.joins[member.id];

        if (inviterId) {
            guildData.users[inviterId] = (guildData.users[inviterId] || 1) - 1;
            delete guildData.joins[member.id];
        }
        saveInvites();

        const embed = new EmbedBuilder()
            .setColor("Red")
            .setTitle("-# . <a:BananaSkiee:1360541400382439475> <a:rflx:1361623860205715589> <a:rflx_e:1361624001939771413> <a:rflx_l:1361624056884887673> <a:rflx_c:1361624260434591855> <a:rflx_o:1361624335126626396> <a:rflx_m:1361624355771256956> <a:rflx_e:1361624001939771413> <a:BananaSkiee:1360541400382439475>")
            .setThumbnail(member.user.displayAvatarURL({ dynamic: true }))
            .setDescription(
                `👤 **Member**        : <@${member.id}>\n` +
                `🎁 **Invited by**    : ${inviterId ? `<@${inviterId}>` : "Tidak diketahui"}\n` +
                `📉 **Total Invites** : ${inviterId ? `${guildData.users[inviterId]} (-1)` : "-"}\n` +
                `👥 **Total Members** : ${member.guild.memberCount}\n` +
                `📅 **Keluar**        : ${formatDateIndo(Date.now())}\n\n` +
                `-# . <a:merah:1361623714541604894> <a:garis:1361628335297527910><a:garis:1361628335297527910><a:garis:1361628335297527910><a:garis:1361628335297527910><a:garis:1361628335297527910><a:garis:1361628335297527910><a:garis:1361628335297527910><a:garis:1361628335297527910><a:garis:1361628335297527910><a:garis:1361628335297527910><a:garis:1361628335297527910><a:garis:1361628335297527910> <a:merah:1361623714541604894>`
            )
            .setFooter({
                text: "© Copyright | BananaSkiee Community",
                iconURL: "https://i.imgur.com/RGp8pqJ.jpeg"
            });

        const goodbyeChannel = member.guild.channels.cache.get(process.env.GOODBYE_CHANNEL_ID);
        if (goodbyeChannel) goodbyeChannel.send({ embeds: [embed] });
    });

    // Commands
    client.on(Events.MessageCreate, (message) => {
        if (message.author.bot) return;
        const args = message.content.trim().split(/\s+/);

        if (args[0] === "!topinvites") {
            const guildData = invitesData[message.guild.id]?.users || {};
            const sorted = Object.entries(guildData).sort((a, b) => b[1] - a[1]).slice(0, 10);
            const desc = sorted.map(([id, count], i) => `**${i + 1}.** <@${id}> — ${count} invites`).join("\n") || "Tidak ada data.";

            const embed = new EmbedBuilder()
                .setColor("Blue")
                .setTitle("🏆 Top 10 Pengundang")
                .setDescription(desc);
            message.channel.send({ embeds: [embed] });
        }

        if (args[0] === "!invites") {
            const user = message.mentions.users.first() || message.author;
            const count = invitesData[message.guild.id]?.users[user.id] || 0;
            const embed = new EmbedBuilder()
                .setColor("Blue")
                .setTitle(`📊 Invites untuk ${user.username}`)
                .setDescription(`<@${user.id}> memiliki **${count}** invites.`);
            message.channel.send({ embeds: [embed] });
        }
    });
};
