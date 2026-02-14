module.exports = {
    // Bot Configuration
    token: process.env.TOKEN,
    probotId: process.env.PROBOT_ID,
    ownerId: process.env.OWNER_ID,
    
    // Game Configuration
    minBet: 10000,
    dailyReward: 50000,
    jackpotBase: 100000,
    taxRate: 0.05, // 5% casino tax on wins
    
    // Timeouts (ms)
    paymentTimeout: 30000,
    gameTimeout: 60000,
    
    // Cooldowns (ms)
    dailyCooldown: 86400000, // 24 hours
    duelCooldown: 300000, // 5 minutes
    
    // Colors
    colors: {
        success: 0x00ff00,
        error: 0xff0000,
        info: 0x0099ff,
        warning: 0xffaa00,
        casino: 0xffd700
    },
    
    // Emojis
    emojis: {
        coin: "🪙",
        dice: "🎲",
        cards: "🃏",
        slot: "🎰",
        roulette: "🎯",
        jackpot: "💰",
        trophy: "🏆",
        bank: "🏦",
        warning: "⚠️",
        success: "✅",
        error: "❌",
        time: "⏰",
        lock: "🔒",
        unlock: "🔓"
    },
    
    // Arabic translations
    ar: {
        // Game names
        coin: "عملة",
        dice: "نرد",
        roulette: "روليت",
        blackjack: "بلاك جاك",
        slots: "سلوتس",
        higherlower: "أعلى/أقل",
        guess: "تخمين",
        crash: "تحطم",
        jackpot: "جاكبوت",
        duel: "تحدي",
        russian: "روليت روسي",
        
        // Messages
        minBet: `الحد الأدنى للرهان 10000 نقطة`,
        insufficientBank: "رصيد الكازينو غير كافٍ",
        paymentRequest: "يرجى تحويل النقاط للعب",
        waitingPayment: "في انتظار التحويل...",
        paymentSuccess: "تم استلام النقاط! بدء اللعبة...",
        paymentFailed: "فشل التحويل أو انتهاء الوقت",
        gameCancelled: "تم إلغاء اللعبة",
        win: "فوز!",
        lose: "خسارة!",
        draw: "تعادل!",
        bankBalance: "رصيد الكازينو",
        ownerOnly: "هذا الأمر للمالك فقط",
        gameLocked: "اللعبة مقفلة حالياً",
        casinoClosed: "الكازينو مغلق حالياً",
        dailyClaimed: "تم استلام المكافأة اليومية",
        dailyCooldown: "انتظر {time} للمكافأة التالية",
        leaderboard: "قائمة المتصدرين",
        stats: "إحصائياتك",
        level: "المستوى",
        wagered: "إجمالي الرهانات",
        won: "إجمالي الأرباح",
        
        // Commands
        help: "مساعدة",
        stats: "احصائياتي",
        leaderboard: "المتصدرين",
        daily: "جائزة يومية",
        
        // Games
        coinHeads: "صورة",
        coinTails: "كتابة",
        
        // Blackjack
        hit: "اضرب",
        stand: "قف",
        bust: "انفجر",
        blackjack_: "بلاك جاك!",
        
        // Roulette
        red: "أحمر",
        black: "أسود",
        green: "أخضر",
        odd: "فردي",
        even: "زوجي",
        
        // Errors
        error: "حدث خطأ",
        invalidAmount: "مبلغ غير صالح",
        invalidChoice: "اختيار غير صالح",
        notEnough: "رصيد غير كافٍ"
    }
};
