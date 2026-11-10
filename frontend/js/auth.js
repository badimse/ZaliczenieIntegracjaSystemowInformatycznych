// Obsługa logowania i rejestracji

function setupAuthForms() {
    const loginForm = document.getElementById('loginForm');
    const registerForm = document.getElementById('registerForm');
    
    if (loginForm) {
        loginForm.addEventListener('submit', handleLogin);
    }
    
    if (registerForm) {
        registerForm.addEventListener('submit', handleRegister);
    }
    
    updateAuthUI();
}

async function handleLogin(e) {
    e.preventDefault();
    
    const email = document.getElementById('loginEmail').value;
    const password = document.getElementById('loginPassword').value;
    
    try {
        await loginUser(email, password);
        showToast('Zalogowano pomyślnie!', 'success');
        updateAuthUI();
        
        // Zamknij modal i przeładuj stronę
        const modal = document.getElementById('loginModal');
        if (modal) {
            modal.classList.remove('active');
        }
        window.location.reload();
    } catch (error) {
        showToast(error.message || 'Błąd logowania', 'error');
    }
}

async function handleRegister(e) {
    e.preventDefault();
    
    const imie = document.getElementById('registerImie').value;
    const nazwisko = document.getElementById('registerNazwisko').value;
    const email = document.getElementById('registerEmail').value;
    const password = document.getElementById('registerPassword').value;
    const passwordConfirm = document.getElementById('registerPasswordConfirm').value;
    
    console.log('Rejestracja - dane:', { imie, nazwisko, email, password });
    
    if (password !== passwordConfirm) {
        showToast('Hasła nie są identyczne', 'error');
        return;
    }
    
    try {
        const result = await registerUser({ imie, nazwisko, email, password, password_confirm: passwordConfirm });
        console.log('Rejestracja - wynik:', result);
        showToast('Konto utworzone! Zaloguj się.', 'success');
        
        // Przełącz na formularz logowania
        const registerModal = document.getElementById('registerModal');
        const loginModal = document.getElementById('loginModal');
        if (registerModal) registerModal.classList.remove('active');
        if (loginModal) loginModal.classList.add('active');
    } catch (error) {
        console.error('Błąd rejestracji:', error);
        showToast(error.message || 'Błąd rejestracji', 'error');
    }
}

function updateAuthUI() {
    const token = getAuthToken();
    const loginBtn = document.getElementById('loginBtn');
    const registerBtn = document.getElementById('registerBtn');
    const userMenu = document.getElementById('userMenu');
    const userName = document.getElementById('userName');
    const adminLink = document.getElementById('adminLink');
    
    console.log('updateAuthUI - token:', token);
    console.log('updateAuthUI - registerBtn:', registerBtn);
    console.log('updateAuthUI - adminLink:', adminLink);
    
    if (token) {
        // Użytkownik zalogowany
        if (loginBtn) loginBtn.style.display = 'none';
        if (registerBtn) registerBtn.style.display = 'none';
        if (userMenu) userMenu.style.display = 'block';
        
        // Pobierz imię użytkownika i sprawdź czy jest administratorem
        getUserProfile().then(profile => {
            console.log('Profile:', profile);
            if (userName) userName.textContent = profile.imie || 'Użytkownik';
            
            // Pokaż link do panelu administratora tylko dla adminów
            if (adminLink) {
                console.log('is_staff:', profile.is_staff);
                adminLink.style.display = profile.is_staff ? 'block' : 'none';
            }
        }).catch(err => {
            console.error('Błąd pobierania profilu:', err);
            if (userName) userName.textContent = 'Użytkownik';
            if (adminLink) adminLink.style.display = 'none';
        });
    } else {
        // Użytkownik niezalogowany
        if (loginBtn) loginBtn.style.display = 'block';
        if (registerBtn) registerBtn.style.display = 'block';
        if (userMenu) userMenu.style.display = 'none';
        if (adminLink) adminLink.style.display = 'none';
    }
}

function setupLogout() {
    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', () => {
            logoutUser();
        });
    }
}

// Pokaż modal logowania
function showLoginModal() {
    const modal = document.getElementById('loginModal');
    if (modal) {
        modal.classList.add('active');
    }
}

// Pokaż modal rejestracji
function showRegisterModal() {
    const modal = document.getElementById('registerModal');
    if (modal) {
        modal.classList.add('active');
    }
}

// Zamknij modale
function closeModals() {
    document.querySelectorAll('.modal').forEach(modal => {
        modal.classList.remove('active');
    });
}

// Inicjalizacja auth
document.addEventListener('DOMContentLoaded', () => {
    setupAuthForms();
    setupLogout();
    
    // Obsługa przycisku logowania w navbar
    const loginBtn = document.getElementById('loginBtn');
    if (loginBtn) {
        loginBtn.addEventListener('click', showLoginModal);
    }
    
    // Obsługa przycisku rejestracji w navbar
    const registerBtn = document.getElementById('registerBtn');
    if (registerBtn) {
        registerBtn.addEventListener('click', showRegisterModal);
    }
    
    // Obsługa przycisków logowania/rejestracji w modalach
    document.querySelectorAll('.login-trigger').forEach(btn => {
        btn.addEventListener('click', showLoginModal);
    });
    
    document.querySelectorAll('.register-trigger').forEach(btn => {
        btn.addEventListener('click', showRegisterModal);
    });
    
    // Zamknięcie modala po kliknięciu outside
    document.querySelectorAll('.modal-overlay').forEach(overlay => {
        overlay.addEventListener('click', closeModals);
    });
});
