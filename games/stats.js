const { EmbedBuilder } = require('discord.js');
const config = require('../config.js');
const db = require('../utils/database.js');

module.exports = async (client, message, args, utils, config) => {
    const isArabic = /[\u0600-\u06AE]/.test(message.content);
    
    // Get player stats
    const player = db.getPlayer(message.author.id);
    
    // Calculate level progress
    const currentLevelXp = utils.helpers.getXpForLevel(player.level);
    const nextLevelXp = utils.helpers.getXpForLevel(player.level + 1);
    const progress = utils.helpers.getProgressBar(player.xp - currentLevelXp, nextLevelXp - currentLevelXp, 15);
    
    // Calculate win rate
    const winRate = player.gamesPlayed > 0 ? 
        ((player.totalWon / player.totalWagered) * 100).toFixed(1) : 0;
    
    // Create embed
    const embed = new EmbedBuilder()
        .setColor(config.colors.info)
        .setTitle(isArabic ? '📊 إحصائياتك' : '📊 Your Stats')
        .setThumbnail(message.author.displayAvatarURL())
        .addFields(
            {
                name: isArabic ? '👤 اللاعب' : '👤 Player',
                value: message.author.tag,
                inline: false
            },
            {
                name: isArabic ? '📈 المستوى' : '📈 Level',
                value: `${player.level}`,
                inline: true
            },
            {
                name: isArabic ? '✨ النقاط' : '✨ XP',
                value: `${player.xp}`,
                inline: true
            },
            {
                name: isArabic ? '📊 التقدم' : '📊 Progress',
                value: progress,
                inline: false
            },
            {
                name: isArabic ? '💰 إجمالي الرهانات' : '💰 Total Wagered',
                value: `${utils.helpers.formatNumber(player.totalWagered)} ${isArabic ? 'نقطة' : 'credits'}`,
                inline: true
            },
            {
                name: isArabic ? '💵 إجمالي الأرباح' : '💵 Total Won',
                value: `${utils.helpers.formatNumber(player.totalWon)} ${isArabic ? 'نقطة' : 'credits'}`,
                inline: true
            },
            {
                name: isArabic ? '🎮 الألعاب' : '🎮 Games Played',
                value: player.gamesPlayed.toString(),
                inline: true
            },
            {
                name: isArabic ? '📊 نسبة الفوز' : '📊 Win Rate',
                value: `${winRate}%`,
                inline: true
            },
            {
                name: isArabic ? '💹 صافي الربح' : '💹 Net Profit',
                value: `${utils.helpers.formatNumber(player.totalWon - player.totalWagered)} ${isArabic ? 'نقطة' : 'credits'}`,
                inline: true
            }
        )
        .setFooter({ text: isArabic ? 'كازينو | استمر في اللعب' : 'Casino | Keep playing' });
    
    await message.reply({ embeds: [embed] });
};
