# Berber Randevu Sistemi - Hızlı Başlangıç

## ✅ Oluşturulan Dosyalar

### Backend (Node.js + Express + MySQL)
- **server.js** - Express sunucusu ve route'lar
- **db.js** - MySQL connection pool
- **routes/iller.js** - İller API
- **routes/ilceler.js** - İlçeler API
- **routes/kuaforler.js** - Kuaförler API
- **package.json** - NPM bağımlılıkları
- **.env** - Ortam ayarları

### Frontend (HTML + Bootstrap + JavaScript)
- **index.html** - Anasayfa (✨ güncellenmiş - kart yapısı eklendi)
- **kuafor-detay.html** - Kuaför detay sayfası
- **randevu-al.html** - Randevu oluşturma sayfası

### Veritabanı
- **veritabani-yapisi.sql** - MySQL veritabanı yapısı ve örnek veriler

### Dokümantasyon
- **README.md** - Detaylı bilgi
- **KURULUM_KILAVUZU.md** - Adım adım kurulum

---

## 🚀 Hızlı Kurulum (3 Adım)

### 1️⃣ Veritabanını Oluştur
```bash
mysql -u root -p < veritabani-yapisi.sql
```

### 2️⃣ Paketleri Yükle
```bash
npm install
```

### 3️⃣ Sunucuyu Başlat
```bash
npm run dev
```

**Tarayıcıda aç:** http://localhost:3000

---

## 🎨 Anasayfa Özellikleri

✨ **Yeni Özellikler:**
- ✅ Dinamik il-ilçe seçimi (veritabanından)
- ✅ Hizmet filtresi
- ✅ Kuaför kartları (veritabanından doldurulur)
- ✅ Her kart detayında:
  - Kuaför adı
  - 5 yıldızlı puanlandırma
  - Konum (il, ilçe)
  - En yakın randevu saati
  - Sunulan hizmetler (badge'ler)
  - Detay ve Hızlı Randevu butonları

---

## 🔌 API Endpoint'leri

| Endpoint | Metod | Açıklama |
|----------|-------|----------|
| `/api/iller` | GET | Tüm illeri listele |
| `/api/ilceler/:il_id` | GET | Belirli ile ait ilçeleri listele |
| `/api/kuaforler` | GET | Tüm kuaförleri listele |
| `/api/kuaforler?il_id=1` | GET | İle göre filtrele |
| `/api/kuaforler?ilce_id=2` | GET | İlçeye göre filtrele |
| `/api/kuaforler?hizmet=Boya` | GET | Hizmete göre filtrele |
| `/api/kuaforler/:id` | GET | Kuaför detaylarını getir |

---

## 📊 Veritabanı Yapısı

### iller
- id, il_adi, created_at

### ilceler
- id, il_id, ilce_adi, created_at

### kuafor_listesi
- id, isletme_adi, telefon, email, adres
- il_id, ilce_id, rating
- hizmetler (virgülle ayrılmış)
- en_yakin_randevu, calisma_saatleri, aciklama
- created_at, updated_at

---

## 📁 Proje Yapısı

```
Berber Randevu Sistemi/
├── server.js
├── db.js
├── package.json
├── .env
├── routes/
│   ├── iller.js
│   ├── ilceler.js
│   └── kuaforler.js
├── index.html ✨ (güncellenmiş)
├── kuafor-detay.html
├── randevu-al.html
├── login-customer.html
├── login-barber.html
├── register-customer.html
├── register-barber.html
├── veritabani-yapisi.sql
├── README.md
├── KURULUM_KILAVUZU.md
└── OZET.md (bu dosya)
```

---

## ⚙️ .env Ayarları

Projede hassas bilgileri `.env` içinde tutuyoruz. Repoya hassas dosyalar eklenmemesi için **`.env.example`** şablonunu kullanın ve yerelde `.env` veya `.env.local` olarak kaydedin.

```env
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=              # MySQL şifreniz
DB_NAME=berber_randevu
NODE_ENV=development
PORT=3000
JWT_SECRET=your_jwt_secret
```

Not: `.env` dosyasını repoya commit etmeyin; `.env.example` şablonu repoda kalmalıdır.

---

## 🐛 Sık Sorulan Sorular

**S: npm install'da hata alıyorum**
C: Node.js ve npm'in kurulu olduğundan emin olun

**S: "Unknown database" hatası**
C: `veritabani-yapisi.sql` dosyasını MySQL'de çalıştırın

**S: Sunucu başlamıyor**
C: MySQL çalıştığından emin olun, `.env` ayarlarını kontrol edin

**S: Kuaförler gösterilmiyor**
C: Veritabanında örnek verileri kontrol edin (veritabani-yapisi.sql)

---

## 📝 Örnek Veritabanı Verileri

3 İl: İstanbul, Ankara, İzmir
8 İlçe: Kadıköy, Beşiktaş, Üsküdar, Fatih, Çankaya, Keçiören, Bornova, Karşıyaka
6 Kuaför: Elite Hair Studio, Modern Berber Evi, Güzellik Merkezi Lale, vb.

---

## 🎯 Sonraki Adımlar

- [ ] Müşteri ve Kuaför giriş sistemi entegre et
- [ ] Randevu kaydetme API'si ekle
- [ ] Email bildirimleri gönder
- [ ] Randevu yönetimi paneli oluştur
- [ ] Ödeme sistemi ekle

---

## 📞 Destek

Herhangi bir sorun için `README.md` ve `KURULUM_KILAVUZU.md` dosyalarına bakınız.

**Başarılı kurulumlar! 🎉**
