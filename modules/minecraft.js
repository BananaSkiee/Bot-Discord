const mineflayer = require('mineflayer');
const { EventEmitter } = require('events');

class MinecraftManager extends EventEmitter {
    constructor(config) {
        super();
        this.config = config;
        this.bot = null;
        this.isConnected = false;
        this.players = new Map();
        this.reconnectAttempts = 0;
        this.maxReconnectAttempts = 5;
    }

    async connect() {
        try {
            console.log('🟡 [Minecraft] Connecting to server...');
            
            this.bot = mineflayer.createBot({
                host: this.config.host || 'localhost',
                port: this.config.port || 25565,
                username: this.config.username || 'DiscordBot',
                password: this.config.password || '',
                version: this.config.version || '1.20.1',
                auth: this.config.auth || 'mojang',
                checkTimeoutInterval: 60 * 1000 // Check connection every minute
            });

            this.setupEventHandlers();
            
        } catch (error) {
            console.error('❌ [Minecraft] Failed to connect:', error);
            this.scheduleReconnect();
        }
    }

    setupEventHandlers() {
        this.bot.on('login', () => {
            console.log('🟢 [Minecraft] Connected to server!');
            this.isConnected = true;
            this.reconnectAttempts = 0;
            this.emit('connected');
        });

        this.bot.on('error', (err) => {
            console.error('❌ [Minecraft] Error:', err);
            this.isConnected = false;
            this.scheduleReconnect();
        });

        this.bot.on('end', () => {
            console.log('🔴 [Minecraft] Disconnected');
            this.isConnected = false;
            this.scheduleReconnect();
        });

        this.bot.on('message', (jsonMsg) => {
            const message = jsonMsg.toString().trim();
            if (this.isValidChatMessage(message)) {
                console.log(`💬 [Minecraft] ${message}`);
                this.emit('chat', message);
            }
        });

        this.bot.on('playerJoined', (player) => {
            console.log(`🟢 [Minecraft] ${player.username} joined`);
            this.players.set(player.username, player);
            this.emit('playerJoined', player.username);
        });

        this.bot.on('playerLeft', (player) => {
            console.log(`🔴 [Minecraft] ${player.username} left`);
            this.players.delete(player.username);
            this.emit('playerLeft', player.username);
        });

        // Auto re-spawn jika mati
        this.bot.on('death', () => {
            console.log('💀 [Minecraft] Bot died, auto respawning...');
            setTimeout(() => {
                if (this.bot) {
                    this.bot.chat('/spawn');
                }
            }, 2000);
        });

        // Periodic connection check
        setInterval(() => {
            if (this.bot && !this.bot.connected) {
                console.log('🟡 [Minecraft] Connection lost, reconnecting...');
                this.isConnected = false;
                this.scheduleReconnect();
            }
        }, 30000);
    }

    scheduleReconnect() {
        if (this.reconnectAttempts < this.maxReconnectAttempts) {
            this.reconnectAttempts++;
            const delay = Math.min(30000, this.reconnectAttempts * 5000); // Max 30 detik
            
            console.log(`🟡 [Minecraft] Reconnecting in ${delay/1000} seconds... (Attempt ${this.reconnectAttempts}/${this.maxReconnectAttempts})`);
            
            setTimeout(() => {
                if (!this.isConnected) {
                    this.connect();
                }
            }, delay);
        } else {
            console.error('❌ [Minecraft] Max reconnection attempts reached. Giving up.');
            this.emit('reconnectFailed');
        }
    }

    isValidChatMessage(message) {
        return message && 
               !message.includes('joined the game') && 
               !message.includes('left the game') &&
               !message.includes('Advanced to') &&
               message.length > 2;
    }

    sendChat(message) {
        if (this.bot && this.isConnected) {
            this.bot.chat(message);
            return true;
        }
        return false;
    }

    getOnlinePlayers() {
        return Array.from(this.players.keys());
    }

