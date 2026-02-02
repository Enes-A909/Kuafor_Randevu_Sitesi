const express = require('express');
const router = express.Router();
const pool = require('../db');

// Tüm kuaförleri getir (kategori_id = 1)
router.get('/', async (req, res) => {
  try {
    const { il_id, ilce_id } = req.query;

    let query = `
      SELECT 
        f.id,
        f.firmaAdi,
        f.ilce_id,
        ilc.ilceAdi,
        i.sehirAdi,
        f.mahalle,
        f.cadde,
        f.sokak,
        f.bina_no,
        f.daire_no,
        kd.erkek_kabul,
        kd.kadın_kabul,
        kd.cocuk_kabul,
        kd.calisan_sayisi,
        (SELECT g.dosya_yolu FROM firma_gorselleri g 
         WHERE g.firma_id = f.id 
         ORDER BY COALESCE(g.ana_kart, 0) DESC, g.sira ASC 
         LIMIT 1) as gorsel_url
      FROM firmalar f
      JOIN ilceler ilc ON f.ilce_id = ilc.id
      JOIN iller i ON ilc.il_id = i.id
      LEFT JOIN kuafor_detay kd ON f.id = kd.firma_id
      WHERE f.kategori_id = 1
    `;

    const params = [];

    if (il_id) {
      query += ' AND i.id = ?';
      params.push(il_id);
    }

    if (ilce_id) {
      query += ' AND f.ilce_id = ?';
      params.push(ilce_id);
    }

    query += ' ORDER BY f.firmaAdi ASC';

    const connection = await pool.getConnection();
    const [rows] = await connection.query(query, params);
    connection.release();

    res.json(rows);
  } catch (error) {
    console.error('Hata:', error);
    res.status(500).json({ error: 'Firmalar getirilemedi' });
  }
});

// Belirli bir firmanın detaylarını getir
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const connection = await pool.getConnection();
    const [rows] = await connection.query(
      `SELECT 
        f.id,
        f.firmaAdi,
        f.ilce_id,
        f.mahalle,
        f.cadde,
        f.sokak,
        f.bina_no,
        f.daire_no,
        ilc.ilceAdi,
        i.sehirAdi,
        kd.erkek_kabul,
        kd.kadın_kabul,
        kd.cocuk_kabul,
        kd.calisan_sayisi,
        (SELECT g.dosya_yolu FROM firma_gorselleri g 
         WHERE g.firma_id = f.id 
         ORDER BY COALESCE(g.ana_kart, 0) DESC, g.sira ASC 
         LIMIT 1) as gorsel_url
      FROM firmalar f
      JOIN ilceler ilc ON f.ilce_id = ilc.id
      JOIN iller i ON ilc.il_id = i.id
      LEFT JOIN kuafor_detay kd ON f.id = kd.firma_id
      WHERE f.id = ? AND f.kategori_id = 1`,
      [id]
    );

    if (rows.length === 0) {
      connection.release();
      return res.status(404).json({ error: 'Firma bulunamadı' });
    }

    const firma = rows[0];
    try {
      const [gorseller] = await connection.execute(
        'SELECT id, dosya_yolu, sira FROM firma_gorselleri WHERE firma_id = ? ORDER BY sira ASC',
        [id]
      );
      firma.gorseller = (gorseller || []).map(g => g.dosya_yolu);
    } catch (e) {
      firma.gorseller = [];
    }
    connection.release();

    res.json(firma);
  } catch (error) {
    console.error('Hata:', error);
    res.status(500).json({ error: 'Firma detayı getirilemedi' });
  }
});

// Belirli bir firmanın hizmetlerini getir
router.get('/:id/hizmetler', async (req, res) => {
  try {
    const { id } = req.params;

    const connection = await pool.getConnection();
    const [rows] = await connection.query(
      `SELECT h.id, h.hizmetAdi, h.fiyat, h.sureDakika, h.aciklama
       FROM hizmetler h
       INNER JOIN firma_hizmetleri fh ON h.id = fh.hizmet_id
       WHERE fh.firma_id = ? AND h.kategori_id = 1`,
      [id]
    );
    connection.release();

    res.json(rows);
  } catch (error) {
    console.error('Hata:', error);
    res.status(500).json({ error: 'Hizmetler getirilemedi' });
  }
});

// Belirli bir firmanın çalışma programını getir
router.get('/:id/calisma-programi', async (req, res) => {
  try {
    const { id } = req.params;

    const connection = await pool.getConnection();
    const [rows] = await connection.query(
      `SELECT id, gun, baslangic_saati, bitis_saati, slot_dakika, max_randevu, buffer_dk, kapali, aciklama
       FROM randevu_calisma_programi
       WHERE firma_id = ?
       ORDER BY gun ASC`,
      [id]
    );
    connection.release();

    res.json(rows);
  } catch (error) {
    console.error('Hata:', error);
    res.status(500).json({ error: 'Çalışma programı getirilemedi' });
  }
});

module.exports = router;
