const mineflayer = require('mineflayer');

let botInstance = null;
let reconnectTimeout = null;
let currentAbortController = null;

module.exports = {
    init: (client) => {
        const botName = 'EmpireBS';
        const passwordBot = 'BananaSkiee';

        const startBot = () => {
            // 1. Matikan loop lama jika ada sebelum buat baru
            if (currentAbortController) {
                currentAbortController.abort();
            }
            currentAbortController = new AbortController();
            const { signal } = currentAbortController;

            // 2. Bersihkan instance bot lama secara total
            if (botInstance) {
                botInstance.removeAllListeners();
                try { botInstance.quit(); } catch (e) {}
                botInstance = null;
            }

            console.log(`[MC-SYSTEM] 🔄 Menghubungkan ke ${botName}...`);

            botInstance = mineflayer.createBot({
                host: 'emerald.magmanode.com',
                port: 33096,
                username: botName,
                auth: 'offline',
                version: "1.21.1",
                checkTimeoutInterval: 60000 // Menambah batas timeout agar tidak gampang ECONNRESET
            });

            // Helper delay yang aman & bisa di-cancel
            const safeWait = (ms) => new Promise(resolve => {
                const timer = setTimeout(resolve, ms);
                signal.addEventListener('abort', () => clearTimeout(timer));
            });

            botInstance.once('spawn', async () => {
                console.log(`[MC-SUCCESS] ✅ Bot aktif di server.`);
                
                await safeWait(5000);
                if (signal.aborted || !botInstance) return;
                
                botInstance.chat(`/login ${passwordBot}`);
                await safeWait(10000); // Jeda extra setelah login

                // --- MAIN LOOP ---
                try {
                    while (!signal.aborted && botInstance) {
                        // SURVIVAL
                        if (!signal.aborted) {
                            console.log(`[MC-MOVE] ✈️  Berpindah ke: survival`);
                            botInstance.chat('/server survival');
                        }
                        await safeWait(60000); // Stay 1 menit

                        // CREATIVE
                        if (!signal.aborted) {
                            console.log(`[MC-MOVE] ✈️  Berpindah ke: creative`);
                            botInstance.chat('/server creative');
                        }
                        await safeWait(60000); // Stay 1 menit

                        // LOBBY
                        if (!signal.aborted) {
                            console.log(`[MC-MOVE] ✈️  Berpindah ke: lobby`);
                            botInstance.chat('/server lobby');
                            console.log(`[MC-LOOP] 🔄 Putaran selesai.`);
                        }
                        await safeWait(60000); // Stay 1 menit
                    }
                } catch (err) {
                    // Loop berhenti dengan aman
                }
            });

            botInstance.on('kicked', (reason) => {
                console.log(`[MC-KICK] Keluar: Terputus dari Proxy.`);
            });

            botInstance.on('error', (err) => {
                // Menangani ECONNRESET atau EPIPE secara halus
                if (err.code === 'ECONNRESET' || err.code === 'EPIPE') {
                    console.log(`[MC-ERROR] Koneksi diputus oleh server (Socket Error).`);
                } else {
                    console.log(`[MC-ERROR] Kendala: ${err.message}`);
                }
            });

            botInstance.on('end', () => {
                if (currentAbortController) currentAbortController.abort();
                console.log(`[MC-RETRY] 🔌 Reconnect dalam 60 detik...`);
                
                if (reconnectTimeout) clearTimeout(reconnectTimeout);
                reconnectTimeout = setTimeout(startBot, 60000);
            });
        };

        startBot();
    }
};
