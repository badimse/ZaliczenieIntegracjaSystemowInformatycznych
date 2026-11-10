// Panel Administratora - JavaScript

// Sprawdź czy użytkownik jest administratorem
function isAdmin() {
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    return user.is_staff || false;
}

// Sprawdź autoryzację przy ładowaniu strony
document.addEventListener('DOMContentLoaded', () => {
    console.log('Admin.js załadowany');
    
    const token = getAuthToken();
    console.log('Token:', token);
    
    if (token) {
        // Pobierz profil i sprawdź czy admin
        getUserProfile().then(profile => {
            console.log('Profil:', profile);
            localStorage.setItem('user', JSON.stringify(profile));
            
            if (profile.is_staff) {
                showAdminPanel();
                loadProducts();
            } else {
                showToast('Brak uprawnień administratora', 'error');
                setTimeout(() => window.location.href = 'index.html', 2000);
            }
        }).catch(err => {
            console.error('Błąd pobierania profilu:', err);
            showToast('Sesja wygasła. Zaloguj się ponownie.', 'error');
        });
    }
    
    // Formularz logowania
    const loginForm = document.getElementById('adminLoginForm');
    if (loginForm) {
        loginForm.addEventListener('submit', handleAdminLogin);
        console.log('Dodano event listener do formularza logowania');
    }
    
    // Formularz produktu
    const productForm = document.getElementById('productForm');
    if (productForm) {
        productForm.addEventListener('submit', handleProductSubmit);
    }
    
    // Obsługa zmiany kategorii w formularzu produktu
    setupProductCategoryChange();
    
    // Logout
    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', () => {
            logoutUser();
            window.location.href = 'index.html';
        });
    }
    
    // Tabs
    setupTabs();
});

// Logowanie administratora
async function handleAdminLogin(e) {
    e.preventDefault();
    
    const email = document.getElementById('adminEmail').value;
    const password = document.getElementById('adminPassword').value;
    
    console.log('Logowanie:', email);
    
    try {
        const response = await fetch(`${API_BASE_URL}/auth/login/`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ email, password }),
        });
        
        const data = await response.json();
        console.log('Odpowiedź:', data);
        
        if (!response.ok) {
            throw new Error(data.detail || 'Błąd logowania');
        }
        
        setAuthToken(data.access, data.refresh);
        
        // Pobierz profil użytkownika
        const profile = await getUserProfile();
        localStorage.setItem('user', JSON.stringify(profile));
        console.log('Profil po logowaniu:', profile);
        
        // Sprawdź czy użytkownik jest administratorem
        if (!profile.is_staff) {
            showToast('Brak uprawnień administratora', 'error');
            logoutUser();
            return;
        }
        
        showToast('Zalogowano pomyślnie!', 'success');
        showAdminPanel();
        loadProducts();
        
    } catch (error) {
        console.error('Błąd logowania:', error);
        const errorEl = document.getElementById('loginError');
        if (errorEl) errorEl.textContent = error.message;
        showToast(error.message || 'Błąd logowania', 'error');
    }
}

// Pokaż panel administratora
function showAdminPanel() {
    const loginSection = document.getElementById('adminLoginSection');
    const adminPanel = document.getElementById('adminPanel');
    
    if (loginSection) loginSection.style.display = 'none';
    if (adminPanel) adminPanel.style.display = 'block';
    
    console.log('Panel administratora pokazany');
}

// Tabs
function setupTabs() {
    const tabButtons = document.querySelectorAll('.tab-btn');
    tabButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            const tabId = btn.dataset.tab;
            
            // Usuń active ze wszystkich
            document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
            document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
            
            // Dodaj active do wybranego
            btn.classList.add('active');
            document.getElementById(`${tabId}Tab`).classList.add('active');
            
            // Załaduj dane dla zakładki
            if (tabId === 'orders') loadOrders();
            if (tabId === 'returns') loadReturns();
            if (tabId === 'users') loadUsers();
            if (tabId === 'opinions') loadOpinions();
        });
    });
}

