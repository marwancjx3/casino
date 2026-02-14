const { EmbedBuilder } = require('discord.js');
const config = require('../config.js');
const db = require('../utils/database.js');
const payment = require('../utils/payment.js');

const activeGames = new Map();

module.exports = async (client, message, args, utils, config) => {
    const isArabic = /[\u0600-\u06AE]/.test(message.content);
    
    // Parse arguments
    let amount, choice;
    
    if (isArabic) {
        amount = parseInt(args[1]);
        choice = args[2]?.toLowerCase();
    } else {
        amount = parseInt(args[1]);
        choice = args[2]?.toLowerCase();
    }
    
    // Validate amount
    if (isNaN(amount) || amount < config.minBet) {
        return message.reply(isArabic ? config.ar.minBet : `Minimum bet is ${config.minBet} credits`);
    }
    
    // Validate choice
    const validChoices = isArabic ? ['صورة', 'كتابة'] : ['heads', 'tails'];
    if (!choice || !validChoices.includes(choice)) {
        return message.reply(isArabic ? 
            'الرجاء اختيار صورة أو كتابة' : 
            'Please choose heads or tails');
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
            game: 'coin',
            choice: choice,
            multiplier: 2
        };
        
        const paymentMsg = await payment.requestPayment(message, amount, gameData);
        
        // Store active game
        activeGames.set(message.author.id, {
            amount: amount,
            choice: choice,
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
    const choice = gameData.choice;
    
    // Play coin flip
    const result = Math.random() < 0.5 ? (isArabic ? 'صورة' : 'heads') : (isArabic ? 'كتابة' : 'tails');
    const won = result === choice;
    
    let winAmount = 0;
    if (won) {
        const rawWin = amount * 2;
        const taxed = utils.helpers.applyTax(rawWin);
        winAmount = taxed.total;
        
        // Check if bank has enough
        if (!db.removeFromBank(winAmount)) {
            const embed = utils.helpers.createEmbed(
                isArabic ? '⚠️ خطأ' : '⚠️ Error',
                isArabic ? config.ar.insufficientBank : "Casino doesn't have enough credits",
                config.colors.error
            );
            return message.reply({ embeds: [embed] });
        }
        
        db.addWin(message.author.id, winAmount);
    } else {
        // Loss - money already added to bank via payment
        winAmount = 0;
    }
    
    // Create result embed
    const embed = new EmbedBuilder()
        .setColor(won ? config.colors.success : config.colors.error)
        .setTitle(isArabic ? '🎲 لعبة العملة' : '🎲 Coin Flip')
        .setDescription(isArabic ? 
            (won ? '🎉 لقد فزت!' : '💔 لقد خسرت!') :
            (won ? '🎉 You won!' : '💔 You lost!'))
        .addFields(
            {
                name: isArabic ? '💰 رهانك' : '💰 Your Bet',
                value: `${amount} ${isArabic ? 'نقطة' : 'credits'}`,
                inline: true
            },
            {
                name: isArabic ? '🎯 اختيارك' : '🎯 Your Choice',
                value: choice,
                inline: true
            },
            {
                name: isArabic ? '🎲 النتيجة' : '🎲 Result',
                value: result,
                inline: true
            },
            {
                name: isArabic ? '💵 الربح' : '💵 Winnings',
                value: won ? `${winAmount} ${isArabic ? 'نقطة' : 'credits'}` : '0',
                inline: true
            }
        )
        .setFooter({ text: isArabic ? 'كازينو | حظ سعيد' : '
