# Kuaför Görselleri - Veritabanı Revizyonu

Bu doküman, kuaförlerin salon görselleri ekleyebilmesi için yapılması gereken veritabanı değişikliklerini açıklar.

---

## 1. Yeni Tablo: `firma_gorselleri`

Kuaförlerin birden fazla görsel yükleyebilmesi için ayrı bir tablo oluşturulmalıdır.

```sql
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
```

### Alan Açıklamaları

| Alan | Tip | Açıklama |
|------|-----|----------|
| `id` | int | Birincil anahtar |
| `firma_id` | int | Hangi firmaya ait (firmalar.id) |
| `dosya_yolu` | varchar(500) | Görselin sunucudaki yolu (örn: `/uploads/firma_1/abc123.jpg`) veya harici URL |
| `sira` | int | Slider'da gösterim sırası (küçük = önce) |
| `olusturma_zamani` | datetime | Kayıt tarihi |

---

## 2. Alternatif: `firmalar` Tablosuna Kolon Ekleme

Eğer her kuaförün **tek bir** ana görseli olacaksa, mevcut `firmalar` tablosuna kolon eklenebilir:

```sql
ALTER TABLE `firmalar` 
ADD COLUMN `gorsel_url` varchar(500) DEFAULT NULL 
COMMENT 'Ana salon görseli URL veya dosya yolu' 
AFTER `daire_no`;
```

**Not:** Bu yaklaşım tek görsel için uygundur. Birden fazla görsel (slider) için `firma_gorselleri` tablosu tercih edilmelidir.

---

## 3. Önerilen Yapı: `firma_gorselleri` Tablosu

Birden fazla görsel ve slider desteği için `firma_gorselleri` tablosu önerilir.

### Görsel Saklama Seçenekleri

#### Seçenek A: Dosya Sistemi (Önerilen)
- Görseller sunucuda `uploads/firma_gorselleri/{firma_id}/` klasörüne kaydedilir
- `dosya_yolu` alanına örn: `firma_gorselleri/5/1738234567_abc.jpg` yazılır
- API, statik dosyaları `/uploads/` altından servis eder

#### Seçenek B: Harici URL
- Kuaför harici bir URL girebilir (örn: imgur, cloudinary)
- `dosya_yolu` alanına tam URL yazılır: `https://example.com/image.jpg`

#### Seçenek C: Base64 (Önerilmez)
- Veritabanında base64 string saklamak performansı düşürür, önerilmez

---

## 4. API Entegrasyonu

### Kuaforler API Güncellemesi

`GET /api/kuaforler/:id` endpoint'inde firma detayı dönerken görseller de eklenmeli:

```sql
-- Firma detayı ile birlikte görseller
SELECT f.*, 
       (SELECT JSON_ARRAYAGG(JSON_OBJECT('id', g.id, 'dosya_yolu', g.dosya_yolu, 'sira', g.sira))
        FROM firma_gorselleri g WHERE g.firma_id = f.id ORDER BY g.sira ASC) as gorseller
FROM firmalar f
WHERE f.id = ? AND f.kategori_id = 1;
```

Veya ayrı sorgu:
```sql
SELECT id, dosya_yolu, sira FROM firma_gorselleri WHERE firma_id = ? ORDER BY sira ASC;
```

### Yeni Endpoint'ler (Kuaför Paneli için)

| Method | Endpoint | Açıklama |
|--------|----------|----------|
| GET | `/api/kuafor/gorseller` | Kuaförün tüm görsellerini listele |
| POST | `/api/kuafor/gorsel` | Yeni görsel yükle (multipart/form-data) |
| DELETE | `/api/kuafor/gorsel/:id` | Görsel sil |

---

## 5. Dosya Yükleme Klasör Yapısı

```
proje_klasoru/
├── uploads/
│   └── firma_gorselleri/
│       ├── 1/          (firma_id=1)
│       │   ├── 1738234567_abc.jpg
│       │   └── 1738234600_def.jpg
│       ├── 2/          (firma_id=2)
│       │   └── ...
```

---

## 6. Kart Görseli Seçimi (ana_kart)

Anasayfadaki kuaför kartında hangi fotoğrafın gösterileceğini seçmek için:

```sql
-- migrations/firma_gorselleri_ana_kart.sql
ALTER TABLE `firma_gorselleri` 
ADD COLUMN `ana_kart` TINYINT(1) NOT NULL DEFAULT 0 
COMMENT '1 = Anasayfa kartında göster' 
AFTER `sira`;
```

Kuaför panelinde "Kartta göster" ile işaretlenen görsel anasayfa kartında gösterilir. Hiçbiri seçilmemişse sıralamada ilk görsel kullanılır.

---

## 7. Uygulama Adımları Özeti

1. **Veritabanı:** `firma_gorselleri` tablosunu oluştur (`migrations/firma_gorselleri.sql`)
2. **Veritabanı:** `ana_kart` kolonunu ekle (`migrations/firma_gorselleri_ana_kart.sql`)
3. **Backend:** `multer` paketi ile dosya yükleme endpoint'i ekle
4. **Backend:** Görsel listeleme, silme ve ana kart seçimi endpoint'leri
5. **Backend:** `kuaforler` list/detay response'larına `gorsel_url` ve `gorseller` ekle
6. **Frontend:** Kuaför detay sayfasında slider, anasayfa kartında görsel gösterimi
7. **Frontend:** Kuaför panelinde "Fotoğraflar" sekmesi ve "Kartta göster" seçimi

---

## 8. Güvenlik Notları

- Yüklenen dosya türü kontrol edilmeli (sadece jpg, png, webp)
- Dosya boyutu limiti konulmalı (örn: max 5MB)
- Dosya adları benzersiz olmalı (timestamp + random string)
- `uploads/` klasörü `.gitignore`'a eklenmeli
