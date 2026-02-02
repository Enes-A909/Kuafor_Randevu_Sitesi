// URL'den kuaför ID'sini al
const urlParams = new URLSearchParams(window.location.search);
const kuaforId = urlParams.get('kuafor_id');

const randevuForm = document.getElementById('randevuForm');
const errorMessage = document.getElementById('errorMessage');
const successMessage = document.getElementById('successMessage');
const submitBtn = document.getElementById('submitBtn');

// Giriş kontrolü
function checkAuth() {
    const token = localStorage.getItem('token');
    const user = localStorage.getItem('user');

    if (!token || !user) {
        window.location.href = 'login-customer.html';
        return false;
    }
    return true;
}

async function kuaforBilgisiniGetir() {
    if (!kuaforId) {
        errorMessage.textContent = 'Geçerli bir kuaför seçiniz.';
        errorMessage.style.display = 'block';
        return;
    }

    try {
        const response = await fetch(`/api/kuaforler/${kuaforId}`);
        const firma = await response.json();

        document.getElementById('kuaforAdi').textContent = firma.firmaAdi;
        document.getElementById('kuaforKonum').textContent = `${firma.ilceAdi}, ${firma.sehirAdi}`;

        // Hizmetleri doldur
        const hizmetResponse = await fetch(`/api/kuaforler/${kuaforId}/hizmetler`);
        const hizmetler = await hizmetResponse.json();

        const hizmetSelect = document.getElementById('hizmet');
        hizmetSelect.innerHTML = '<option value="">Hizmet Seçiniz</option>';
        hizmetler.forEach(h => {
            const option = document.createElement('option');
            option.value = h.id;
            option.textContent = `${h.hizmetAdi} (${h.fiyat}₺)`;
            hizmetSelect.appendChild(option);
        });

        // Bugünün tarihini varsayılan yap ve müsait saatleri yükle
        const today = new Date().toISOString().split('T')[0];
        document.getElementById('tarih').value = today;
        await musaitSaatleriYukle(today);
    } catch (error) {
        console.error('Hata:', error);
        errorMessage.textContent = 'Kuaför bilgisi getirilemedi.';
        errorMessage.style.display = 'block';
    }
}

// Sadece müsait (boş) saatleri yükle - dolu slotlar gösterilmez
async function musaitSaatleriYukle(tarih) {
    const zamanSlotlari = document.getElementById('zamanSlotlari');
    if (!kuaforId || !tarih) {
        zamanSlotlari.innerHTML = '<p class="text-muted">Önce tarih seçiniz.</p>';
        return;
    }

    zamanSlotlari.innerHTML = '<p class="text-muted">Yükleniyor...</p>';

    try {
        const response = await fetch(`/api/randevu/musait-saatler?firma_id=${kuaforId}&tarih=${tarih}`);
        const data = await response.json();

        if (!response.ok) {
            zamanSlotlari.innerHTML = '<p class="text-danger">Saatler yüklenemedi.</p>';
            return;
        }

        const musaitSaatler = data.musaitSaatler || [];

        if (musaitSaatler.length === 0) {
            zamanSlotlari.innerHTML = '<p class="text-muted">Bu tarihte müsait saat bulunmamaktadır.</p>';
            return;
        }

        zamanSlotlari.innerHTML = musaitSaatler
            .map((saat, index) => `
                <div class="time-slot">
                    <input type="radio" id="zaman${index}" name="zaman" value="${saat}" required>
                    <label for="zaman${index}">${saat}</label>
                </div>
            `)
            .join('');
    } catch (error) {
        console.error('Müsait saatler hatası:', error);
        zamanSlotlari.innerHTML = '<p class="text-danger">Saatler yüklenirken hata oluştu.</p>';
    }
}

randevuForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    const zamanSecim = document.querySelector('input[name="zaman"]:checked');
    if (!zamanSecim) {
        errorMessage.textContent = 'Lütfen müsait bir saat seçiniz.';
        errorMessage.style.display = 'block';
        return;
    }

    const token = localStorage.getItem('token');
    const user = JSON.parse(localStorage.getItem('user'));

    const formData = {
        firma_id: parseInt(kuaforId),
        musteri_id: user.id,
        hizmet_id: parseInt(document.getElementById('hizmet').value),
        tarih: document.getElementById('tarih').value,
        saat: zamanSecim.value,
        notlar: document.getElementById('notlar').value || null
    };

    submitBtn.disabled = true;
    submitBtn.textContent = 'Randevu Alınıyor...';

    try {
        const response = await fetch('/api/randevu/olustur', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(formData)
        });

        const data = await response.json();

        if (response.ok) {
            successMessage.style.display = 'block';
            errorMessage.style.display = 'none';
            randevuForm.reset();

            setTimeout(() => {
                window.location.href = 'index.html';
            }, 2000);
        } else {
            errorMessage.textContent = data.message || 'Randevu alınırken bir hata oluştu.';
            errorMessage.style.display = 'block';
            submitBtn.disabled = false;
            submitBtn.textContent = 'Randevu Al';
        }
    } catch (error) {
        console.error('Hata:', error);
        errorMessage.textContent = 'Sunucu hatası: ' + error.message;
        errorMessage.style.display = 'block';
        submitBtn.disabled = false;
        submitBtn.textContent = 'Randevu Al';
    }
});

// Sayfa yüklendiğinde
document.addEventListener('DOMContentLoaded', () => {
    if (!checkAuth()) return;

    const today = new Date().toISOString().split('T')[0];
    document.getElementById('tarih').setAttribute('min', today);

    kuaforBilgisiniGetir();

    // Tarih değiştiğinde müsait saatleri yeniden yükle
    document.getElementById('tarih').addEventListener('change', (e) => {
        musaitSaatleriYukle(e.target.value);
    });
});