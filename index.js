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


// ===== READY =====
client.once('ready', () => {
    console.log(`🤖 Logged in as ${client.user.tag}`);
});


// ===== MESSAGE HANDLER =====
client.on('messageCreate', async (message) => {
    if (message.author.bot) return;

    const msg = message.content.toLowerCase();

    // help command test
    if (msg === "help" || msg === "مساعدة") {
        return message.reply("✅ البوت يعمل بنجاح!");
    }
});


// Keep alive (Railway web server)
keepAlive();

// Login
client.login(process.env.TOKEN);
