const mineflayer = require('mineflayer');
const { EventEmitter } = require('events');

class MinecraftManager extends EventEmitter {
    constructor(config) {
        super();
        this.config = config;
        this.bot = null;
        this.isConnected = false;
        this.reconnectAttempts = 0;
        this.maxReconnectAttempts = 10;
        this.players = new Map();
        this.chatHistory = [];
        this.maxChatHistory = 50;
    }

    async connect() {
        try {
            console.log('🟡 [Minecraft] Connecting to Minecraft server...');
            
            this.bot = mineflayer.createBot({
                host: this.config.host || 'localhost',
                port: this.config.port || 25565,
                username: this.config.username || 'DiscordBot',
                password: this.config.password || '',
                version: this.config.version || '1.20.1',
                auth: this.config.auth || 'mojang'
            });

            this.setupEventHandlers();
            
        } catch (error) {
            console.error('❌ [Minecraft] Failed to create Minecraft bot:', error);
            this.scheduleReconnect();
        }
    }

    setupEventHandlers() {
        this.bot.on('login', () => {
            console.log('🟢 [Minecraft] Bot connected successfully!');
            this.isConnected = true;
            this.reconnectAttempts = 0;
            this.emit('connected');
        });

        this.bot.on('error', (err) => {
            console.error('❌ [Minecraft] Bot error:', err);
            this.isConnected = false;
            this.emit('error', err);
            this.scheduleReconnect();
        });

        this.bot.on('end', () => {
            console.log('🔴 [Minecraft] Bot disconnected');
            this.isConnected = false;
            this.emit('disconnected');
            this.scheduleReconnect();
        });

        this.bot.on('message', (jsonMsg) => {
            const message = jsonMsg.toString().trim();
            if (this.isValidChatMessage(message)) {
                console.log(`💬 [Minecraft] ${message}`);
                
                // Add to chat history
                this.chatHistory.push({
                    timestamp: new Date(),
                    message: message,
                    type: 'minecraft'
                });
                
                // Keep only recent messages
                if (this.chatHistory.length > this.maxChatHistory) {
                    this.chatHistory = this.chatHistory.slice(-this.maxChatHistory);
                }
                
                this.emit('chat', message);
            }
        });

        this.bot.on('playerJoined', (player) => {
            console.log(`🟢 [Minecraft] Player joined: ${player.username}`);
            this.players.set(player.username, player);
            this.emit('playerJoined', player.username);
        });

        this.bot.on('playerLeft', (player) => {
            console.log(`🔴 [Minecraft] Player left: ${player.username}`);
            this.players.delete(player.username);
            this.emit('playerLeft', player.username);
        });

        this.bot.on('kicked', (reason) => {
            console.log(`🚫 [Minecraft] Bot kicked: ${reason}`);
            this.emit('kicked', reason);
        });

        this.bot.on('spawn', () => {
            console.log('📍 [Minecraft] Bot spawned in world');
            this.emit('spawned');
        });

        this.bot.on('death', () => {
            console.log('💀 [Minecraft] Bot died');
            this.emit('death');
        });
    }

    isValidChatMessage(message) {
        // Filter out system messages and join/leave messages
        return message && 
               !message.includes('joined the game') && 
               !message.includes('left the game') &&
               !message.includes('Advanced to') &&
               !message.includes('Completed') &&
               !message.includes('has made the advancement') &&
               !message.includes('achievement') &&
               message.length > 2 &&
               !message.startsWith('<') && // Skip formatted chat if any
               !message.startsWith('>');
    }

    sendChat(message) {
        if (this.bot && this.isConnected) {
            this.bot.chat(message);
            return true;
        }
        return false;
    }

    sendCommand(command) {
        if (this.bot && this.isConnected) {
            this.bot.chat(`/${command}`);
            return true;
        }
        return false;
    }

    getOnlinePlayers() {
        return Array.from(this.players.keys());
    }

    getPlayerCount() {
        return this.players.size;
    }

    getChatHistory(limit = 10) {
        return this.chatHistory.slice(-limit);
    }

    getBotPosition() {
        if (this.bot && this.bot.entity) {
            return {
                x: Math.floor(this.bot.entity.position.x),
                y: Math.floor(this.bot.entity.position.y),
                z: Math.floor(this.bot.entity.position.z),
                dimension: this.bot.game.dimension || 'unknown'
            };
        }
        return null;
    }

    getBotHealth() {
        if (this.bot && this.bot.health) {
            return {
                health: this.bot.health,
                food: this.bot.food,
                saturation: this.bot.foodSaturation
            };
        }
        return null;
    }

    scheduleReconnect() {
        if (this.reconnectAttempts < this.maxReconnectAttempts) {
            this.reconnectAttempts++;
            const delay = Math.min(30000, this.reconnectAttempts * 5000);
            
            console.log(`🟡 [Minecraft] Reconnecting in ${delay/1000}s... (Attempt ${this.reconnectAttempts}/${this.maxReconnectAttempts})`);
            
            setTimeout(() => {
                if (!this.isConnected) {
                    this.connect();
                }
            }, delay);
        } else {
            console.error('❌ [Minecraft] Max reconnection attempts reached');
            this.emit('reconnectFailed');
        }
    }

