-- Kuaför görselleri tablosu
CREATE TABLE IF NOT EXISTS `firma_gorselleri` (
  `id` int NOT NULL AUTO_INCREMENT,
  `firma_id` int NOT NULL,
  `dosya_yolu` varchar(500) NOT NULL COMMENT 'Sunucudaki dosya yolu veya URL',
  `sira` int NOT NULL DEFAULT 0 COMMENT 'Slider sıralaması (0=ilk)',
  `olusturma_zamani` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `firma_id` (`firma_id`),
  CONSTRAINT `firma_gorselleri_ibfk_1` FOREIGN KEY (`firma_id`) REFERENCES `firmalar` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
