const { EmbedBuilder } = require('discord.js');
const config = require('../config.js');
const db = require('../utils/database.js');
const payment = require('../utils/payment.js');

const activeGames = new Map();
let jackpot = {
    players: [],
    total: 0,
    timer: null,
    message: null,
    channel: null
};

module.exports = async (client, message, args, utils, config) => {
    const isArabic = /[\u0600-\u06AE]/.test(message.content);
    
    // Parse amount
    let amount = parseInt(args[1]);
    
    // Validate amount
    if (isNaN(amount) || amount < config.minBet) {
        return message.reply(isArabic ? config.ar.minBet : `Minimum bet is ${config.minBet} credits`);
    }
    
    // Check if user already has active game
    if (activeGames.has(message.author.id)) {
        return message.reply(isArabic ? 
            'لديك لعبة نشطة بالفعل' : 
            'You already have an active game');
    }
    
    try {
        // Request payment
        const gameData = {
            game: 'jackpot',
            multiplier: jackpot.total > 0 ? (jackpot.total + amount) / amount : 1
        };
        
        const paymentMsg = await payment.requestPayment(message, amount, gameData);
        
        // Store active game
        activeGames.set(message.author.id, {
            amount: amount,
            isArabic: isArabic,
            paymentMsg: paymentMsg
        });
        
    } catch (error) {
        message.reply(error.message);
    }
};

// Handle payment confirmation
module.exports.handlePayment = async (client, message, paymentData) => {
    const gameData = activeGames.get(message.author.id);
    if (!gameData) return;
    
    const isArabic = gameData.isArabic;
    const amount = gameData.amount;
    
    // Add to jackpot
    jackpot.players.push({
        userId: message.author.id,
        username: message.author.username,
        amount: amount
    });
    jackpot.total += amount;
    
    // Create or update jackpot message
    if (!jackpot.message) {
        const embed = new EmbedBuilder()
            .setColor(config.colors.casino)
            .setTitle(isArabic ? '💰 جاكبوت' : '💰 Jackpot')
            .setDescription(isArabic ? 
                `الجائزة الكبرى: **${jackpot.total}** نقطة\nعدد اللاعبين: ${jackpot.players.length}` :
                `Jackpot: **${jackpot.total}** credits\nPlayers: ${jackpot.players.length}`)
            .addFields({
                name: isArabic ? '👥 اللاعبون' : '👥 Players',
                value: jackpot.players.map(p => p.username).join('\n') || (isArabic ? 'لا يوجد' : 'None'),
                inline: false
            })
            .setFooter({ text: isArabic ? 'كازينو | ينتهي خلال 30 ثانية' : 'Casino | Ends in 30 seconds' });
        
        jackpot.message = await message.channel.send({ embeds: [embed] });
        jackpot.channel = message.channel;
        
        // Set timer
        jackpot.timer = setTimeout(() => drawWinner(client), 30000);
    } else {
        // Update existing message
        const embed = new EmbedBuilder()
            .setColor(config.colors.casino)
            .setTitle(isArabic ? '💰 جاكبوت' : '💰 Jackpot')
            .setDescription(isArabic ? 
                `الجائزة الكبرى: **${jackpot.total}** نقطة\nعدد اللاعبين: ${jackpot.players.length}` :
                `Jackpot: **${jackpot.total}** credits\nPlayers: ${jackpot.players.length}`)
            .addFields({
                name: isArabic ? '👥 اللاعبون' : '👥 Players',
                value: jackpot.players.map(p => p.username).join('\n').slice(0, 1000) || (isArabic ? 'لا يوجد' : 'None'),
                inline: false
            })
            .setFooter({ text: isArabic ? `كازينو | انضم الآن` : 'Casino | Join now' });
        
        await jackpot.message.edit({ embeds: [embed] });
    }
    
    // Remove from active games
    activeGames.delete(message.author.id);
};

async function drawWinner(client) {
    if (jackpot.players.length === 0) {
        jackpot = { players: [], total: 0, timer: null, message: null, channel: null };
        return;
    }
    
    // Pick winner
    const winnerIndex = Math.floor(Math.random() * jackpot.players.length);
    const winner = jackpot.players[winnerIndex];
    
    // Calculate winnings (jackpot total minus 10% house fee)
    const winAmount = Math.floor(jackpot.total * 0.9);
    
    // Check if bank has enough
    if (!db.removeFromBank(winAmount)) {
        const embed = new EmbedBuilder()
            .setColor(config.colors.error)
            .setTitle('⚠️ Jackpot Error')
            .setDescription("Casino doesn't have enough credits for jackpot payout");
        
        await jackpot.channel.send({ embeds: [embed] });
        jackpot = { players: [], total: 0, timer: null, message: null, channel: null };
        return;
    }
    
    // Award winner
    db.addWin(winner.userId, winAmount);
    
    // Create winner embed
    const embed = new EmbedBuilder()
        .setColor(config.colors.success)
        .setTitle('🎉 Jackpot Winner!')
        .setDescription(`Congratulations <@${winner.userId}>!`)
        .addFields(
            {
                name: '💰 Prize',
                value: `${winAmount} credits`,
                inline: true
            },
            {
                name: '🎮 Players',
                value: jackpot.players.length.toString(),
                inline: true
            },
            {
                name: '🏆 Total Pool',
                value: jackpot.total.toString(),
                inline: true
            }
        )
        .setFooter({ text: 'Casino | New jackpot starting soon!' });
    
    await jackpot.channel.send({ embeds: [embed] });
    
    // Reset jackpot
    jackpot = { players: [], total: 0, timer: null, message: null, channel: null };
}