    disconnect() {
        if (this.bot) {
            this.bot.end();
            this.isConnected = false;
            console.log('🛑 [Minecraft] Bot disconnected');
        }
    }

    // Utility method to check if bot is alive
    isAlive() {
        return this.bot && this.bot.health > 0;
    }
}

// Function to initialize Minecraft manager
function initMinecraft(client, config) {
    const minecraftManager = new MinecraftManager(config);
    
    // Connect to Minecraft server
    minecraftManager.connect();
    
    // Setup Discord command handlers for Minecraft
    setupMinecraftCommands(client, minecraftManager);
    
    return minecraftManager;
}

// Setup Discord commands for Minecraft
function setupMinecraftCommands(client, minecraftManager) {
    client.on('messageCreate', async (message) => {
        if (message.author.bot) return;
        
        // Only respond to commands in specific channels or DMs
        const allowedChannels = process.env.MINECRAFT_CHANNELS ? 
            process.env.MINECRAFT_CHANNELS.split(',') : [];
        
        if (message.channel.type !== 1 && !allowedChannels.includes(message.channel.id)) {
            return;
        }

        if (message.content.startsWith('!mc ')) {
            const command = message.content.slice(4).trim();
            
            if (command) {
                if (minecraftManager.isConnected) {
                    const success = minecraftManager.sendChat(command);
                    if (success) {
                        message.reply(`✅ **Minecraft Command Executed:** \`${command}\``);
                    } else {
                        message.reply('❌ **Failed to send command to Minecraft**');
                    }
                } else {
                    message.reply('❌ **Minecraft bot is not connected**');
                }
            }
        }

        if (message.content === '!mc status') {
            const status = minecraftManager.isConnected ? '🟢 **Connected**' : '🔴 **Disconnected**';
            const players = minecraftManager.getOnlinePlayers();
            const position = minecraftManager.getBotPosition();
            const health = minecraftManager.getBotHealth();
            
            let statusMessage = `## 🎮 Minecraft Bot Status\n`;
            statusMessage += `${status}\n`;
            statusMessage += `**Players Online:** ${players.length}\n`;
            
            if (players.length > 0) {
                statusMessage += `**Online:** ${players.join(', ')}\n`;
            }
            
            if (position) {
                statusMessage += `**Position:** ${position.x}, ${position.y}, ${position.z} (${position.dimension})\n`;
            }
            
            if (health) {
                statusMessage += `**Health:** ❤️ ${health.health} | 🍖 ${health.food}`;
            }
            
            message.reply(statusMessage);
        }

        if (message.content === '!mc players') {
            const players = minecraftManager.getOnlinePlayers();
            if (players.length > 0) {
                message.reply(`## 👥 Minecraft Players (${players.length})\n${players.join('\n')}`);
            } else {
                message.reply('## 👥 Minecraft Players\n**No players online**');
            }
        }

        if (message.content === '!mc chat') {
            const chatHistory = minecraftManager.getChatHistory(5);
            if (chatHistory.length > 0) {
                const chatText = chatHistory.map(entry => 
                    `[${entry.timestamp.toLocaleTimeString()}] ${entry.message}`
                ).join('\n');
                message.reply(`## 💬 Recent Minecraft Chat\n${chatText}`);
            } else {
                message.reply('## 💬 Recent Minecraft Chat\n**No recent chat messages**');
            }
        }

        if (message.content === '!mc help') {
            const helpEmbed = {
                color: 0x00FF00,
                title: '🎮 Minecraft Bot Commands',
                fields: [
                    {
                        name: '!mc <message>',
                        value: 'Send chat message to Minecraft',
                        inline: false
                    },
                    {
                        name: '!mc status',
                        value: 'Check Minecraft bot status',
                        inline: false
                    },
                    {
                        name: '!mc players',
                        value: 'List online players',
                        inline: false
                    },
                    {
                        name: '!mc chat',
                        value: 'Show recent chat history',
                        inline: false
                    },
                    {
                        name: '!mc help',
                        value: 'Show this help message',
                        inline: false
                    }
                ],
                timestamp: new Date().toISOString(),
            };
            message.reply({ embeds: [helpEmbed] });
        }
    });
}

// Auto-reconnect when Discord bot restarts
function setupAutoFeatures(client, minecraftManager) {
    // Reconnect when Discord bot is ready
    client.on('ready', () => {
        if (!minecraftManager.isConnected) {
            console.log('🔄 [Minecraft] Attempting to reconnect...');
            minecraftManager.connect();
        }
    });

    // Sync Minecraft chat to Discord
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
                channel.send(`🟢 **${playerName}** joined the Minecraft server`);
            }
        }
    });

    minecraftManager.on('playerLeft', (playerName) => {
        const channelId = process.env.MINECRAFT_CHANNEL_ID;
        if (channelId) {
            const channel = client.channels.cache.get(channelId);
            if (channel) {
                channel.send(`🔴 **${playerName}** left the Minecraft server`);
            }
        }
    });
}

module.exports = {
    MinecraftManager,
    initMinecraft,
    setupMinecraftCommands,
    setupAutoFeatures
};
