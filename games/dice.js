const { EmbedBuilder } = require('discord.js');
const config = require('../config.js');
const db = require('../utils/database.js');
const payment = require('../utils/payment.js');

const activeGames = new Map();

module.exports = async (client, message, args, utils, config) => {
    const isArabic = /[\u0600-\u06AE]/.test(message.content);
    
    // Parse arguments
    let amount, prediction;
    
    if (isArabic) {
        amount = parseInt(args[1]);
        prediction = args[2]?.toLowerCase();
    } else {
        amount = parseInt(args[1]);
        prediction = args[2]?.toLowerCase();
    }
    
    // Validate amount
    if (isNaN(amount) || amount < config.minBet) {
        return message.reply(isArabic ? config.ar.minBet : `Minimum bet is ${config.minBet} credits`);
    }
    
    // Validate prediction (1-6)
    const diceNumber = parseInt(prediction);
    if (isNaN(diceNumber) || diceNumber < 1 || diceNumber > 6) {
        return message.reply(isArabic ? 
            'الرجاء اختيار رقم من 1 إلى 6' : 
            'Please choose a number from 1 to 6');
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
            game: 'dice',
            prediction: diceNumber,
            multiplier: 6
        };
        
        const paymentMsg = await payment.requestPayment(message, amount, gameData);
        
        // Store active game
        activeGames.set(message.author.id, {
            amount: amount,
            prediction: diceNumber,
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
    const prediction = gameData.prediction;
    
    // Roll dice
    const result = Math.floor(Math.random() * 6) + 1;
    const won = result === prediction;
    
    let winAmount = 0;
    if (won) {
        const rawWin = amount * 6;
        const taxed = require('../utils/helpers.js').applyTax(rawWin);
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
    } else {
        // Loss - money already added to bank via payment
        winAmount = 0;
    }
    
    // Create dice visualization
    const diceEmojis = ['⚀', '⚁', '⚂', '⚃', '⚄', '⚅'];
    
    // Create result embed
    const embed = new EmbedBuilder()
        .setColor(won ? config.colors.success : config.colors.error)
        .setTitle(isArabic ? '🎲 لعبة النرد' : '🎲 Dice Game')
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
                name: isArabic ? '🔮 توقعك' : '🔮 Your Prediction',
                value: prediction.toString(),
                inline: true
            },
            {
                name: isArabic ? '🎲 النتيجة' : '🎲 Result',
                value: `${diceEmojis[result-1]} ${result}`,
                inline: true
            },
            {
                name: isArabic ? '💵 الربح' : '💵 Winnings',
                value: won ? `${winAmount} ${isArabic ? 'نقطة' : 'credits'}` : '0',
                inline: true
            }
        )
        .setFooter({ text: isArabic ? 'كازينو | حظ سعيد' : 'Casino | Good Luck' });
    
    await message.channel.send({ embeds: [embed] });
    
    // Remove from active games
    activeGames.delete(message.author.id);
};
