// 🆕 FITUR AUTO SEND RULES
try {
    const RULES_CHANNEL_ID = '1352326247186694164'; // GANTI DENGAN CHANNEL ID MU
    const rulesChannel = await client.channels.fetch(RULES_CHANNEL_ID);
    
    if (rulesChannel) {
        // Hapus pesan lama satu per satu (tidak pakai bulk delete)
        const messages = await rulesChannel.messages.fetch({ limit: 50 });
        if (messages.size > 0) {
            for (const message of messages.values()) {
                try {
                    await message.delete();
                    await new Promise(resolve => setTimeout(resolve, 100)); // Delay 100ms
                } catch (error) {
                    console.log('⚠️ Tidak bisa hapus pesan lama:', error.message);
                }
            }
            console.log('🗑️ Pesan lama dihapus');
        }

        const rules = await rulesModule.execute(client);

        // Kirim semua embed berurutan dengan delay
        await rulesChannel.send({ embeds: [rules.welcomeHeaderEmbed] });
        await new Promise(resolve => setTimeout(resolve, 500));
        
        await rulesChannel.send({ 
            embeds: [rules.welcomeMainEmbed],
            components: [rules.welcomeButtons]
        });
        await new Promise(resolve => setTimeout(resolve, 500));
        
        await rulesChannel.send({ 
            embeds: [rules.guidebookEmbed],
            components: [rules.guideButton]
        });
        await new Promise(resolve => setTimeout(resolve, 500));
        
        await rulesChannel.send({ embeds: [rules.guidelinesEmbed] });
        await new Promise(resolve => setTimeout(resolve, 500));
        
        await rulesChannel.send({ 
            content: '**🔍 Jelajahi informasi lebih lanjut:**',
            components: [rules.infoSelectMenu] 
        });
        
        console.log('✅ Rules premium berhasil dikirim ke channel');
    }
} catch (error) {
    console.error('❌ Gagal mengirim rules:', error.message);
}
