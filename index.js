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
if (fs.existsSync(utilsPath)) {
    fs.readdirSync(utilsPath).forEach(file => {
        if (file.endsWith('.js')) {
            utils[file.replace('.js', '')] = require(path.join(utilsPath, file));
        }
    });
}

// Load games
const games = {};
const gamesPath = path.join(__dirname, 'games');
if (fs.existsSync(gamesPath)) {
    fs.readdirSync(gamesPath).forEach(file => {
        if (file.endsWith('.js')) {
            games[file.replace('.js', '')] = require(path.join(gamesPath, file));
        }
    });
}

// Load events
const eventsPath = path.join(__dirname, 'events');
if (fs.existsSync(eventsPath)) {
    fs.readdirSync(eventsPath).forEach(file => {
        if (file.endsWith('.js')) {
            const event = require(path.join(eventsPath, file));
            const eventName = file.replace('.js', '');
            client.on(eventName, event.bind(null, client, utils, games));
        }
    });
}

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

// ====== DIAGNOSTIC LINE ======
keepAlive();
console.log("TOKEN LENGTH:", process.env.TOKEN?.length);

// Login
client.login(config.token).then(() => {
    console.log('🤖 Casino Bot is online!');
    console.log(`📊 Min bet: ${config.minBet} credits`);
    console.log(`💰 Tax rate: ${config.taxRate * 100}%`);
}).catch(err => {
    console.error("LOGIN ERROR:", err);
});
