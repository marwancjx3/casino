const express = require('express');
const app = express();

app.all('/', (req, res) => {
    res.send(`
        <html>
            <head>
                <title>Casino Bot Status</title>
                <style>
                    body {
                        font-family: Arial, sans-serif;
                        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                        color: white;
                        text-align: center;
                        padding: 50px;
                    }
                    .status {
                        background: rgba(255,255,255,0.2);
                        border-radius: 10px;
                        padding: 20px;
                        margin-top: 30px;
                    }
                    h1 {
                        font-size: 48px;
                        margin-bottom: 10px;
                    }
                    .online {
                        color: #4CAF50;
                    }
                </style>
            </head>
            <body>
                <h1>🎰 Casino Bot</h1>
                <div class="status">
                    <h2 class="online">🟢 ONLINE</h2>
                    <p>Bot is running and ready to serve!</p>
                    <p>Version: 1.0.0</p>
                    <p>Uptime: ${Math.floor(process.uptime() / 3600)}h ${Math.floor((process.uptime() % 3600) / 60)}m</p>
                </div>
            </body>
        </html>
    `);
});

function keepAlive() {
    const port = process.env.PORT || 3000;
    app.listen(port, () => {
        console.log(`🌐 Keep-alive server running on port ${port}`);
    });
}

module.exports = keepAlive;
