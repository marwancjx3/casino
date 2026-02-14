const { Client, GatewayIntentBits } = require('discord.js');
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
    ]
});

// ===== LOAD GAMES AUTOMATIC =====
const games = new Map();
const gamesPath = path.join(__dirname, "games");

fs.readdirSync(gamesPath).forEach(file => {
    if (!file.endsWith(".js")) return;

    const name = file.replace(".js", "").toLowerCase();
    const game = require(`./games/${file}`);

    games.set(name, game);
    console.log("🎮 Loaded game:", name);
});

// ===== MESSAGE HANDLER =====
client.on("messageCreate", async (message) => {
    if (message.author.bot) return;

    const args = message.content.trim().split(/ +/);
    const command = args.shift().toLowerCase();

    if (!games.has(command)) return;

    const game = games.get(command);

    try {
        // يدعم النظامين
        if (typeof game.execute === "function") {
            await game.execute(client, message, args, config);
        }
        else if (typeof game === "function") {
            await game(client, message, args, config);
        }
        else {
            console.log(`⚠️ ${command}.js ليس لديه function`);
        }
    }
    catch (err) {
        console.error("GAME ERROR:", err);
        message.reply("❌ حدث خطأ أثناء تشغيل اللعبة");
    }
});

// ===== READY =====
client.once("ready", () => {
    console.log(`🤖 Logged in as ${client.user.tag}`);
});

// ===== START =====
keepAlive();
client.login(process.env.TOKEN);
