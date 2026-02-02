const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
require('dotenv').config();

const app = express();
const uploadsPath = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsPath)) {
    fs.mkdirSync(uploadsPath, { recursive: true });
}
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname)));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Import route modülleri
const illerRoute = require('./routes/iller');
const ilcelerRoute = require('./routes/ilceler');
const kuaforlerRoute = require('./routes/kuaforler');
const musteriRoute = require('./routes/musteri');
const kuaforRoute = require('./routes/kuafor');
const randevuRoute = require('./routes/randevu');

// Routes
app.use('/api/iller', illerRoute);
app.use('/api/ilceler', ilcelerRoute);
app.use('/api/kuaforler', kuaforlerRoute);
app.use('/api/musteri', musteriRoute);
app.use('/api/kuafor', kuaforRoute);
app.use('/api/randevu', randevuRoute);

// Ana sayfa
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

// Hata yakalama
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Bir hata oluştu' });
});

// Migration çalıştır ve sunucuyu başlat
const runAnaKartMigration = require('./migrations/run-ana-kart');

async function start() {
  await runAnaKartMigration();
  app.listen(PORT, () => {
    console.log(`Server çalışıyor: http://localhost:${PORT}`);
  });
}

start().catch((err) => {
  console.error('Sunucu başlatılamadı:', err);
  process.exit(1);
});

