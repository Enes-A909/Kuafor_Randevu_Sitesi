// Değişkenler
let currentDate = new Date();
let selectedDate = new Date();
let allAppointments = [];
let appointmentsByDate = {};
let appointmentsByDateForCalendar = {};

// Sayfa yüklendiğinde auth kontrol et
window.addEventListener('DOMContentLoaded', () => {
    checkAuth();
    loadAppointments();
    renderCalendar();
});

// Auth kontrol
function checkAuth() {
    const token = localStorage.getItem('token');
    const user = localStorage.getItem('user');

    if (!token || !user) {
        window.location.href = 'login-customer.html';
    }
}

// Randevuları yükle
async function loadAppointments() {
    try {
        const token = localStorage.getItem('token');

        if (!token) {
            console.error('Token bulunamadı');
            showAlert('Oturum açmanız gerekiyor', 'danger');
            return;
        }

        console.log('API çağrısı başlıyor...', '/api/randevu/list');

        const response = await fetch('/api/randevu/list', {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });

        console.log('API Yanıt Status:', response.status);

        if (!response.ok) {
            const errorData = await response.json();
            console.error('API Hatası:', errorData);
            throw new Error(errorData.message || 'Randevular yüklenenemedi');
        }

        const data = await response.json();
        console.log('Alınan Randevular:', data);

        allAppointments = data.randevular || [];

        // Randevuları tarihe göre gruplat (iptal edilenler hariç kalender işaretlemesi için)
        appointmentsByDate = {};
        allAppointments.forEach(app => {
            // Tarih formatını kontrol et ve düzelt
            let dateStr = app.tarih;
            if (dateStr instanceof Date) {
                dateStr = dateStr.toISOString().split('T')[0];
            } else if (typeof dateStr === 'string' && dateStr.length > 10) {
                dateStr = dateStr.split('T')[0];
            }

            console.log('İşlenen Tarih:', dateStr, 'Orijinal:', app.tarih, 'Durum:', app.durum);

            if (!appointmentsByDate[dateStr]) {
                appointmentsByDate[dateStr] = [];
            }
            appointmentsByDate[dateStr].push(app);
        });

        // Kalender işaretlemesi için: sadece iptal olmayan VE geçmemiş randevuları say
        const activeAppointmentsByDate = {};
        Object.entries(appointmentsByDate).forEach(([date, apps]) => {
            const activeApps = apps.filter(app => {
                if (app.durum && app.durum.toLowerCase() === 'iptal') return false;
                return !isAppointmentPast(app, date);
            });
            if (activeApps.length > 0) {
                activeAppointmentsByDate[date] = activeApps;
            }
        });
        appointmentsByDateForCalendar = activeAppointmentsByDate;

        console.log('Tarihe Göre Gruplanmış Randevular:', appointmentsByDate);

        renderCalendar();
        displayAppointmentsForDate(selectedDate);
    } catch (error) {
        console.error('Hata:', error);
        showAlert('Randevular yüklenirken hata oluştu: ' + error.message, 'danger');
    }
}

