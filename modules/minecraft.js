// modules/minecraft.js
const mineflayer = require('mineflayer');
const fs = require('fs');
const path = require('path');
const { EmbedBuilder } = require('discord.js');

// ==== CONFIG ====
const ID_GUILD = '1347233781391560837';
const LOG_CHANNEL_ID = '1426537842875826278';
const CHANNEL_S1 = '1426537842875826278';
const CHANNEL_S2 = '1429751342301184071';

const randomNames = [
  'Delta','Botty','NotchX','Kicker','Banned','Player','Crashy','Signal','ByeBot','LostMC',
  'Reboot','Jumpin','Zapper','MinerX','Crafty','Blocky','Pixelz','Mobster','EnderX','Nether',
  'SkyBot','RedMC','BlueMC','GhostX','LavaMC','AquaBot','Frosty','StormX','BlazeX','IronMC',
  'GoldMC','Diamond','Emerald','SwiftX','LuckyX','MegaMC','MicroX','TinyBot','AlphaX','BetaMC',
  'GammaX','DeltaX','OmegaX','Shadow','Phantom','Mystic','Wizard','RogueX','NinjaX','Pirate',
  'Hunter','Archer','Builder','Farmer','MinerY','Slayer','Tanker','Sniper','ScoutX','Guardian',
  'TitanX','HyperX','SonicX','Rocket','AstroX','CometX','NovaMC','Pulsar','Eclipse','Stellar',
  'OrbitX','Galaxy','Meteor','Cosmic','Quantum','Vector','TurboX','Spectr','PrismX','Photon',
  'Fusion','Reactor','Voltage','Electron','Circuit','AtomX','Proton','Neutron','Magnet','Crystal',
  'ShinyX','SparkX','GlowMC','LightX','FlameX','EmberX','Inferno','PyroMC','BlazeMC','ServerDrop'
];

const servers = [
  { id:'s1', name:'Server 1', host:'BananaUcok.aternos.me', port:14262, username:'BotServer1', defaultNickname:'BotServer1', channel:CHANNEL_S1 },
  { id:'s2', name:'Server 2', host:'nightz.my.id', port:25583, username:'BotServer2', defaultNickname:'BotServer2', channel:CHANNEL_S2 }
];

const state = {};
if(!fs.existsSync('./logs')) fs.mkdirSync('./logs');

function appendLocalLog(serverId,line){
  const file = path.join('logs', `server-${serverId}.log`);
  const ts = new Date().toISOString();
  fs.appendFile(file, `[${ts}] ${line}\n`, ()=>{});
}

function getRandomName(){
  return randomNames[Math.floor(Math.random()*randomNames.length)];
}

function makePrefix(serverId){
  return serverId==='s1'? '[S1]' : '[S2]';
}

// ===== INIT =====
module.exports = {
  init: (client)=>{
    servers.forEach(s=>{
      state[s.id] = { config:s, bot:null, reconnectTimeout:null, online:false, queuedMessages:[], players:new Set(), totalCommandsToday:0, totalChatToday:0, totalEventsToday:0, errorCount:0, intervals:[], startedAt:null, lastOfflineAt:null };
    });

    // Discord listener
    client.on('messageCreate', async msg=>{
      if(msg.author.bot) return;
      const content = msg.content.trim();

      // !log S1/S2
      if(/^!log\s+s1$/i.test(content)) return sendServerStatus(client,'s1',msg.channel);
      if(/^!log\s+s2$/i.test(content)) return sendServerStatus(client,'s2',msg.channel);

      // !UN1 / !UN2
      const un1 = content.match(/^!UN1\s+(.+)$/i);
      const un2 = content.match(/^!UN2\s+(.+)$/i);
      if(un1) return changeBotNicknameAndRestart(client,'s1',un1[1]);
      if(un2) return changeBotNicknameAndRestart(client,'s2',un2[1]);

      // Relay chat: S1/S2/ALL
      const matchS1 = content.match(/^S1\s+([\s\S]+)/i);
      const matchS2 = content.match(/^S2\s+([\s\S]+)/i);
      const matchAll = content.match(/^ALL\s+([\s\S]+)/i);
      if(matchS1) return handleDiscordToMinecraft(client,'s1',msg.author,matchS1[1]);
      if(matchS2) return handleDiscordToMinecraft(client,'s2',msg.author,matchS2[1]);
      if(matchAll) return handleDiscordToMinecraft(client,'all',msg.author,matchAll[1]);

      // !mc s1/s2/all
      const mcCmd = content.match(/^!mc\s+(s1|s2|all)\s+([\s\S]+)/i);
      if(mcCmd){
        const target = mcCmd[1].toLowerCase();
        return handleDiscordToMinecraft(client,target==='all'?'all':target,msg.author,mcCmd[2]);
      }
    });

    // create bots
    servers.forEach(s=>createBotForServer(client,s));
  }
};

