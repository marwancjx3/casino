const { Client, GatewayIntentBits, Partials, EmbedBuilder } = require('discord.js');
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
        GatewayIntentBits.GuildMembers,
        GatewayIntentBits.DirectMessages
    ],
    partials: [
        Partials.Channel,
        Partials.Message,
        Partials.User
    ]
});

// ===== LOAD GAMES =====
const games = {};
const gamesPath = path.join(__dirname, 'games');

if (fs.existsSync(gamesPath)) {
    fs.readdirSync(gamesPath).forEach(file => {
        if (file.endsWith('.js')) {
            games[file.replace('.js', '')] = require(path.join(gamesPath, file));
        }
    });
}

// ===== READY =====
client.once('ready', () => {
    console.log(`🤖 Logged in as ${client.user.tag}`);
});

// ===== MESSAGE HANDLER =====
client.on('messageCreate', async (message) => {
    if (message.author.bot) return;

    const args = message.content.split(" ");
    const command = args[0].toLowerCase();

    // help
    if (command === "help" || command === "مساعدة") {
        return message.reply("🎰 الكازينو يعمل!");
    }

    // تجربة لعبة العملة
    if (command === "coin" || command === "عملة") {
        return message.reply("🪙 نظام الألعاب سيتم تفعيله الآن...");
    }
});

// keep alive
keepAlive();

// login
client.login(process.env.TOKEN);
