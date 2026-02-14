const fs = require('fs');
const path = require('path');

module.exports = {
    getBank: () => {
        return JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'database', 'bank.json')));
    },
    
    updateBank: (newBalance) => {
        const bank = module.exports.getBank();
        bank.balance = newBalance;
        fs.writeFileSync(path.join(__dirname, '..', 'database', 'bank.json'), JSON.stringify(bank, null, 2));
    },
    
    addToBank: (amount) => {
        const bank = module.exports.getBank();
        bank.balance += amount;
        bank.totalWagered += amount;
        fs.writeFileSync(path.join(__dirname, '..', 'database', 'bank.json'), JSON.stringify(bank, null, 2));
    },
    
    removeFromBank: (amount) => {
        const bank = module.exports.getBank();
        if (bank.balance < amount) return false;
        bank.balance -= amount;
        bank.totalPaid += amount;
        fs.writeFileSync(path.join(__dirname, '..', 'database', 'bank.json'), JSON.stringify(bank, null, 2));
        return true;
    },
    
    getPlayer: (userId) => {
        const players = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'database', 'players.json')));
        if (!players[userId]) {
            players[userId] = {
                level: 1,
                xp: 0,
                totalWagered: 0,
                totalWon: 0,
                gamesPlayed: 0,
                lastDaily: 0,
                lastDuel: 0
            };
            fs.writeFileSync(path.join(__dirname, '..', 'database', 'players.json'), JSON.stringify(players, null, 2));
        }
        return players[userId];
    },
    
    updatePlayer: (userId, data) => {
        const players = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'database', 'players.json')));
        players[userId] = { ...players[userId], ...data };
        fs.writeFileSync(path.join(__dirname, '..', 'database', 'players.json'), JSON.stringify(players, null, 2));
    },
    
    addWager: (userId, amount) => {
        const player = module.exports.getPlayer(userId);
        player.totalWagered += amount;
        player.xp += Math.floor(amount / 1000);
        player.gamesPlayed += 1;
        
        // Level up calculation (every 10000 XP = level 1, then exponential)
        const newLevel = Math.floor(Math.sqrt(player.xp / 10000)) + 1;
        if (newLevel > player.level) {
            player.level = newLevel;
        }
        
        module.exports.updatePlayer(userId, player);
    },
    
    addWin: (userId, amount) => {
        const player = module.exports.getPlayer(userId);
        player.totalWon += amount;
        module.exports.updatePlayer(userId, player);
    },
    
    checkDaily: (userId) => {
        const player = module.exports.getPlayer(userId);
        const now = Date.now();
        const cooldown = 24 * 60 * 60 * 1000; // 24 hours
        
        if (now - player.lastDaily < cooldown) {
            const remaining = cooldown - (now - player.lastDaily);
            const hours = Math.floor(remaining / (60 * 60 * 1000));
            const minutes = Math.floor((remaining % (60 * 60 * 1000)) / (60 * 1000));
            return { available: false, remaining: `${hours}h ${minutes}m` };
        }
        
        return { available: true };
    },
    
    claimDaily: (userId) => {
        const player = module.exports.getPlayer(userId);
        player.lastDaily = Date.now();
        module.exports.updatePlayer(userId, player);
    }
};
