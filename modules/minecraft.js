// modules/minecraft.js
// Full-featured Minecraft <-> Discord relay for 2 servers
// Features:
// - 2 Mineflayer bots (Server 1 & Server 2)
// - Persistent reconnect loop (waits while server offline)
// - Relay: Discord -> Minecraft (S1, S2, ALL)
// - Relay: Minecraft -> Discord (all chat, commands, plugin/server responses)
// - Command detection (player commands starting with '/')
// - Queue messages when server offline, send when back online
// - Change Discord nickname on kick/ban and reset on login
// - !S1 UN / !S2 UN command to change bot nickname & disconnect-reconnect
// - !log S1 / !log S2 to display server stats in an embed
// - Logs saved to local files logs/server-<name>.log and sent to Discord channel

const mineflayer = require('mineflayer');
const fs = require('fs');
const path = require('path');
const { EmbedBuilder } = require('discord.js');

// ==== CONFIG ====
// Ganti ID_GUILD dan LOG_CHANNEL_ID sesuai servermu
const ID_GUILD = 'ID_GUILD_KAMU'; // <-- ganti
const LOG_CHANNEL_ID = '1426537842875826278'; // channel log gabungan

// Kapasitas default tiap server (bisa disesuaikan)
const DEFAULT_CAPACITY = 100;

// Nama prefix yang dipakai di Minecraft relay
const PREFIX_S1 = '[S1]';
const PREFIX_S2 = '[S2]';
const PREFIX_ALL = '[ALL]';

// 50+ random names untuk ganti nickname saat dikick/ban
const randomNames = [
  'BananaBot','BotPanas','NotchAnakBuah','KickedBoy','BannedGuy','MainTerus',
  'ServerDrop','NoSignal','CrashMan','ByeBot','Reconnecter','LostInNether',
  'AFKBanget','KickMaster','BlockHead','PacketLost','SleepyBot','CreeperFood',
  'MiningLagi','TerbangYuk','BotNgeyel','BotNakal','KickLagi','BanLagi',
  'DisuruhPulang','BotKocak','BotKabur','DisuruhTidur','ErrorTerus','BotNgambek',
  'Disconnected','KickZone','BotDipukul','NgilangTiba2','AduhDC','RestartBot',
  'RespawnLag','JatohVoid','TimeoutGang','LoginLagi','OopsKicked','AFKLama',
  'ByeServer','BotLupaPassword','Ping999+','ServerMarah','BotNgopi','KickedBanget',
  'BotGagalMasuk','TerbannedSedih','BannedForever','KickedForever','KickChampion'
];

// Server configurations (ubah host/port/username/defaultNickname/capacity jika perlu)
const servers = [
  {
    id: 's1',
    name: 'Server 1',
    host: 'BananaUcok.aternos.me',
    port: 14262,
    username: 'BotServer1',
    defaultNickname: 'BotServer1',
    capacity: 100
  },
  {
    id: 's2',
    name: 'Server 2',
    host: 'nightz.my.id',
    port: 25583,
    username: 'BotServer2',
    defaultNickname: 'BotServer2',
    capacity: 100
  }
];

// internal state per server
const state = {};

// ensure logs folder
if (!fs.existsSync('./logs')) fs.mkdirSync('./logs');

function appendLocalLog(serverId, line) {
  const file = path.join('logs', `server-${serverId}.log`);
  const ts = new Date().toISOString();
  fs.appendFile(file, `[${ts}] ${line}\n`, () => {});
}

function getRandomName() {
  return randomNames[Math.floor(Math.random() * randomNames.length)];
}

function makePrefix(serverId) {
  return serverId === 's1' ? PREFIX_S1 : (serverId === 's2' ? PREFIX_S2 : PREFIX_ALL);
}

