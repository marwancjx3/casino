const config = require('../config.js');
const db = require('./database.js');

const pendingPayments = new Map();

module.exports = {
    pendingPayments,
    
    requestPayment: async (message, amount, gameData) => {
        const isArabic = /[\u0600-\u06FF]/.test(message.content);
        
        // Check minimum bet
        if (amount < config.minBet) {
            throw new Error(isArabic ? config.ar.minBet : `Minimum bet is ${config.minBet} credits`);
        }
        
        // Check casino balance for potential payout
        const bank = db.getBank();
        const potentialPayout = amount * (gameData.multiplier || 2);
        if (bank.balance < potentialPayout) {
            throw new Error(isArabic ? config.ar.insufficientBank : "Casino doesn't have enough credits for this bet");
        }
        
        // Request payment
        const paymentMsg = await message.reply(
            isArabic ? 
            `${config.ar.paymentRequest}\n#credit <@${config.probotId}> ${amount}` :
            `Please transfer ${amount} credits to continue:\n#credit <@${config.probotId}> ${amount}`
        );
        
        // Store pending payment
        pendingPayments.set(message.author.id, {
            channelId: message.channel.id,
            messageId: paymentMsg.id,
            amount: amount,
            gameData: gameData,
            timestamp: Date.now(),
            isArabic: isArabic
        });
        
        // Set timeout
        setTimeout(() => {
            if (pendingPayments.has(message.author.id)) {
                pendingPayments.delete(message.author.id);
                message.channel.send(isArabic ? config.ar.paymentFailed : "Payment timeout. Game cancelled.");
            }
        }, config.paymentTimeout);
        
        return paymentMsg;
    },
    
    processPayment: async (client, message) => {
        // Check if this is a pending payment
        const mentions = message.mentions.users;
        const playerId = message.author.id;
        
        if (!pendingPayments.has(playerId)) return;
        
        const payment = pendingPayments.get(playerId);
        
        // Verify channel
        if (message.channel.id !== payment.channelId) return;
        
        // Extract amount from message
        const content = message.content;
        const amountMatch = content.match(/\d+/);
        if (!amountMatch) return;
        
        const transferredAmount = parseInt(amountMatch[0]);
        
        // Verify amount
        if (transferredAmount !== payment.amount) {
            return message.reply(payment.isArabic ? 
                "المبلغ المحول غير صحيح" : 
                "Incorrect amount transferred");
        }
        
        // Verify receiver is ProBot
        if (!message.mentions.has(config.probotId)) return;
        
        // Payment successful
        pendingPayments.delete(playerId);
        
        // Add to total wagered
        db.addWager(playerId, payment.amount);
        db.addToBank(payment.amount);
        
        // Return game data
        return {
            success: true,
            amount: payment.amount,
            gameData: payment.gameData,
            isArabic: payment.isArabic
        };
    }
};
