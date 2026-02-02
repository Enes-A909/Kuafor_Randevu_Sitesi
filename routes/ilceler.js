const express = require('express');
const router = express.Router();
const pool = require('../db');

// Belirli ile ait ilçeleri getir
router.get('/:il_id', async (req, res) => {
  try {
    const { il_id } = req.params;

    const connection = await pool.getConnection();
    const [rows] = await connection.query(
      'SELECT id, ilceAdi FROM ilceler WHERE il_id = ? ORDER BY ilceAdi',
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
