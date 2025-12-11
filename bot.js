const Discord = require('discord.js-selfbot-v13');
const fs = require('fs').promises;
const config = require('./config.json');
const fetch = require('node-fetch');
const { createWorker } = require('tesseract.js');

// İstatistik
const stats = new Map();

// Rastgele mesaj 
async function getRandomMessage() {
    try {
        const data = await fs.readFile('kelimeler.txt', 'utf8');
        const messages = data.split('\n').filter(msg => msg.trim() !== '');
        return messages[Math.floor(Math.random() * messages.length)];
    } catch (error) {
        console.error('Kelimeler.txt okuma hatası:', error);
        return 'Merhaba!';
    }
}

// kalan süreyi hesaplama
function getTimeRemaining(lastTime, intervalHours) {
    if (!lastTime) return 'Henüz kullanılmadı';
    
    const now = new Date();
    const nextTime = new Date(lastTime.getTime() + intervalHours * 60 * 60 * 1000);
    const remaining = nextTime - now;
    
    if (remaining <= 0) return 'Hazır!';
    
    const hours = Math.floor(remaining / (60 * 60 * 1000));
    const minutes = Math.floor((remaining % (60 * 60 * 1000)) / (60 * 1000));
    
    return `${hours} saat ${minutes} dakika`;
}

class OwoBot {
    constructor(botConfig, isMainBot = false) {
        this.config = botConfig;
        this.client = new Discord.Client({
            checkUpdate: false,
            autoRedeemNitro: false,
            captchaService: false,
            password: false,
            ws: {
                properties: {
                    browser: config.clientSettings.browser,
                    os: config.clientSettings.os,
                    device: "",
                    browser_user_agent: config.clientSettings.browser_user_agent,
                    browser_version: config.clientSettings.browser_version,
                    os_version: config.clientSettings.os_version,
                    referrer: "",
                    referring_domain: "",
                    referrer_current: "",
                    referring_domain_current: "",
                    release_channel: "stable",
                    client_build_number: config.clientSettings.client_build_number,
                    client_event_source: null
                }
            }
        });
        this.isMainBot = isMainBot;
        this.stats = {
            huntCount: 0,
            dailyCount: 0,
            battleCount: 0,
            messageCount: 0,
            lastHuntTime: null,
            lastDailyTime: null,
            lastBattleTime: null,
            lastMessageTime: null,
            startTime: new Date(),
            xpAmount: "Henuz taranmadi"  // XP miktarı için yeni alan
        };
        
        stats.set(botConfig.token, this.stats);
        this.currentChannelIndex = {
            hunt: 0,
            daily: 0,
            battle: 0,
            message: 0
        };
        this.setupBot();
    }

    async setupBot() {
        this.client.on('ready', async () => {
            await this.client.user.setStatus(this.config.status);
            console.log(`${this.client.user.tag} olarak giris yapildi! (${this.config.status} modunda)`);
            this.startTasks();
        });

        if (this.isMainBot) {
            this.client.on('messageCreate', async (message) => {
                if (message.content === '!s') {
                    await this.sendAllBotsStats(message);
                }
            });
        }

        await this.client.login(this.config.token);
    }

    async startTasks() {
        const server = this.config.servers[0];
        
        // XP kontrolü
        setTimeout(() => this.checkOwOProfile(), 0);
        setTimeout(() => this.startHuntTask(server), 15000);
        setTimeout(() => this.startDailyTask(server), 30000);
        setTimeout(() => this.startBattleTask(server), 45000);
        setTimeout(() => this.startMessageTask(server), 60000);
        
        // saat başı xp kontrolü
        setInterval(() => this.checkOwOProfile(), 60 * 60 * 1000);
        
        console.log(`[${this.client.user.tag}] Komutlar sirayla baslatiliyor...`);
    }

    async startHuntTask(server) {
        while (true) {
            try {
                const currentServer = this.config.servers[this.currentChannelIndex.hunt];
                const guild = this.client.guilds.cache.get(currentServer.guildId);
                const channel = guild.channels.cache.get(currentServer.channelId);
                
                await channel.send('owo hunt');
                this.stats.huntCount++;
                this.stats.lastHuntTime = new Date();
                
                const minHours = config.timers.hunt.min;
                const maxHours = config.timers.hunt.max;
                const waitHours = minHours + Math.random() * (maxHours - minHours);
                
                console.log(`[${this.client.user.tag}] Hunt komutu kullanildi! Kanal: ${channel.name}, Toplam: ${this.stats.huntCount}`);
                console.log(`Bir sonraki hunt icin ${waitHours.toFixed(2)} saat bekleniyor...`);
                
                this.currentChannelIndex.hunt = (this.currentChannelIndex.hunt + 1) % this.config.servers.length;
                
                await new Promise(resolve => setTimeout(resolve, waitHours * 60 * 60 * 1000));
            } catch (error) {
                console.error(`[${this.client.user.tag}] Hunt hatasi:`, error);
                await new Promise(resolve => setTimeout(resolve, 60 * 1000));
            }
        }
    }

