// ============================================================
// BERBER RANDEVU SİSTEMİ - BACKEND KOD ÖRNEKLERİ
// ============================================================

// ============================================================
// 1. server.js - EXPRESS SUNUCUSU
// ============================================================

const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname)));

// Routes
app.use('/api/iller', require('./routes/iller'));
app.use('/api/ilceler', require('./routes/ilceler'));
app.use('/api/kuaforler', require('./routes/kuaforler'));

app.listen(PORT, () => {
  console.log(`Server çalışıyor: http://localhost:${PORT}`);
});

/* Güvenlik Notu:
 - `JWT_SECRET` ve benzeri kritik anahtarları kod içinde sabit olarak bırakmayın. Bunları `.env` içinde saklayın ve
   `process.env.JWT_SECRET` ile okuyun. Üretim ortamında güçlü, rastgele bir secret kullanın ve paylaşmayın. */

// ============================================================
// 2. db.js - MYSQL BAĞLANTISI
// ============================================================

const mysql = require('mysql2/promise');
require('dotenv').config();

const pool = mysql.createPool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

module.exports = pool;

// ============================================================
// 3. routes/iller.js - İLLER API
// ============================================================

const express = require('express');
const router = express.Router();
const pool = require('../db');

// GET /api/iller - Tüm illeri listele
router.get('/', async (req, res) => {
  try {
    const connection = await pool.getConnection();
    const [rows] = await connection.query(
      'SELECT id, il_adi FROM iller ORDER BY il_adi'
    );
    connection.release();
    res.json(rows);
  } catch (error) {
    console.error('Hata:', error);
    res.status(500).json({ error: 'İller getirilemedi' });
  }
});

module.exports = router;

// ============================================================
// 4. routes/ilceler.js - İLÇELER API
// ============================================================

const express = require('express');
const router = express.Router();
const pool = require('../db');

// GET /api/ilceler/:il_id - Belirli ile ait ilçeleri getir
router.get('/:il_id', async (req, res) => {
  try {
    const { il_id } = req.params;
    const connection = await pool.getConnection();
    const [rows] = await connection.query(
      'SELECT id, ilce_adi FROM ilceler WHERE il_id = ? ORDER BY ilce_adi',
      [il_id]
    );
    connection.release();
    res.json(rows);
  } catch (error) {
    console.error('Hata:', error);
    res.status(500).json({ error: 'İlçeler getirilemedi' });
  }
});

module.exports = router;

// ============================================================
// 5. routes/kuaforler.js - KUAFÖRLER API
// ============================================================

const express = require('express');
const router = express.Router();
const pool = require('../db');

// GET /api/kuaforler - Kuaförleri getir (filtreli)
router.get('/', async (req, res) => {
  try {
    const { il_id, ilce_id, hizmet } = req.query;
    
    let query = `
      SELECT 
        k.id,
        k.isletme_adi,
        k.rating,
        k.il_id,
        k.ilce_id,
        i.il_adi,
        ilc.ilce_adi,
        k.en_yakin_randevu,
        k.hizmetler
      FROM kuafor_listesi k
      JOIN iller i ON k.il_id = i.id
      JOIN ilceler ilc ON k.ilce_id = ilc.id
      WHERE 1=1
    `;
    
    const params = [];
    
    if (il_id) {
      query += ' AND k.il_id = ?';
      params.push(il_id);
    }
    if (ilce_id) {
      query += ' AND k.ilce_id = ?';
      params.push(ilce_id);
    }
    if (hizmet) {
      query += ' AND k.hizmetler LIKE ?';
      params.push(`%${hizmet}%`);
    }
    
    query += ' ORDER BY k.rating DESC, k.isletme_adi ASC';
    
    const connection = await pool.getConnection();
    const [rows] = await connection.query(query, params);
    connection.release();
    
    res.json(rows);
  } catch (error) {
    console.error('Hata:', error);
    res.status(500).json({ error: 'Kuaförler getirilemedi' });
  }
});

// GET /api/kuaforler/:id - Belirli kuaförün detaylarını getir
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const connection = await pool.getConnection();
    const [rows] = await connection.query(
      `SELECT * FROM kuafor_listesi k
       JOIN iller i ON k.il_id = i.id
       JOIN ilceler ilc ON k.ilce_id = ilc.id
       WHERE k.id = ?`,
      [id]
    );
    connection.release();
    
    if (rows.length === 0) {
      return res.status(404).json({ error: 'Kuaför bulunamadı' });
    }
    
    res.json(rows[0]);
  } catch (error) {
    console.error('Hata:', error);
    res.status(500).json({ error: 'Kuaför detayı getirilemedi' });
  }
});

