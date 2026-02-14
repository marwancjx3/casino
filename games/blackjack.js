const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const config = require('../config.js');
const db = require('../utils/database.js');
const payment = require('../utils/payment.js');

const activeGames = new Map();
const gameSessions = new Map();

module.exports = async (client, message, args, utils, config) => {
    const isArabic = /[\u0600-\u06AE]/.test(message.content);
    
    // Parse amount
    let amount;
    if (isArabic) {
        amount = parseInt(args[1]);
    } else {
        amount = parseInt(args[1]);
    }
    
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
            game: 'blackjack',
            multiplier: 2.5 // Blackjack pays 2.5x
        };
        
        const paymentMsg = await payment.requestPayment(message, amount, gameData);
        
        // Create initial game state
        const deck = createDeck();
        const playerHand = [drawCard(deck), drawCard(deck)];
        const dealerHand = [drawCard(deck), drawCard(deck)];
        
        const gameState = {
            amount: amount,
            deck: deck,
            playerHand: playerHand,
            dealerHand: dealerHand,
            playerScore: calculateHand(playerHand),
            dealerScore: calculateHand(dealerHand.slice(0, 1)), // Only show first card
            isArabic: isArabic,
            paymentMsg: paymentMsg,
            gameEnded: false
        };
        
        // Check for blackjack
        const playerScore = calculateHand(playerHand);
        const dealerScore = calculateHand(dealerHand);
        
        if (playerScore === 21 || dealerScore === 21) {
            return handleBlackjackResult(client, message, gameState, playerScore, dealerScore);
        }
        
        // Store game session
        activeGames.set(message.author.id, gameState);
        
        // Show game UI
        await showGameUI(client, message, gameState);
        
    } catch (error) {
        message.reply(error.message);
    }
};

// Handle hit/stand commands
module.exports.action = async (client, message, action, utils, config) => {
    const gameState = activeGames.get(message.author.id);
    if (!gameState) return;
    
    const isArabic = gameState.isArabic;
    
    if (action === 'hit') {
        // Draw card
        const newCard = drawCard(gameState.deck);
        gameState.playerHand.push(newCard);
        gameState.playerScore = calculateHand(gameState.playerHand);
        
        // Check if bust
        if (gameState.playerScore > 21) {
            // Player loses
            gameState.gameEnded = true;
            await endGame(client, message, gameState, 'lose');
            activeGames.delete(message.author.id);
            return;
        }
        
        // Update UI
        await showGameUI(client, message, gameState);
        
    } else if (action === 'stand') {
        // Dealer's turn
        while (calculateHand(gameState.dealerHand) < 17) {
            gameState.dealerHand.push(drawCard(gameState.deck));
        }
        
        gameState.dealerScore = calculateHand(gameState.dealerHand);
        
        // Determine winner
        const playerScore = gameState.playerScore;
        const dealerScore = gameState.dealerScore;
        
        if (dealerScore > 21 || playerScore > dealerScore) {
            await endGame(client, message, gameState, 'win');
        } else if (playerScore === dealerScore) {
            await endGame(client, message, gameState, 'push');
        } else {
            await endGame(client, message, gameState, 'lose');
        }
        
        activeGames.delete(message.author.id);
    }
};

// Helper functions
function createDeck() {
    const suits = ['♠️', '♥️', '♦️', '♣️'];
    const values = ['2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K', 'A'];
    const deck = [];
    
    for (const suit of suits) {
        for (const value of values) {
            deck.push({ suit, value });
        }
    }
    
    // Shuffle
    for (let i = deck.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [deck[i], deck[j]] = [deck[j], deck[i]];
    }
    
    return deck;
}

function drawCard(deck) {
    return deck.pop();
}

function calculateHand(hand) {
    let sum = 0;
    let aces = 0;
    
    for (const card of hand) {
        if (card.value === 'A') {
            aces++;
            sum += 11;
        } else if (['K', 'Q', 'J'].includes(card.value)) {
            sum += 10;
        } else {
            sum += parseInt(card.value);
        }
    }
    
    // Adjust aces
    while (sum > 21 && aces > 0) {
        sum -= 10;
        aces--;
    }
    
    return sum;
}

