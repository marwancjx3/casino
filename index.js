const { Client, GatewayIntentBits, EmbedBuilder } = require('discord.js');
const config = require('./config.js');
const keepAlive = require('./keep_alive.js');
const fs = require('fs');
const path = require('path');

// Initialize client
const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.GuildMembers
    ]
});

// Load utilities
const utils = {};
const utilsPath = path.join(__dirname, 'utils');
fs.readdirSync(utilsPath).forEach(file => {
    if (file.endsWith('.js')) {
        utils[file.replace('.js', '')] = require(path.join(utilsPath, file));
    }
});

// Load games
const games = {};
const gamesPath = path.join(__dirname, 'games');
fs.readdirSync(gamesPath).forEach(file => {
    if (file.endsWith('.js')) {
        games[file.replace('.js', '')] = require(path.join(gamesPath, file));
    }
});

// Load events
const eventsPath = path.join(__dirname, 'events');
fs.readdirSync(eventsPath).forEach(file => {
    if (file.endsWith('.js')) {
        const event = require(path.join(eventsPath, file));
        const eventName = file.replace('.js', '');
        client.on(eventName, event.bind(null, client, utils, games));
    }
});

// Database handling
const bankFile = path.join(__dirname, 'database', 'bank.json');
const playersFile = path.join(__dirname, 'database', 'players.json');

// Ensure database files exist
if (!fs.existsSync(path.join(__dirname, 'database'))) {
    fs.mkdirSync(path.join(__dirname, 'database'));
}

if (!fs.existsSync(bankFile)) {
    fs.writeFileSync(bankFile, JSON.stringify({ balance: 1000000, locked: false, closed: false }));
}

if (!fs.existsSync(playersFile)) {
    fs.writeFileSync(playersFile, JSON.stringify({}));
}

