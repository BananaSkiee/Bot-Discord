// modules/minecraftBot.js
const mineflayer = require('mineflayer');

let botInstance = null;
let reconnectTimeout = null;
let rotationInterval = null;
let serverIndex = 0;
let currentServer = 'lobby'; // Track server saat ini

// Daftar server untuk rotasi
const servers = ['survival', 'creative', 'lobby'];

module.exports = {
    init: (client) => {
        const botName = 'PersonaBS';
        const passwordBot = 'BananaSkiee';

        const startBot = () => {
            if (botInstance) return;

            console.log(`[MC-SYSTEM] 🔄 Menghubungkan ke ${botName}...`);

            botInstance = mineflayer.createBot({
                host: 'emerald.magmanode.com',
                port: 33096,
                username: botName,
                auth: 'offline',
                keepAlive: true,
                hideErrors: true,
                checkTimeoutInterval: 60000,
                maxRetries: 10
            });

            // Fungsi untuk pindah server
            const navigateTo = (target) => {
                if (!botInstance || !botInstance.entity) {
                    console.log(`[MC-ERROR] ❌ Bot tidak siap untuk pindah ke ${target}`);
                    return false;
                }
                
                console.log(`[MC-MOVE] ✈️  Berpindah dari ${currentServer} ke server: ${target}`);
                botInstance.chat(`/server ${target}`);
                currentServer = target;
                
                // Catat waktu pindah
                console.log(`[MC-MOVE] ⏱️  Perintah /server ${target} dikirim pada ${new Date().toLocaleTimeString()}`);
                return true;
            };

            // Fungsi untuk memulai rotasi server
            const startServerRotation = () => {
                if (rotationInterval) {
                    clearInterval(rotationInterval);
                }
                
                console.log(`[MC-ROTATION] 🔄 Memulai rotasi server setiap 30 detik`);
                console.log(`[MC-ROTATION] 📋 Urutan server: ${servers.join(' → ')}`);
                
                // Eksekusi pertama setelah 5 detik (biar bot stabil)
                setTimeout(() => {
                    if (!botInstance) return;
                    
                    // Mulai dari survival sesuai permintaan
                    serverIndex = 0; // survival
                    console.log(`[MC-ROTATION] 🎯 Rotasi pertama: ${servers[serverIndex]}`);
                    navigateTo(servers[serverIndex]);
                    
                }, 5000);
                
                // Set interval setiap 30 detik
                rotationInterval = setInterval(() => {
                    if (!botInstance || !botInstance.entity) {
                        console.log(`[MC-ROTATION] ⚠️ Bot tidak tersedia, skip rotasi`);
                        return;
                    }
                    
                    // Hitung server berikutnya
                    serverIndex = (serverIndex + 1) % servers.length;
                    const nextServer = servers[serverIndex];
                    
                    console.log(`[MC-ROTATION] ⏲️ 30 detik berlalu, pindah ke server berikutnya: ${nextServer}`);
                    console.log(`[MC-ROTATION] 📊 Progress: ${serverIndex + 1}/${servers.length} (${Math.round((serverIndex + 1)/servers.length * 100)}%)`);
                    
                    navigateTo(nextServer);
                    
                    // Hitung mundur 30 detik berikutnya
                    let countdown = 30;
                    const countdownInterval = setInterval(() => {
                        if (!botInstance) {
                            clearInterval(countdownInterval);
                            return;
                        }
                        countdown--;
                        if (countdown > 0) {
                            console.log(`[MC-COUNTDOWN] ⏱️ Server berikutnya (${servers[(serverIndex + 1) % servers.length]}) dalam ${countdown} detik...`);
                        } else {
                            clearInterval(countdownInterval);
                        }
                    }, 1000);
                    
                }, 30000); // 30.000 ms = 30 detik
            };

            // Fungsi untuk stop rotasi
            const stopServerRotation = () => {
                if (rotationInterval) {
                    clearInterval(rotationInterval);
                    rotationInterval = null;
                    console.log(`[MC-ROTATION] ⏹️ Rotasi server dihentikan`);
                }
            };

            // Handler spawn
            botInstance.once('spawn', () => {
                console.log(`[MC-SUCCESS] ✅ Bot aktif di Proxy/Lobby.`);
                currentServer = 'lobby';
                
                // Step 1: Tunggu 10 detik di lobby
                setTimeout(() => {
                    if (!botInstance) return;
                    console.log(`[MC-PHASE] 📍 Fase 1: Login ke AuthMe...`);
                    
                    // Login ke AuthMe
                    botInstance.chat(`/login ${passwordBot}`);
                    botInstance.chat(`/register ${passwordBot} ${passwordBot}`);
                    
                }, 10000); // 10 detik pertama
                
                // Step 2: Tunggu 20 detik, test koneksi
                setTimeout(() => {
                    if (!botInstance) return;
                    console.log(`[MC-PHASE] 📍 Fase 2: Test koneksi...`);
                    botInstance.chat('/ping');
                    
                }, 20000); // 20 detik
                
                // Step 3: Pindah ke survival pertama kali (setelah 30 detik total)
                setTimeout(() => {
                    if (!botInstance) return;
                    console.log(`[MC-PHASE] 📍 Fase 3: Pindah ke survival untuk pertama kali...`);
                    navigateTo('survival');
                    
                    // Step 4: Setelah sampai survival, mulai rotasi 30 detik
                    setTimeout(() => {
                        if (!botInstance) return;
                        console.log(`[MC-PHASE] 📍 Fase 4: Memulai rotasi server 30 detik...`);
                        startServerRotation();
                    }, 15000); // 15 detik setelah pindah ke survival
                    
                }, 30000); // 30 detik dari spawn

                // Anti-AFK
                const afkLoop = setInterval(() => {
                    if (botInstance && botInstance.entity) {
                        botInstance.swingArm('right');
                    }
                }, 45000);

                botInstance.once('end', () => {
                    clearInterval(afkLoop);
                    stopServerRotation();
                });
            });

            // Handler untuk pesan (deteksi pindah server)
            botInstance.on('message', (message) => {
                const msg = message.toString();
                
                // Deteksi kalau berhasil pindah server
                if (msg.includes('Sending you to') || msg.includes('Connecting you to')) {
                    const match = msg.match(/to (?:server )?['"]?(\w+)['"]?/i);
                    if (match && match[1]) {
                        const newServer = match[1].toLowerCase();
                        currentServer = newServer;
                        console.log(`[MC-SERVER] ✅ Berhasil pindah ke server: ${newServer}`);
                        console.log(`[MC-STATUS] 📍 Sekarang di: ${newServer}`);
                    }
                }
                
                // Deteksi kalau gagal pindah server
                if (msg.includes('not found') || msg.includes('t exist')) {
                    console.log(`[MC-ERROR] ❌ Server tidak ditemukan! Cek nama server di BungeeCord`);
                }
            });

            // Handler Error yang Lebih Informatif
            botInstance.on('error', (err) => {
                if (err.code === 'ECONNREFUSED') {
                    console.log(`[MC-ERROR] 🔌 Koneksi ditolak. Pastikan BungeeCord online.`);
                } else if (err.code === 'ETIMEDOUT' || err.message.includes('timeout')) {
                    console.log(`[MC-ERROR] ⏱️ Timeout - Server terlalu lambat merespons.`);
                } else {
                    console.log(`[MC-WARN] ⚠️ Error: ${err.message || err.code}`);
                }
                
                stopServerRotation();
            });

            // Handler Kicked
            botInstance.on('kicked', (reason) => {
                let cleanReason = reason;
                try {
                    cleanReason = JSON.parse(reason).text || reason;
                } catch (e) {}
                
                console.log(`[MC-KICK] Keluar server: ${cleanReason}`);
                stopServerRotation();
                
                // Jika ReadTimeout, tambah delay reconnect
                if (cleanReason.includes('ReadTimeoutException')) {
                    console.log('[MC-FIX] 🔧 Server terlalu lambat. Akan reconnect dengan delay lebih panjang (120 detik)...');
                    if (botInstance) {
                        botInstance.end('Timeout - server lambat');
                    }
                    setTimeout(() => {
                        console.log('[MC-FIX] Mencoba reconnect setelah delay panjang...');
                        startBot();
                    }, 120000);
                    return;
                }
                
                botInstance.removeAllListeners();
                botInstance = null;
            });

            botInstance.on('end', (reason) => {
                console.log(`[MC-RETRY] 🔌 Terputus. Mencoba kembali dalam 60 detik...`);
                stopServerRotation();
                
                if (botInstance) {
                    botInstance.removeAllListeners();
                    botInstance = null;
                }

                if (reconnectTimeout) clearTimeout(reconnectTimeout);
                reconnectTimeout = setTimeout(startBot, 60000);
            });
        };

        // Mulai 15 detik setelah app nyala
        setTimeout(startBot, 15000);
    }
};
