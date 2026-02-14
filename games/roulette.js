const { EmbedBuilder } = require('discord.js');
const config = require('../config.js');
const db = require('../utils/database.js');
const payment = require('../utils/payment.js');

const activeGames = new Map();
const rouletteNumbers = [
    { number: 0, color: 'green' },
    { number: 1, color: 'red' }, { number: 2, color: 'black' }, { number: 3, color: 'red' },
    { number: 4, color: 'black' }, { number: 5, color: 'red' }, { number: 6, color: 'black' },
    { number: 7, color: 'red' }, { number: 8, color: 'black' }, { number: 9, color: 'red' },
    { number: 10, color: 'black' }, { number: 11, color: 'black' }, { number: 12, color: 'red' },
    { number: 13, color: 'black' }, { number: 14, color: 'red' }, { number: 15, color: 'black' },
    { number: 16, color: 'red' }, { number: 17, color: 'black' }, { number: 18, color: 'red' },
    { number: 19, color: 'red' }, { number: 20, color: 'black' }, { number: 21, color: 'red' },
    { number: 22, color: 'black' }, { number: 23, color: 'red' }, { number: 24, color: 'black' },
    { number: 25, color: 'red' }, { number: 26, color: 'black' }, { number: 27, color: 'red' },
    { number: 28, color: 'black' }, { number: 29, color: 'black' }, { number: 30, color: 'red' },
    { number: 31, color: 'black' }, { number: 32, color: 'red' }, { number: 33, color: 'black' },
    { number: 34, color: 'red' }, { number: 35, color: 'black' }, { number: 36, color: 'red' }
];

module.exports = async (client, message, args, utils, config) => {
    const isArabic = /[\u0600-\u06AE]/.test(message.content);
    
    // Parse arguments
    let amount, betType, betValue;
    
    if (isArabic) {
        amount = parseInt(args[1]);
        betType = args[2]?.toLowerCase();
        betValue = args.slice(3).join(' ');
    } else {
        amount = parseInt(args[1]);
        betType = args[2]?.toLowerCase();
        betValue = args[3];
    }
    
    // Validate amount
    if (isNaN(amount) || amount < config.minBet) {
        return message.reply(isArabic ? config.ar.minBet : `Minimum bet is ${config.minBet} credits`);
    }
    
    // Validate bet type
    const validBets = {
        'number': { ar: 'رقم', multiplier: 36 },
        'red': { ar: 'أحمر', multiplier: 2 },
        'black': { ar: 'أسود', multiplier: 2 },
        'even': { ar: 'زوجي', multiplier: 2 },
        'odd': { ar: 'فردي', multiplier: 2 },
        '1-18': { ar: '1-18', multiplier: 2 },
        '19-36': { ar: '19-36', multiplier: 2 },
        '1st12': { ar: '1-12', multiplier: 3 },
        '2nd12': { ar: '13-24', multiplier: 3 },
        '3rd12': { ar: '25-36', multiplier: 3 }
    };
    
    let actualBetType = betType;
    if (isArabic) {
        // Convert Arabic bet type to English
        for (const [key, value] of Object.entries(validBets)) {
            if (value.ar === betType) {
                actualBetType = key;
                break;
            }
        }
    }
    
    if (!validBets[actualBetType]) {
        return message.reply(isArabic ? 
            'نوع الرهان غير صالح' : 
            'Invalid bet type');
    }
    
    // Validate number bet
    if (actualBetType === 'number') {
        const number = parseInt(betValue);
        if (isNaN(number) || number < 0 || number > 36) {
            return message.reply(isArabic ? 
                'الرجاء اختيار رقم من 0 إلى 36' : 
                'Please choose a number from 0 to 36');
        }
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
            game: 'roulette',
            betType: actualBetType,
            betValue: betValue,
            multiplier: validBets[actualBetType].multiplier
        };
        
        const paymentMsg = await payment.requestPayment(message, amount, gameData);
        
        // Store active game
        activeGames.set(message.author.id, {
            amount: amount,
            betType: actualBetType,
            betValue: betValue,
            multiplier: validBets[actualBetType].multiplier,
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
    const betType = gameData.betType;
    const betValue = gameData.betValue;
    const multiplier = gameData.multiplier;
    
    // Spin the wheel
    const result = rouletteNumbers[Math.floor(Math.random() * rouletteNumbers.length)];
    let won = false;
    
    // Check win conditions
    if (betType === 'number' && result.number === parseInt(betValue)) {
        won = true;
    } else if (betType === 'red' && result.color === 'red') {
        won = true;
    } else if (betType === 'black' && result.color === 'black') {
        won = true;
    } else if (betType === 'even' && result.number !== 0 && result.number % 2 === 0) {
        won = true;
    } else if (betType === 'odd' && result.number % 2 === 1) {
        won = true;
    } else if (betType === '1-18' && result.number >= 1 && result.number <= 18) {
        won = true;
    } else if (betType === '19-36' && result.number >= 19 && result.number <= 36) {
        won = true;
    } else if (betType === '1st12' && result.number >= 1 && result.number <= 12) {
        won = true;
    } else if (betType === '2nd12' && result.number >= 13 && result.number <= 24) {
        won = true;
    } else if (betType === '3rd12' && result.number >= 25 && result.number <= 36) {
        won = true;
    }
    
    let winAmount = 0;
    if (won) {
        const rawWin = amount * multiplier;
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
    
    // Create result embed
    const embed = new EmbedBuilder()
        .setColor(won ? config.colors.success : config.colors.error)
        .setTitle(isArabic ? '🎯 روليت' : '🎯 Roulette')
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
                name: isArabic ? '🎯 نوع الرهان' : '🎯 Bet Type',
                value: betType,
                inline: true
            },
            {
                name: isArabic ? '🎲 النتيجة' : '🎲 Result',
                value: `${result.number} ${result.color}`,
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
