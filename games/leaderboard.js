const { EmbedBuilder } = require('discord.js');
const fs = require('fs');
const path = require('path');
const config = require('../config.js');

module.exports = async (client, message, args, utils, config) => {
    const isArabic = /[\u0600-\u06AE]/.test(message.content);
    
    // Load players
    const players = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'database', 'players.json')));
    
    // Sort by different categories
    const byWagered = Object.entries(players)
        .sort((a, b) => b[1].totalWagered - a[1].totalWagered)
        .slice(0, 10);
    
    const byWon = Object.entries(players)
        .sort((a, b) => b[1].totalWon - a[1].totalWon)
        .slice(0, 10);
    
    const byLevel = Object.entries(players)
        .sort((a, b) => b[1].level - a[1].level)
        .slice(0, 10);
    
    // Format leaderboard entries
    const formatWagered = async (entry, index) => {
        const user = await client.users.fetch(entry[0]).catch(() => null);
        const name = user ? user.tag : 'Unknown User';
        return `**${index + 1}.** ${name} - ${utils.helpers.formatNumber(entry[1].totalWagered)} ${isArabic ? 'نقطة' : 'credits'}`;
    };
    
    const formatWon = async (entry, index) => {
        const user = await client.users.fetch(entry[0]).catch(() => null);
        const name = user ? user.tag : 'Unknown User';
        return `**${index + 1}.** ${name} - ${utils.helpers.formatNumber(entry[1].totalWon)} ${isArabic ? 'نقطة' : 'credits'}`;
    };
    
    const formatLevel = async (entry, index) => {
        const user = await client.users.fetch(entry[0]).catch(() => null);
        const name = user ? user.tag : 'Unknown User';
        return `**${index + 1}.** ${name} - Level ${entry[1].level} (${entry[1].xp} XP)`;
    };
    
    // Create embed
    const embed = new EmbedBuilder()
        .setColor(config.colors.casino)
        .setTitle(isArabic ? '🏆 قائمة المتصدرين' : '🏆 Leaderboard')
        .setDescription(isArabic ? 
            'أفضل اللاعبين في الكازينو' :
            'Top players in the casino')
        .setFooter({ text: isArabic ? 'كازينو | استمر في اللعب' : 'Casino | Keep playing' });
    
    // Add fields asynchronously
    const wageredTexts = await Promise.all(byWagered.map((entry, i) => formatWagered(entry, i)));
    embed.addFields({
        name: isArabic ? '💰 أعلى الرهانات' : '💰 Top by Wagered',
        value: wageredTexts.join('\n') || (isArabic ? 'لا يوجد' : 'None'),
        inline: true
    });
    
    const wonTexts = await Promise.all(byWon.map((entry, i) => formatWon(entry, i)));
    embed.addFields({
        name: isArabic ? '💵 أعلى الأرباح' : '💵 Top by Winnings',
        value: wonTexts.join('\n') || (isArabic ? 'لا يوجد' : 'None'),
        inline: true
    });
    
    const levelTexts = await Promise.all(byLevel.map((entry, i) => formatLevel(entry, i)));
    embed.addFields({
        name: isArabic ? '📈 أعلى المستويات' : '📈 Top by Level',
        value: levelTexts.join('\n') || (isArabic ? 'لا يوجد' : 'None'),
        inline: true
    });
    
    await message.reply({ embeds: [embed] });
};
