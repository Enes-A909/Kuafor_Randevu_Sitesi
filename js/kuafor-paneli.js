const DAYS = ['Pazar', 'Pazartesi', 'Salı', 'Çarşamba', 'Perşembe', 'Cuma', 'Cumartesi'];
let kuaforId = null;
let kuaforData = null;
let scheduleData = {};

// Sayfa yüklendiğinde
window.addEventListener('DOMContentLoaded', async () => {
    checkAuth();
    await loadIller();
    await loadKuaforInfo();
    loadSchedule();

    // Randevular sekmesine tıklandığında randevuları yükle
    const appointmentsTab = document.getElementById('appointments-tab');
    if (appointmentsTab) {
        appointmentsTab.addEventListener('shown.bs.tab', () => {
            loadAppointments();
        });
    }

    // Fotoğraflar sekmesine tıklandığında fotoğrafları yükle
    const photosTab = document.getElementById('photos-tab');
    if (photosTab) {
        photosTab.addEventListener('shown.bs.tab', () => {
            loadPhotos();
        });
    }

    // Fotoğraf URL ekle butonu
    const addPhotoUrlBtn = document.getElementById('addPhotoUrlBtn');
    if (addPhotoUrlBtn) {
        addPhotoUrlBtn.addEventListener('click', addPhotoByUrl);
    }

    // Fotoğraf yükle butonu (dosya seçildiğinde)
    const uploadPhotoBtn = document.getElementById('uploadPhotoBtn');
    if (uploadPhotoBtn) {
        uploadPhotoBtn.addEventListener('click', uploadPhotoFile);
    }

    // İl değiştiğinde ilçeleri yükle
    const ilSelect = document.getElementById('il');
    if (ilSelect) {
        ilSelect.addEventListener('change', (e) => {
            loadIlceler(e.target.value);
        });
    }
});

// Auth kontrol
function checkAuth() {
    const token = localStorage.getItem('kuaforToken') || localStorage.getItem('token');
    const user = localStorage.getItem('kuaforUser') || localStorage.getItem('user');

    if (!token || !user) {
        window.location.href = 'login-barber.html';
        return;
    }

    try {
        const userData = JSON.parse(user);
        kuaforId = userData.id;
    } catch (e) {
        window.location.href = 'login-barber.html';
    }
}

// İlleri yükle
async function loadIller() {
    try {
        const response = await fetch('/api/iller');
        const iller = await response.json();

        const ilSelect = document.getElementById('il');
        ilSelect.innerHTML = '<option value="">İl Seçiniz</option>';
        iller.forEach(il => {
            ilSelect.innerHTML += `<option value="${il.id}">${il.sehirAdi}</option>`;
        });
    } catch (error) {
        console.error('İller yükleme hatası:', error);
    }
}

// İlçeleri yükle
async function loadIlceler(ilId) {
    const ilceSelect = document.getElementById('ilce');

    if (!ilId) {
        ilceSelect.innerHTML = '<option value="">Önce il seçiniz</option>';
        return;
    }

    try {
        const response = await fetch(`/api/ilceler/${ilId}`);
        const ilceler = await response.json();

        ilceSelect.innerHTML = '<option value="">İlçe Seçiniz</option>';
        ilceler.forEach(ilce => {
            ilceSelect.innerHTML += `<option value="${ilce.id}">${ilce.ilceAdi}</option>`;
        });
    } catch (error) {
        console.error('İlçeler yükleme hatası:', error);
        ilceSelect.innerHTML = '<option value="">İlçeler yüklenemedi</option>';
    }
}

