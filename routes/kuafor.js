const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const pool = require('../db');

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-2024';

// Multer konfigürasyonu - firma görselleri için
const uploadsDir = path.join(__dirname, '..', 'uploads', 'firma_gorselleri');
if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
}

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const firmaId = req.user?.id;
        if (!firmaId) return cb(new Error('Yetkisiz'));
        const dir = path.join(uploadsDir, String(firmaId));
        if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
        cb(null, dir);
    },
    filename: (req, file, cb) => {
        const ext = (path.extname(file.originalname) || '').toLowerCase();
        const allowed = ['.jpg', '.jpeg', '.png', '.webp'];
        const safeExt = allowed.includes(ext) ? ext : '.jpg';
        const name = Date.now() + '_' + Math.random().toString(36).slice(2, 8) + safeExt;
        cb(null, name);
    }
});

const upload = multer({
    storage,
    limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
    fileFilter: (req, file, cb) => {
        const ext = (path.extname(file.originalname) || '').toLowerCase();
        if (['.jpg', '.jpeg', '.png', '.webp'].includes(ext)) {
            cb(null, true);
        } else {
            cb(new Error('Sadece JPG, PNG ve WebP formatları desteklenir'));
        }
    }
});

// Kuaför Kayıt (Register)
router.post('/register', async (req, res) => {
    try {
        const { firmaAdi, firma_sahibi, eposta, telefon, password } = req.body;

        // Validasyon
        if (!firmaAdi || !firma_sahibi || !eposta || !telefon || !password) {
            return res.status(400).json({
                message: 'Tüm alanlar zorunludur'
            });
        }

        // E-posta kontrolü
        const connection = await pool.getConnection();
        const [existingUser] = await connection.execute(
            'SELECT id FROM firmalar WHERE eposta = ?',
            [eposta]
        );

        if (existingUser.length > 0) {
            connection.release();
            return res.status(400).json({
                message: 'Bu e-posta zaten kayıtlı'
            });
        }

        // Şifre hash'le
        const hashedPassword = await bcrypt.hash(password, 10);

        // Veritabanına kaydet
        await connection.execute(
            'INSERT INTO firmalar (firmaAdi, firma_sahibi, eposta, telefon, sifre) VALUES (?, ?, ?, ?, ?)',
            [firmaAdi, firma_sahibi, eposta, telefon, hashedPassword]
        );

        connection.release();

        res.status(201).json({
            message: 'Kayıt başarılı. Lütfen giriş yapınız.'
        });
    } catch (error) {
        console.error('Register hatası:', error);
        res.status(500).json({
            message: 'Kayıt sırasında hata oluştu: ' + error.message
        });
    }
});

// Kuaför Giriş (Login)
router.post('/login', async (req, res) => {
    try {
        const { eposta, password } = req.body;

        // Validasyon
        if (!eposta || !password) {
            return res.status(400).json({
                message: 'E-posta ve şifre zorunludur'
            });
        }

        // Kuaför bul
        const connection = await pool.getConnection();
        const [users] = await connection.execute(
            'SELECT id, firmaAdi, firma_sahibi, eposta, sifre FROM firmalar WHERE eposta = ?',
            [eposta]
        );

        if (users.length === 0) {
            connection.release();
            return res.status(401).json({
                message: 'E-posta veya şifre hatalı'
            });
        }

        const user = users[0];

        // Şifre karşılaştır
        const passwordMatch = await bcrypt.compare(password, user.sifre);

        if (!passwordMatch) {
            connection.release();
            return res.status(401).json({
                message: 'E-posta veya şifre hatalı'
            });
        }

        connection.release();

        // JWT token oluştur
        const token = jwt.sign(
            { id: user.id, eposta: user.eposta, name: user.firmaAdi, firma_sahibi: user.firma_sahibi },
            JWT_SECRET,
            { expiresIn: '7d' }
        );

        res.status(200).json({
            message: 'Giriş başarılı',
            token: token,
            user: {
                id: user.id,
                firmaAdi: user.firmaAdi,
                firma_sahibi: user.firma_sahibi,
                eposta: user.eposta
            }
        });
    } catch (error) {
        console.error('Login hatası:', error);
        res.status(500).json({
            message: 'Giriş sırasında hata oluştu: ' + error.message
        });
    }
});

