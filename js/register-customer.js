const form = document.getElementById('registerForm');
const registerBtn = document.getElementById('registerBtn');
const passwordInput = document.getElementById('password');
const togglePasswordBtn = document.getElementById('togglePassword');
const alertContainer = document.getElementById('alertContainer');

// Password show/hide toggle
togglePasswordBtn.addEventListener('click', function () {
    const type = passwordInput.getAttribute('type') === 'password' ? 'text' : 'password';
    passwordInput.setAttribute('type', type);
    togglePasswordBtn.innerHTML = type === 'password' ? '<i class="bi bi-eye"></i>' : '<i class="bi bi-eye-slash"></i>';
});

// Password strength checker
passwordInput.addEventListener('input', function () {
    const password = this.value;
    const strengthDiv = document.getElementById('passwordStrength');

    if (password.length === 0) {
        strengthDiv.classList.remove('weak', 'medium', 'strong');
        return;
    }

    let strength = 0;
    if (password.length >= 6) strength++;
    if (/[a-z]/.test(password) && /[A-Z]/.test(password)) strength++;
    if (/[0-9]/.test(password)) strength++;
    if (/[!@#$%^&*]/.test(password)) strength++;

    strengthDiv.classList.remove('weak', 'medium', 'strong');

    if (strength === 1) {
        strengthDiv.classList.add('weak');
        strengthDiv.textContent = '🔴 Zayıf Şifre - En az 6 karakter gereklidir';
    } else if (strength === 2 || strength === 3) {
        strengthDiv.classList.add('medium');
        strengthDiv.textContent = '🟡 Orta Seviye Şifre - Daha güçlü şifre önerilir';
    } else if (strength >= 4) {
        strengthDiv.classList.add('strong');
        strengthDiv.textContent = '🟢 Güçlü Şifre - İyi seçim!';
    }
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
form.addEventListener('submit', async (e) => {
    e.preventDefault();

    const isim = document.getElementById('isim').value.trim();
    const email = document.getElementById('email').value.trim();
    const telefon = document.getElementById('telefon').value.trim();
    const password = document.getElementById('password').value;

    // Validation
    if (!isim || !email || !telefon || !password) {
        showAlert('⚠️ Tüm alanları doldurunuz', 'danger');
        return;
    }

    // Basit telefon format kontrolü (zorunlu değil ama yardımcı)
    const telDigits = telefon.replace(/\D/g, '');
    if (telDigits.length < 10) {
        showAlert('⚠️ Geçerli bir telefon numarası giriniz', 'danger');
        return;
    }

    if (password.length < 6) {
        showAlert('⚠️ Şifre minimum 6 karakter olmalıdır', 'danger');
        return;
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
        showAlert('⚠️ Geçerli bir e-posta adresi giriniz', 'danger');
        return;
    }

    registerBtn.disabled = true;
    registerBtn.innerHTML = '<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span><span id="btnText">Kaydediliyor...</span>';

    try {
        const response = await fetch('http://localhost:3000/api/musteri/register', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                isim,
                email,
                telefon,
                password,
            }),
        });

        const data = await response.json();

        if (response.ok) {
            showAlert('✅ Kayıt başarılı! Giriş sayfasına yönlendiriliyorsunuz...', 'success');
            setTimeout(() => {
                window.location.href = 'login-customer.html';
            }, 2000);
        } else {
            showAlert(`❌ ${data.message || 'Kayıt başarısız'}`, 'danger');
            registerBtn.disabled = false;
            registerBtn.innerHTML = '<span id="btnText">Kayıt Ol</span>';
        }
    } catch (error) {
        showAlert(`❌ Sunucu hatası: ${error.message}`, 'danger');
        registerBtn.disabled = false;
        registerBtn.innerHTML = '<span id="btnText">Kayıt Ol</span>';
    }
});