// Produkty - CRUD
let currentProductFilters = {
    kategoria: '',
    kolor: '',
    cena_min: '',
    cena_max: '',
    rozmiar: '',
    nazwa: ''
};

// Dostępne rozmiary dla każdej kategorii
const SIZES_BY_CATEGORY = {
    'bluzy': ['XS', 'S', 'M', 'L', 'XL', 'XXL'],
    't-shirty': ['XS', 'S', 'M', 'L', 'XL', 'XXL'],
    'spodnie': ['30', '32', '34', '36'],
    'akcesoria': ['UNI']
};

// Generuj pola rozmiarów dla danej kategorii
function generateSizeInputs(category, existingSizes = {}) {
    const container = document.getElementById('sizesContainer');
    if (!container) return;
    
    const sizes = SIZES_BY_CATEGORY[category] || [];
    
    if (sizes.length === 0) {
        container.innerHTML = '<p class="text-muted" style="color: #666;">Nieznana kategoria</p>';
        return;
    }
    
    container.innerHTML = '<div class="sizes-grid-inputs">' + 
        sizes.map(size => {
            const stan = existingSizes[size] || 0;
            return `
                <div class="size-input-item">
                    <label>${size}</label>
                    <input type="number" 
                           name="size_${size}" 
                           value="${stan}" 
                           min="0" 
                           placeholder="0"
                           data-size="${size}">
                </div>
            `;
        }).join('') + 
        '</div>';
}

// Obsługa zmiany kategorii w formularzu produktu
function setupProductCategoryChange() {
    const categorySelect = document.getElementById('productKategoria');
    if (!categorySelect) return;
    
    categorySelect.addEventListener('change', (e) => {
        const category = e.target.value;
        if (category) {
            generateSizeInputs(category);
        } else {
            document.getElementById('sizesContainer').innerHTML = 
                '<p class="text-muted" style="color: #666; font-size: 0.9rem;">Wybierz kategorię, aby zobaczyć dostępne rozmiary</p>';
        }
    });
}

async function loadProducts(filters = {}) {
    console.log('Ładowanie produktów...', filters);
    
    try {
        // Zbuduj query string z filtrami (tylko te obsługiwane przez backend)
        const params = new URLSearchParams();
        if (filters.kategoria) params.append('kategoria', filters.kategoria);
        if (filters.kolor) params.append('kolor', filters.kolor);
        if (filters.cena_min) params.append('cena_min', filters.cena_min);
        if (filters.cena_max) params.append('cena_max', filters.cena_max);
        
        const queryString = params.toString();
        const url = '/produkty/' + (queryString ? '?' + queryString : '');
        
        let products = await apiRequest(url);
        console.log('Produkty:', products);
        
        // Filtrowanie po rozmiarze i nazwie po stronie frontendu
        if (filters.rozmiar) {
            products = products.filter(p => 
                p.rozmiary && p.rozmiary.some(r => r.rozmiar === filters.rozmiar)
            );
        }
        
        if (filters.nazwa) {
            products = products.filter(p => 
                p.nazwa.toLowerCase().includes(filters.nazwa.toLowerCase())
            );
        }
        
        console.log('Produkty po filtrowaniu:', products);
        
        const tbody = document.getElementById('productsTableBody');
        if (!tbody) return;
        
        if (products.length === 0) {
            tbody.innerHTML = '<tr><td colspan="6">Brak produktów</td></tr>';
            return;
        }
        
        tbody.innerHTML = products.map(product => {
            // Pobierz rozmiary jako string
            const rozmiary = product.rozmiary && product.rozmiary.length > 0 
                ? product.rozmiary.map(r => `${r.rozmiar} (${r.stanMagazynowy})`).join(', ')
                : '-';
            
            return `
            <tr>
                <td>${product.id_produkt}</td>
                <td>${product.nazwa}</td>
                <td>${product.kategoria}</td>
                <td>${parseFloat(product.cenaBrutto).toFixed(2)} zł</td>
                <td style="font-size: 0.85rem;">${rozmiary}</td>
                <td class="actions">
                    <button class="btn btn-sm btn-edit" onclick="editProduct(${product.id_produkt})">Edytuj</button>
                    <button class="btn btn-sm btn-delete" onclick="deleteProduct(${product.id_produkt})">Usuń</button>
                </td>
            </tr>
        `;
        }).join('');
        
        showToast('Załadowano produkty', 'success');
    } catch (error) {
        console.error('Błąd ładowania produktów:', error);
        showToast('Nie udało się załadować produktów', 'error');
    }
}

