const express = require('express');
const jwt = require('jsonwebtoken');
const pool = require('../db');

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-2024';

// Token doğrulama middleware
const verifyToken = (req, res, next) => {
    const token = req.headers.authorization?.split(' ')[1];

    if (!token) {
        return res.status(401).json({
            success: false,
            message: 'Token bulunamadı'
        });
    }

    try {
        const decoded = jwt.verify(token, JWT_SECRET);
        req.user = decoded;
        next();
    } catch (error) {
        res.status(401).json({
            success: false,
            message: 'Token geçersiz'
        });
    }
};

// Randevu Oluştur
router.post('/olustur', verifyToken, async (req, res) => {
    try {
        const { firma_id, musteri_id, hizmet_id, tarih, saat, notlar } = req.body;

        // Validasyon
        if (!firma_id || !musteri_id || !hizmet_id || !tarih || !saat) {
            return res.status(400).json({
                success: false,
                message: 'Zorunlu alanlar eksik'
            });
        }

        // Tarih ve saat formatı kontrol et
        const randevuTarihi = new Date(tarih);
        if (isNaN(randevuTarihi.getTime())) {
            return res.status(400).json({
                success: false,
                message: 'Geçersiz tarih formatı'
            });
        }

        // Geçmiş tarihe randevu oluşturamasını engelle
        const bugun = new Date();
        bugun.setHours(0, 0, 0, 0);
        if (randevuTarihi < bugun) {
            return res.status(400).json({
                success: false,
                message: 'Geçmiş tarihe randevu oluşturamazsınız'
            });
        }

        const connection = await pool.getConnection();

        // Aynı saatte randevu var mı kontrol et
        const [existingAppointments] = await connection.execute(
            `SELECT id FROM randevular 
             WHERE firma_id = ? AND tarih = ? AND saat = ? AND durum != 'İptal'`,
            [firma_id, tarih, saat]
        );

        if (existingAppointments.length > 0) {
            connection.release();
            return res.status(409).json({
                success: false,
                message: 'Bu saatte randevu zaten alınmış, lütfen başka bir saat seçiniz'
            });
        }

        // Randevu oluştur
        const [result] = await connection.execute(
            `INSERT INTO randevular (firma_id, musteri_id, hizmet_id, tarih, saat, notlar, durum, olusturma_zamani)
             VALUES (?, ?, ?, ?, ?, ?, 'Beklemede', NOW())`,
            [firma_id, musteri_id, hizmet_id, tarih, saat, notlar || '']
        );

        connection.release();

        res.status(201).json({
            success: true,
            message: 'Randevu başarıyla oluşturuldu',
            randevuId: result.insertId
        });
    } catch (error) {
        console.error('Randevu oluşturma hatası:', error);
        res.status(500).json({
            success: false,
            message: 'Randevu oluşturulurken hata oluştu: ' + error.message
        });
    }
});