// Token doğrulama middleware'i
const verifyToken = (req, res, next) => {
    try {
        const token = req.headers.authorization?.split(' ')[1];

        if (!token) {
            return res.status(401).json({
                message: 'Token bulunamadı'
            });
        }

        const decoded = jwt.verify(token, JWT_SECRET);
        req.user = decoded;
        next();
    } catch (error) {
        res.status(401).json({
            message: 'Token geçersiz'
        });
    }
};

// Token doğrulama endpoint'i
router.get('/verify', (req, res) => {
    try {
        const token = req.headers.authorization?.split(' ')[1];

        if (!token) {
            return res.status(401).json({
                message: 'Token bulunamadı'
            });
        }

        const decoded = jwt.verify(token, JWT_SECRET);

        res.status(200).json({
            user: decoded
        });
    } catch (error) {
        res.status(401).json({
            message: 'Token geçersiz'
        });
    }
});

// Kuaför bilgilerini getir
router.get('/info', verifyToken, async (req, res) => {
    try {
        const connection = await pool.getConnection();
        const [kuafor] = await connection.execute(
            `SELECT f.id, f.firmaAdi, f.firma_sahibi, f.eposta, f.telefon, 
                    f.ilce_id, f.mahalle, f.cadde, f.sokak, f.bina_no, f.daire_no,
                    ilc.il_id, ilc.ilceAdi
             FROM firmalar f
             LEFT JOIN ilceler ilc ON f.ilce_id = ilc.id
             WHERE f.id = ?`,
            [req.user.id]
        );

        connection.release();

        if (kuafor.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Kuaför bulunamadı'
            });
        }

        res.status(200).json({
            success: true,
            kuafor: kuafor[0]
        });
    } catch (error) {
        console.error('Kuaför bilgisi getirme hatası:', error);
        res.status(500).json({
            success: false,
            message: 'Bilgi alınırken hata oluştu: ' + error.message
        });
    }
});

// Kuaför bilgilerini güncelle
router.put('/update-info', verifyToken, async (req, res) => {
    try {
        const { firmaAdi, firma_sahibi, telefon, il_id, ilce_id, mahalle, cadde, sokak, bina_no, daire_no } = req.body;

        if (!firmaAdi || !firma_sahibi || !telefon) {
            return res.status(400).json({
                success: false,
                message: 'Salon adı, yetkili adı ve telefon zorunludur'
            });
        }

        const connection = await pool.getConnection();
        await connection.execute(
            `UPDATE firmalar SET 
                firmaAdi = ?, 
                firma_sahibi = ?, 
                telefon = ?,
                ilce_id = ?,
                mahalle = ?,
                cadde = ?,
                sokak = ?,
                bina_no = ?,
                daire_no = ?
             WHERE id = ?`,
            [firmaAdi, firma_sahibi, telefon, ilce_id || null, mahalle || null, cadde || null, sokak || null, bina_no || null, daire_no || null, req.user.id]
        );

        connection.release();

        res.status(200).json({
            success: true,
            message: 'Bilgiler başarıyla güncellendi'
        });
    } catch (error) {
        console.error('Kuaför bilgisi güncelleme hatası:', error);
        res.status(500).json({
            success: false,
            message: 'Güncelleme sırasında hata oluştu: ' + error.message
        });
    }
});

// Çalışma programını getir
router.get('/schedule', verifyToken, async (req, res) => {
    try {
        const connection = await pool.getConnection();
        const [programs] = await connection.execute(
            'SELECT id, gun, baslangic_saati, bitis_saati, slot_dakika, max_randevu, buffer_dk, kapali FROM randevu_calisma_programi WHERE firma_id = ? ORDER BY gun',
            [req.user.id]
        );

        connection.release();

        res.status(200).json({
            success: true,
            programs: programs || []
        });
    } catch (error) {
        console.error('Çalışma programı getirme hatası:', error);
        res.status(500).json({
            success: false,
            message: 'Program alınırken hata oluştu: ' + error.message
        });
    }
});