// Filtrowanie produktów
function applyProductFilters() {
    const kategoria = document.getElementById('filterKategoria').value;
    const kolor = document.getElementById('filterKolor').value;
    const cena_min = document.getElementById('filterCenaMin').value;
    const cena_max = document.getElementById('filterCenaMax').value;
    const rozmiar = document.getElementById('filterRozmiar').value;
    const nazwa = document.getElementById('filterNazwa').value;
    
    currentProductFilters = { kategoria, kolor, cena_min, cena_max, rozmiar, nazwa };
    loadProducts(currentProductFilters);
}

function clearProductFilters() {
    document.getElementById('filterKategoria').value = '';
    document.getElementById('filterKolor').value = '';
    document.getElementById('filterCenaMin').value = '';
    document.getElementById('filterCenaMax').value = '';
    document.getElementById('filterRozmiar').value = '';
    document.getElementById('filterNazwa').value = '';
    currentProductFilters = { kategoria: '', kolor: '', cena_min: '', cena_max: '', rozmiar: '', nazwa: '' };
    loadProducts();
}

// Dodaj/Edytuj produkt
function showAddProductModal() {
    document.getElementById('productModalTitle').textContent = 'Dodaj Produkt';
    document.getElementById('productForm').reset();
    document.getElementById('productId').value = '';
    document.getElementById('productModal').classList.add('active');
}

function closeProductModal() {
    document.getElementById('productModal').classList.remove('active');
}

async function editProduct(productId) {
    try {
        const products = await apiRequest('/produkty/');
        const product = products.find(p => p.id_produkt === productId);
        
        if (!product) {
            showToast('Nie znaleziono produktu', 'error');
            return;
        }
        
        document.getElementById('productModalTitle').textContent = 'Edytuj Produkt';
        document.getElementById('productId').value = product.id_produkt;
        document.getElementById('productNazwa').value = product.nazwa;
        document.getElementById('productKategoria').value = product.kategoria;
        document.getElementById('productCena').value = product.cenaBrutto;
        document.getElementById('productKolor').value = product.kolor;
        document.getElementById('productOpis').value = product.opis;
        document.getElementById('productZdjecieFile').value = '';
        
        // Generuj pola rozmiarów z istniejącymi danymi
        const existingSizes = {};
        if (product.rozmiary && product.rozmiary.length > 0) {
            product.rozmiary.forEach(r => {
                existingSizes[r.rozmiar] = r.stanMagazynowy;
            });
        }
        generateSizeInputs(product.kategoria, existingSizes);
        
        // Pokaż podgląd zdjęcia jeśli istnieje
        const preview = document.getElementById('productPreview');
        if (product.zdjecie_url) {
            preview.src = product.zdjecie_url;
            preview.style.display = 'block';
        } else {
            preview.style.display = 'none';
        }
        
        document.getElementById('productModal').classList.add('active');
    } catch (error) {
        showToast('Nie udało się załadować produktu', 'error');
    }
}

async function deleteProduct(productId) {
    if (!confirm('Czy na pewno chcesz usunąć ten produkt?')) return;
    
    try {
        await apiRequest(`/produkty/${productId}/`, {
            method: 'DELETE',
        });
        showToast('Produkt usunięty', 'success');
        loadProducts();
    } catch (error) {
        showToast('Nie udało się usunąć produktu', 'error');
    }
}

