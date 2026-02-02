const API_URL = 'http://localhost:3000/api';

// Token kontrolü ve UI güncelleme
function checkAuth() {
    const token = localStorage.getItem('token');
    const user = localStorage.getItem('user');
    const authButtons = document.getElementById('authButtons');
    const profileSection = document.getElementById('profileSection');

    if (token && user) {
        const userData = JSON.parse(user);
        authButtons.style.display = 'none';
        profileSection.style.display = 'block';
        // Müşteri ise name, Kuaför ise salonAdi göster
        const displayName = userData.name || userData.salonAdi || 'Kullanıcı';
        document.getElementById('userName').textContent = displayName;
        document.getElementById('profileAvatar').textContent = displayName.charAt(0).toUpperCase();
    } else {
        authButtons.style.display = 'flex';
        profileSection.style.display = 'none';
    }
}

// Dropdown aç/kapat
function toggleDropdown() {
    const dropdown = document.getElementById('profileDropdown');
    dropdown.classList.toggle('show');
}

// Sayfa harici tıklamada dropdown kapat
document.addEventListener('click', (e) => {
    const profileSection = document.getElementById('profileSection');
    if (!profileSection.contains(e.target)) {
        document.getElementById('profileDropdown').classList.remove('show');
    }
});

// Dropdown menü fonksiyonları
function goToAppointments() {
    window.location.href = 'randevularim.html';
}

function goToProfile() {
    Swal.fire({
        title: 'Yapım Aşamasında',
        text: 'Ayarlar sayfası şu an geliştirme aşamasındadır.',
        icon: 'info',
        confirmButtonText: 'Tamam',
        confirmButtonColor: 'cornflowerblue'
    });
}

function goToEditProfile() {
    window.location.href = 'edit-profile.html';
}

function logout() {
    Swal.fire({
        title: 'Çıkış Yap',
        text: 'Çıkış yapmak istediğinize emin misiniz?',
        icon: 'question',
        showCancelButton: true,
        confirmButtonText: 'Evet, Çıkış',
        cancelButtonText: 'İptal',
        confirmButtonColor: '#dc3545',
        cancelButtonColor: '#6c757d'
    }).then((result) => {
        if (result.isConfirmed) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        localStorage.removeItem('musteriToken');
        localStorage.removeItem('kuaforToken');
        checkAuth();
        location.reload();
        }
    });
}

// DOM Elemanları
const ilSelect = document.getElementById('il');
const ilceSelect = document.getElementById('ilce');
const aramaBtn = document.getElementById('aramaBtn');
const kuaforlerKonteyner = document.getElementById('kuaforlerKonteyner');

// İlleri Yükle
async function illerinYukle() {
    try {
        const response = await fetch(`${API_URL}/iller`);
        const iller = await response.json();

        ilSelect.innerHTML = '<option value="">İl Seç</option>';
        iller.forEach(il => {
            ilSelect.innerHTML += `<option value="${il.id}">${il.sehirAdi}</option>`;
        });
    } catch (error) {
        console.error('İller yükleme hatası:', error);
    }
}

// İlçeleri Yükle
async function ilceleriYukle(ilId) {
    if (!ilId) {
        ilceSelect.innerHTML = '<option value="">İlçe Seç</option>';
        return;
    }

    try {
        const response = await fetch(`${API_URL}/ilceler/${ilId}`);
        const ilceler = await response.json();

        ilceSelect.innerHTML = '<option value="">İlçe Seç</option>';
        ilceler.forEach(ilce => {
            ilceSelect.innerHTML += `<option value="${ilce.id}">${ilce.ilceAdi}</option>`;
        });
    } catch (error) {
        console.error('İlçeler yükleme hatası:', error);
    }
}

// Görsel URL'sini tam hale getir
function resolveImageUrl(url) {
    if (!url || typeof url !== 'string') return '';
    const u = url.trim();
    if (u.startsWith('http://') || u.startsWith('https://')) return u;
    const origin = (window.location && window.location.origin) ? window.location.origin : '';
    return u.startsWith('/') ? origin + u : origin + '/' + u;
}

