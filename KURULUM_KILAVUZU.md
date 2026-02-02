/* ==============================================================
   BERBER RANDEVU SİSTEMİ - KURULUM KILAVUZU
============================================================== */

/*
┌─────────────────────────────────────────────────────────────┐
│ ADIM 1: MYSQL VERİTABANI KURULUMU                           │
└─────────────────────────────────────────────────────────────┘

1. MySQL'i açın veya MySQL Workbench / phpMyAdmin kullanın
2. veritabani-yapisi.sql dosyasındaki tüm kodları çalıştırın

Komut:
  mysql -u root -p < veritabani-yapisi.sql

Oluşturulacak Veritabanı: berber_randevu
Oluşturulacak Tablolar:
  - iller (Türkiye şehirleri)
  - ilceler (Her şehrin ilçeleri)
  - kuafor_listesi (Tüm kuaförler)
*/

/*
┌─────────────────────────────────────────────────────────────┐
│ ADIM 2: NODE.JS ORTAMINI HAZIRLA                            │
└─────────────────────────────────────────────────────────────┘

1. İçinde bulunduğunuz klasöre gidin (Berber Randevu Sistemi)
2. Terminal/Komut istemini açın
3. Aşağıdaki komutu çalıştırın:

  npm install

Bu komut package.json dosyasındaki tüm bağımlılıkları yükleyecek.
*/

/*
┌─────────────────────────────────────────────────────────────┐
│ ADIM 3: ORTAM DEĞİŞKENLERİ (.env)                           │
└─────────────────────────────────────────────────────────────┘

Projede hassas veriler `.env` içinde tutulur. Repoya hassas dosyaların eklenmemesi için **`.env.example`** dosyasını kullanın:

1. `.env.example` dosyasını kopyalayın:
   ```bash
   cp .env.example .env
   ```
2. `.env` içindeki değerleri kendi ortamınıza göre güncelleyin:
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

Güvenlik notları:
- `.env` dosyasını **her koşulda** repoya commit etmeyin.
- Yerelde tercih ediyorsanız `.env.local` adıyla saklayabilirsiniz (bu isim `.gitignore` tarafından göz ardı edilir).
- `reset.js` çalıştırmak için yeni şifreyi `NEW_PASSWORD` env değişkeni veya argüman ile verin:
  ```bash
  NEW_PASSWORD=myNewPass node reset.js
  ```
*/

/*
┌─────────────────────────────────────────────────────────────┐
│ ADIM 4: SUNUCUYU BAŞLAT                                     │
└─────────────────────────────────────────────────────────────┘

Geliştirme Modu (Otomatik yeniden başlama - nodemon ile):
  npm run dev

Üretim Modu:
  npm start

Çıktı:
  Server çalışıyor: http://localhost:3000

Tarayıcınızda şu adresi ziyaret edin:
  http://localhost:3000
*/

/*
┌─────────────────────────────────────────────────────────────┐
│ DOSYA YAPISI VE AÇIKLAMALAR                                 │
└─────────────────────────────────────────────────────────────┘

├── server.js                    Express uygulamasının ana dosyası
├── db.js                        MySQL bağlantı havuzu
├── package.json                 NPM bağımlılıkları ve scripts
├── .env                         Ortam değişkenleri (hassas bilgiler)
├── veritabani-yapisi.sql       Veritabanı ve örnek verileri
│
├── routes/
│   ├── iller.js                İller API endpoint'leri
│   ├── ilceler.js              İlçeler API endpoint'leri
│   └── kuaforler.js            Kuaförler API endpoint'leri
│
├── index.html                  Anasayfa
├── kuafor-detay.html          Kuaför detay sayfası
├── randevu-al.html            Randevu alma sayfası
├── login-customer.html         Müşteri giriş
├── login-barber.html           Kuaför giriş
├── register-customer.html      Müşteri kayıt
└── register-barber.html        Kuaför kayıt
*/

/*
┌─────────────────────────────────────────────────────────────┐
│ API ENDPOINT'LERİ VE ÖRNEKLERİ                              │
└─────────────────────────────────────────────────────────────┘

1. TÜM İLLERİ GETIR
   GET http://localhost:3000/api/iller
   
   Response:
   [
     {"id": 1, "il_adi": "İstanbul"},
     {"id": 2, "il_adi": "Ankara"}
   ]

─────────────────────────────────────────────────────────────

2. BELİRLİ İLE AİT İLÇELERİ GETIR
   GET http://localhost:3000/api/ilceler/1
   
   Response:
   [
     {"id": 1, "ilce_adi": "Kadıköy"},
     {"id": 2, "ilce_adi": "Beşiktaş"}
   ]

─────────────────────────────────────────────────────────────

3. KUAFÖRLERI GETIR (FİLTRELERLE)
   GET http://localhost:3000/api/kuaforler
   GET http://localhost:3000/api/kuaforler?il_id=1
   GET http://localhost:3000/api/kuaforler?ilce_id=2
   GET http://localhost:3000/api/kuaforler?hizmet=Boya
   GET http://localhost:3000/api/kuaforler?il_id=1&ilce_id=2&hizmet=Kesim
   
   Response:
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

─────────────────────────────────────────────────────────────

4. BELİRLİ KUAFÖRÜN DETAYLARINI GETIR
   GET http://localhost:3000/api/kuaforler/1
   
   Response:
   {
     "id": 1,
     "isletme_adi": "Elite Hair Studio",
     "telefon": "0212-5551234",
     "email": "info@elitehairstudio.com",
     "adres": "Beşiktaş, İstanbul",
     "rating": 4.9,
     "hizmetler": "Boya,Bakım,Saç Kesimi",
     "en_yakin_randevu": "Yarın 11:00",
     "calisma_saatleri": "09:00 - 19:00",
     "aciklama": "..."
   }
*/

