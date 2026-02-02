const passwordInput = document.getElementById('passwordInput');
const togglePasswordBtn = document.getElementById('togglePassword');
const successAlert = document.getElementById('successAlert');
const errorAlert = document.getElementById('errorAlert');

// Password show/hide toggle
togglePasswordBtn.addEventListener('click', function () {
    const type = passwordInput.getAttribute('type') === 'password' ? 'text' : 'password';
    passwordInput.setAttribute('type', type);
    togglePasswordBtn.innerHTML = type === 'password' ? '<i class="bi bi-eye"></i>' : '<i class="bi bi-eye-slash"></i>';
});

// Form submission
document.getElementById('loginForm').addEventListener('submit', async (e) => {
    e.preventDefault();

    const email = document.getElementById('email').value.trim();
    const password = document.getElementById('passwordInput').value;
    const loginBtn = document.getElementById('loginBtn');

    if (!email || !password) {
        errorAlert.innerHTML = '<strong>✕ Hata!</strong> Tüm alanları doldurunuz';
        errorAlert.style.display = 'block';
        successAlert.style.display = 'none';
        return;
    }

    loginBtn.disabled = true;
    loginBtn.innerHTML = '<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>Giriş yapılıyor...';
    errorAlert.style.display = 'none';
    successAlert.style.display = 'none';

    try {
        const response = await fetch('http://localhost:3000/api/musteri/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                email,
                password,
            }),
        });

        const data = await response.json();

        if (response.ok && data.token) {
            localStorage.setItem('token', data.token);
            localStorage.setItem('user', JSON.stringify({
                id: data.user.id,
                name: data.user.name,
                email: data.user.email,
                type: 'musteri'
            }));
            document.getElementById('successMessage').textContent = 'Giriş başarılı! Yönlendiriliyorsunuz...';
            successAlert.style.display = 'block';
            setTimeout(() => {
                window.location.href = 'index.html';
            }, 2000);
        } else {
            errorAlert.innerHTML = `<strong>✕ Hata!</strong> ${data.message || 'Giriş başarısız'}`;
            errorAlert.style.display = 'block';
            loginBtn.disabled = false;
            loginBtn.innerHTML = 'Giriş Yap';
        }
    } catch (error) {
        errorAlert.innerHTML = `<strong>✕ Hata!</strong> Sunucu hatası: ${error.message}`;
        errorAlert.style.display = 'block';
        loginBtn.disabled = false;
        loginBtn.innerHTML = 'Giriş Yap';
    }
});