    async startDailyTask(server) {
        while (true) {
            try {
                const currentServer = this.config.servers[this.currentChannelIndex.daily];
                const guild = this.client.guilds.cache.get(currentServer.guildId);
                const channel = guild.channels.cache.get(currentServer.channelId);
                
                await channel.send('owo daily');
                this.stats.dailyCount++;
                this.stats.lastDailyTime = new Date();
                
                const minHours = config.timers.daily.min;
                const maxHours = config.timers.daily.max;
                const waitHours = minHours + Math.random() * (maxHours - minHours);
                
                console.log(`[${this.client.user.tag}] Daily komutu kullanildi! Kanal: ${channel.name}, Toplam: ${this.stats.dailyCount}`);
                console.log(`Bir sonraki daily icin ${waitHours.toFixed(2)} saat bekleniyor...`);
                
                this.currentChannelIndex.daily = (this.currentChannelIndex.daily + 1) % this.config.servers.length;
                
                await new Promise(resolve => setTimeout(resolve, waitHours * 60 * 60 * 1000));
            } catch (error) {
                console.error(`[${this.client.user.tag}] Daily hatasi:`, error);
                await new Promise(resolve => setTimeout(resolve, 60 * 1000));
            }
        }
    }

    async startBattleTask(server) {
        while (true) {
            try {
                const currentServer = this.config.servers[this.currentChannelIndex.battle];
                const guild = this.client.guilds.cache.get(currentServer.guildId);
                const channel = guild.channels.cache.get(currentServer.channelId);
                
                await channel.send('owo battle');
                this.stats.battleCount++;
                this.stats.lastBattleTime = new Date();
                
                const minHours = config.timers.battle.min;
                const maxHours = config.timers.battle.max;
                const waitHours = minHours + Math.random() * (maxHours - minHours);
                
                console.log(`[${this.client.user.tag}] Battle komutu kullanildi! Kanal: ${channel.name}, Toplam: ${this.stats.battleCount}`);
                console.log(`Bir sonraki battle icin ${waitHours.toFixed(2)} saat bekleniyor...`);
                
                this.currentChannelIndex.battle = (this.currentChannelIndex.battle + 1) % this.config.servers.length;
                
                await new Promise(resolve => setTimeout(resolve, waitHours * 60 * 60 * 1000));
            } catch (error) {
                console.error(`[${this.client.user.tag}] Battle hatasi:`, error);
                await new Promise(resolve => setTimeout(resolve, 60 * 1000));
            }
        }
    }

    async startMessageTask(server) {
        while (true) {
            try {
                const currentServer = this.config.servers[this.currentChannelIndex.message];
                const guild = this.client.guilds.cache.get(currentServer.guildId);
                const channel = guild.channels.cache.get(currentServer.channelId);
                
                const randomMessage = await getRandomMessage();
                await channel.send(randomMessage);
                this.stats.messageCount++;
                this.stats.lastMessageTime = new Date();
                
                console.log(`[${this.client.user.tag}] Rastgele mesaj gonderildi! Kanal: ${channel.name}, Toplam: ${this.stats.messageCount}`);
                
                this.currentChannelIndex.message = (this.currentChannelIndex.message + 1) % this.config.servers.length;
                
                await new Promise(resolve => setTimeout(resolve, config.timers.message.interval * 1000));
            } catch (error) {
                console.error(`[${this.client.user.tag}] Mesaj gonderme hatasi:`, error);
                await new Promise(resolve => setTimeout(resolve, 60 * 1000));
            }
        }
    }

    getUptime() {
        const now = new Date();
        const uptime = now - this.stats.startTime;
        
        const hours = Math.floor(uptime / (1000 * 60 * 60));
        const minutes = Math.floor((uptime % (1000 * 60 * 60)) / (1000 * 60));
        
        return `${hours} saat ${minutes} dakika`;
    }