    disconnect() {
        if (this.bot) {
            this.bot.end();
            this.isConnected = false;
        }
    }

    // Force reconnect manual
    reconnect() {
        console.log('🔄 [Minecraft] Manual reconnect requested');
        this.disconnect();
        setTimeout(() => this.connect(), 2000);
    }
}

// Initialize Minecraft dengan auto connect
function initMinecraft(client, config) {
    const minecraftManager = new MinecraftManager(config);
    
    // Connect to Minecraft
    minecraftManager.connect();
    
    // Setup Discord integration
    setupDiscordIntegration(client, minecraftManager);
    
    return minecraftManager;
}

function setupDiscordIntegration(client, minecraftManager) {
    // Handle messages di channel Minecraft
    client.on('messageCreate', async (message) => {
        if (message.author.bot) return;
        
        const minecraftChannel = process.env.MINECRAFT_CHANNEL_ID;
        if (!minecraftChannel || message.channel.id !== minecraftChannel) return;

        // Kirim chat ke Minecraft
        if (message.content.startsWith('!m ')) {
            const text = message.content.slice(3).trim();
            if (text) {
                const success = minecraftManager.sendChat(text);
                if (success) {
                    message.react('✅');
                } else {
                    message.reply('❌ Minecraft bot tidak terhubung');
                }
            }
        }

        // Cek status Minecraft
        if (message.content === '!m status') {
            const status = minecraftManager.isConnected ? '🟢 Connected' : '🔴 Disconnected';
            const players = minecraftManager.getOnlinePlayers();
            
            let reply = `## 🎮 Minecraft Server\n` +
                       `**Status:** ${status}\n` +
                       `**Players Online:** ${players.length}\n`;
            
            if (players.length > 0) {
                reply += `**Players:** ${players.join(', ')}`;
            }
            
            message.reply(reply);
        }

        // Reconnect manual
        if (message.content === '!m reconnect') {
            minecraftManager.reconnect();
            message.reply('🔄 Reconnecting to Minecraft server...');
        }

        // Help
        if (message.content === '!m help') {
            const help = `
## 🎮 Minecraft Commands
**!m <message>** - Kirim chat ke Minecraft
**!m status** - Cek status server
**!m reconnect** - Reconnect manual
**!m help** - Show this help

Chat otomatis sync antara Discord ↔ Minecraft
            `;
            message.reply(help);
        }
    });

    // Forward Minecraft chat to Discord
    minecraftManager.on('chat', (message) => {
        const channelId = process.env.MINECRAFT_CHANNEL_ID;
        if (channelId) {
            const channel = client.channels.cache.get(channelId);
            if (channel) {
                channel.send(`**💬 Minecraft:** ${message}`);
            }
        }
    });

    minecraftManager.on('playerJoined', (playerName) => {
        const channelId = process.env.MINECRAFT_CHANNEL_ID;
        if (channelId) {
            const channel = client.channels.cache.get(channelId);
            if (channel) {
                channel.send(`🟢 **${playerName}** joined the game`);
            }
        }
    });

    minecraftManager.on('playerLeft', (playerName) => {
        const channelId = process.env.MINECRAFT_CHANNEL_ID;
        if (channelId) {
            const channel = client.channels.cache.get(channelId);
            if (channel) {
                channel.send(`🔴 **${playerName}** left the game`);
            }
        }
    });

    minecraftManager.on('connected', () => {
        const channelId = process.env.MINECRAFT_CHANNEL_ID;
        if (channelId) {
            const channel = client.channels.cache.get(channelId);
            if (channel) {
                channel.send('🟢 **Minecraft bot connected!**');
            }
        }
    });

    minecraftManager.on('disconnected', () => {
        const channelId = process.env.MINECRAFT_CHANNEL_ID;
        if (channelId) {
            const channel = client.channels.cache.get(channelId);
            if (channel) {
                channel.send('🔴 **Minecraft bot disconnected**');
            }
        }
    });
}

module.exports = {
    MinecraftManager,
    initMinecraft
};