// Obsługa formularza produktu (Poprawiona dla zdjęć!)
async function handleProductSubmit(e) {
    e.preventDefault();
    
    const productId = document.getElementById('productId').value;
    const productFile = document.getElementById('productZdjecieFile').files[0];
    const category = document.getElementById('productKategoria').value;
    
    // Pobierz dane rozmiarów z dynamicznych pól
    const sizesContainer = document.getElementById('sizesContainer');
    const sizeInputs = sizesContainer.querySelectorAll('input[data-size]');
    const rozmiaryData = [];
    
    sizeInputs.forEach(input => {
        const stan = parseInt(input.value) || 0;
        rozmiaryData.push({
            rozmiar: input.dataset.size,
            stanMagazynowy: stan
        });
    });
    
    console.log('Rozmiary:', rozmiaryData);
    
    // Przygotuj dane Używamy FormData zamiast zwykłego obiektu JSON
    const formData = new FormData();
    formData.append('nazwa', document.getElementById('productNazwa').value);
    formData.append('kategoria', category);
    formData.append('cenaBrutto', document.getElementById('productCena').value);
    formData.append('kolor', document.getElementById('productKolor').value);
    formData.append('opis', document.getElementById('productOpis').value);
    
    // Tablice i obiekty (jak rozmiary) trzeba zamienić na string, gdy używamy FormData
    formData.append('rozmiary_data', JSON.stringify(rozmiaryData));
    
    // Dodajemy plik zdjęcia TYLKO jeśli został wybrany 
    // (żeby nie nadpisać pustym polem przy edycji produktu)
    if (productFile) {
        // Zwróć uwagę na nazwę 'zdjecie' - musi pasować do pola w Django!
        formData.append('zdjecie', productFile); 
    }
    
    console.log('Zapis produktu:', productId ? 'Edycja' : 'Dodawanie');
    
    try {
        const token = getAuthToken();
        const config = {
            method: productId ? 'PATCH' : 'POST',
            headers: {
                'Authorization': `Bearer ${token}`
                // UWAGA KRYTYCZNA: Przy wysyłaniu FormData NIE WOLNO ustawiać 'Content-Type'!
                // Przeglądarka musi sama wygenerować nagłówek 'multipart/form-data; boundary=...'
            },
            body: formData, // Wysyłamy fizyczną paczkę, a nie tekst JSON
        };
        
        const response = await fetch(`${API_BASE_URL}/produkty/${productId ? productId + '/' : ''}`, config);
        
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.detail || 'Błąd zapisu produktu');
        }
        
        showToast(productId ? 'Produkt zaktualizowany' : 'Produkt dodany', 'success');
        closeProductModal();
        loadProducts();
    } catch (error) {
        console.error('Błąd zapisu:', error);
        showToast(error.message || 'Nie udało się zapisać produktu', 'error');
    }
}

// Zmienna globalna do przechowywania aktualnego filtra zamówień
let currentAdminOrderFilter = '';
let currentOrderSearchFilters = {
    order_id: '',
    date: ''
};