    async checkOwOProfile() {
        try {
            const currentServer = this.config.servers[0];
            const guild = this.client.guilds.cache.get(currentServer.guildId);
            const channel = guild.channels.cache.get(currentServer.channelId);
            
            const sentMessage = await channel.send('owo profile');
            
            const response = await channel.awaitMessages({
                filter: m => m.author.id === '408785106942164992' && m.attachments.size > 0,
                max: 1,
                time: 10000
            });
            
            if (response.size > 0) {
                const attachment = response.first().attachments.first();
                
                const worker = await createWorker();
                await worker.load();
                await worker.loadLanguage('eng');
                await worker.initialize('eng');
                
                try {
                    const { data: { text } } = await worker.recognize(attachment.url);
                    
                    // kontrol
                    let statsMatch = text.match(/Rank:\s*#([\d,]+)\s*XP:\s*([\d,]+)\/([\d,]+)/);
                    
                    if (statsMatch) {
                        const rank = statsMatch[1];
                        const currentXP = statsMatch[2];
                        const maxXP = statsMatch[3];
                        this.stats.xpAmount = `Rank: #${rank} | XP: ${currentXP}/${maxXP}`;
                    } else {
                        // 2. format kontrolü
                        statsMatch = text.match(/XP:\s*([\d,]+)\/([\d,]+)/);
                        if (statsMatch) {
                            const currentXP = statsMatch[1];
                            const maxXP = statsMatch[2];
                            this.stats.xpAmount = `XP: ${currentXP}/${maxXP}`;
                        }
                    }
                    
                    if (statsMatch) {
                        console.log(`[${this.client.user.tag}] XP guncellendi: ${this.stats.xpAmount}`);
                    } else {
                        console.log(`[${this.client.user.tag}] XP formati bulunamadi. Bulunan metin:`, text);
                    }
                } finally {
                    await worker.terminate();
                }
            }
        } catch (error) {
            console.error(`[${this.client.user.tag}] XP kontrol hatasi:`, error);
            this.stats.xpAmount = "Kontrol hatasi";
        }
    }

    async sendAllBotsStats(message) {
        let statsMessage = 'Bot Istatistikleri:\n\n';
        
        for (const [token, botStats] of stats) {
            const botConfig = config.bots.find(b => b.token === token);
            if (!botConfig) continue;

            const huntAvgHours = (config.timers.hunt.min + config.timers.hunt.max) / 2;
            const dailyAvgHours = (config.timers.daily.min + config.timers.daily.max) / 2;
            const battleAvgHours = (config.timers.battle.min + config.timers.battle.max) / 2;
            
            const huntRemaining = getTimeRemaining(botStats.lastHuntTime, huntAvgHours);
            const dailyRemaining = getTimeRemaining(botStats.lastDailyTime, dailyAvgHours);
            const battleRemaining = getTimeRemaining(botStats.lastBattleTime, battleAvgHours);
            
            const uptime = new Date() - botStats.startTime;
            const uptimeHours = Math.floor(uptime / (1000 * 60 * 60));
            const uptimeMinutes = Math.floor((uptime % (1000 * 60 * 60)) / (1000 * 60));
            
            statsMessage += `Bot ${botConfig === config.bots[0] ? '1' : '2'}:\n`;
            statsMessage += `Calisma suresi: ${uptimeHours} saat ${uptimeMinutes} dakika\n`;
            statsMessage += `XP Miktari: ${botStats.xpAmount}\n`;  // XP bilgisini ekle
            statsMessage += `Yapilan Hunt sayisi: ${botStats.huntCount}\n`;
            statsMessage += `Yapilan Daily sayisi: ${botStats.dailyCount}\n`;
            statsMessage += `Yapilan Battle sayisi: ${botStats.battleCount}\n`;
            statsMessage += `Gonderilen Mesaj sayisi: ${botStats.messageCount}\n`;
            statsMessage += `Kalan Hunt suresi: ${huntRemaining}\n`;
            statsMessage += `Kalan Daily suresi: ${dailyRemaining}\n`;
            statsMessage += `Kalan Battle suresi: ${battleRemaining}\n\n`;
        }
        
        await message.channel.send(statsMessage);
    }
}

// başlatma 
async function startBots() {
    const bots = config.bots;
    if (bots.length === 0) {
        console.error('Bot yapilandirmasi bulunamadi!');
        return;
    }
    
    // ana bot
    new OwoBot(bots[0], true);
    
    // ikinci bot ve devamı
    new OwoBot(bots[1], false);
}


startBots().catch(console.error); 