// Message handler
client.on('messageCreate', async (message) => {
    if (message.author.bot) return;
    
    const args = message.content.split(' ');
    const command = args[0].toLowerCase();
    const isArabic = /[\u0600-\u06FF]/.test(command);
    
    // Check if casino is closed
    const bank = JSON.parse(fs.readFileSync(bankFile));
    if (bank.closed && !message.author.id === config.ownerId) {
        return message.reply(isArabic ? config.ar.casinoClosed : "Casino is currently closed");
    }
    
    // Process ProBot payment messages
    if (message.author.id === config.probotId && message.mentions.has(client.user.id)) {
        await utils.payment.processPayment(client, message);
        return;
    }
    
    // Owner commands
    if (message.author.id === config.ownerId) {
        if (command === 'اضافة للبنك' || command === 'addbank') {
            const amount = parseInt(args[1]);
            if (isNaN(amount)) return;
            
            bank.balance += amount;
            fs.writeFileSync(bankFile, JSON.stringify(bank));
            
            const embed = new EmbedBuilder()
                .setColor(config.colors.success)
                .setTitle(isArabic ? 'تم اضافة للبنك' : 'Bank Updated')
                .setDescription(isArabic ? `تم اضافة ${amount} نقطة` : `Added ${amount} credits`)
                .addFields({ name: isArabic ? 'الرصيد الجديد' : 'New Balance', value: bank.balance.toString() });
            
            return message.reply({ embeds: [embed] });
        }
        
        if (command === 'سحب من البنك' || command === 'removebank') {
            const amount = parseInt(args[1]);
            if (isNaN(amount) || bank.balance < amount) return;
            
            bank.balance -= amount;
            fs.writeFileSync(bankFile, JSON.stringify(bank));
            
            const embed = new EmbedBuilder()
                .setColor(config.colors.success)
                .setTitle(isArabic ? 'تم السحب من البنك' : 'Bank Updated')
                .setDescription(isArabic ? `تم سحب ${amount} نقطة` : `Removed ${amount} credits`)
                .addFields({ name: isArabic ? 'الرصيد الجديد' : 'New Balance', value: bank.balance.toString() });
            
            return message.reply({ embeds: [embed] });
        }
        
        if (command === 'رصيد البنك' || command === 'bankbalance') {
            const embed = new EmbedBuilder()
                .setColor(config.colors.info)
                .setTitle(isArabic ? 'رصيد البنك' : 'Bank Balance')
                .setDescription(isArabic ? `💰 الرصيد: ${bank.balance}` : `💰 Balance: ${bank.balance}`)
                .addFields(
                    { name: isArabic ? 'مقفول' : 'Locked', value: bank.locked ? '✅' : '❌', inline: true },
                    { name: isArabic ? 'مغلق' : 'Closed', value: bank.closed ? '✅' : '❌', inline: true }
                );
            
            return message.reply({ embeds: [embed] });
        }
        
        if (command === 'lockgame') {
            const gameName = args[1];
            if (!gameName) return;
            
            if (!fs.existsSync(path.join(__dirname, 'games', `${gameName}.js`))) return;
            
            bank.locked = true;
            fs.writeFileSync(bankFile, JSON.stringify(bank));
            
            return message.reply(isArabic ? `تم قفل ${gameName}` : `Locked ${gameName}`);
        }
        
        if (command === 'unlockgame') {
            const gameName = args[1];
            if (!gameName) return;
            
            bank.locked = false;
            fs.writeFileSync(bankFile, JSON.stringify(bank));
            
            return message.reply(isArabic ? `تم فتح ${gameName}` : `Unlocked ${gameName}`);
        }
        
        if (command === 'settax') {
            const rate = parseFloat(args[1]);
            if (isNaN(rate) || rate < 0 || rate > 1) return;
            
            config.taxRate = rate;
            return message.reply(isArabic ? `تم تحديد الضريبة: ${rate * 100}%` : `Tax rate set to: ${rate * 100}%`);
        }
        
        if (command === 'closecasino') {
            bank.closed = true;
            fs.writeFileSync(bankFile, JSON.stringify(bank));
            return message.reply(isArabic ? 'تم اغلاق الكازينو' : 'Casino closed');
        }
        
        if (command === 'opencasino') {
            bank.closed = false;
            fs.writeFileSync(bankFile, JSON.stringify(bank));
            return message.reply(isArabic ? 'تم فتح الكازينو' : 'Casino opened');
        }
    }
    
    // Check if game is locked
    if (bank.locked && !message.author.id === config.ownerId) {
        return message.reply(isArabic ? config.ar.gameLocked : "Games are currently locked");
    }
    
    // Process regular commands
    if (command === 'help' || command === 'مساعدة') {
        return games.help(client, message, args, utils, config);
    }
    
    if (command === 'stats' || command === 'احصائياتي') {
        return games.stats(client, message, args, utils, config);
    }
    
    if (command === 'leaderboard' || command === 'المتصدرين') {
        return games.leaderboard(client, message, args, utils, config);
    }
    
    if (command === 'daily' || command === 'جائزة يومية') {
        return games.daily(client, message, args, utils, config);
    }
    
    // Game commands
    if (command === 'coin' || command === 'عملة') {
        return games.coin(client, message, args, utils, config);
    }
    
    if (command === 'dice' || command === 'نرد') {
        return games.dice(client, message, args, utils, config);
    }
    
    if (command === 'roulette' || command === 'روليت') {
        return games.roulette(client, message, args, utils, config);
    }
    
    if (command === 'blackjack' || command === 'بلاك جاك') {
        return games.blackjack(client, message, args, utils, config);
    }
    
    if (command === 'slots' || command === 'سلوتس') {
        return games.slots(client, message, args, utils, config);
    }
    
    if (command === 'higherlower' || command === 'أعلى/أقل') {
        return games.higherlower(client, message, args, utils, config);
    }
    
    if (command === 'guess' || command === 'تخمين') {
        return games.guess(client, message, args, utils, config);
    }
    
    if (command === 'crash' || command === 'تحطم') {
        return games.crash(client, message, args, utils, config);
    }
    
    if (command === 'jackpot' || command === 'جاكبوت') {
        return games.jackpot(client, message, args, utils, config);
    }
    
    if (command === 'duel' || command === 'تحدي') {
        return games.duel(client, message, args, utils, config);
    }
    
    if (command === 'russian' || command === 'روليت روسي') {
        return games.russian(client, message, args, utils, config);
    }
    
    // Handle blackjack actions
    if (command === 'hit' || command === 'اضرب') {
        return games.blackjackAction(client, message, 'hit', utils, config);
    }
    
    if (command === 'stand' || command === 'قف') {
        return games.blackjackAction(client, message, 'stand', utils, config);
    }
});

// Login
keepAlive();
client.login(config.token).then(() => {
    console.log('🤖 Casino Bot is online!');
    console.log(`📊 Min bet: ${config.minBet} credits`);
    console.log(`💰 Tax rate: ${config.taxRate * 100}%`);
});
