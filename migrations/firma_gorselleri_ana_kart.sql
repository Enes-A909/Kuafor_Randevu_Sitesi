-- Kart görseli seçimi için ana_kart kolonu
ALTER TABLE `firma_gorselleri` 
ADD COLUMN `ana_kart` TINYINT(1) NOT NULL DEFAULT 0 
COMMENT '1 = Anasayfa kartında göster' 
AFTER `sira`;