// Kuaför bilgilerini yükle
async function loadKuaforInfo() {
    try {
        const token = localStorage.getItem('kuaforToken') || localStorage.getItem('token');
        const response = await fetch('/api/kuafor/info', {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (!response.ok) throw new Error('Bilgiler yüklenemedi');

        const data = await response.json();
        kuaforData = data.kuafor;

        // Görüntüleme alanlarını doldur
        document.getElementById('firmaAdiDisplay').innerHTML = `<strong>Salon:</strong> ${kuaforData.firmaAdi}`;
        document.getElementById('firma_sahibiDisplay').innerHTML = `<strong>Yetkili:</strong> ${kuaforData.firma_sahibi}`;
        document.getElementById('epostaDisplay').innerHTML = `<strong>E-Posta:</strong> ${kuaforData.eposta}`;
        document.getElementById('telefonDisplay').innerHTML = `<strong>Telefon:</strong> ${kuaforData.telefon || 'Belirtilmemiş'}`;

        // Adres bilgilerini göster
        const adresParts = [];
        if (kuaforData.mahalle) adresParts.push(kuaforData.mahalle);
        if (kuaforData.cadde) adresParts.push(kuaforData.cadde);
        if (kuaforData.sokak) adresParts.push(kuaforData.sokak);
        if (kuaforData.bina_no) adresParts.push(`No: ${kuaforData.bina_no}`);
        if (kuaforData.daire_no) adresParts.push(`Daire: ${kuaforData.daire_no}`);
        if (kuaforData.ilceAdi) adresParts.push(kuaforData.ilceAdi);

        const adresText = adresParts.length > 0 ? adresParts.join(', ') : 'Adres bilgisi girilmemiş';
        document.getElementById('adresDisplay').innerHTML = `<strong>Adres:</strong> ${adresText}`;

        // Form alanlarını doldur
        document.getElementById('firmaAdi').value = kuaforData.firmaAdi || '';
        document.getElementById('firma_sahibi').value = kuaforData.firma_sahibi || '';
        document.getElementById('profileEposta').value = kuaforData.eposta || '';
        document.getElementById('telefon').value = kuaforData.telefon || '';

        // Adres alanlarını doldur
        if (kuaforData.il_id) {
            document.getElementById('il').value = kuaforData.il_id;
            await loadIlceler(kuaforData.il_id);
            // İlçeler yüklendikten sonra ilçe seçimini yap
            if (kuaforData.ilce_id) {
                document.getElementById('ilce').value = kuaforData.ilce_id;
            }
        }

        document.getElementById('mahalle').value = kuaforData.mahalle || '';
        document.getElementById('cadde').value = kuaforData.cadde || '';
        document.getElementById('sokak').value = kuaforData.sokak || '';
        document.getElementById('bina_no').value = kuaforData.bina_no || '';
        document.getElementById('daire_no').value = kuaforData.daire_no || '';
    } catch (error) {
        console.error('Hata:', error);
        showAlert('Bilgiler yüklenirken hata oluştu', 'danger');
    }
}

// Çalışma programını yükle
async function loadSchedule() {
    try {
        const token = localStorage.getItem('kuaforToken') || localStorage.getItem('token');
        const response = await fetch('/api/kuafor/schedule', {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (!response.ok) throw new Error('Program yüklenemedi');

        const data = await response.json();
        const programs = data.programs;

        // Programları gün numarasına göre organize et
        const scheduleByDay = {};
        programs.forEach(prog => {
            scheduleByDay[prog.gun] = prog;
            scheduleData[prog.gun] = prog.id;
        });

        // Tablo satırlarını oluştur
        const tbody = document.getElementById('scheduleTableBody');
        tbody.innerHTML = '';

        DAYS.forEach((dayName, dayNum) => {
            const prog = scheduleByDay[dayNum] || {};
            const row = document.createElement('tr');

            const startTime = prog.baslangic_saati || '09:00';
            const endTime = prog.bitis_saati || '17:00';
            const slotMinutes = prog.slot_dakika || 30;
            const maxAppointments = prog.max_randevu || 1;
            const bufferMinutes = prog.buffer_dk || 0;
            const isClosed = prog.kapali || 0;

            row.innerHTML = `
                        <td class="day-header">${dayName}</td>
                        <td>
                            <input type="checkbox" class="day-closed" data-day="${dayNum}" ${isClosed ? 'checked' : ''}>
                        </td>
                        <td>
                            <input type="time" class="form-control start-time" data-day="${dayNum}" value="${startTime}" ${isClosed ? 'disabled' : ''}>
                        </td>
                        <td>
                            <input type="time" class="form-control end-time" data-day="${dayNum}" value="${endTime}" ${isClosed ? 'disabled' : ''}>
                        </td>
                        <td>
                            <input type="number" class="form-control slot-minutes" data-day="${dayNum}" min="10" max="120" value="${slotMinutes}" ${isClosed ? 'disabled' : ''}>
                        </td>
                        <td>
                            <input type="number" class="form-control max-appointments" data-day="${dayNum}" min="1" max="20" value="${maxAppointments}" ${isClosed ? 'disabled' : ''}>
                        </td>
                        <td>
                            <input type="number" class="form-control buffer-minutes" data-day="${dayNum}" min="0" max="60" value="${bufferMinutes}" ${isClosed ? 'disabled' : ''}>
                        </td>
                    `;

            tbody.appendChild(row);
        });

        // Kapalı checkbox'ları dinle
        document.querySelectorAll('.day-closed').forEach(checkbox => {
            checkbox.addEventListener('change', (e) => {
                const day = e.target.dataset.day;
                const isDisabled = e.target.checked;

                document.querySelectorAll(`[data-day="${day}"]`).forEach(input => {
                    if (input !== checkbox) {
                        input.disabled = isDisabled;
                    }
                });
            });
        });
    } catch (error) {
        console.error('Hata:', error);
        showAlert('Program yüklenirken hata oluştu', 'danger');
    }
}

// Profil formu
document.getElementById('profileForm').addEventListener('submit', async (e) => {
    e.preventDefault();

    const firmaAdi = document.getElementById('firmaAdi').value;
    const firma_sahibi = document.getElementById('firma_sahibi').value;
    const telefon = document.getElementById('telefon').value;
    const il_id = document.getElementById('il').value;
    const ilce_id = document.getElementById('ilce').value;
    const mahalle = document.getElementById('mahalle').value;
    const cadde = document.getElementById('cadde').value;
    const sokak = document.getElementById('sokak').value;
    const bina_no = document.getElementById('bina_no').value;
    const daire_no = document.getElementById('daire_no').value;

    try {
        const token = localStorage.getItem('kuaforToken') || localStorage.getItem('token');
        const response = await fetch('/api/kuafor/update-info', {
            method: 'PUT',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                firmaAdi: firmaAdi,
                firma_sahibi: firma_sahibi,
                telefon: telefon,
                il_id: il_id || null,
                ilce_id: ilce_id || null,
                mahalle: mahalle || null,
                cadde: cadde || null,
                sokak: sokak || null,
                bina_no: bina_no || null,
                daire_no: daire_no || null
            })
        });

        const data = await response.json();

        if (response.ok) {
            showAlert('Bilgiler başarıyla güncellendi', 'success');
            loadKuaforInfo();
        } else {
            showAlert(data.message || 'Güncelleme başarısız', 'danger');
        }
    } catch (error) {
        console.error('Hata:', error);
        showAlert('Güncelleme sırasında hata oluştu', 'danger');
    }
});

// Saati HH:MM:SS formatına çevir (input HH:MM veya HH:MM:SS dönebilir)
function toDbTime(val) {
    if (!val) return '00:00:00';
    const parts = String(val).trim().split(':');
    const h = (parts[0] || '00').padStart(2, '0');
    const m = (parts[1] || '00').padStart(2, '0');
    const s = (parts[2] || '00').padStart(2, '0');
    return `${h}:${m}:${s}`;
}

// Çalışma programı formu
document.getElementById('scheduleForm').addEventListener('submit', async (e) => {
    e.preventDefault();

    const schedules = [];
    const tbody = document.getElementById('scheduleTableBody');
    const rows = tbody.querySelectorAll('tr');

    rows.forEach((row, index) => {
        const isClosed = row.querySelector('.day-closed').checked;
        const startTime = row.querySelector('.start-time').value;
        const endTime = row.querySelector('.end-time').value;
        const slotMinutes = parseInt(row.querySelector('.slot-minutes').value);
        const maxAppointments = parseInt(row.querySelector('.max-appointments').value);
        const bufferMinutes = parseInt(row.querySelector('.buffer-minutes').value);

        schedules.push({
            gun: index,
            kapali: isClosed ? 1 : 0,
            baslangic_saati: isClosed ? '00:00:00' : toDbTime(startTime),
            bitis_saati: isClosed ? '00:00:00' : toDbTime(endTime),
            slot_dakika: slotMinutes,
            max_randevu: maxAppointments,
            buffer_dk: bufferMinutes
        });
    });

    try {
        const token = localStorage.getItem('kuaforToken') || localStorage.getItem('token');
        const response = await fetch('/api/kuafor/update-schedule', {
            method: 'PUT',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ schedules })
        });

        const data = await response.json();

        if (response.ok) {
            showAlert('Çalışma programı başarıyla güncellendi', 'success');
        } else {
            showAlert(data.message || 'Güncelleme başarısız', 'danger');
        }
    } catch (error) {
        console.error('Hata:', error);
        showAlert('Güncelleme sırasında hata oluştu', 'danger');
    }
});