// Müşteri Randevularını Getir
router.get('/list', verifyToken, async (req, res) => {
    try {
        if (!req.user || !req.user.id) {
            return res.status(401).json({
                success: false,
                message: 'Kullanıcı bilgisi bulunamadı'
            });
        }

        const connection = await pool.getConnection();

        const [randevular] = await connection.execute(
            `SELECT r.id, DATE_FORMAT(r.tarih, '%Y-%m-%d') as tarih, r.saat, r.durum, r.notlar,
                    f.firmaAdi, f.cadde, f.sokak,
                    h.hizmetAdi, h.fiyat, h.sureDakika
             FROM randevular r
             JOIN firmalar f ON r.firma_id = f.id
             LEFT JOIN hizmetler h ON r.hizmet_id = h.id
             WHERE r.musteri_id = ?
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

// Müsait randevu saatlerini getir (dolu slotlar hariç)
router.get('/musait-saatler', async (req, res) => {
    try {
        const { firma_id, tarih } = req.query;

        if (!firma_id || !tarih) {
            return res.status(400).json({
                success: false,
                message: 'firma_id ve tarih zorunludur'
            });
        }

        const tarihStr = String(tarih).substring(0, 10);
        const parts = tarihStr.split('-').map(Number);
        if (parts.length !== 3 || isNaN(parts[0]) || isNaN(parts[1]) || isNaN(parts[2])) {
            return res.status(400).json({
                success: false,
                message: 'Geçersiz tarih formatı (YYYY-MM-DD olmalı)'
            });
        }
        const randevuTarihi = new Date(parts[0], parts[1] - 1, parts[2]);
        const bugun = new Date();
        const gun = randevuTarihi.getDay(); // 0=Pazar, 6=Cumartesi
        const isToday = getDateKey(randevuTarihi) === getDateKey(bugun);

        const connection = await pool.getConnection();

        const [program] = await connection.execute(
            `SELECT baslangic_saati, bitis_saati, slot_dakika, buffer_dk, kapali
             FROM randevu_calisma_programi
             WHERE firma_id = ? AND gun = ?`,
            [firma_id, gun]
        );

        if (program.length === 0 || program[0].kapali) {
            connection.release();
            return res.status(200).json({
                success: true,
                musaitSaatler: []
            });
        }

        const baslangic = program[0].baslangic_saati;
        const bitis = program[0].bitis_saati;
        const slotDakika = program[0].slot_dakika || 30;
        const bufferDk = program[0].buffer_dk || 0;

        const [doluRandevular] = await connection.execute(
            `SELECT TIME_FORMAT(saat, '%H:%i') as saat
             FROM randevular
             WHERE firma_id = ? AND tarih = ? AND durum != 'İptal' AND durum != 'iptal'`,
            [firma_id, tarihStr]
        );
        connection.release();

        // Dolu randevular: her biri [randevu_saati, randevu_saati + slot_dakika + buffer_dk) aralığını bloklar
        const doluBloklar = (doluRandevular || []).map(r => {
            const s = String(r.saat || '');
            const [h, m] = (s.length >= 5 ? s.substring(0, 5) : s).split(':').map(Number);
            const bas = (h || 0) * 60 + (m || 0);
            return { bas, bitis: bas + slotDakika + bufferDk };
        });

        // Öğle arası: 13:00 - 14:00 arası randevu yok
        const ogleBaslangic = 13 * 60;      // 13:00 = 780 dakika
        const ogleBitis = 14 * 60;          // 14:00 = 840 dakika

        const slotlar = [];
        const [bH, bM] = String(baslangic).split(':').map(Number);
        const [eH, eM] = String(bitis).split(':').map(Number);
        let dakika = (bH || 0) * 60 + (bM || 0);
        const bitisDakika = (eH || 0) * 60 + (eM || 0);

        while (dakika + slotDakika <= bitisDakika) {
            const h = Math.floor(dakika / 60);
            const m = dakika % 60;
            const saatStr = String(h).padStart(2, '0') + ':' + String(m).padStart(2, '0');

            const ogleArasinda = dakika >= ogleBaslangic && dakika < ogleBitis;
            const bloklu = doluBloklar.some(b => dakika >= b.bas && dakika < b.bitis);

            if (!ogleArasinda && !bloklu) {
                if (isToday) {
                    const slotZaman = new Date(bugun);
                    slotZaman.setHours(h, m, 0, 0);
                    if (slotZaman > bugun) {
                        slotlar.push(saatStr);
                    }
                } else {
                    slotlar.push(saatStr);
                }
            }
            dakika += slotDakika;
        }

        res.status(200).json({
            success: true,
            musaitSaatler: slotlar
        });
    } catch (error) {
        console.error('Müsait saatler hatası:', error);
        res.status(500).json({
            success: false,
            message: 'Müsait saatler alınırken hata oluştu: ' + error.message
        });
    }
});

function getDateKey(d) {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
}

// Belirli Ay İçin Randevu Tarihlerini Getir (Takvim için)
router.get('/aylik/:firma_id/:yil/:ay', async (req, res) => {
    try {
        const { firma_id, yil, ay } = req.params;

        const connection = await pool.getConnection();

        const [randevular] = await connection.execute(
            `SELECT DATE(tarih) as tarih, COUNT(*) as count
             FROM randevular 
             WHERE firma_id = ? AND YEAR(tarih) = ? AND MONTH(tarih) = ? AND durum != 'İptal'
             GROUP BY DATE(tarih)`,
            [firma_id, yil, ay]
        );

        connection.release();

        res.status(200).json({
            success: true,
            randevuTarihleri: randevular.map(r => r.tarih)
        });
    } catch (error) {
        console.error('Aylık randevu getirme hatası:', error);
        res.status(500).json({
            success: false,
            message: 'Aylık randevular alınırken hata oluştu: ' + error.message
        });
    }
});

// Randevu İptal Et
router.put('/iptal/:id', verifyToken, async (req, res) => {
    try {
        const { id } = req.params;
        const connection = await pool.getConnection();

        // Randevunun müşteri tarafından yapıldığını kontrol et
        const [randevular] = await connection.execute(
            'SELECT id FROM randevular WHERE id = ? AND musteri_id = ?',
            [id, req.user.id]
        );

        if (randevular.length === 0) {
            connection.release();
            return res.status(404).json({
                success: false,
                message: 'Randevu bulunamadı'
            });
        }

        // Randevuyu iptal et
        await connection.execute(
            'UPDATE randevular SET durum = ? WHERE id = ?',
            ['İptal', id]
        );

        connection.release();

        res.status(200).json({
            success: true,
            message: 'Randevu başarıyla iptal edildi'
        });
    } catch (error) {
        console.error('Randevu iptal hatası:', error);
        res.status(500).json({
            success: false,
            message: 'Randevu iptal edilirken hata oluştu: ' + error.message
        });
    }
});

module.exports = router;