module.exports = {
  init: (client) => {
    // prepare state
    servers.forEach(s => {
      state[s.id] = {
        config: s,
        bot: null,
        reconnectTimeout: null,
        online: false,
        queuedMessages: [],
        players: new Set(), // best-effort tracking
        totalCommandsToday: 0,
        totalChatToday: 0,
        errorCount: 0,
        intervals: []
      };
    });

    // Discord message listener (relay & commands)
    client.on('messageCreate', async (msg) => {
      if (msg.author.bot) return;

      // Optional: limit commands to certain channel(s). We'll accept anywhere but log channel is LOG_CHANNEL_ID
      const content = msg.content.trim();

      // !log S1 / !log S2
      if (/^!log\s+S1$/i.test(content)) return sendServerStatus(client, 's1', msg.channel);
      if (/^!log\s+S2$/i.test(content)) return sendServerStatus(client, 's2', msg.channel);

      // !S1 UN / !S2 UN -> change Discord nickname for bot and restart connection for that server
      if (/^!S1\s+UN$/i.test(content)) return changeBotNicknameAndRestart(client, 's1', msg.author.username);
      if (/^!S2\s+UN$/i.test(content)) return changeBotNicknameAndRestart(client, 's2', msg.author.username);

      // Relay shortcuts: "S1 <text>", "S2 <text>", "ALL <text>"
      const matchS1 = content.match(/^S1\s+([\s\S]+)/i);
      const matchS2 = content.match(/^S2\s+([\s\S]+)/i);
      const matchAll = content.match(/^ALL\s+([\s\S]+)/i);

      if (matchS1) return handleDiscordToMinecraft(client, 's1', msg.author, matchS1[1]);
      if (matchS2) return handleDiscordToMinecraft(client, 's2', msg.author, matchS2[1]);
      if (matchAll) return handleDiscordToMinecraft(client, 'all', msg.author, matchAll[1]);

      // Allow direct command-style prefix: "!mc s1 /op Player" (backwards-compatible)
      const matchMcCmd = content.match(/^!mc\s+(s1|s2|all)\s+([\s\S]+)/i);
      if (matchMcCmd) {
        const serverKey = matchMcCmd[1].toLowerCase();
        return handleDiscordToMinecraft(client, serverKey === 'all' ? 'all' : serverKey === 's1' ? 's1' : 's2', msg.author, matchMcCmd[2]);
      }

      // nothing matched
    });

    // create bots for each server
    servers.forEach(s => createBotForServer(client, s));
  }
};

// ===== helpers =====
async function sendLogToChannel(client, content, options = {}) {
  try {
    const ch = await client.channels.fetch(LOG_CHANNEL_ID);
    if (!ch) return;
    // content could be string or embed
    if (options.embed) return ch.send({ embeds: [options.embed] });
    return ch.send(content);
  } catch (err) {
    console.error('Failed to send log to channel:', err);
  }
}

function simpleLog(client, serverId, line) {
  const tag = makePrefix(serverId);
  const final = `${tag} ${line}`;
  appendLocalLog(serverId, final);
  sendLogToChannel(client, final);
}

async function sendServerStatus(client, serverId, replyChannel) {
  const st = state[serverId];
  if (!st) return replyChannel.send('Server tidak ditemukan');
  const conf = st.config;
  // get player list best-effort
  const players = Array.from(st.players.values ? st.players.values() : st.players) || [];
  const embed = new EmbedBuilder()
    .setTitle(`${conf.name} Status`)
    .addFields(
      { name: 'Status', value: st.online ? '🟢 ONLINE' : '🔴 OFFLINE', inline: true },
      { name: 'IP', value: `${conf.host}:${conf.port}`, inline: true },
      { name: 'Players', value: `${players.length}/${conf.capacity}`, inline: true },
      { name: 'Uptime / Downtime', value: st.online ? formatUptime(st.startedAt) : `Down for ${msToHuman(Date.now() - st.lastOfflineAt)}`, inline: false },
      { name: 'Total Commands Today', value: `${st.totalCommandsToday}`, inline: true },
      { name: 'Total Chat Today', value: `${st.totalChatToday}`, inline: true },
      { name: 'Errors Today', value: `${st.errorCount}`, inline: true }
    )
    .setTimestamp();
  return replyChannel.send({ embeds: [embed] });
}