// Alert göster
function showAlert(message, type) {
    const alertContainer = document.getElementById('alertContainer');
    const alert = document.createElement('div');
    alert.className = `alert alert-${type} alert-dismissible fade show`;
    alert.innerHTML = `
                ${message}
                <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
            `;
    alertContainer.innerHTML = '';
    alertContainer.appendChild(alert);

    setTimeout(() => {
        alert.remove();
    }, 5000);
}

// Randevuları yükle
async function loadAppointments() {
    try {
        const token = localStorage.getItem('kuaforToken') || localStorage.getItem('token');

        if (!token) {
            throw new Error('Oturum açmanız gerekiyor');
        }

        const response = await fetch('/api/kuafor/appointments', {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.message || `HTTP ${response.status}: Randevular yüklenemedi`);
        }

        const data = await response.json();
        const randevular = data.randevular || [];

        displayAppointments(randevular);
    } catch (error) {
        console.error('Hata:', error);
        showAlert('Randevular yüklenirken hata oluştu: ' + error.message, 'danger');
        document.getElementById('appointmentsList').innerHTML = `
            <div class="text-center text-danger py-5">
                <i class="bi bi-exclamation-triangle" style="font-size: 3rem;"></i>
                <p class="mt-3">Randevular yüklenirken hata oluştu</p>
                <p class="mt-2 text-muted" style="font-size: 0.9rem;">${error.message}</p>
            </div>
        `;
    }
}

