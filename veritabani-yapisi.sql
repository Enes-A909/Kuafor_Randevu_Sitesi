-- Veritabanı Oluştur
CREATE DATABASE IF NOT EXISTS `randesnaf_projesi`;
USE `randesnaf_projesi`;

-- Kategoriler Tablosu
CREATE TABLE IF NOT EXISTS `kategoriler` (
  `id` int NOT NULL AUTO_INCREMENT,
  `kategoriAdi` varchar(100) NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- İller Tablosu
CREATE TABLE IF NOT EXISTS `iller` (
  `id` int NOT NULL AUTO_INCREMENT,
  `sehirAdi` varchar(50) DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- İlçeler Tablosu
CREATE TABLE IF NOT EXISTS `ilceler` (
  `id` int NOT NULL AUTO_INCREMENT,
  `il_id` int NOT NULL,
  `ilceAdi` varchar(100) NOT NULL,
  PRIMARY KEY (`id`),
  KEY `il_id` (`il_id`),
  CONSTRAINT `ilceler_ibfk_1` FOREIGN KEY (`il_id`) REFERENCES `iller` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=9 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Firmalar Tablosu
CREATE TABLE `firmalar` (
  `id` int NOT NULL AUTO_INCREMENT,
  `firmaAdi` varchar(255) NOT NULL,
  `firma_sahibi` varchar(100) DEFAULT NULL,
  `eposta` varchar(150) DEFAULT NULL,
  `sifre` varchar(255) DEFAULT NULL,
  `telefon` varchar(20) DEFAULT NULL,
  `ilce_id` int NOT NULL,
  `kategori_id` int NOT NULL,
  `mahalle` varchar(100) DEFAULT NULL,
  `cadde` varchar(100) DEFAULT NULL,
  `sokak` varchar(100) DEFAULT NULL,
  `bina_no` varchar(20) DEFAULT NULL,
  `daire_no` varchar(20) DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `ilce_id` (`ilce_id`),
  KEY `kategori_id` (`kategori_id`),
  CONSTRAINT `firmalar_ibfk_1` FOREIGN KEY (`ilce_id`) REFERENCES `ilceler` (`id`),
  CONSTRAINT `firmalar_ibfk_2` FOREIGN KEY (`kategori_id`) REFERENCES `kategoriler` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=31 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;


-- Hizmetler Tablosu
CREATE TABLE IF NOT EXISTS `hizmetler` (
  `id` int NOT NULL AUTO_INCREMENT,
  `kategori_id` int NOT NULL,
  `hizmetAdi` varchar(255) NOT NULL,
  `fiyat` decimal(10,2) NOT NULL,
  `sureDakika` int NOT NULL,
  `aciklama` text,
  PRIMARY KEY (`id`),
  KEY `kategori_id` (`kategori_id`),
  CONSTRAINT `hizmetler_ibfk_1` FOREIGN KEY (`kategori_id`) REFERENCES `kategoriler` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=6 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Firma Hizmetleri Tablosu
CREATE TABLE IF NOT EXISTS `firma_hizmetleri` (
  `firma_id` int NOT NULL,
  `hizmet_id` int NOT NULL,
  PRIMARY KEY (`firma_id`,`hizmet_id`),
  KEY `hizmet_id` (`hizmet_id`),
  CONSTRAINT `firma_hizmetleri_ibfk_1` FOREIGN KEY (`firma_id`) REFERENCES `firmalar` (`id`),
  CONSTRAINT `firma_hizmetleri_ibfk_2` FOREIGN KEY (`hizmet_id`) REFERENCES `hizmetler` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Kuaför Detay Tablosu
CREATE TABLE IF NOT EXISTS `kuafor_detay` (
  `firma_id` int NOT NULL,
  `erkek_kabul` tinyint(1) NOT NULL,
  `kadın_kabul` tinyint(1) NOT NULL,
  `cocuk_kabul` tinyint(1) NOT NULL,
  `calisan_sayisi` int NOT NULL,
  PRIMARY KEY (`firma_id`),
  CONSTRAINT `kuafor_detay_ibfk_1` FOREIGN KEY (`firma_id`) REFERENCES `firmalar` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Müşteri Tablosu
CREATE TABLE IF NOT EXISTS `musteri` (
  `id` int NOT NULL AUTO_INCREMENT,
  `musteri_adi` varchar(120) NOT NULL,
  `musteri_tel` varchar(20) NOT NULL,
  `musteri_email` varchar(150) DEFAULT NULL,
  `sifre` varchar(255) NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=1 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Randevu Çalışma Programı Tablosu
CREATE TABLE IF NOT EXISTS `randevu_calisma_programi` (
  `id` int NOT NULL AUTO_INCREMENT,
  `firma_id` int NOT NULL,
  `gun` tinyint NOT NULL COMMENT '0=Pazar, 6=Cumartesi',
  `baslangic_saati` time NOT NULL,
  `bitis_saati` time NOT NULL,
  `slot_dakika` int NOT NULL DEFAULT '30',
  `max_randevu` int NOT NULL DEFAULT '1',
  `buffer_dk` int NOT NULL DEFAULT '0',
  `kapali` tinyint(1) NOT NULL DEFAULT '0',
  `aciklama` varchar(255) DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `firma_id` (`firma_id`),
  CONSTRAINT `randevu_calisma_programi_ibfk_1` FOREIGN KEY (`firma_id`) REFERENCES `firmalar` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=43 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Randevular Tablosu
CREATE TABLE IF NOT EXISTS `randevular` (
  `id` int NOT NULL AUTO_INCREMENT,
  `firma_id` int NOT NULL,
  `hizmet_id` int DEFAULT NULL,
  `tarih` date NOT NULL,
  `saat` time NOT NULL,
  `durum` enum('beklemede','onaylandı','iptal') DEFAULT 'beklemede',
  `notlar` text,
  `olusturma_zamani` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `musteri_id` int NOT NULL,
  `kategori_id` int DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `firma_id` (`firma_id`),
  KEY `hizmet_id` (`hizmet_id`),
  KEY `fk_randevu_musteri` (`musteri_id`),
  KEY `fk_randevu_kategori` (`kategori_id`),
  CONSTRAINT `fk_randevu_kategori` FOREIGN KEY (`kategori_id`) REFERENCES `kategoriler` (`id`),
  CONSTRAINT `fk_randevu_musteri` FOREIGN KEY (`musteri_id`) REFERENCES `musteri` (`id`),
  CONSTRAINT `randevular_ibfk_1` FOREIGN KEY (`firma_id`) REFERENCES `firmalar` (`id`),
  CONSTRAINT `randevular_ibfk_2` FOREIGN KEY (`hizmet_id`) REFERENCES `hizmetler` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=1 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;



