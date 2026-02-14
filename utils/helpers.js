const { EmbedBuilder } = require('discord.js');
const config = require('../config.js');

module.exports = {
    createEmbed: (title, description, color = config.colors.info, fields = []) => {
        const embed = new EmbedBuilder()
            .setTitle(title)
            .setDescription(description)
            .setColor(color)
            .setTimestamp();
        
        if (fields.length > 0) {
            embed.addFields(fields);
        }
        
        return embed;
    },
    
    formatNumber: (num) => {
        return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
    },
    
    randomInt: (min, max) => {
        return Math.floor(Math.random() * (max - min + 1)) + min;
    },
    
    shuffleArray: (array) => {
        for (let i = array.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [array[i], array[j]] = [array[j], array[i]];
        }
        return array;
    },
    
    calculateWin: (bet, multiplier) => {
        return Math.floor(bet * multiplier);
    },
    
    applyTax: (amount) => {
        const tax = Math.floor(amount * config.taxRate);
        return {
            total: amount - tax,
            tax: tax
        };
    },
    
    getLevel: (xp) => {
        return Math.floor(Math.sqrt(xp / 10000)) + 1;
    },
    
    getXpForLevel: (level) => {
        return Math.pow(level - 1, 2) * 10000;
    },
    
    getProgressBar: (current, max, size = 10) => {
        const percentage = current / max;
        const progress = Math.round(size * percentage);
        const empty = size - progress;
        return '█'.repeat(progress) + '░'.repeat(empty);
    },
    
    detectLanguage: (text) => {
        return /[\u0600-\u06FF]/.test(text) ? 'ar' : 'en';
    },
    
    getResponse: (key, lang, ...args) => {
        let text = config[lang][key] || config.en[key];
        args.forEach((arg, i) => {
            text = text.replace(`{${i}}`, arg);
        });
        return text;
    },
    
    timeUntil: (timestamp) => {
        const now = Date.now();
        const diff = timestamp - now;
        
        if (diff <= 0) return 'now';
        
        const hours = Math.floor(diff / (1000 * 60 * 60));
        const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((diff % (1000 * 60)) / 1000);
        
        if (hours > 0) return `${hours}h ${minutes}m`;
        if (minutes > 0) return `${minutes}m ${seconds}s`;
        return `${seconds}s`;
    }
};