// ===== HELPERS =====
async function sendLogToChannel(client,content,options={}){
  try{
    const ch = await client.channels.fetch(LOG_CHANNEL_ID);
    if(!ch) return;
    if(options.embed) return ch.send({embeds:[options.embed]});
    return ch.send(content);
  }catch(err){console.error(err);}
}

function simpleLog(client,serverId,line){
  appendLocalLog(serverId,line);
  sendLogToChannel(client,line);
}

async function sendServerStatus(client,serverId,replyChannel){
  const st = state[serverId];
  if(!st) return replyChannel.send('Server tidak ditemukan');
  const conf = st.config;
  const players = Array.from(st.players.values?st.players.values():st.players)||[];
  const embed = new EmbedBuilder()
    .setTitle(`${conf.name} Status`)
    .addFields(
      {name:'Status', value: st.online?'🟢 ONLINE':'🔴 OFFLINE', inline:true},
      {name:'IP', value:`${conf.host}:${conf.port}`, inline:true},
      {name:'Players', value:`${players.length}`, inline:true},
      {name:'Total Chat Today', value:`${st.totalChatToday}`, inline:true},
      {name:'Total Commands Today', value:`${st.totalCommandsToday}`, inline:true},
      {name:'Total Events Today', value:`${st.totalEventsToday}`, inline:true},
      {name:'Errors Today', value:`${st.errorCount}`, inline:true}
    ).setTimestamp();
  return replyChannel.send({embeds:[embed]});
}

async function changeBotNicknameAndRestart(client,serverId,newNick){
  const st = state[serverId]; if(!st) return;
  const guild = await client.guilds.fetch(ID_GUILD).catch(()=>null); if(!guild) return;
  try{
    const member = await guild.members.fetch(client.user.id);
    await member.setNickname(newNick).catch(()=>null);
    simpleLog(client,serverId,`[LOG] Nickname changed to: ${newNick}`);
  }catch(err){console.error(err);}
  if(st.bot) try{st.bot.quit();}catch(e){}
}

async function handleDiscordToMinecraft(client,target,author,text){
  if(target==='all'){
    for(const sid of Object.keys(state)){
      await sendToServerMessage(client,sid,text,true,author.username);
    }
    sendLogToChannel(client,`[DISCORD → ALL] ${author.username}: ${text}`);
    return;
  }
  await sendToServerMessage(client,target,text,true,author.username);
  sendLogToChannel(client,`[DISCORD → ${target.toUpperCase()}] ${author.username}: ${text}`);
}

async function sendToServerMessage(client,serverId,text,fromDiscord=false,discordUser=null){
  const st = state[serverId]; if(!st) return;
  const bot = st.bot;
  if(!st.online||!bot){
    st.queuedMessages.push({text,discordUser,time:Date.now()});
    appendLocalLog(serverId,`[QUEUED] ${text}`);
    simpleLog(client,serverId,`Server OFFLINE. Pesan ditambahkan ke antrean: ${text}`);
    return;
  }

  const trimmed = text.trim();
  if(trimmed.startsWith('/')){
    try{
      bot.chat(trimmed);
      st.totalCommandsToday++;
      appendLocalLog(serverId,`[DISCORD_CMD] ${discordUser}: ${trimmed}`);
      simpleLog(client,serverId,`[CMD] Discord → Minecraft executed: ${trimmed}`);
    }catch(err){
      st.errorCount++;
      simpleLog(client,serverId,`[ERROR] CMD failed: ${trimmed} (${err.message})`);
    }
  }else{
    const toSend = `${makePrefix(serverId)} ${discordUser}: ${trimmed}`;
    try{
      bot.chat(toSend);
      st.totalChatToday++;
      appendLocalLog(serverId,`[DISCORD_CHAT] ${discordUser}: ${trimmed}`);
      simpleLog(client,serverId,`[DISCORD → MC] ${discordUser}: ${trimmed}`);
    }catch(err){
      st.errorCount++;
      simpleLog(client,serverId,`[ERROR] Chat failed: ${toSend} (${err.message})`);
    }
  }
}