// Yardımcı: Tarihi YYYY-MM-DD formatında üret (yerel zamana göre)
function getDateKey(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

// Takvimi Oluştur
function renderCalendar() {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();

    // Ayın ilk ve son günü
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const prevLastDay = new Date(year, month, 0);

    // Ay ve yıl başlığı
    const monthNames = ['Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran',
        'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık'];
    document.getElementById('monthYear').textContent = `${monthNames[month]} ${year}`;

    // Takvim gridini temizle
    const calendarGrid = document.getElementById('calendarGrid');
    calendarGrid.innerHTML = '';

    // Önceki ayın günleri
    const prevStartDay = firstDay.getDay() || 7;
    for (let i = prevStartDay - 1; i > 0; i--) {
        const day = prevLastDay.getDate() - i + 1;
        createDayElement(calendarGrid, day, 'other-month', false, null);
    }

    // Mevcut ayın günleri
    for (let day = 1; day <= lastDay.getDate(); day++) {
        const date = new Date(year, month, day);
        const dateStr = getDateKey(date);
        const hasAppointment = appointmentsByDateForCalendar[dateStr] && appointmentsByDateForCalendar[dateStr].length > 0;
        const isToday = isDateToday(date);
        const isSelected = isDateEqual(date, selectedDate);

        let classes = '';
        if (isToday) classes += 'today ';
        if (isSelected) classes += 'selected ';
        if (hasAppointment) classes += 'has-appointment';

        const dayEl = createDayElement(calendarGrid, day, classes.trim(), true, date);
    }

    // Sonraki ayın günleri
    const nextDaysCount = (7 - ((lastDay.getDay() || 7) % 7)) % 7;
    for (let day = 1; day <= nextDaysCount; day++) {
        createDayElement(calendarGrid, day, 'other-month', false, null);
    }
}

// Gün elemanı oluştur
function createDayElement(container, day, classes, clickable, date) {
    const el = document.createElement('div');
    el.className = `calendar-day ${classes}`;
    el.textContent = day;

    if (clickable && date) {
        el.style.cursor = 'pointer';
        el.addEventListener('click', () => {
            selectedDate = new Date(date);
            renderCalendar();
            displayAppointmentsForDate(selectedDate);
        });
    }

    container.appendChild(el);
    return el;
}

// Randevu geçmişte mi kontrol et (tarih + saat)
function isAppointmentPast(app, dateStr) {
    const appTime = typeof app.saat === 'string' ? app.saat.trim() : String(app.saat || '');
    const [h = 0, m = 0] = appTime.split(':').map(Number);
    const appDate = new Date(dateStr + 'T' + String(h).padStart(2, '0') + ':' + String(m).padStart(2, '0') + ':00');
    return appDate <= new Date();
}

// Seçili tarih için randevuları göster
function displayAppointmentsForDate(date) {
    const dateStr = getDateKey(date);
    const dayNames = ['Pazar', 'Pazartesi', 'Salı', 'Çarşamba', 'Perşembe', 'Cuma', 'Cumartesi'];
    const monthNames = ['Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran',
        'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık'];

    const dayName = dayNames[date.getDay()];
    const monthName = monthNames[date.getMonth()];
    const displayDate = `${dayName}, ${date.getDate()} ${monthName} ${date.getFullYear()}`;

    document.getElementById('selectedDateDisplay').textContent = displayDate + ' Randevuları';

    const appointments = appointmentsByDate[dateStr] || [];
    const content = document.getElementById('appointmentsContent');

    if (appointments.length === 0) {
        content.innerHTML = `
                    <div class="empty-state">
                        <div class="empty-icon">
                            <i class="bi bi-calendar-x"></i>
                        </div>
                        <div class="empty-text">Bu tarihte randevunuz bulunmamaktadır</div>
                    </div>
                `;
    } else {
        content.innerHTML = appointments.map(app => {
            const isPast = isAppointmentPast(app, dateStr);
            const durumDisplay = isPast ? 'Geçmiş Randevu' : (app.durum || '');
            const durumClass = isPast ? 'gecmis' : (app.durum || '').toLowerCase().replace(/ı/g, 'i').replace(/\s+/g, '-');
            const showCancel = !isPast && app.durum && app.durum !== 'İptal';
            const saatStr = typeof app.saat === 'string' && app.saat.length >= 5 ? app.saat.substring(0, 5) : app.saat;

            return `
                    <div class="appointment-item ${isPast ? 'appointment-past' : ''}">
                        <div class="appointment-header">
                            <div class="appointment-service">${app.hizmetAdi || 'Hizmet'}</div>
                            <span class="appointment-status status-${durumClass}">
                                ${durumDisplay}
                            </span>
                        </div>

                        <div class="appointment-details">
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

                        <div class="appointment-shop">
                            <div class="shop-name">${app.firmaAdi}</div>
                            <small>${app.cadde || ''} ${app.sokak || ''}</small>
                        </div>

                        ${app.notlar ? `<div class="appointment-notes"><i class="bi bi-chat-dots"></i> ${app.notlar}</div>` : ''}

                        ${showCancel ? `
                        <div class="appointment-actions">
                            <button class="action-btn cancel" onclick="cancelAppointment(${app.id})">
                                <i class="bi bi-x-lg"></i> İptal Et
                            </button>
                        </div>
                        ` : ''}
                    </div>
                `;
        }).join('');
    }
}

// Randevu İptal
async function cancelAppointment(id) {
    const result = await Swal.fire({
        title: 'Randevuyu İptal Et',
        text: 'Bu randevuyu iptal etmek istediğinizden emin misiniz?',
        icon: 'warning',
        showCancelButton: true,
        confirmButtonText: 'Evet, İptal Et',
        cancelButtonText: 'Vazgeç',
        confirmButtonColor: '#dc3545',
        cancelButtonColor: '#6c757d'
    });
    if (!result.isConfirmed) return;

    try {
        const token = localStorage.getItem('token');
        const response = await fetch(`/api/randevu/iptal/${id}`, {
            method: 'PUT',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });

        if (response.ok) {
            showAlert('Randevu başarıyla iptal edildi', 'success');
            await loadAppointments();
        } else {
            showAlert('Randevu iptal edilirken hata oluştu', 'danger');
        }
    } catch (error) {
        console.error('Hata:', error);
        showAlert('Hata oluştu: ' + error.message, 'danger');
    }
}

// Takvim Navigasyonu
function previousMonth() {
    currentDate.setMonth(currentDate.getMonth() - 1);
    renderCalendar();
}

function nextMonth() {
    currentDate.setMonth(currentDate.getMonth() + 1);
    renderCalendar();
}

function today() {
    currentDate = new Date();
    selectedDate = new Date();
    renderCalendar();
    displayAppointmentsForDate(selectedDate);
}

// Yardımcı Fonksiyonlar
function isDateToday(date) {
    const today = new Date();
    return date.getDate() === today.getDate() &&
        date.getMonth() === today.getMonth() &&
        date.getFullYear() === today.getFullYear();
}

function isDateEqual(date1, date2) {
    return date1.getDate() === date2.getDate() &&
        date1.getMonth() === date2.getMonth() &&
        date1.getFullYear() === date2.getFullYear();
}

// Alert Göster
function showAlert(message, type) {
    const alertContainer = document.createElement('div');
    alertContainer.className = `alert alert-${type} position-fixed top-0 start-50 translate-middle-x mt-3`;
    alertContainer.style.zIndex = '2000';
    alertContainer.style.maxWidth = '500px';
    alertContainer.innerHTML = `
                <i class="bi ${type === 'success' ? 'bi-check-circle' : 'bi-exclamation-circle'}"></i> ${message}
            `;
    document.body.appendChild(alertContainer);

    setTimeout(() => {
        alertContainer.remove();
    }, 3000);
}

// Yeni eklenen
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
    if (profileSection && !profileSection.contains(e.target)) {
        const dropdown = document.getElementById('profileDropdown');
        if (dropdown) dropdown.classList.remove('show');
    }
});

// Dropdown menü fonksiyonları

function goToProfile() {
    Swal.fire({
        title: 'Sistem Güncellemesi',
        text: 'Ayarlar sayfası şu an bakım ve geliştirme aşamasındadır. En kısa sürede hizmete açılacaktır.',
        icon: 'warning',
        confirmButtonText: 'Anladım',
        confirmButtonColor: '#2c3e50', // Kurumsal bir lacivert/gri tonu
        showClass: {
            popup: 'animate__animated animate__fadeInDown' // Hafif bir giriş animasyonu
        },
        hideClass: {
            popup: 'animate__animated animate__fadeOutUp'
        }
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

// Sayfa yüklendiğinde auth kontrol et
document.addEventListener('DOMContentLoaded', () => {
    checkAuth();

    // Bootstrap tooltips initialize et
    const tooltipTriggerList = [].slice.call(document.querySelectorAll('[data-bs-toggle="tooltip"]'));
    tooltipTriggerList.map(function (tooltipTriggerEl) {
        return new bootstrap.Tooltip(tooltipTriggerEl);
    });
});