// Randevu geçmişte mi kontrol et
function isAppointmentPast(app) {
    const dateStr = typeof app.tarih === 'string' ? app.tarih.substring(0, 10) : '';
    const appTime = typeof app.saat === 'string' ? app.saat.trim() : String(app.saat || '');
    const [h = 0, m = 0] = appTime.split(':').map(Number);
    const appDate = new Date(dateStr + 'T' + String(h).padStart(2, '0') + ':' + String(m).padStart(2, '0') + ':00');
    return appDate <= new Date();
}

// Randevuları göster
function displayAppointments(randevular) {
    const container = document.getElementById('appointmentsList');

    if (randevular.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <div class="empty-icon">
                    <i class="bi bi-calendar-x"></i>
                </div>
                <div class="empty-text">Henüz randevu bulunmamaktadır</div>
            </div>
        `;
        return;
    }

    container.innerHTML = randevular.map(app => {
        const tarih = new Date(app.tarih).toLocaleDateString('tr-TR', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });

        const isPast = isAppointmentPast(app);
        const durumDisplay = isPast ? 'Geçmiş Randevu' : (app.durum || '');
        let durumClass = isPast ? 'gecmis' : (app.durum || '').toLowerCase()
            .replace(/ı/g, 'i')
            .replace(/ğ/g, 'g')
            .replace(/ü/g, 'u')
            .replace(/ş/g, 's')
            .replace(/ö/g, 'o')
            .replace(/ç/g, 'c')
            .replace(/\s+/g, '-');
        const musteriAdi = app.musteri_adi || 'Müşteri bilgisi yok';
        const saatStr = typeof app.saat === 'string' && app.saat.length >= 5 ? app.saat.substring(0, 5) : app.saat;

        return `
            <div class="appointment-item ${isPast ? 'appointment-past' : ''}">
                <div class="appointment-header">
                    <div class="appointment-service">${app.hizmetAdi || 'Hizmet bilgisi yok'}</div>
                    <span class="appointment-status status-${durumClass}">
                        ${durumDisplay}
                    </span>
                </div>

                <div class="appointment-details">
                    <div class="detail-item">
                        <span class="detail-icon"><i class="bi bi-calendar"></i></span>
                        <span>${tarih}</span>
                    </div>
                    <div class="detail-item">
                        <span class="detail-icon"><i class="bi bi-clock"></i></span>
                        <span>${saatStr}</span>
                    </div>
                    <div class="detail-item">
                        <span class="detail-icon"><i class="bi bi-cash-coin"></i></span>
                        <span>${app.fiyat ? app.fiyat + ' TL' : 'Fiyat bilgisi yok'}</span>
                    </div>
                    <div class="detail-item">
                        <span class="detail-icon"><i class="bi bi-hourglass"></i></span>
                        <span>${app.sureDakika ? app.sureDakika + ' dk' : 'Süre bilgisi yok'}</span>
                    </div>
                </div>

                <div class="appointment-customer">
                    <div class="customer-name">
                        <i class="bi bi-person"></i> ${musteriAdi}
                    </div>
                    ${app.musteri_telefon ? `
                        <div class="customer-phone">
                            <i class="bi bi-telephone"></i> ${app.musteri_telefon}
                        </div>
                    ` : ''}
                </div>

                ${app.notlar ? `
                    <div class="appointment-notes">
                        <strong>Notlar:</strong> ${app.notlar}
                    </div>
                ` : ''}
            </div>
        `;
    }).join('');
}

// Görsel URL'sini tam hale getir (relative path ise origin ekle)
function resolveImageUrl(url) {
    if (!url || typeof url !== 'string') return '';
    const u = url.trim();
    if (u.startsWith('http://') || u.startsWith('https://')) return u;
    const origin = (typeof window !== 'undefined' && window.location && window.location.origin) ? window.location.origin : '';
    return (u.startsWith('/') ? origin + u : origin + '/' + u);
}

// Fotoğrafları yükle
async function loadPhotos() {
    const container = document.getElementById('photosList');
    if (!container) return;
    try {
        const token = localStorage.getItem('kuaforToken') || localStorage.getItem('token');
        const response = await fetch('/api/kuafor/gorseller', {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await response.json();
        const gorseller = (data.gorseller || []);
        if (gorseller.length === 0) {
            container.innerHTML = '<div class="text-center text-muted py-4"><i class="bi bi-images" style="font-size: 3rem;"></i><p class="mt-2">Henüz fotoğraf eklenmemiş. Dosya yükleyebilir veya URL ile ekleyebilirsiniz.</p></div>';
            return;
        }
        container.innerHTML = gorseller.map((g, i) => {
            const imgUrl = resolveImageUrl(g.dosya_yolu || g);
            const isAnaKart = g.ana_kart === 1 || g.ana_kart === true;
            return `
            <div class="photo-item ${isAnaKart ? 'photo-item-ana-kart' : ''}">
                ${isAnaKart ? '<span class="photo-ana-kart-badge"><i class="bi bi-star-fill"></i> Kart</span>' : ''}
                <div class="photo-thumb-wrap">
                    <img src="${imgUrl.replace(/"/g, '&quot;')}" alt="Fotoğraf ${i + 1}" class="photo-thumb" onerror="this.src='https://placehold.co/200x150?text=Yüklenemedi'">
                </div>
                <div class="photo-actions">
                    ${!isAnaKart ? `<button type="button" class="btn btn-sm btn-outline-primary photo-set-card" onclick="setAnaKart(${g.id})" title="Anasayfa kartında göster"><i class="bi bi-star"></i> Kartta göster</button>` : ''}
                    <button type="button" class="btn btn-sm btn-danger photo-delete" onclick="deletePhoto(${g.id})" title="Sil"><i class="bi bi-trash"></i></button>
                </div>
            </div>
        `;
        }).join('');
    } catch (error) {
        console.error('Fotoğraflar yükleme hatası:', error);
        container.innerHTML = '<div class="text-center text-danger py-4">Fotoğraflar yüklenemedi. Veritabanında firma_gorselleri tablosu oluşturulmuş olmalı.</div>';
    }
}

// URL ile fotoğraf ekle
async function addPhotoByUrl() {
    const urlInput = document.getElementById('photoUrl');
    const url = (urlInput && urlInput.value || '').trim();
    if (!url) {
        showAlert('Lütfen geçerli bir URL giriniz', 'danger');
        return;
    }
    try {
        const token = localStorage.getItem('kuaforToken') || localStorage.getItem('token');
        const response = await fetch('/api/kuafor/gorsel', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ dosya_yolu: url })
        });
        const data = await response.json();
        if (response.ok) {
            showAlert('Fotoğraf eklendi', 'success');
            urlInput.value = '';
            loadPhotos();
        } else {
            showAlert(data.message || 'Fotoğraf eklenemedi', 'danger');
        }
    } catch (error) {
        console.error('Fotoğraf ekleme hatası:', error);
        showAlert('Fotoğraf eklenirken hata oluştu', 'danger');
    }
}

// Dosya ile fotoğraf yükle
async function uploadPhotoFile() {
    const fileInput = document.getElementById('photoFile');
    if (!fileInput || !fileInput.files || fileInput.files.length === 0) {
        showAlert('Lütfen yüklenecek bir dosya seçiniz', 'danger');
        return;
    }
    const file = fileInput.files[0];
    const allowed = ['image/jpeg', 'image/png', 'image/webp'];
    if (!allowed.includes(file.type)) {
        showAlert('Sadece JPG, PNG ve WebP formatları desteklenir', 'danger');
        return;
    }
    if (file.size > 5 * 1024 * 1024) {
        showAlert('Dosya boyutu en fazla 5MB olmalıdır', 'danger');
        return;
    }
    try {
        const token = localStorage.getItem('kuaforToken') || localStorage.getItem('token');
        const formData = new FormData();
        formData.append('gorsel', file);
        const response = await fetch('/api/kuafor/gorsel/upload', {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${token}` },
            body: formData
        });
        const data = await response.json();
        if (response.ok) {
            showAlert('Fotoğraf yüklendi', 'success');
            fileInput.value = '';
            loadPhotos();
        } else {
            showAlert(data.message || 'Fotoğraf yüklenemedi', 'danger');
        }
    } catch (error) {
        console.error('Fotoğraf yükleme hatası:', error);
        showAlert('Fotoğraf yüklenirken hata oluştu', 'danger');
    }
}

