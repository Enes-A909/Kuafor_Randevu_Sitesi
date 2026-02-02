const API_URL = 'http://localhost:3000/api';

// Giriş kontrolü
function checkAuthForDetail() {
    const token = localStorage.getItem('token');
    if (!token) {
        document.getElementById('loginWarningModal').classList.add('show');
        return false;
    }
    return true;
}

// URL'den kuaför ID'sini al
const urlParams = new URLSearchParams(window.location.search);
const kuaforId = urlParams.get('id');

const loadingSpinner = document.getElementById('loadingSpinner');
const errorSection = document.getElementById('errorSection');
const errorMessage = document.getElementById('errorMessage');
const detailContent = document.getElementById('detailContent');

async function kuaforDetayiniGetir() {
    if (!kuaforId) {
        errorMessage.textContent = 'Geçerli bir kuaför seçiniz.';
        errorSection.style.display = 'block';
        loadingSpinner.style.display = 'none';
        return;
    }

    try {
        const response = await fetch(`${API_URL}/kuaforler/${kuaforId}`);

        if (!response.ok) {
            throw new Error('Kuaför bulunamadı');
        }

        const firma = await response.json();

        // Hizmetleri getir
        const hizmetResponse = await fetch(`${API_URL}/kuaforler/${kuaforId}/hizmetler`);
        const hizmetler = await hizmetResponse.json();

        // Çalışma programını getir
        const programResponse = await fetch(`${API_URL}/kuaforler/${kuaforId}/calisma-programi`);
        const program = await programResponse.json();

        detayiGoster(firma, hizmetler, program);
    } catch (error) {
        console.error('Detay getirme hatası:', error);
        errorMessage.textContent = error.message || 'Kuaför detayı getirilemedi.';
        errorSection.style.display = 'block';
    } finally {
        loadingSpinner.style.display = 'none';
    }
}

function resolveImageUrl(url) {
    if (!url || typeof url !== 'string') return '';
    const u = url.trim();
    if (u.startsWith('http://') || u.startsWith('https://')) return u;
    const origin = (window.location && window.location.origin) ? window.location.origin : '';
    return u.startsWith('/') ? origin + u : origin + '/' + u;
}

function detayiGoster(firma, hizmetler, program) {
    // Görsel slider'ı doldur (API'den gelen görseller veya placeholder)
    const gorseller = firma.gorseller || (firma.gorsel_url ? [firma.gorsel_url] : []);
    const sliderInner = document.getElementById('kuaforSliderInner');
    const placeholderUrl = 'https://placehold.co/300x200/123456/FFF?text=Salon';
    const imgUrls = gorseller.length > 0 ? gorseller.map(u => resolveImageUrl(u)) : [placeholderUrl];
    sliderInner.innerHTML = imgUrls.map((url, i) => `
        <div class="carousel-item ${i === 0 ? 'active' : ''}">
            <img src="${url}" class="d-block w-100 kuafor-slider-img" alt="Salon görseli ${i + 1}" loading="${i === 0 ? 'eager' : 'lazy'}" onerror="this.src='${placeholderUrl}'">
        </div>
    `).join('');

    document.getElementById('isletmeAdi').textContent = firma.firmaAdi;
    document.getElementById('telefon').textContent = 'Bilgi İçin İletişime Geçin';
    document.getElementById('email').textContent = 'Bilgi İçin İletişime Geçin';

    const adres = `${firma.mahalle || ''} ${firma.cadde || ''} ${firma.sokak || ''} ${firma.bina_no ? 'No: ' + firma.bina_no : ''} ${firma.daire_no ? 'Daire: ' + firma.daire_no : ''}`.trim();
    document.getElementById('adres').textContent = `${adres}, ${firma.ilceAdi}, ${firma.sehirAdi}`;

    // Kabul bilgileri
    const kabul = [];
    if (firma.erkek_kabul) kabul.push('Erkek Müşteri');
    if (firma.kadın_kabul) kabul.push('Kadın Müşteri');
    if (firma.cocuk_kabul) kabul.push('Çocuk Müşteri');
    const kabulText = kabul.length > 0 ? kabul.join(', ') : 'Bilgi Yok';
    document.getElementById('calismaHour').textContent = kabulText;

    document.getElementById('enYakinRandevu').textContent = `${firma.calisan_sayisi || '-'} Çalışan`;

    // Hizmetleri göster
    document.getElementById('hizmetler').innerHTML = hizmetler
        .map(h => `<div class="service-badge">${h.hizmetAdi} - ${h.fiyat}₺ (${h.sureDakika} dk)</div>`)
        .join('');

    // Çalışma programını göster
    const gunler = ['Pazar', 'Pazartesi', 'Salı', 'Çarşamba', 'Perşembe', 'Cuma', 'Cumartesi'];
    const programHTML = program
        .map(p => {
            if (p.kapali) {
                return `<div class="service-badge"><strong>${gunler[p.gun]}</strong>: Kapalı</div>`;
            }
            return `<div class="service-badge"><strong>${gunler[p.gun]}</strong>: ${p.baslangic_saati.substring(0, 5)} - ${p.bitis_saati.substring(0, 5)}</div>`;
        })
        .join('');
    document.getElementById('aciklama').innerHTML = programHTML;

    // Randevu butonu
    document.getElementById('randevuButton').addEventListener('click', () => {
        window.location.href = `randevu-al.html?kuafor_id=${firma.id}`;
    });

    detailContent.style.display = 'block';
}

// Sayfa yüklendiğinde
document.addEventListener('DOMContentLoaded', () => {
    // İlk olarak auth kontrol et
    if (!checkAuthForDetail()) {
        return;
    }

    kuaforDetayiniGetir();
});