function msToHuman(ms) {
  const s = Math.floor(ms/1000)%60;
  const m = Math.floor(ms/60000)%60;
  const h = Math.floor(ms/3600000);
  return `${h} jam ${m} menit ${s} detik`;
}

async function changeBotNicknameAndRestart(client, serverId, requestedBy) {
  const st = state[serverId];
  if (!st) return;
  const guild = await client.guilds.fetch(ID_GUILD).catch(()=>null);
  if (!guild) return;
  try {
    const member = await guild.members.fetch(client.user.id);
    const newName = `UN_${getRandomName()}`;
    await member.setNickname(newName).catch(()=>null);
    simpleLog(client, serverId, `[LOG] Nickname changed to: ${newName} (requested by ${requestedBy})`);
  } catch (err) {
    console.error('Failed change nickname:', err);
  }
  // disconnect bot and let reconnect loop start
  if (st.bot) {
    try { st.bot.quit(); } catch(e){}
  }
}

async function handleDiscordToMinecraft(client, target, author, text) {
  // target: 's1' | 's2' | 'all'
  const ts = new Date().toISOString();
  if (target === 'all') {
    // send to all servers
    for (const sid of Object.keys(state)) {
      await sendToServerMessage(client, sid, `${makePrefix(sid)} ${author.username}: ${text}`, true, author.username, text);
    }
    // log
    sendLogToChannel(client, `[DISCORD → ALL] ${author.username}: ${text}`);
    return;
  }
  await sendToServerMessage(client, target, `${makePrefix(target)} ${author.username}: ${text}`, true, author.username, text);
  sendLogToChannel(client, `[DISCORD → ${target.toUpperCase()}] ${author.username}: ${text}`);
}

async function sendToServerMessage(client, serverId, rawText, fromDiscord = false, discordUser = null, originalText = null) {
  const st = state[serverId];
  if (!st) return;
  const bot = st.bot;
  const conf = st.config;

  // Determine what to send in-game: we want prefix [Sx] + username: message for chat
  // If message starts with '/', treat as command and send bot.chat('/command...')
  // But per requirement: when Discord->Minecraft, Minecraft should NOT know who sent it; only show prefix + name

  // We'll craft inGameMessage depending on whether the original text starts with '/'
  const trimmed = originalText !== null ? originalText.trim() : rawText.trim();
  const inGamePrefix = makePrefix(serverId);

  if (!st.online || !bot) {
    // queue message
    st.queuedMessages.push({ rawText, discordUser, originalText, time: Date.now() });
    appendLocalLog(serverId, `[QUEUED] ${rawText}`);
    simpleLog(client, serverId, `Server OFFLINE. Pesan ditambahkan ke antrean: ${rawText}`);
    return;
  }

  if (trimmed.startsWith('/')) {
    // send command as-is but bot will send it (Minecraft won't see discord username)
    try {
      bot.chat(trimmed);
      st.totalCommandsToday++;
      appendLocalLog(serverId, `[DISCORD_CMD] ${discordUser}: ${trimmed}`);
      simpleLog(client, serverId, `[CMD] Discord -> Minecraft executed by bot: ${trimmed}`);
    } catch (err) {
      st.errorCount++;
      simpleLog(client, serverId, `[ERROR] Failed to run command: ${trimmed} (${err.message})`);
    }
  } else {
    // send as chat with prefix
    const toSend = `${inGamePrefix} ${discordUser}: ${trimmed}`;
    try {
      bot.chat(toSend);
      st.totalChatToday++;
      appendLocalLog(serverId, `[DISCORD_CHAT] ${discordUser}: ${trimmed}`);
      simpleLog(client, serverId, `[DISCORD → MC] ${discordUser}: ${trimmed}`);
    } catch (err) {
      st.errorCount++;
      simpleLog(client, serverId, `[ERROR] Failed to send chat: ${toSend} (${err.message})`);
    }
  }
}

