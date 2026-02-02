const API_URL = 'http://localhost:3000/api';

const form = document.getElementById('profileForm');
const saveBtn = document.getElementById('saveBtn');
const alertContainer = document.getElementById('alertContainer');

function showAlert(message, type) {
    alertContainer.innerHTML = `
                <div class="alert alert-${type} alert-dismissible fade show" role="alert">
                    ${message}
                    <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Kapat"></button>
                </div>
            `;
}

// Profil bilgilerini yükle
async function loadProfile() {
    try {
        const token = localStorage.getItem('token');

        if (!token) {
            window.location.href = 'login-customer.html';
            return;
        }

        const response = await fetch(`${API_URL}/musteri/profil`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        const data = await response.json();

        if (!response.ok || !data.success) {
            showAlert(data.message || 'Profil bilgileri yüklenemedi', 'danger');
            return;
        }

        const user = data.user;
        document.getElementById('isim').value = user.musteri_adi || '';
        document.getElementById('email').value = user.musteri_email || '';
        document.getElementById('telefon').value = user.musteri_tel || '';
    } catch (error) {
        console.error('Profil yükleme hatası:', error);
        showAlert('Profil bilgileri yüklenirken hata oluştu: ' + error.message, 'danger');
    }
}

// Form submit
form.addEventListener('submit', async (e) => {
    e.preventDefault();

    const musteri_adi = document.getElementById('isim').value.trim();
    const musteri_tel = document.getElementById('telefon').value.trim();

    if (!musteri_adi || !musteri_tel) {
        showAlert('⚠️ Ad soyad ve telefon alanları zorunludur', 'danger');
        return;
    }

    const telDigits = musteri_tel.replace(/\D/g, '');
    if (telDigits.length < 10) {
        showAlert('⚠️ Geçerli bir telefon numarası giriniz', 'danger');
        return;
    }

    saveBtn.disabled = true;
    saveBtn.innerHTML = '<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span><span id="btnText">Kaydediliyor...</span>';

    try {
        const token = localStorage.getItem('token');

        const response = await fetch(`${API_URL}/musteri/profil`, {
            method: 'PUT',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                musteri_adi,
                musteri_tel
            })
        });

        const data = await response.json();

        if (response.ok && data.success) {
            showAlert('✅ Profil bilgileri başarıyla güncellendi', 'success');

            // LocalStorage'daki user objesini de güncelle
            const storedUser = localStorage.getItem('user');
            if (storedUser) {
                const userObj = JSON.parse(storedUser);
                userObj.name = musteri_adi;
                localStorage.setItem('user', JSON.stringify(userObj));
            }

            setTimeout(() => {
                window.location.href = 'index.html';
            }, 1500);
        } else {
            showAlert(data.message || 'Profil güncellenemedi', 'danger');
            saveBtn.disabled = false;
            saveBtn.innerHTML = '<span id="btnText">Kaydet</span>';
        }
    } catch (error) {
        console.error('Profil güncelleme hatası:', error);
        showAlert('❌ Kayıt sırasında hata oluştu: ' + error.message, 'danger');
        saveBtn.disabled = false;
        saveBtn.innerHTML = '<span id="btnText">Kaydet</span>';
    }
});

document.addEventListener('DOMContentLoaded', () => {
    loadProfile();
});