function formatHand(hand) {
    return hand.map(card => `${card.value}${card.suit}`).join(' ');
}

async function showGameUI(client, message, gameState) {
    const isArabic = gameState.isArabic;
    
    const embed = new EmbedBuilder()
        .setColor(config.colors.info)
        .setTitle(isArabic ? '🃏 بلاك جاك' : '🃏 Blackjack')
        .setDescription(isArabic ? 'اختر: اضرب / قف' : 'Choose: hit / stand')
        .addFields(
            {
                name: isArabic ? '💰 رهانك' : '💰 Your Bet',
                value: `${gameState.amount} ${isArabic ? 'نقطة' : 'credits'}`,
                inline: true
            },
            {
                name: isArabic ? '👤 يدك' : '👤 Your Hand',
                value: `${formatHand(gameState.playerHand)} (${gameState.playerScore})`,
                inline: false
            },
            {
                name: isArabic ? '🤵 الموزع' : '🤵 Dealer',
                value: `${formatHand([gameState.dealerHand[0]])} (${gameState.dealerScore})`,
                inline: false
            }
        )
        .setFooter({ text: isArabic ? 'اضرب أو قف' : 'Hit or Stand' });
    
    await message.channel.send({ embeds: [embed] });
}

async function endGame(client, message, gameState, result) {
    const isArabic = gameState.isArabic;
    const amount = gameState.amount;
    
    let winAmount = 0;
    let resultText = '';
    let color = config.colors.info;
    
    if (result === 'win') {
        winAmount = amount * 2.5;
        const taxed = require('../utils/helpers.js').applyTax(winAmount);
        winAmount = taxed.total;
        
        if (!db.removeFromBank(winAmount)) {
            result = 'error';
        } else {
            db.addWin(message.author.id, winAmount);
            resultText = isArabic ? '🎉 فوز!' : '🎉 You win!';
            color = config.colors.success;
        }
    } else if (result === 'push') {
        // Return bet
        winAmount = amount;
        db.removeFromBank(winAmount);
        resultText = isArabic ? '🤝 تعادل' : '🤝 Push';
        color = config.colors.info;
    } else if (result === 'lose') {
        resultText = isArabic ? '💔 خسارة' : '💔 You lose';
        color = config.colors.error;
    } else {
        resultText = isArabic ? '⚠️ خطأ' : '⚠️ Error';
        color = config.colors.error;
    }
    
    const embed = new EmbedBuilder()
        .setColor(color)
        .setTitle(isArabic ? '🃏 بلاك جاك' : '🃏 Blackjack')
        .setDescription(resultText)
        .addFields(
            {
                name: isArabic ? '👤 يدك' : '👤 Your Hand',
                value: `${formatHand(gameState.playerHand)} (${gameState.playerScore})`,
                inline: false
            },
            {
                name: isArabic ? '🤵 الموزع' : '🤵 Dealer',
                value: `${formatHand(gameState.dealerHand)} (${calculateHand(gameState.dealerHand)})`,
                inline: false
            },
            {
                name: isArabic ? '💰 النتيجة' : '💰 Result',
                value: winAmount > 0 ? 
                    `${isArabic ? 'ربح' : 'Win'}: ${winAmount} ${isArabic ? 'نقطة' : 'credits'}` :
                    `${isArabic ? 'خسارة' : 'Loss'}: ${amount} ${isArabic ? 'نقطة' : 'credits'}`,
                inline: false
            }
        );
    
    await message.channel.send({ embeds: [embed] });
}

function handleBlackjackResult(client, message, gameState, playerScore, dealerScore) {
    const isArabic = gameState.isArabic;
    
    if (playerScore === 21 && dealerScore === 21) {
        return endGame(client, message, gameState, 'push');
    } else if (playerScore === 21) {
        return endGame(client, message, gameState, 'win');
    } else if (dealerScore === 21) {
        return endGame(client, message, gameState, 'lose');
    }
}
