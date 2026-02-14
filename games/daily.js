const { EmbedBuilder } = require('discord.js');
const config = require('../config.js');
const db = require('../utils/database.js');

module.exports = async (client, message, args, utils, config) => {
    const isArabic = /[\u0600-\u06AE]/.test(message.content);
    
    // Check daily cooldown
    const dailyCheck = db.checkDaily(message.author.id);
    
    if (!dailyCheck.available) {
        const embed = new EmbedBuilder()
            .setColor(config.colors.warning)
            .setTitle(isArabic ? '⏰ جائزة يومية' : '⏰ Daily Reward')
            .setDescription(isArabic ? 
                `انتظر ${dailyCheck.remaining} للمكافأة التالية` :
                `Wait ${dailyCheck.remaining} for next reward`)
            .setFooter({ text: isArabic ? 'كازينو | تعال غداً' : 'Casino | Come back tomorrow' });
        
        return message.reply({ embeds: [embed] });
    }
    
    // Calculate daily amount based on level
    const player = db.getPlayer(message.author.id);
    const levelBonus = player.level * 10000;
    const dailyAmount = config.dailyReward + levelBonus;
    
    // Check if bank has enough
    if (!db.removeFromBank(dailyAmount)) {
        const embed = new EmbedBuilder()
            .setColor(config.colors.error)
            .setTitle(isArabic ? '⚠️ خطأ' : '⚠️ Error')
            .setDescription(isArabic ? 
                'الكازينو ليس لديه رصيد كافي' :
                "Casino doesn't have enough credits")
            .setFooter({ text: isArabic ? 'كازينو | حاول لاحقاً' : 'Casino | Try later' });
        
        return message.reply({ embeds: [embed] });
    }
    
    // Claim daily
    db.claimDaily(message.author.id);
    db.addWin(message.author.id, dailyAmount);
    
    // Create embed
    const embed = new EmbedBuilder()
        .setColor(config.colors.success)
        .setTitle(isArabic ? '🎁 جائزة يومية' : '🎁 Daily Reward')
        .setDescription(isArabic ? 
            `تم استلام ${dailyAmount} نقطة!` :
            `You received ${dailyAmount} credits!`)
        .addFields(
            {
                name: isArabic ? '💰 المبلغ' : '💰 Amount',
                value: `${dailyAmount} ${isArabic ? 'نقطة' : 'credits'}`,
                inline: true
            },
            {
                name: isArabic ? '📊 المستوى' : '📊 Level',
                value: player.level.toString(),
                inline: true
            },
            {
                name: isArabic ? '🎁 مكافأة المستوى' : '🎁 Level Bonus',
                value: `+${levelBonus}`,
                inline: true
            }
        )
        .setFooter({ text: isArabic ? 'كازينو | تعال غداً للمزيد' : 'Casino | Come back tomorrow for more' });
    
    await message.reply({ embeds: [embed] });
    
    // Random treasure drop chance (10%)
    if (Math.random() < 0.1) {
        const treasureAmount = Math.floor(dailyAmount * (Math.random() * 0.5 + 0.5)); // 50-100% of daily
        if (db.removeFromBank(treasureAmount)) {
            db.addWin(message.author.id, treasureAmount);
            
            const treasureEmbed = new EmbedBuilder()
                .setColor(config.colors.casino)
                .setTitle(isArabic ? '💎 كنز مفاجئ!' : '💎 Treasure Drop!')
                .setDescription(isArabic ? 
                    `لقد وجدت كنزاً إضافياً قيمته ${treasureAmount} نقطة!` :
                    `You found an extra treasure worth ${treasureAmount} credits!`)
                .setFooter({ text: isArabic ? 'كازينو | مبروك!' : 'Casino | Congratulations!' });
            
            await message.channel.send({ embeds: [treasureEmbed] });
        }
    }
};