/*
┌─────────────────────────────────────────────────────────────┐
│ FRONTEND SAYFALARI                                          │
└─────────────────────────────────────────────────────────────┘

index.html
  - Anasayfa
  - İl-İlçe filtresi ile kuaför araması
  - Dinamik kart yükleme
  - Detay ve Randevu Al butonları

kuafor-detay.html?id=[kuafor_id]
  - Seçili kuaförün tüm detaylarını gösterir
  - Hizmetler, çalışma saatleri vb.
  - Randevu al butonuna sahip

randevu-al.html?kuafor_id=[kuafor_id]
  - Randevu oluşturma formu
  - Tarih-saat seçimi
  - Müşteri bilgisi girişi
*/

/*
┌─────────────────────────────────────────────────────────────┐
│ ÖNEMLI NOTLAR VE HATA ÇÖZÜMLERI                             │
└─────────────────────────────────────────────────────────────┘

HATA: "Cannot find module 'express'"
ÇÖZÜM: npm install komutunu çalıştırın

─────────────────────────────────────────────────────────────

HATA: "Error: connect ECONNREFUSED 127.0.0.1:3306"
ÇÖZÜM: MySQL sunucusunun çalıştığından emin olun

─────────────────────────────────────────────────────────────

HATA: "Unknown database 'berber_randevu'"
ÇÖZÜM: veritabani-yapisi.sql dosyasını MySQL'de çalıştırın

─────────────────────────────────────────────────────────────

HATA: "Access denied for user 'root'@'localhost'"
ÇÖZÜM: .env dosyasında MySQL şifresi doğru mu kontrol edin

─────────────────────────────────────────────────────────────

HATA: CORS hatası
ÇÖZÜM: Cors middleware server.js'de etkindir, endişe etmeyin

─────────────────────────────────────────────────────────────

HATA: "Port 3000 is already in use"
ÇÖZÜM: .env dosyasından PORT değerini değiştirin
       veya: lsof -i :3000 (Linux/Mac) / netstat -ano (Windows)
*/

/*
┌─────────────────────────────────────────────────────────────┐
│ VERİTABANI TABLOSU AÇIKLAMALARI                             │
└─────────────────────────────────────────────────────────────┘

ILLER TABLOSU:
  id          - Birincil anahtar
  il_adi      - Şehir adı (benzersiz)
  created_at  - Oluşturulma tarihi

─────────────────────────────────────────────────────────────

İLÇELER TABLOSU:
  id          - Birincil anahtar
  il_id       - İl tablosuna referans (yabancı anahtar)
  ilce_adi    - İlçe adı
  created_at  - Oluşturulma tarihi
  
  Benzersizlik: Bir şehir içinde ilçe adları benzersizdir

─────────────────────────────────────────────────────────────

KUAFÖR_LİSTESİ TABLOSU:
  id                 - Birincil anahtar
  isletme_adi        - Kuaför/Berber adı
  telefon            - İletişim telefonu
  email              - İletişim emaili
  adres              - Tam adres
  il_id              - İl referansı (yabancı anahtar)
  ilce_id            - İlçe referansı (yabancı anahtar)
  rating             - 1-5 arasında puanlama (4.9 gibi)
  hizmetler          - Virgülle ayrılmış: "Kesim,Boya,Bakım"
  en_yakin_randevu   - "Yarın 14:30" formatında
  calisma_saatleri   - "09:00 - 19:00" formatında
  aciklama           - Kuaför hakkında açıklama metni
  created_at         - Oluşturulma tarihi
  updated_at         - Güncelleme tarihi
*/

/*
┌─────────────────────────────────────────────────────────────┐
│ GELİŞTİRME MODUNDAKİ ÖRNEKLER                               │
└─────────────────────────────────────────────────────────────┘

Örnek: Browser'da tüm kuaförleri filtresiz görmek
  http://localhost:3000/api/kuaforler

Örnek: İstanbul'daki (il_id=1) kuaförleri görmek
  http://localhost:3000/api/kuaforler?il_id=1

Örnek: Beşiktaş'taki (ilce_id=2) kuaförleri görmek
  http://localhost:3000/api/kuaforler?ilce_id=2

Örnek: Boya hizmeti sunanleri görmek
  http://localhost:3000/api/kuaforler?hizmet=Boya

Örnek: Elite Hair Studio'yu görmek (ID=1)
  http://localhost:3000/api/kuaforler/1
*/