// Ana kart görseli olarak ayarla (anasayfa kartında gösterilecek)
async function setAnaKart(id) {
    try {
        const token = localStorage.getItem('kuaforToken') || localStorage.getItem('token');
        const response = await fetch(`/api/kuafor/gorsel/${id}/ana-kart`, {
            method: 'PUT',
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await response.json();
        if (response.ok) {
            showAlert('Kart görseli güncellendi', 'success');
            loadPhotos();
        } else {
            showAlert(data.message || 'Güncelleme başarısız', 'danger');
        }
    } catch (error) {
        console.error('Ana kart ayarlama hatası:', error);
        showAlert('İşlem sırasında hata oluştu', 'danger');
    }
}

// Fotoğraf sil
async function deletePhoto(id) {
    try {
        const token = localStorage.getItem('kuaforToken') || localStorage.getItem('token');
        const response = await fetch(`/api/kuafor/gorsel/${id}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await response.json();
        if (response.ok) {
            showAlert('Fotoğraf silindi', 'success');
            loadPhotos();
        } else {
            showAlert(data.message || 'Fotoğraf silinemedi', 'danger');
        }
    } catch (error) {
        console.error('Fotoğraf silme hatası:', error);
        showAlert('Fotoğraf silinirken hata oluştu', 'danger');
    }
}

// Çıkış
function logout() {
    localStorage.removeItem('kuaforToken');
    localStorage.removeItem('kuaforUser');
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.href = 'index.html';
}