module.exports = router;

// ============================================================
// 6. FRONTEND - JavaScript API Çağrıları
// ============================================================

// İlleri Yükle
async function illerinYukle() {
  try {
    const response = await fetch('http://localhost:3000/api/iller');
    const iller = await response.json();
    
    const ilSelect = document.getElementById('il');
    ilSelect.innerHTML = '<option value="">İl Seç</option>';
    iller.forEach(il => {
      ilSelect.innerHTML += `<option value="${il.id}">${il.il_adi}</option>`;
    });
  } catch (error) {
    console.error('Hata:', error);
  }
}

// İlçeleri Yükle
async function ilceleriYukle(ilId) {
  if (!ilId) {
    document.getElementById('ilce').innerHTML = '<option value="">İlçe Seç</option>';
    return;
  }
  
  try {
    const response = await fetch(`http://localhost:3000/api/ilceler/${ilId}`);
    const ilceler = await response.json();
    
    const ilceSelect = document.getElementById('ilce');
    ilceSelect.innerHTML = '<option value="">İlçe Seç</option>';
    ilceler.forEach(ilce => {
      ilceSelect.innerHTML += `<option value="${ilce.id}">${ilce.ilce_adi}</option>`;
    });
  } catch (error) {
    console.error('Hata:', error);
  }
}

// Kuaförleri Getir
async function kuaforleriGoster() {
  try {
    const ilId = document.getElementById('il').value;
    const ilceId = document.getElementById('ilce').value;
    const hizmet = document.getElementById('hizmet').value;
    
    let url = 'http://localhost:3000/api/kuaforler';
    const params = new URLSearchParams();
    
    if (ilId) params.append('il_id', ilId);
    if (ilceId) params.append('ilce_id', ilceId);
    if (hizmet) params.append('hizmet', hizmet);
    
    if (params.toString()) {
      url += '?' + params.toString();
    }
    
    const response = await fetch(url);
    const kuaforler = await response.json();
    
    const container = document.getElementById('kuaforlerKonteyner');
    container.innerHTML = kuaforler
      .map(kuafor => `
        <div class="col-md-4 mb-4">
          <div class="card kuafor-card h-100">
            <div class="card-body">
              <h5 class="card-title">${kuafor.isletme_adi}</h5>
              <p class="mb-1">⭐ ${kuafor.rating}</p>
              <p class="text-muted mb-2">📍 ${kuafor.ilce_adi}, ${kuafor.il_adi}</p>
              <p class="fw-semibold">En yakın randevu: ${kuafor.en_yakin_randevu}</p>
              <div class="mb-3">
                ${kuafor.hizmetler ? kuafor.hizmetler.split(',')
                  .map(h => `<span class="badge bg-secondary">${h.trim()}</span>`)
                  .join('') : ''}
              </div>
              <div class="d-flex gap-2">
                <button class="btn btn-outline-dark w-50" onclick="detayGoster(${kuafor.id})">Detay</button>
                <button class="btn btn-dark w-50" onclick="hizliRandevuAl(${kuafor.id})">Hızlı Randevu</button>
              </div>
            </div>
          </div>
        </div>
      `)
      .join('');
  } catch (error) {
    console.error('Hata:', error);
  }
}

// ============================================================
// 7. SQL VERİTABANI SORGUSU - KUAFÖRLER
// ============================================================

SELECT 
  k.id,
  k.isletme_adi,
  k.rating,
  k.il_id,
  k.ilce_id,
  i.il_adi,
  ilc.ilce_adi,
  k.en_yakin_randevu,
  k.hizmetler
FROM kuafor_listesi k
JOIN iller i ON k.il_id = i.id
JOIN ilceler ilc ON k.ilce_id = ilc.id
WHERE 1=1
  AND k.il_id = 1          -- İstanbul
  AND ilc.ilce_adi LIKE '%Beşiktaş%'
  AND k.hizmetler LIKE '%Boya%'
ORDER BY k.rating DESC;

// ============================================================
// KURULUM VE ÇALIŞMA ADIMı
// ============================================================

/*
1. npm install
   - express, mysql2, cors, dotenv yüklenecek

2. .env dosyası ayarla
   DB_HOST=localhost
   DB_USER=root
   DB_PASSWORD=...
   DB_NAME=berber_randevu

3. npm run dev (Geliştirme modu)
   
4. http://localhost:3000 açıp test et

5. İller seç → İlçeler otomatik doldurulur → Kuaförler gösterilir
*/

// ============================================================
