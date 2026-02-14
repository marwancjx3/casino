const { EmbedBuilder } = require('discord.js');
const config = require('../config.js');
const db = require('../utils/database.js');
const payment = require('../utils/payment.js');

const activeGames = new Map();

const slotSymbols = ['🍒', '🍋', '🍊', '🍇', '💎', '7️⃣', '🎰', '⭐'];
const payouts = {
    '🍒': { 3: 5, 2: 2 },
    '🍋': { 3: 5, 2: 2 },
    '🍊': { 3: 5, 2: 2 },
    '🍇': { 3: 8, 2: 3 },
    '💎': { 3: 15, 2: 5 },
    '7️⃣': { 3: 25, 2: 8 },
    '🎰': { 3: 50, 2: 15 },
    '⭐': { 3: 100, 2: 25 }
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
            game: 'slots',
            multiplier: 100 // Max multiplier
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
    
    // Spin slots
    const reels = [[], [], []];
    for (let i = 0; i < 3; i++) {
        for (let j = 0; j < 3; j++) {
            reels[i][j] = slotSymbols[Math.floor(Math.random() * slotSymbols.length)];
        }
    }
    
    // Check wins
    let winAmount = 0;
    let winLines = [];
    
    // Check rows
    for (let i = 0; i < 3; i++) {
        if (reels[i][0] === reels[i][1] && reels[i][1] === reels[i][2]) {
            const multiplier = payouts[reels[i][0]][3];
            winAmount += amount * multiplier;
            winLines.push(`Row ${i + 1}`);
        } else if (reels[i][0] === reels[i][1] || reels[i][1] === reels[i][2]) {
            const multiplier = payouts[reels[i][1]][2];
            winAmount += amount * multiplier;
            winLines.push(`Row ${i + 1} (2)`);
        }
    }
    
    // Check diagonals
    if (reels[0][0] === reels[1][1] && reels[1][1] === reels[2][2]) {
        const multiplier = payouts[reels[1][1]][3];
        winAmount += amount * multiplier;
        winLines.push('Diagonal \\');
    }
    
    if (reels[0][2] === reels[1][1] && reels[1][1] === reels[2][0]) {
        const multiplier = payouts[reels[1][1]][3];
        winAmount += amount * multiplier;
        winLines.push('Diagonal /');
    }
    
    const won = winAmount > 0;
    
    if (won) {
        const taxed = require('../utils/helpers.js').applyTax(winAmount);
        winAmount = taxed.total;
        
        // Check if bank has enough
        if (!db.removeFromBank(winAmount)) {
            const embed = require('../utils/helpers.js').createEmbed(
                isArabic ? '⚠️ خطأ' : '⚠️ Error',
                isArabic ? config.ar.insufficientBank : "Casino doesn't have enough credits",
                config.colors.error
            );
            return message.reply({ embeds: [embed] });
        }
        
        db.addWin(message.author.id, winAmount);
    }
    
    // Format slot display
    const slotDisplay = reels.map(row => row.join(' | ')).join('\n');
    
    // Create result embed
    const embed = new EmbedBuilder()
        .setColor(won ? config.colors.success : config.colors.error)
        .setTitle(isArabic ? '🎰 سلوتس' : '🎰 Slots')
        .setDescription(slotDisplay)
        .addFields(
            {
                name: isArabic ? '💰 رهانك' : '💰 Your Bet',
                value: `${amount} ${isArabic ? 'نقطة' : 'credits'}`,
                inline: true
            },
            {
                name: isArabic ? '💵 الربح' : '💵 Winnings',
                value: won ? `${winAmount} ${isArabic ? 'نقطة' : 'credits'}` : '0',
                inline: true
            },
            {
                name: isArabic ? '📊 الخطوط الفائزة' : '📊 Winning Lines',
                value: winLines.length > 0 ? winLines.join(', ') : (isArabic ? 'لا يوجد' : 'None'),
                inline: true
            }
        )
        .setFooter({ text: isArabic ? 'كازينو | حظ سعيد' : 'Casino | Good Luck' });
    
    await message.channel.send({ embeds: [embed] });
    
    // Remove from active games
    activeGames.delete(message.author.id);
};
