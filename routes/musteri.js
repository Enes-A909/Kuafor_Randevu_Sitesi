const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const pool = require('../db');

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-2024';

// Müşteri Kayıt (Register)
router.post('/register', async (req, res) => {
    try {
        const { isim, email, password, telefon } = req.body;

        // Validasyon
        if (!isim || !email || !password || !telefon) {
            return res.status(400).json({
                message: 'Ad soyad, e-posta, telefon ve şifre alanları zorunludur'
            });
        }

        // Email kontrolü
        const connection = await pool.getConnection();
        const [existingUser] = await connection.execute(
            'SELECT id FROM musteri WHERE musteri_email = ?',
            [email]
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
            'INSERT INTO musteri (musteri_adi, musteri_tel, musteri_email, sifre) VALUES (?, ?, ?, ?)',
            [isim, telefon, email, hashedPassword]
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

// Müşteri Giriş (Login)
router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;

        // Validasyon
        if (!email || !password) {
            return res.status(400).json({
                message: 'E-posta ve şifre zorunludur'
            });
        }

        // Kullanıcı bul
        const connection = await pool.getConnection();
        const [users] = await connection.execute(
            'SELECT id, musteri_adi, musteri_email, sifre FROM musteri WHERE musteri_email = ?',
            [email]
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
            { id: user.id, email: user.musteri_email, name: user.musteri_adi },
            JWT_SECRET,
            { expiresIn: '7d' }
        );

        res.status(200).json({
            message: 'Giriş başarılı',
            token: token,
            user: {
                id: user.id,
                name: user.musteri_adi,
                email: user.musteri_email
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
router.get('/verify', (req, res) => {
    try {
        const token = req.headers.authorization?.split(' ')[1];

        if (!token) {
            return res.status(401).json({
                success: false,
                message: 'Token bulunamadı'
            });
        }

        const decoded = jwt.verify(token, JWT_SECRET);

        res.status(200).json({
            success: true,
            user: decoded
        });
    } catch (error) {
        res.status(401).json({
            success: false,
            message: 'Token geçersiz'
        });
    }
});

// Profil Bilgisi Getir
router.get('/profil', async (req, res) => {
    try {
        const token = req.headers.authorization?.split(' ')[1];

        if (!token) {
            return res.status(401).json({
                success: false,
                message: 'Token bulunamadı'
            });
        }

        const decoded = jwt.verify(token, JWT_SECRET);
        const connection = await pool.getConnection();

        const [users] = await connection.execute(
            'SELECT id, musteri_adi, musteri_email, musteri_tel FROM musteri WHERE id = ?',
            [decoded.id]
        );

        connection.release();

        if (users.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Kullanıcı bulunamadı'
            });
        }

        res.status(200).json({
            success: true,
            user: users[0]
        });
    } catch (error) {
        res.status(401).json({
            success: false,
            message: 'Token geçersiz'
        });
    }
});

// Profil Bilgisi Güncelle
router.put('/profil', async (req, res) => {
    try {
        const token = req.headers.authorization?.split(' ')[1];

        if (!token) {
            return res.status(401).json({
                success: false,
                message: 'Token bulunamadı'
            });
        }

        const decoded = jwt.verify(token, JWT_SECRET);
        const { musteri_adi, musteri_tel } = req.body;

        if (!musteri_adi || !musteri_tel) {
            return res.status(400).json({
                success: false,
                message: 'Ad soyad ve telefon alanları zorunludur'
            });
        }

        const connection = await pool.getConnection();

        await connection.execute(
            'UPDATE musteri SET musteri_adi = ?, musteri_tel = ? WHERE id = ?',
            [musteri_adi, musteri_tel, decoded.id]
        );

        connection.release();

        res.status(200).json({
            success: true,
            message: 'Profil bilgileri başarıyla güncellendi'
        });
    } catch (error) {
        console.error('Profil güncelleme hatası:', error);
        res.status(500).json({
            success: false,
            message: 'Profil güncellenirken hata oluştu: ' + error.message
        });
    }
});

// Müşteri Randevularını Getir
router.get('/randevularim', async (req, res) => {
    try {
        const token = req.headers.authorization?.split(' ')[1];

        if (!token) {
            return res.status(401).json({
                success: false,
                message: 'Token bulunamadı'
            });
        }

        const decoded = jwt.verify(token, JWT_SECRET);
        const connection = await pool.getConnection();

        const [randevular] = await connection.execute(
            `SELECT r.id, r.tarih, r.saat, r.durum, r.notlar,
              f.firmaAdi, f.cadde, f.sokak,
              h.hizmetAdi, h.fiyat, h.sureDakika
       FROM randevular r
       JOIN firmalar f ON r.firma_id = f.id
       LEFT JOIN hizmetler h ON r.hizmet_id = h.id
       WHERE r.musteri_id = ?
       ORDER BY r.tarih DESC, r.saat DESC`,
            [decoded.id]
        );

        connection.release();

        res.status(200).json({
            success: true,
            randevular: randevular
        });
    } catch (error) {
        console.error('Randevu getirme hatası:', error);
        res.status(401).json({
            success: false,
            message: 'Token geçersiz'
        });
    }
});

module.exports = router;
