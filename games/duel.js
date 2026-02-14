const { EmbedBuilder } = require('discord.js');
const config = require('../config.js');
const db = require('../utils/database.js');
const payment = require('../utils/payment.js');

const activeDuels = new Map();
const duelChallenges = new Map();

module.exports = async (client, message, args, utils, config) => {
    const isArabic = /[\u0600-\u06AE]/.test(message.content);
    
    // Parse arguments
    let opponent, amount;
    
    if (isArabic) {
        opponent = message.mentions.users.first();
        amount = parseInt(args[2]);
    } else {
        opponent = message.mentions.users.first();
        amount = parseInt(args[2]);
    }
    
    // Validate opponent
    if (!opponent || opponent.bot || opponent.id === message.author.id) {
        return message.reply(isArabic ? 
            'الرجاء تحديد لاعب صالح' : 
            'Please mention a valid player');
    }
    
    // Validate amount
    if (isNaN(amount) || amount < config.minBet) {
        return message.reply(isArabic ? config.ar.minBet : `Minimum bet is ${config.minBet} credits`);
    }
    
    // Check cooldown
    const player = db.getPlayer(message.author.id);
    if (Date.now() - player.lastDuel < config.duelCooldown) {
        const remaining = utils.helpers.timeUntil(player.lastDuel + config.duelCooldown);
        return message.reply(isArabic ? 
            `انتظر ${remaining} قبل التحدي التالي` : 
            `Wait ${remaining} before next duel`);
    }
    
    // Create challenge
    const challengeId = `${message.author.id}-${opponent.id}-${Date.now()}`;
    
    const embed = new EmbedBuilder()
        .setColor(config.colors.info)
        .setTitle(isArabic ? '⚔️ تحدي' : '⚔️ Duel Challenge')
        .setDescription(isArabic ? 
            `<@${opponent.id}>، هل تقبل التحدي من <@${message.author.id}>؟\nالرهان: ${amount} نقطة` :
            `<@${opponent.id}>, do you accept the duel from <@${message.author.id}>?\nBet: ${amount} credits`)
        .setFooter({ text: isArabic ? 'ينتهي خلال 30 ثانية' : 'Expires in 30 seconds' });
    
    const challengeMsg = await message.channel.send({ 
        content: `<@${opponent.id}>`, 
        embeds: [embed] 
    });
    
    // Store challenge
    duelChallenges.set(challengeId, {
        challenger: message.author.id,
        opponent: opponent.id,
        amount: amount,
        channel: message.channel,
        message: challengeMsg,
        isArabic: isArabic,
        timestamp: Date.now()
    });
    
    // Set timeout
    setTimeout(() => {
        if (duelChallenges.has(challengeId)) {
            duelChallenges.delete(challengeId);
            challengeMsg.edit({ 
                embeds: [embed.setColor(config.colors.error).setDescription(isArabic ? 'انتهى الوقت' : 'Challenge expired')] 
            });
        }
    }, 30000);
    
    // Wait for opponent response
    const filter = (response) => {
        return response.author.id === opponent.id && 
               ['accept', 'قبول', 'decline', 'رفض'].includes(response.content.toLowerCase());
    };
    
    try {
        const response = await message.channel.awaitMessages({ filter, max: 1, time: 30000, errors: ['time'] });
        const answer = response.first().content.toLowerCase();
        
        if (answer === 'decline' || answer === 'رفض') {
            const declineEmbed = new EmbedBuilder()
                .setColor(config.colors.error)
                .setTitle(isArabic ? '❌ تم رفض التحدي' : '❌ Challenge Declined')
                .setDescription(isArabic ? 
                    `<@${opponent.id}> رفض التحدي` : 
                    `<@${opponent.id}> declined the challenge`);
            
            return challengeMsg.edit({ embeds: [declineEmbed] });
        }
        
        if (answer === 'accept' || answer === 'قبول') {
            // Start duel
            await startDuel(client, message, challengeId, amount, isArabic);
        }
        
    } catch (error) {
        // Timeout
        duelChallenges.delete(challengeId);
        challengeMsg.edit({ 
            embeds: [embed.setColor(config.colors.error).setDescription(isArabic ? 'انتهى الوقت' : 'Challenge expired')] 
        });
    }
};