// Kuaförler Kartını Oluştur
function kuaforKartiOlustur(firma) {
    const kabul = [];
    if (firma.erkek_kabul) kabul.push('Erkek');
    if (firma.kadın_kabul) kabul.push('Kadın');
    if (firma.cocuk_kabul) kabul.push('Çocuk');
    const kabulHTML = kabul.length > 0 ? kabul.map(k => `<span class="badge bg-secondary tag">${k}</span>`).join('') : '';

    const rawImg = (firma.gorsel_url || firma.gorsel || '').trim();
    const imageUrl = rawImg ? resolveImageUrl(rawImg) : 'https://via.placeholder.com/300x200?text=Salon';

    return `
                <div class="col-12 col-sm-6 col-md-4 mb-2">
                    <div class="card kuafor-card h-100">
                        <div class="kuafor-card-image-wrap">
                            <img src="${imageUrl}" alt="${(firma.firmaAdi || '').replace(/"/g, '&quot;')}" class="kuafor-card-image" loading="lazy">
                        </div>
                        <div class="card-body">
                            <h5 class="card-title">${firma.firmaAdi}</h5>
                            <p class="text-muted mb-2 fs-6">📍 ${firma.ilceAdi}, ${firma.sehirAdi}</p>
                            <p class="text-muted mb-2" style="font-size: 0.9rem;">
                                ${firma.mahalle ? firma.mahalle + ' Mahallesi' : ''} 
                                ${firma.cadde ? firma.cadde : ''} 
                                ${firma.sokak ? firma.sokak : ''}
                            </p>
                            <p class="fw-semibold">👥 ${firma.calisan_sayisi || '-'} Çalışan</p>
                            <div class="mb-3">
                                ${kabulHTML}
                            </div>
                            <div class="d-flex flex-column flex-sm-row gap-2">
                                <button id="detayBtn" class="btn flex-grow-1 outline-blue-button" onclick="detayGoster(${firma.id})">Detay</button>
                                <button id="hizliRandevuBtn" class="btn flex-grow-1 blue-button" onclick="hizliRandevuAl(${firma.id})">Hızlı Randevu</button>
                            </div>
                        </div>
                    </div>
                </div>
            `;
}


async function kuaforleriGoster() {
    try {
        const ilId = ilSelect.value;
        const ilceId = ilceSelect.value;

        let url = `${API_URL}/kuaforler`;
        const params = new URLSearchParams();

        if (ilId) params.append('il_id', ilId);
        if (ilceId) params.append('ilce_id', ilceId);

        if (params.toString()) {
            url += '?' + params.toString();
        }

        kuaforlerKonteyner.innerHTML = '<div class="loading active"><div class="spinner-border"></div><p>Kuaförler yükleniyor...</p></div>';

        const response = await fetch(url);
        const firmalar = await response.json();

        if (firmalar.length === 0) {
            kuaforlerKonteyner.innerHTML = '<div class="no-results"><h5>Maalesef kuaför bulunamadı</h5><p>Lütfen farklı filtreler deneyin.</p></div>';
            return;
        }

        kuaforlerKonteyner.innerHTML = firmalar
            .map(firma => kuaforKartiOlustur(firma))
            .join('');
    } catch (error) {
        console.error('Kuaförler yükleme hatası:', error);
        kuaforlerKonteyner.innerHTML = '<div class="no-results"><h5>Bir hata oluştu</h5><p>Lütfen daha sonra tekrar deneyiniz.</p></div>';
    }
}

// Detay Sayfasına Git
function detayGoster(kuaforId) {
    window.location.href = `kuafor-detay.html?id=${kuaforId}`;
}

// Hızlı Randevu Al
function hizliRandevuAl(kuaforId) {
    window.location.href = `randevu-al.html?kuafor_id=${kuaforId}`;
}

// Event Listeners
ilSelect.addEventListener('change', (e) => {
    ilceleriYukle(e.target.value);
});

aramaBtn.addEventListener('click', () => {
    kuaforleriGoster();
});

// Sayfa yüklendiğinde
document.addEventListener('DOMContentLoaded', () => {
    checkAuth(); // Authentication durumunu kontrol et
    illerinYukle();
    kuaforleriGoster(); // Tüm kuaförler otomatik yükle
});