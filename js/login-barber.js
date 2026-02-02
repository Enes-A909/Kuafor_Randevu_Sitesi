const passwordInput = document.getElementById('passwordInput');
const togglePasswordBtn = document.getElementById('togglePassword');
const alertContainer = document.getElementById('alertContainer');

// Password show/hide toggle - HATALAR DÜZELTİLDİ
togglePasswordBtn.addEventListener('click', function () {
    const type = passwordInput.getAttribute('type') === 'password' ? 'text' : 'password';
    passwordInput.setAttribute('type', type);
    togglePasswordBtn.innerHTML = type === 'password' ? '<i class="bi bi-eye"></i>' : '<i class="bi bi-eye-slash"></i>';
});

// Show alert
function showAlert(message, type) {
    alertContainer.innerHTML = `
                <div class="alert alert-${type} alert-dismissible fade show" role="alert">
                    ${message}
                    <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Kapat"></button>
                </div>
            `;
}

// Form submission
document.getElementById('loginForm').addEventListener('submit', async (e) => {
    e.preventDefault();

    const eposta = document.getElementById('eposta').value.trim();
    const password = document.getElementById('passwordInput').value;
    const loginBtn = document.getElementById('loginBtn');

    if (!eposta || !password) {
        showAlert('⚠️ Tüm alanları doldurunuz', 'danger');
        return;
    }

    loginBtn.disabled = true;
    loginBtn.innerHTML = '<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>Giriş yapılıyor...';

    try {
        const response = await fetch('http://localhost:3000/api/kuafor/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                eposta,
                password,
            }),
        });

        const data = await response.json();

        if (response.ok && data.token) {
            localStorage.setItem('kuaforToken', data.token);
            localStorage.setItem('kuaforUser', JSON.stringify({
                id: data.user.id,
                salonAdi: data.user.salonAdi,
                yetkiliAdi: data.user.yetkiliAdi,
                email: data.user.email,
                type: 'kuafor'
            }));
            showAlert('✅ Giriş başarılı! Yönlendiriliyorsunuz...', 'success');
            setTimeout(() => {
                window.location.href = 'kuafor-paneli.html';
            }, 2000);
        } else {
            showAlert(`❌ ${data.message || 'Giriş başarısız'}`, 'danger');
            loginBtn.disabled = false;
            loginBtn.innerHTML = 'Giriş Yap';
        }
    } catch (error) {
        showAlert(`❌ Sunucu hatası: ${error.message}`, 'danger');
        loginBtn.disabled = false;
        loginBtn.innerHTML = 'Giriş Yap';
    }
});