// Zamówienia
async function loadOrders(statusFilter = '') {
    currentAdminOrderFilter = statusFilter;
    
    try {
        const allOrders = await apiRequest('/zamowienia/');
        
        // Filtrowanie zamówień
        let orders = allOrders;
        if (statusFilter) {
            orders = allOrders.filter(order => order.status === statusFilter);
        }
        
        // Dodatkowe filtrowanie po numerze, kliencie i dacie
        if (currentOrderSearchFilters.order_id) {
            orders = orders.filter(order => 
                order.id_zamowienie.toString() === currentOrderSearchFilters.order_id
            );
        }
        
        if (currentOrderSearchFilters.date) {
            orders = orders.filter(order => {
                const orderDate = new Date(order.dataZlozenia).toISOString().split('T')[0];
                return orderDate === currentOrderSearchFilters.date;
            });
        }
        
        const ordersList = document.getElementById('ordersList');
        
        if (!ordersList) return;
        
        if (orders.length === 0) {
            ordersList.innerHTML = '<p class="empty-message">Brak zamówień do realizacji</p>';
            return;
        }
        
        ordersList.innerHTML = orders.map(order => `
            <div class="order-card">
                <div class="order-header">
                    <div>
                        <strong>Zamówienie #${order.id_zamowienie}</strong>
                        <span class="order-status status-${order.status}">${order.status}</span>
                    </div>
                    <span>${new Date(order.dataZlozenia).toLocaleString('pl-PL')}</span>
                </div>
                <div class="order-info">
                    <p>Klient: ${order.id_uzytkownik}</p>
                    <p>Kwota: ${parseFloat(order.kwota).toFixed(2)} zł</p>
                </div>
                <div class="order-items">
                    <h4>Produkty:</h4>
                    <ul>
                        ${order.pozycje.map(item => `
                            <li>${item.produkt_nazwa} - ${item.ilosc} szt. x ${parseFloat(item.cenaJednostkowa).toFixed(2)} zł</li>
                        `).join('')}
                    </ul>
                </div>
                ${order.adres_dostawy ? `
                    <div class="order-info" style="margin-top: 1rem;">
                        <p>Adres: ${order.adres_dostawy.ulica}, ${order.adres_dostawy.kodPocztowy} ${order.adres_dostawy.miasto}</p>
                    </div>
                ` : ''}
                <div class="order-actions" style="margin-top: 1rem;">
                    <select class="status-select" onchange="updateOrderStatus(${order.id_zamowienie}, this.value)">
                        <option value="oczekujące" ${order.status === 'oczekujące' ? 'selected' : ''}>Oczekujące</option>
                        <option value="w realizacji" ${order.status === 'w realizacji' ? 'selected' : ''}>W realizacji</option>
                        <option value="wysłane" ${order.status === 'wysłane' ? 'selected' : ''}>Wysłane</option>
                        <option value="zakończone" ${order.status === 'zakończone' ? 'selected' : ''}>Zakończone</option>
                        <option value="anulowane" ${order.status === 'anulowane' ? 'selected' : ''}>Anulowane</option>
                    </select>
                </div>
            </div>
        `).join('');
    } catch (error) {
        showToast('Nie udało się załadować zamówień', 'error');
    }
}

async function updateOrderStatus(orderId, status) {
    try {
        await apiRequest(`/admin/zamowienia/${orderId}/zmien_status/`, {
            method: 'PATCH',
            body: JSON.stringify({ status }),
        });
        showToast('Status zaktualizowany', 'success');
        loadOrders();
    } catch (error) {
        showToast('Nie udało się zaktualizować statusu', 'error');
    }
}

// Zwroty
let currentReturnFilter = '';

async function loadReturns(statusFilter = '') {
    currentReturnFilter = statusFilter;
    
    try {
        const allReturns = await apiRequest('/admin/zwroty/');
        
        // Filtrowanie zwrotów
        let returns = allReturns;
        if (statusFilter) {
            returns = allReturns.filter(ret => ret.status === statusFilter);
        }
        const returnsList = document.getElementById('returnsList');
        
        if (!returnsList) return;
        
        if (returns.length === 0) {
            returnsList.innerHTML = '<p class="empty-message">Brak zgłoszeń zwrotów</p>';
            return;
        }
        
        returnsList.innerHTML = returns.map(ret => `
            <div class="return-card">
                <div class="return-header">
                    <div>
                        <strong>Zwrot #${ret.id_zwrot}</strong>
                        <span class="return-status status-${ret.status}">${ret.status}</span>
                    </div>
                    <span>${new Date(ret.dataZgloszenia).toLocaleDateString('pl-PL')}</span>
                </div>
                <div class="return-info">
                    <p>Zamówienie: #${ret.id_zamowienie}</p>
                    <p>Powód: ${ret.powod}</p>
                </div>
                <div class="return-actions" style="margin-top: 1rem;">
                    <button class="btn btn-sm btn-edit" onclick="approveReturn(${ret.id_zwrot})">Zatwierdź</button>
                    <button class="btn btn-sm btn-delete" onclick="rejectReturn(${ret.id_zwrot})">Odrzuć</button>
                </div>
            </div>
        `).join('');
    } catch (error) {
        showToast('Nie udało się załadować zwrotów', 'error');
    }
}

