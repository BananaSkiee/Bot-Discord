// File: events/guildMemberAdd.js (VERSI FINAL DENGAN TOMBOL LINK)

// PERUBAHAN: Tambahkan ActionRowBuilder, ButtonBuilder, dan ButtonStyle
const { AttachmentBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
// const generateWelcomeCard = require('../modules/welcomeCard.js');
// const getRandomQuote = require("../modules/welcomeQuotes"); // sesuaikan path-nya
const { handleBotRoles } = require('../modules/autoBotRole'); 

module.exports = {
    name: 'guildMemberAdd',
    async execute(member, client) {
        // Hosting 1 HANYA mengurus Role, TIDAK mengirim pesan welcome (biar diurus Host 2)
        const ROLE_NON_VERIFY = "1444248589051367435"; 
        
        if (!member.user.bot) {
            await member.roles.add(ROLE_NON_VERIFY).catch(() => {});
        }
        
        if (typeof handleBotRoles === 'function') {
            await handleBotRoles(member); 
        }
    },
};
