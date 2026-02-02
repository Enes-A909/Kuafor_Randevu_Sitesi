# Berber Randevu Sistemi - Backend Kurulumu

## Proje Yapısı

```
Berber Randevu Sistemi/
├── server.js                    # Express sunucusu
├── db.js                        # MySQL bağlantı havuzu
├── package.json                 # NPM bağımlılıkları
├── .env                         # Ortam değişkenleri
├── veritabani-yapisi.sql       # SQL veritabanı kurulumu
├── routes/
│   ├── iller.js                # İller API endpoint'leri
│   ├── ilceler.js              # İlçeler API endpoint'leri
│   └── kuaforler.js            # Kuaförler API endpoint'leri
├── index.html                  # Anasayfa (güncellenmiş)
├── login-customer.html
├── login-barber.html
├── register-customer.html
└── register-barber.html
```

## Kurulum Adımları

### 1. MySQL Veritabanını Oluştur

MySQL'de `veritabani-yapisi.sql` dosyasındaki kodları çalıştırın:

```bash
mysql -u root -p < veritabani-yapisi.sql
```

Veya MySQL Workbench / phpMyAdmin aracılığıyla dosyayı içe aktarın.

### 2. Node.js Paketlerini Yükle

```bash
npm install
```

### 3. Ortam Değişkenleri (.env)

Projede hassas bilgiler `.env` ile yönetilir. Repoya hassas bilgilerin eklenmemesi için **`.env.example`** şablonunu kullanın: bu dosyayı kopyalayıp yerel olarak `.env` veya `.env.local` olarak kaydedin (ve kesinlikle commit etmeyin).

Örnek `.env`:

```env
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=your_db_password
DB_NAME=berber_randevu
NODE_ENV=development
PORT=3000
JWT_SECRET=your_jwt_secret
```

Notlar:
- `.env` dosyasını repoya commit etmeyin. Bunun yerine **`.env.example`** repoda şablon olarak tutulur.
- `reset.js` artık açık metin şifre içermez; yeni şifreyi `NEW_PASSWORD` env değişkeni veya komut satırı argümanı ile verin:
  ```bash
  NEW_PASSWORD=myNewPass node reset.js
  ```
- Üretim ortamları için güçlü, rastgele bir `JWT_SECRET` kullanın ve bu değeri güvenli şekilde saklayın.

### 4. Sunucuyu Başlat

Geliştirme modu (nodemon ile):
```bash
npm run dev
```

Üretim modu:
```bash
npm start
```

Sunucu çalışmaya başladıktan sonra: `http://localhost:3000`

## API Endpoint'leri

### İller
- **GET** `/api/iller` - Tüm illeri listele

Örnek Response:
```json
[
  {"id": 1, "il_adi": "İstanbul"},
  {"id": 2, "il_adi": "Ankara"}
]
```

### İlçeler
- **GET** `/api/ilceler/:il_id` - Belirli ile ait ilçeleri listele

Örnek Response:
```json
[
  {"id": 1, "ilce_adi": "Kadıköy"},
  {"id": 2, "ilce_adi": "Beşiktaş"}
]
```

### Kuaförler
- **GET** `/api/kuaforler` - Tüm kuaförleri listele
- **GET** `/api/kuaforler?il_id=1` - İlçe filtresi
- **GET** `/api/kuaforler?ilce_id=2` - İlçe filtresi
- **GET** `/api/kuaforler?hizmet=Boya` - Hizmet filtresi
- **GET** `/api/kuaforler/:id` - Belirli kuaförün detaylarını getir

Örnek Response:
```json
[
  {
    "id": 1,
    "isletme_adi": "Elite Hair Studio",
    "telefon": "0212-5551234",
    "email": "info@elitehairstudio.com",
    "adres": "Beşiktaş, İstanbul",
    "il_id": 1,
    "ilce_id": 2,
    "il_adi": "İstanbul",
    "ilce_adi": "Beşiktaş",
    "rating": 4.9,
    "hizmetler": "Boya,Bakım,Saç Kesimi",
    "en_yakin_randevu": "Yarın 11:00",
    "calisma_saatleri": "09:00 - 19:00",
    "aciklama": "Profesyonel kuaför ekibi ile hizmet sunuyoruz"
  }
]
```

## Veritabanı Tablolarının Yapısı

### iller Tablosu
```
id (INT) - PK
il_adi (VARCHAR) - Şehir adı
created_at (TIMESTAMP)
```

### ilceler Tablosu
```
id (INT) - PK
il_id (INT) - FK
ilce_adi (VARCHAR)
created_at (TIMESTAMP)
```

### kuafor_listesi Tablosu
```
id (INT) - PK
isletme_adi (VARCHAR) - Kuaför/berber adı
telefon (VARCHAR)
email (VARCHAR)
adres (TEXT)
il_id (INT) - FK
ilce_id (INT) - FK
rating (DECIMAL) - 1-5 arası puanlama
hizmetler (TEXT) - Virgülle ayrılmış hizmetler
en_yakin_randevu (VARCHAR) - "Yarın 11:00" formatında
calisma_saatleri (VARCHAR)
aciklama (TEXT)
created_at (TIMESTAMP)
updated_at (TIMESTAMP)
```

## Frontend İşlevleri

### index.html
- İl ve ilçe seçimi: `illerinYukle()` ve `ilceleriYukle()` fonksiyonları
- Kuaförler listesini getirme: `kuaforleriGoster()` fonksiyonu
- Dinamik kart oluşturma: `kuaforKartiOlustur()` fonksiyonu
- Hizmet filtresi, il-ilçe filtresi, responsive tasarım

### Kart Özellikleri
- Kuaför adı
- Yıldız puanlaması
- Konum (il, ilçe)
- En yakın randevu saati
- Sunulan hizmetler (badge olarak)
- "Detay" ve "Hızlı Randevu" butonları

## Hata Çözümleri

### "Cannot find module 'express'" 
```bash
npm install
```

### "Access denied for user 'root'@'localhost'"
`.env` dosyasında MySQL şifrenizi kontrol edin.

### "Unknown database 'berber_randevu'"
`veritabani-yapisi.sql` dosyasını MySQL'de çalıştırdığınızdan emin olun.

### CORS Hatası
CORS middleware sunucu.js'de zaten etkindir:
```javascript
app.use(cors());
```

## Geliştirme Notları

- Frontend ve Backend aynı portta çalışıyor: `http://localhost:3000`
- Tüm API çağrıları `http://localhost:3000/api/` üzerinden yapılıyor
- MySQL connection pool kullanılıyor (max 10 bağlantı)
- Hata yönetimi her endpoint'te implementasyonu yapılmıştır
