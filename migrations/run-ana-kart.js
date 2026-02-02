/**
 * ana_kart kolonunu firma_gorselleri tablosuna ekler (yoksa).
 * Sunucu başlangıcında otomatik çalıştırılır.
 */
const pool = require('../db');

async function runAnaKartMigration() {
    let connection;
    try {
        connection = await pool.getConnection();
        const [cols] = await connection.query(
            "SHOW COLUMNS FROM firma_gorselleri LIKE 'ana_kart'"
        );
        if (cols.length === 0) {
            await connection.query(`
                ALTER TABLE firma_gorselleri 
                ADD COLUMN ana_kart TINYINT(1) NOT NULL DEFAULT 0 
                COMMENT '1 = Anasayfa kartında göster' 
                AFTER sira
            `);
            console.log('Migration: firma_gorselleri.ana_kart kolonu eklendi.');
        }
    } catch (err) {
        console.warn('Migration uyarısı (ana_kart):', err.message);
    } finally {
        if (connection) connection.release();
    }
}

module.exports = runAnaKartMigration;