// ===== CREATE BOT =====
function createBotForServer(client,conf){
  const sid = conf.id;
  const st = state[sid];

  async function connect(){
    try{
      const bot = mineflayer.createBot({host:conf.host, port:conf.port, username:conf.username, version:'1.20.1', auth:'offline'});
      st.bot = bot;
      st.intervals.forEach(i=>clearInterval(i)); st.intervals=[];

      bot.on('login', async ()=>{
        st.online=true; st.startedAt=Date.now(); st.lastOfflineAt=null;
        simpleLog(client,sid,`✅ Bot connected to ${conf.name}`);
        try{
          const guild = await client.guilds.fetch(ID_GUILD).catch(()=>null);
          if(guild){const member = await guild.members.fetch(client.user.id); await member.setNickname(conf.defaultNickname).catch(()=>null);}
        }catch(e){}

        if(st.queuedMessages.length>0){
          const queued = st.queuedMessages.splice(0);
          simpleLog(client,sid,`[LOG] Sending ${queued.length} queued messages`);
          for(const qm of queued) await sendToServerMessage(client,sid,qm.text,true,qm.discordUser);
        }

        st.intervals.push(setInterval(()=>{if(bot && bot.entity){try{bot.setControlState('forward',true);setTimeout(()=>bot.setControlState('forward',false),500);}catch(e){}}},60000));
        st.intervals.push(setInterval(()=>{if(bot && bot.entity){try{bot.setControlState('jump',true);setTimeout(()=>bot.setControlState('jump',false),300);}catch(e){}}},120000));
        st.intervals.push(setInterval(()=>{if(bot){try{bot.chat('Masih di sini 😎');}catch(e){}}},300000));
      });

      bot.on('message',(jsonMsg)=>{try{handleMinecraftMessage(client,sid,jsonMsg.toString());}catch(e){}});
      bot.on('messagestr',(msg)=>{try{handleMinecraftMessage(client,sid,msg);}catch(e){}});
      bot.on('playerJoined',(p)=>{st.players.add(p.username); st.totalEventsToday++; simpleLog(client,sid,`[PLAYER JOIN] ${p.username}`);});
      bot.on('playerLeft',(p)=>{st.players.delete(p.username); st.totalEventsToday++; simpleLog(client,sid,`[PLAYER LEAVE] ${p.username}`);});

      const handleDisconnect = async (reason)=>{
        st.online=false; st.lastOfflineAt=Date.now(); simpleLog(client,sid,`🚪 Bot disconnected: ${reason}`);
        try{
          const guild = await client.guilds.fetch(ID_GUILD).catch(()=>null);
          if(guild){
            const member = await guild.members.fetch(client.user.id);
            const newName=getRandomName();
            await member.setNickname(newName).catch(()=>null);
            simpleLog(client,sid,`[LOG] Nickname changed to: ${newName}`);
          }
        }catch(e){}
        st.intervals.forEach(i=>clearInterval(i)); st.intervals=[];
        scheduleReconnect(conf);
      };

      bot.on('kicked',handleDisconnect);
      bot.on('end',handleDisconnect);
      bot.on('error',(err)=>{st.errorCount++; simpleLog(client,sid,`[ERROR] ${err.message}`);});

    }catch(err){
      st.errorCount++;
      simpleLog(client,sid,`[ERROR] createBot failed: ${err.message}`);
      scheduleReconnect(conf);
    }
  }

  function scheduleReconnect(confLocal){
    const stLocal=state[confLocal.id];
    if(stLocal.reconnectTimeout) clearTimeout(stLocal.reconnectTimeout);
    stLocal.reconnectTimeout=setTimeout(()=>connect(),30000);
  }

  connect();
}

// ===== HANDLE MINECRAFT MESSAGE =====
function handleMinecraftMessage(client,serverId,text){
  const st=state[serverId]; if(!st) return;
  const t=String(text).trim(); if(!t) return;
  appendLocalLog(serverId,t);

  // player chat
  const playerChat = t.match(/^(?:(.*?)\s*)?([A-Za-z0-9_\-]+):\s*(.*)$/);
  if(playerChat){
    const rank = playerChat[1]?`[${playerChat[1]}] `:'';
    const player = playerChat[2];
    const msg = playerChat[3];
    const prefix = makePrefix(serverId);
    const content = `${prefix}${rank}${player}: ${msg}`;
    simpleLog(client, serverId, content);
    client.channels.fetch(state[serverId].config.channel).then(ch=>ch.send(content)).catch(()=>{});
    st.totalChatToday++;
    return;
  }

  // plugin/server messages
  const pluginMsg = t.match(/^\[(.+?)\]\s*(.*)$/);
  if(pluginMsg){
    const title = pluginMsg[1];
    const msg = pluginMsg[2];
    st.totalEventsToday++;
    const embed = new EmbedBuilder()
      .setTitle(`[${state[serverId].config.name}] ${title}`)
      .setDescription(msg)
      .setColor(0x00FF00)
      .setTimestamp();
    client.channels.fetch(state[serverId].config.channel).then(ch=>ch.send({embeds:[embed]})).catch(()=>{});
    return;
  }

  // generic catch-all
  st.totalEventsToday++;
  const embed = new EmbedBuilder()
    .setTitle(`[${state[serverId].config.name}] Server Message`)
    .setDescription(t)
    .setColor(0xFFFF00)
    .setTimestamp();
  client.channels.fetch(state[serverId].config.channel).then(ch=>ch.send({embeds:[embed]})).catch(()=>{});
}