// Çalışma programını güncelle
router.put('/update-schedule', verifyToken, async (req, res) => {
    try {
        const { schedules } = req.body;

        if (!schedules || !Array.isArray(schedules)) {
            return res.status(400).json({
                success: false,
                message: 'Geçersiz program verisi'
            });
        }

        const connection = await pool.getConnection();

        for (const schedule of schedules) {
            const { gun, kapali, baslangic_saati, bitis_saati, slot_dakika, max_randevu, buffer_dk } = schedule;

            // Mevcut programı kontrol et
            const [existing] = await connection.execute(
                'SELECT id FROM randevu_calisma_programi WHERE firma_id = ? AND gun = ?',
                [req.user.id, gun]
            );

            if (existing.length > 0) {
                // Güncelle
                await connection.execute(
                    `UPDATE randevu_calisma_programi SET kapali = ?, baslangic_saati = ?, bitis_saati = ?, 
                    slot_dakika = ?, max_randevu = ?, buffer_dk = ? WHERE firma_id = ? AND gun = ?`,
                    [kapali, baslangic_saati, bitis_saati, slot_dakika, max_randevu, buffer_dk, req.user.id, gun]
                );
            } else {
                // Yeni ekle
                await connection.execute(
                    `INSERT INTO randevu_calisma_programi (firma_id, gun, kapali, baslangic_saati, bitis_saati, 
                    slot_dakika, max_randevu, buffer_dk) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
                    [req.user.id, gun, kapali, baslangic_saati, bitis_saati, slot_dakika, max_randevu, buffer_dk]
                );
            }
        }

        connection.release();

        res.status(200).json({
            success: true,
            message: 'Çalışma programı başarıyla güncellendi'
        });
    } catch (error) {
        console.error('Çalışma programı güncelleme hatası:', error);
        res.status(500).json({
            success: false,
            message: 'Güncelleme sırasında hata oluştu: ' + error.message
        });
    }
});

// Kuaför randevularını getir
router.get('/appointments', verifyToken, async (req, res) => {
    try {
        const connection = await pool.getConnection();
        const [randevular] = await connection.execute(
            `SELECT r.id, DATE_FORMAT(r.tarih, '%Y-%m-%d') as tarih, r.saat, r.durum, r.notlar,
                    m.musteri_adi, m.musteri_tel as musteri_telefon,
                    h.hizmetAdi, h.fiyat, h.sureDakika
             FROM randevular r
             LEFT JOIN musteri m ON r.musteri_id = m.id
             LEFT JOIN hizmetler h ON r.hizmet_id = h.id
             WHERE r.firma_id = ?
             ORDER BY r.tarih DESC, r.saat DESC`,
            [req.user.id]
        );

        connection.release();

        res.status(200).json({
            success: true,
            randevular: randevular || []
        });
    } catch (error) {
        console.error('Randevu listesi getirme hatası:', error);
        res.status(500).json({
            success: false,
            message: 'Randevular alınırken hata oluştu: ' + error.message
        });
    }
});

// Kuaför görsellerini listele
router.get('/gorseller', verifyToken, async (req, res) => {
    try {
        const connection = await pool.getConnection();
        const [gorseller] = await connection.execute(
            'SELECT id, dosya_yolu, sira, COALESCE(ana_kart, 0) as ana_kart FROM firma_gorselleri WHERE firma_id = ? ORDER BY sira ASC',
            [req.user.id]
        );
        connection.release();
        res.status(200).json({ success: true, gorseller: gorseller || [] });
    } catch (error) {
        console.error('Görsel listesi hatası:', error);
        res.status(500).json({ success: false, message: 'Görseller alınamadı' });
    }
});

// Ana kart görseli seç (bu görsel anasayfadaki kartta gösterilir)
router.put('/gorsel/:id/ana-kart', verifyToken, async (req, res) => {
    try {
        const { id } = req.params;
        const connection = await pool.getConnection();
        await connection.execute(
            'UPDATE firma_gorselleri SET ana_kart = 0 WHERE firma_id = ?',
            [req.user.id]
        );
        const [result] = await connection.execute(
            'UPDATE firma_gorselleri SET ana_kart = 1 WHERE id = ? AND firma_id = ?',
            [id, req.user.id]
        );
        connection.release();
        if (result.affectedRows === 0) {
            return res.status(404).json({ success: false, message: 'Görsel bulunamadı' });
        }
        res.status(200).json({ success: true, message: 'Kart görseli güncellendi' });
    } catch (error) {
        console.error('Ana kart güncelleme hatası:', error);
        res.status(500).json({ success: false, message: 'Güncelleme başarısız' });
    }
});

// Kuaför görsel yükle (dosya ile)
router.post('/gorsel/upload', verifyToken, (req, res) => {
    upload.single('gorsel')(req, res, async (err) => {
        if (err) {
            const msg = err.message || 'Dosya yüklenemedi';
            return res.status(400).json({ success: false, message: msg });
        }
        if (!req.file || !req.file.path) {
            return res.status(400).json({ success: false, message: 'Lütfen bir görsel seçiniz' });
        }
        try {
            const dosyaYolu = '/uploads/firma_gorselleri/' + req.user.id + '/' + req.file.filename;
            const connection = await pool.getConnection();
            const [maxSira] = await connection.execute(
                'SELECT COALESCE(MAX(sira), -1) + 1 as next_sira FROM firma_gorselleri WHERE firma_id = ?',
                [req.user.id]
            );
            const sira = (maxSira && maxSira[0] && maxSira[0].next_sira != null) ? maxSira[0].next_sira : 0;
            await connection.execute(
                'INSERT INTO firma_gorselleri (firma_id, dosya_yolu, sira) VALUES (?, ?, ?)',
                [req.user.id, dosyaYolu, sira]
            );
            connection.release();
            res.status(201).json({ success: true, message: 'Görsel yüklendi' });
        } catch (error) {
            fs.unlink(req.file.path, () => {});
            console.error('Görsel kaydetme hatası:', error);
            res.status(500).json({ success: false, message: 'Görsel kaydedilemedi' });
        }
    });
});

// Kuaför görsel ekle (URL ile)
router.post('/gorsel', verifyToken, async (req, res) => {
    try {
        const { dosya_yolu } = req.body;
        if (!dosya_yolu || typeof dosya_yolu !== 'string') {
            return res.status(400).json({ success: false, message: 'Geçerli bir URL giriniz' });
        }
        const url = dosya_yolu.trim();
        if (!url.startsWith('http://') && !url.startsWith('https://')) {
            return res.status(400).json({ success: false, message: 'Geçerli bir URL giriniz (http veya https ile başlamalı)' });
        }
        const connection = await pool.getConnection();
        const [maxSira] = await connection.execute(
            'SELECT COALESCE(MAX(sira), -1) + 1 as next_sira FROM firma_gorselleri WHERE firma_id = ?',
            [req.user.id]
        );
        const sira = (maxSira && maxSira[0] && maxSira[0].next_sira != null) ? maxSira[0].next_sira : 0;
        await connection.execute(
            'INSERT INTO firma_gorselleri (firma_id, dosya_yolu, sira) VALUES (?, ?, ?)',
            [req.user.id, url, sira]
        );
        connection.release();
        res.status(201).json({ success: true, message: 'Görsel eklendi' });
    } catch (error) {
        console.error('Görsel ekleme hatası:', error);
        res.status(500).json({ success: false, message: 'Görsel eklenemedi: ' + (error.message || '') });
    }
});

// Kuaför görsel sil
router.delete('/gorsel/:id', verifyToken, async (req, res) => {
    try {
        const { id } = req.params;
        const connection = await pool.getConnection();
        const [rows] = await connection.execute(
            'SELECT dosya_yolu FROM firma_gorselleri WHERE id = ? AND firma_id = ?',
            [id, req.user.id]
        );
        if (rows.length === 0) {
            connection.release();
            return res.status(404).json({ success: false, message: 'Görsel bulunamadı' });
        }
        const dosyaYolu = rows[0].dosya_yolu || '';
        await connection.execute(
            'DELETE FROM firma_gorselleri WHERE id = ? AND firma_id = ?',
            [id, req.user.id]
        );
        connection.release();
        if (dosyaYolu.startsWith('/uploads/')) {
            const filePath = path.join(__dirname, '..', dosyaYolu);
            if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
        }
        res.status(200).json({ success: true, message: 'Görsel silindi' });
    } catch (error) {
        console.error('Görsel silme hatası:', error);
        res.status(500).json({ success: false, message: 'Görsel silinemedi' });
    }
});

module.exports = router;
