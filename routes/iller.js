const express = require('express');
const router = express.Router();
const pool = require('../db');

// Tüm illeri getir
router.get('/', async (req, res) => {
  try {
    const connection = await pool.getConnection();
    const [rows] = await connection.query('SELECT id, sehirAdi FROM iller ORDER BY sehirAdi');
    connection.release();

    res.json(rows);
  } catch (error) {
    console.error('Hata:', error);
    res.status(500).json({ error: 'İller getirilemedi' });
  }
});

module.exports = router;
