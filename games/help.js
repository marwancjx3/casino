const { EmbedBuilder } = require('discord.js');
const config = require('../config.js');

module.exports = async (client, message, args, utils, config) => {
    const isArabic = /[\u0600-\u06FF]/.test(message.content);
    
    const embed = new EmbedBuilder()
        .setColor(config.colors.casino)
        .setTitle(isArabic ? '🎰 قائمة الألعاب' : '🎰 Casino Commands')
        .setDescription(isArabic ? 
            'جميع الألعاب متاحة باللغتين العربية والإنجليزية' :
            'All games available in both Arabic and English')
        .addFields(
            {
                name: '🎮 Games / الألعاب',
                value: isArabic ?
                    '`عملة` - Coin Flip\n' +
                    '`نرد` - Dice Roll\n' +
                    '`روليت` - Roulette\n' +
                    '`بلاك جاك` - Blackjack\n' +
                    '`سلوتس` - Slots\n' +
                    '`أعلى/أقل` - Higher/Lower\n' +
                    '`تخمين` - Guess Number\n' +
                    '`تحطم` - Crash Game\n' +
                    '`جاكبوت` - Jackpot\n' +
                    '`تحدي` - Duel\n' +
                    '`روليت روسي` - Russian Roulette' :
                    '`coin` - Coin Flip\n' +
                    '`dice` - Dice Roll\n' +
                    '`roulette` - Roulette\n' +
                    '`blackjack` - Blackjack\n' +
                    '`slots` - Slots\n' +
                    '`higherlower` - Higher/Lower\n' +
                    '`guess` - Guess Number\n' +
                    '`crash` - Crash Game\n' +
                    '`jackpot` - Jackpot\n' +
                    '`duel` - Duel\n' +
                    '`russian` - Russian Roulette'
            },
            {
                name: '💰 Economy / الإقتصاد',
                value: isArabic ?
                    '`جائزة يومية` - Daily reward\n' +
                    '`احصائياتي` - Your stats\n' +
                    '`المتصدرين` - Leaderboard' :
                    '`daily` - Daily reward\n' +
                    '`stats` - Your stats\n' +
                    '`leaderboard` - Leaderboard'
            },
            {
                name: '⚡ Quick Examples / أمثلة سريعة',
                value: isArabic ?
                    '`عملة 20000 صورة`\n' +
                    '`بلاك جاك 50000`\n' +
                    '`تحدي @user 20000`' :
                    '`coin 20000 heads`\n' +
                    '`blackjack 50000`\n' +
                    '`duel @user 20000`'
            },
            {
                name: '⚠️ Rules / القوانين',
                value: isArabic ?
                    `• الحد الأدنى للرهان: ${config.minBet} نقطة\n` +
                    '• يجب تحويل النقاط عبر ProBot قبل اللعب\n' +
                    '• الكازينو يخصم 5% ضريبة من الأرباح' :
                    `• Minimum bet: ${config.minBet} credits\n` +
                    '• Transfer credits via ProBot before playing\n' +
                    '• Casino takes 5% tax on winnings'
            }
        )
        .setFooter({ text: isArabic ? 'كازينو | استمتع باللعب' : 'Casino | Gamble Responsibly' });
    
    await message.reply({ embeds: [embed] });
};
