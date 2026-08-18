const express = require('express');
const fetch = require('node-fetch');
const fs = require('fs');
const path = require('path');

const app = express();

const CLIENT_ID = process.env.CLIENT_ID;
const CLIENT_SECRET = process.env.CLIENT_SECRET;
const REDIRECT_URI = process.env.REDIRECT_URI;

app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// 1. Ana Sayfa / Giriş Ekranı ve Ayar Paneli
app.get('/', (req, res) => {
    res.send(`
        <body style="background: #1e1e1e; color: white; font-family: sans-serif; text-align: center; padding-top: 50px;">
            <h1>Syrexs.mc Bot Yönetim Paneli</h1>
            <br>
            <a href="https://discord.com/api/oauth2/authorize?client_id=${CLIENT_ID}&redirect_uri=${encodeURIComponent(REDIRECT_URI)}&response_type=code&scope=identify" 
               style="background: #5865F2; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; font-weight: bold;">
                Discord ile Giriş Yap
            </a>
        </body>
    `);
});

// 2. Discord Callback (Giriş yaptıktan sonra yönlendirilen kısım)
app.get('/callback', async (req, res) => {
    const code = req.query.code;
    if (!code) return res.send('Giriş kodu bulunamadı!');

    try {
        const tokenResponse = await fetch('https://discord.com/api/oauth2/token', {
            method: 'POST',
            body: new URLSearchParams({
                client_id: CLIENT_ID,
                client_secret: CLIENT_SECRET,
                grant_type: 'authorization_code',
                code: code,
                redirect_uri: REDIRECT_URI,
            }),
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        });

        const tokenData = await tokenResponse.json();
        
        if (!tokenData.access_token) {
            return res.send('Discord token alınamadı: ' + JSON.stringify(tokenData));
        }

        const userResponse = await fetch('https://discord.com/api/users/@me', {
            headers: { authorization: `${tokenData.token_type} ${tokenData.access_token}` },
        });
        
        const userData = await userResponse.json();

        // Başarılı giriş sonrası gösterilecek Ayar Paneli Formu
        res.send(`
            <body style="background: #1e1e1e; color: white; font-family: sans-serif; padding: 40px;">
                <h2>Hoş geldin, ${userData.username}!</h2>
                <hr style="border-color: #444; margin-bottom: 20px;">
                
                <h3>Bot Ayar Paneli</h3>
                <form action="/update-config" method="POST">
                    <div style="margin-bottom: 15px;">
                        <label>Ticket Kategori ID:</label><br>
                        <input type="text" name="ticketKategoriID" placeholder="Kategori ID" style="padding: 8px; width: 350px; margin-top: 5px;">
                    </div>
                    <div style="margin-bottom: 15px;">
                        <label>Ticket Log Kanal ID:</label><br>
                        <input type="text" name="ticketLogKanalID" placeholder="Log Kanal ID" style="padding: 8px; width: 350px; margin-top: 5px;">
                    </div>
                    <div style="margin-bottom: 15px;">
                        <label>Yetkili Rol ID:</label><br>
                        <input type="text" name="yetkiliRolID" placeholder="Yetkili Rol ID" style="padding: 8px; width: 350px; margin-top: 5px;">
                    </div>
                    <button type="submit" style="padding: 10px 20px; background: #2ecc71; color: white; border: none; cursor: pointer; font-weight: bold; border-radius: 4px;">Ayarları Kaydet</button>
                </form>
            </body>
        `);
    } catch (error) {
        console.error(error);
        res.send('Bir hata oluştu: ' + error.message);
    }
});

// 3. Formdan Gelen Ayarları Kaydetme İşlemi
app.post('/update-config', (req, res) => {
    const yeniAyarlar = {
        ticketKategoriID: req.body.ticketKategoriID || "",
        ticketLogKanalID: req.body.ticketLogKanalID || "",
        yetkiliRolID: req.body.yetkiliRolID || ""
    };

    fs.writeFileSync('./config.json', JSON.stringify(yeniAyarlar, null, 2));
    
    res.send(`
        <body style="background: #1e1e1e; color: white; font-family: sans-serif; text-align: center; padding-top: 50px;">
            <h2 style="color: #2ecc71;">Ayarlar başarıyla kaydedildi!</h2>
            <p>Bot artık bu ayarlara göre çalışacak.</p>
            <br>
            <a href="/" style="color: #5865F2; text-decoration: underline;">Ana Sayfaya Dön</a>
        </body>
    `);
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Sunucu ${PORT} portunda ayakta!`));