async function approveReturn(returnId) {
    try {
        await apiRequest(`/admin/zwroty/${returnId}/zatwierdz/`, {
            method: 'POST',
        });
        showToast('Zwrot zatwierdzony', 'success');
        loadReturns();
    } catch (error) {
        showToast('Nie udało się zatwierdzić zwrotu', 'error');
    }
}

async function rejectReturn(returnId) {
    try {
        await apiRequest(`/admin/zwroty/${returnId}/odrzuc/`, {
            method: 'POST',
        });
        showToast('Zwrot odrzucony', 'success');
        loadReturns();
    } catch (error) {
        showToast('Nie udało się odrzucić zwrotu', 'error');
    }
}

// Toast notifications
function showToast(message, type = 'info') {
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.textContent = message;
    
    document.body.appendChild(toast);
    
    setTimeout(() => toast.classList.add('show'), 10);
    
    setTimeout(() => {
        toast.classList.remove('show');
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}

// Udostępnij funkcje globalnie dla onclick w HTML
window.showAddProductModal = showAddProductModal;
window.closeProductModal = closeProductModal;
window.editProduct = editProduct;
window.deleteProduct = deleteProduct;
window.approveReturn = approveReturn;
window.rejectReturn = rejectReturn;
window.loadOrders = loadOrders;

// Użytkownicy
let currentUserFilter = '';

async function loadUsers(statusFilter = '') {
    currentUserFilter = statusFilter;
    
    try {
        const users = await adminGetUsers(statusFilter);
        const tbody = document.getElementById('usersTableBody');
        
        if (!tbody) return;
        
        if (users.length === 0) {
            tbody.innerHTML = '<tr><td colspan="7">Brak użytkowników</td></tr>';
            return;
        }
        
        tbody.innerHTML = users.map(user => `
            <tr>
                <td>${user.id}</td>
                <td>${user.email}</td>
                <td>${user.imie || '-'}</td>
                <td>${user.nazwisko || '-'}</td>
                <td>
                    <span class="status-${user.statusUzytkownika}">
                        ${user.statusUzytkownika}
                    </span>
                </td>
                <td>${new Date(user.dataRejestracji).toLocaleDateString('pl-PL')}</td>
                <td class="actions">
                    ${user.statusUzytkownika === 'usunięty' ? 
                        // Jeśli jest usunięty, pokazujemy tylko tekst
                        `<span style="color: #e74c3c; font-weight: bold;">Konto usunięte</span>` : 
                        
                        // Jeśli NIE JEST usunięty, pokazujemy standardowe przyciski
                        `${user.statusUzytkownika === 'aktywny' ? 
                            `<button class="btn btn-sm btn-delete" onclick="blockUser(${user.id})">Zablokuj</button>` : 
                            `<button class="btn btn-sm btn-edit" onclick="unblockUser(${user.id})">Odblokuj</button>`
                        }
                        <button class="btn btn-sm btn-delete" style="background-color: #e74c3c; margin-left: 5px;" onclick="removeUser(${user.id})">Usuń</button>`
                    }
                </td>
            </tr>
        `).join(''); // <-- TUTAJ BRAKOWAŁO ZAMKNIĘCIA
    } catch (error) {
        showToast('Nie udało się załadować użytkowników', 'error');
    }
}

async function blockUser(userId) {
    if (!confirm('Czy na pewno chcesz zablokować tego użytkownika?')) return;
    
    try {
        await adminBlockUser(userId);
        showToast('Użytkownik zablokowany', 'success');
        loadUsers(currentUserFilter);
    } catch (error) {
        showToast('Nie udało się zablokować użytkownika', 'error');
    }
}

async function unblockUser(userId) {
    try {
        await adminUnblockUser(userId);
        showToast('Użytkownik odblokowany', 'success');
        loadUsers(currentUserFilter);
    } catch (error) {
        showToast('Nie udało się odblokować użytkownika', 'error');
    }
}

// Opinie
// Opinie
async function loadOpinions() {
    try {
        const opinions = await adminGetOpinions();
        const tbody = document.getElementById('opinionsTableBody');
        
        if (!tbody) return;
        
        if (opinions.length === 0) {
            tbody.innerHTML = '<tr><td colspan="7">Brak opinii</td></tr>';
            return;
        }
        
        tbody.innerHTML = opinions.map(opinia => `
            <tr>
                <td>${opinia.id_opinia}</td>
                <td>${opinia.produkt_nazwa || '-'}</td>
                <td>${opinia.uzytkownik_imie || '-'} ${opinia.uzytkownik_nazwisko || '-'}</td>
                <td>${opinia.ocena}/5</td>
                <td>${opinia.komentarz}</td>
                <td>${new Date(opinia.data).toLocaleDateString('pl-PL')}</td>
                <td class="actions">
                    <button class="btn btn-sm btn-delete" onclick="deleteOpinion(${opinia.id_opinia})">Usuń</button>
                </td>
            </tr>
        `).join(''); // <-- TUTAJ TEŻ BRAKOWAŁO ZAMKNIĘCIA
        
    } catch (error) {
        showToast('Nie udało się załadować opinii', 'error');
    }
}

async function deleteOpinion(opinionId) {
    if (!confirm('Czy na pewno chcesz usunąć tę opinię?')) return;
    
    try {
        await adminDeleteOpinion(opinionId);
        showToast('Opinia usunięta', 'success');
        loadOpinions();
    } catch (error) {
        showToast('Nie udało się usunąć opinii', 'error');
    }
}

// Filtrowanie zamówień - szukaj po numerze, kliencie, dacie
function applyOrderFilters() {
    currentOrderSearchFilters = {
        order_id: document.getElementById('filterOrderId').value,
        date: document.getElementById('filterDate').value
    };
    loadOrders(currentAdminOrderFilter);
}

function clearOrderFilters() {
    document.getElementById('filterOrderId').value = '';
    document.getElementById('filterDate').value = '';
    currentOrderSearchFilters = { order_id: '', date: '' };
    loadOrders(currentAdminOrderFilter);
}

// Udostępnij funkcje globalnie
window.applyOrderFilters = applyOrderFilters;
window.clearOrderFilters = clearOrderFilters;

// Obsługa filtrów zamówień w admin panelu
document.addEventListener('DOMContentLoaded', () => {
    // Filtry zamówień
    document.querySelectorAll('.order-filters .filter-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.preventDefault();
            const status = btn.dataset.status;
            
            document.querySelectorAll('.order-filters .filter-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            
            loadOrders(status);
        });
    });
    
    // Filtry zwrotów
    document.querySelectorAll('.return-filters .filter-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.preventDefault();
            const status = btn.dataset.status;
            
            document.querySelectorAll('.return-filters .filter-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            
            loadReturns(status);
        });
    });
    
    // Filtry użytkowników
    document.querySelectorAll('.user-filters .filter-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.preventDefault();
            const status = btn.dataset.status;
            
            document.querySelectorAll('.user-filters .filter-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            
            loadUsers(status);
        });
    });
});

async function removeUser(userId) {
    if (!confirm('Czy na pewno chcesz usunąć to konto? Użytkownik straci do niego dostęp, ale jego zamówienia pozostaną w systemie.')) return;
    
    try {
        await adminDeleteUser(userId);
        showToast('Status zmieniony na "usunięty"', 'success');
        loadUsers(currentUserFilter); // Odśwież listę
    } catch (error) {
        showToast(error.message || 'Nie udało się zmienić statusu', 'error');
    }
}

// Udostępnij funkcje globalnie
window.loadUsers = loadUsers;
window.loadOpinions = loadOpinions;
window.blockUser = blockUser;
window.unblockUser = unblockUser;
window.deleteOpinion = deleteOpinion;
window.removeUser = removeUser;