// ===== create bot =====
function createBotForServer(client, conf) {
  const sid = conf.id;
  const st = state[sid];

  async function connect() {
    console.log(`Connecting ${conf.name}...`);

    try {
      const bot = mineflayer.createBot({
        host: conf.host,
        port: conf.port,
        username: conf.username,
        version: '1.20.1',
        auth: 'offline',
        checkTimeoutInterval: 60000
      });

      st.bot = bot;

      // reset intervals holder
      st.intervals.forEach(i => clearInterval(i));
      st.intervals = [];

      bot.on('login', async () => {
        st.online = true;
        st.startedAt = Date.now();
        st.lastOfflineAt = null;
        simpleLog(client, sid, `✅ Bot connected to ${conf.name}`);

        // reset Discord nickname to default
        try {
          const guild = await client.guilds.fetch(ID_GUILD).catch(()=>null);
          if (guild) {
            const member = await guild.members.fetch(client.user.id);
            await member.setNickname(conf.defaultNickname).catch(()=>null);
          }
        } catch (e) { }

        // send queued messages if any
        if (st.queuedMessages.length > 0) {
          const queued = st.queuedMessages.splice(0);
          simpleLog(client, sid, `[LOG] Server ONLINE — sending ${queued.length} queued messages`);
          for (const qm of queued) {
            await sendToServerMessage(client, sid, qm.rawText, true, qm.discordUser, qm.originalText);
          }
        }

        // simple anti-afk intervals (store to clear later)
        const i1 = setInterval(()=>{ if (bot && bot.entity) { try { bot.setControlState('forward', true); setTimeout(()=>bot.setControlState('forward', false), 500); } catch(e){} } }, 60000);
        const i2 = setInterval(()=>{ if (bot && bot.entity) { try { bot.setControlState('jump', true); setTimeout(()=>bot.setControlState('jump', false), 300); } catch(e){} } }, 120000);
        const i3 = setInterval(()=>{ if (bot) { try { bot.chat('Masih di sini 😎'); } catch(e){} } }, 300000);
        const i4 = setInterval(()=>{ if (bot && bot.entity) { try { const yaw = Math.random()*Math.PI*2; const pitch=(Math.random()-0.5)*Math.PI/2; bot.look(yaw,pitch,true); } catch(e){} } }, 90000);
        st.intervals.push(i1,i2,i3,i4);

        // try to populate players from bot.players if available
        if (bot.players) Object.keys(bot.players).forEach(pn => st.players.add(pn));
      });

      bot.on('message', (jsonMsg) => {
        try {
          const text = jsonMsg.toString();
          handleMinecraftMessage(client, sid, text);
        } catch (e) {}
      });

      // mineflayer sometimes emits messagestr
      bot.on('messagestr', (message) => {
        try { handleMinecraftMessage(client, sid, message); } catch(e){}
      });

      bot.on('playerJoined', (player) => {
        try { st.players.add(player.username); simpleLog(client, sid, `[PLAYER JOIN] ${player.username}`); } catch(e){}
      });
      bot.on('playerLeft', (player) => {
        try { st.players.delete(player.username); simpleLog(client, sid, `[PLAYER LEAVE] ${player.username}`); } catch(e){}
      });

      const handleDisconnect = async (reason) => {
        st.online = false;
        st.lastOfflineAt = Date.now();
        simpleLog(client, sid, `🚪 Bot disconnected: ${reason}`);
        // change discord nickname immediately
        try {
          const guild = await client.guilds.fetch(ID_GUILD).catch(()=>null);
          if (guild) {
            const member = await guild.members.fetch(client.user.id);
            const newName = getRandomName();
            await member.setNickname(newName).catch(()=>null);
            simpleLog(client, sid, `[LOG] Nickname changed to: ${newName}`);
          }
        } catch (e) {}
        // clear intervals
        st.intervals.forEach(i => clearInterval(i));
        st.intervals = [];
        scheduleReconnect(conf);
      };

      bot.on('kicked', handleDisconnect);
      bot.on('end', handleDisconnect);

      bot.on('error', (err) => {
        st.errorCount++;
        simpleLog(client, sid, `[ERROR] ${err.message}`);
        // don't call bot.chat or anything here
        // let 'end' or 'kicked' handle reconnection
      });

    } catch (err) {
      st.errorCount++;
      simpleLog(client, sid, `[ERROR] createBot failed: ${err.message}`);
      scheduleReconnect(conf);
    }
  }

  function scheduleReconnect(confLocal) {
    const sid = confLocal.id;
    const stLocal = state[sid];
    if (stLocal.reconnectTimeout) clearTimeout(stLocal.reconnectTimeout);
    stLocal.reconnectTimeout = setTimeout(()=>{
      simpleLog(globalClient, sid, `♻️ Attempting reconnect to ${confLocal.name}...`);
      connect();
    }, 30000);
  }

  // start connect
  connect();

  // keep a reference to client for scheduleReconnect logging
  var globalClient = null;
  try { globalClient = require('discord.js').Client ? null : null; } catch(e){}
}