async function startDuel(client, message, challengeId, amount, isArabic) {
    const challenge = duelChallenges.get(challengeId);
    if (!challenge) return;
    
    // Check if both players have enough credits (via ProBot)
    // This is simplified - in production you'd need to verify both players have the amount
    
    // Create duel game
    const duelEmbed = new EmbedBuilder()
        .setColor(config.colors.info)
        .setTitle(isArabic ? '⚔️ المبارزة' : '⚔️ Duel')
        .setDescription(isArabic ? 
            `مبارزة بين <@${challenge.challenger}> و <@${challenge.opponent}>\nالرهان: ${amount} نقطة` :
            `Duel between <@${challenge.challenger}> and <@${challenge.opponent}>\nBet: ${amount} credits`)
        .addFields(
            {
                name: isArabic ? '🎲 اللعبة' : '🎲 Game',
                value: isArabic ? 'سيتم اختيار لعبة عشوائية' : 'Random game will be chosen',
                inline: false
            }
        )
        .setFooter({ text: isArabic ? 'يبدأ خلال 5 ثوان...' : 'Starting in 5 seconds...' });
    
    await challenge.message.edit({ embeds: [duelEmbed] });
    
    // Wait 5 seconds
    await new Promise(resolve => setTimeout(resolve, 5000));
    
    // Choose random game
    const games = ['coin', 'dice', 'roulette', 'slots', 'higherlower', 'guess'];
    const randomGame = games[Math.floor(Math.random() * games.length)];
    
    // Play the game for both players
    // This is simplified - in production you'd need to handle payments for both players
    // and track wins/losses properly
    
    let winner, loser;
    if (Math.random() < 0.5) {
        winner = challenge.challenger;
        loser = challenge.opponent;
    } else {
        winner = challenge.opponent;
        loser = challenge.challenger;
    }
    
    // Calculate winnings (winner takes all minus tax)
    const rawWin = amount * 2;
    const taxed = require('../utils/helpers.js').applyTax(rawWin);
    const winAmount = taxed.total;
    
    // Check if bank has enough
    if (!db.removeFromBank(winAmount)) {
        const errorEmbed = new EmbedBuilder()
            .setColor(config.colors.error)
            .setTitle(isArabic ? '⚠️ خطأ' : '⚠️ Error')
            .setDescription(isArabic ? config.ar.insufficientBank : "Casino doesn't have enough credits");
        
        return challenge.channel.send({ embeds: [errorEmbed] });
    }
    
    // Award winner
    db.addWin(winner, winAmount);
    db.addWager(winner, amount);
    db.addWager(loser, amount);
    
    // Update last duel
    const challengerData = db.getPlayer(challenge.challenger);
    challengerData.lastDuel = Date.now();
    db.updatePlayer(challenge.challenger, challengerData);
    
    const opponentData = db.getPlayer(challenge.opponent);
    opponentData.lastDuel = Date.now();
    db.updatePlayer(challenge.opponent, opponentData);
    
    // Create result embed
    const resultEmbed = new EmbedBuilder()
        .setColor(config.colors.success)
        .setTitle(isArabic ? '⚔️ نتيجة المبارزة' : '⚔️ Duel Result')
        .setDescription(isArabic ? 
            `🏆 الفائز: <@${winner}>\nربح ${winAmount} نقطة` :
            `🏆 Winner: <@${winner}>\nWon ${winAmount} credits`)
        .addFields(
            {
                name: isArabic ? '🎮 اللعبة' : '🎮 Game',
                value: randomGame,
                inline: true
            },
            {
                name: isArabic ? '💰 الرهان' : '💰 Bet',
                value: `${amount} ${isArabic ? 'نقطة' : 'credits'}`,
                inline: true
            }
        )
        .setFooter({ text: isArabic ? 'كازينو | مبارزة ممتعة' : 'Casino | Fun duel' });
    
    await challenge.channel.send({ embeds: [resultEmbed] });
    
    // Remove challenge
    duelChallenges.delete(challengeId);
}
