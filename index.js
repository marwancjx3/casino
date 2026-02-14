const { Client, GatewayIntentBits, Partials } = require('discord.js');
const config = require('./config.js');
const keepAlive = require('./keep_alive.js');
const fs = require('fs');
const path = require('path');

// ===== CLIENT =====
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

    const args = message.content.trim().split(/ +/);
    const command = args.shift()?.toLowerCase();
    if (!command) return;

    // مسار ملف اللعبة
    const gamePath = path.join(__dirname, 'games', `${command}.js`);

    // اذا الامر غير موجود
    if (!fs.existsSync(gamePath)) return;

    try {
        delete require.cache[require.resolve(gamePath)];
        const game = require(gamePath);

        // يشغل execute داخل الملف
        if (typeof game.execute === "function") {
            await game.execute(client, message, args, config);
        } else {
            console.log(`⚠️ ${command}.js لا يحتوي execute`);
        }

    } catch (err) {
        console.error("GAME ERROR:", err);
        message.reply("❌ حدث خطأ أثناء تشغيل اللعبة");
    }
});


// ===== KEEP ALIVE =====
keepAlive();

// ===== LOGIN =====
client.login(process.env.TOKEN);