// ===== message parsing =====
function handleMinecraftMessage(client, serverId, text) {
  const st = state[serverId];
  if (!st) return;

  // normalize
  const t = String(text).trim();
  if (!t) return;

  // Append local log and increment chat count
  appendLocalLog(serverId, t);

  // Detect player chat: common format "Player: message" or "[Rank] Player: message"
  // We'll try to parse patterns: "[Rank] Name: msg" or "Name: msg"
  const playerChatMatch = t.match(/^(?:\[(.*?)\]\s*)?([A-Za-z0-9_\-]+):\s*(.*)$/);
  if (playerChatMatch) {
    const rank = playerChatMatch[1] ? playerChatMatch[1] : null;
    const player = playerChatMatch[2];
    const msg = playerChatMatch[3];
    st.totalChatToday++;
    // log to discord with rank if present
    const rankTag = rank ? `[${rank}] ` : '';
    sendLogToChannel(client, `${makePrefix(serverId)} ${rankTag}${player}: ${msg}`);
    // track players
    st.players.add(player);
    return;
  }

  // Detect join/quit system messages
  const joinMatch = t.match(/^([A-Za-z0-9_\-]+) joined the game$/i);
  const leftMatch = t.match(/^([A-Za-z0-9_\-]+) left the game$/i);
  if (joinMatch) { st.players.add(joinMatch[1]); sendLogToChannel(client, `${makePrefix(serverId)} [LOG] ${joinMatch[1]} joined the game`); return; }
  if (leftMatch) { st.players.delete(leftMatch[1]); sendLogToChannel(client, `${makePrefix(serverId)} [LOG] ${leftMatch[1]} left the game`); return; }

  // Detect command responses or server/plugin messages - fallback: send everything to discord
  // For command outputs, users often issue: "Player issued server command: /pl" then server outputs next line(s).
  const issuedCmd = t.match(/^([A-Za-z0-9_\-]+) issued server command: (\/\S+.*)$/i);
  if (issuedCmd) {
    const player = issuedCmd[1];
    const cmd = issuedCmd[2];
    st.totalCommandsToday++;
    sendLogToChannel(client, `${makePrefix(serverId)} ${player}: ${cmd}`);
    return;
  }

  // Many plugin/server messages will not match above - forward them with tag
  sendLogToChannel(client, `${makePrefix(serverId)} ${t}`);
}

// Helper: format uptime
function formatUptime(startTime) {
  if (!startTime) return '—';
  return msToHuman(Date.now() - startTime);
}

// End of file
