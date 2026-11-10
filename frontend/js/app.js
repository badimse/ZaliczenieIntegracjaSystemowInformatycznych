// Główna aplikacja sklepu "Na Rejonie"

// Inicjalizacja aplikacji
document.addEventListener('DOMContentLoaded', () => {
    initApp();
    // Odśwież UI autoryzacji po załadowaniu strony
    if (typeof updateAuthUI === 'function') {
        updateAuthUI();
    }
});

async function initApp() {
    setupNavigation();
    await loadProducts();
    updateCartCount();
    setupSearch();
    setupFilters();
}

// Nawigacja
function setupNavigation() {
    // Obsługa linków nawigacyjnych
    document.querySelectorAll('a[href^="#"]').forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const targetId = link.getAttribute('href').substring(1);
            const target = document.getElementById(targetId);
            if (target) {
                target.scrollIntoView({ behavior: 'smooth' });
            }
        });
    });
}

// Załaduj i wyświetl produkty
async function loadProducts(kategoria = '') {
    const productsContainer = document.getElementById('productsGrid');
    if (!productsContainer) return;
    
    try {
        productsContainer.innerHTML = '<div class="loading">Ładowanie produktów...</div>';
        const products = await getProducts(kategoria);
        
        if (products.length === 0) {
            productsContainer.innerHTML = '<p class="no-products">Brak produktów w tej kategorii.</p>';
            return;
        }
        
        productsContainer.innerHTML = products.map(product => createProductCard(product)).join('');
        
        // Dodaj obsługę przycisków rozmiarów
        document.querySelectorAll('.sizes-grid').forEach(grid => {
            grid.addEventListener('click', (e) => {
                if (e.target.classList.contains('size-btn') && !e.target.disabled) {
                    // Usuń zaznaczenie z innych przycisków w tej samej grupie
                    grid.querySelectorAll('.size-btn').forEach(btn => btn.classList.remove('selected'));
                    // Zaznacz kliknięty przycisk
                    e.target.classList.add('selected');
                }
            });
        });
        
        // Dodaj obsługę przycisków "Dodaj do koszyka"
        document.querySelectorAll('.add-to-cart-btn').forEach(btn => {
            btn.addEventListener('click', async (e) => {
                const produktId = btn.dataset.produktId;
                // Pobierz wybrany rozmiar
                const productCard = btn.closest('.product-card');
                const selectedSize = productCard.querySelector('.size-btn.selected');
                const rozmiar = selectedSize ? selectedSize.dataset.rozmiar : null;
                if (rozmiar) {
                    console.log('Dodawanie do koszyka - rozmiar:', rozmiar);
                    await handleAddToCart(produktId, 1, rozmiar);
                } else {
                    await handleAddToCart(produktId);
                }
            });
        });
        
    } catch (error) {
        productsContainer.innerHTML = '<p class="error">Nie udało się załadować produktów.</p>';
        console.error('Error loading products:', error);
    }
}

// Utwórz kartę produktu
function createProductCard(product) {
    console.log('Produkt:', product.nazwa, 'rozmiary:', product.rozmiary, 'dostepne_rozmiary:', product.dostepne_rozmiary);
    const available = product.dostepne_rozmiary && product.dostepne_rozmiary.length > 0;
    const cena = parseFloat(product.cenaBrutto) || 0;
    const imageUrl = product.zdjecie_url || 'https://via.placeholder.com/300x400?text=Brak+zdjecia';
    
    // --- NOWA LOGIKA SORTOWANIA ---
    const order = { 'XS': 1, 'S': 2, 'M': 3, 'L': 4, 'XL': 5, 'XXL': 6, 'XXXL': 7 };

    const sortedSizes = product.rozmiary ? [...product.rozmiary].sort((a, b) => {
        const valA = a.rozmiar.toUpperCase();
        const valB = b.rozmiar.toUpperCase();
        
        // Jeśli oba rozmiary są w naszym słowniku wag (XS-XXL)
        if (order[valA] && order[valB]) {
            return order[valA] - order[valB];
        }
        
        // Jeśli to rozmiary liczbowe (np. 36, 38)
        const numA = parseInt(valA);
        const numB = parseInt(valB);
        if (!isNaN(numA) && !isNaN(numB)) {
            return numA - numB;
        }

        // Domyślnie alfabetycznie
        return valA.localeCompare(valB);
    }) : [];
    // --- KONIEC SORTOWANIA ---

    // Generuj przyciski rozmiarów z POSORTOWANEJ listy
    console.log('Generowanie przycisków dla:', product.nazwa, 'rozmiary:', sortedSizes);
    const sizesHtml = sortedSizes.length > 0 ? sortedSizes.map(r => {
        const isAvailable = r.stanMagazynowy > 0;
        return `<button class="size-btn ${isAvailable ? '' : 'size-unavailable'}" 
                        data-rozmiar="${r.rozmiar}" 
                        data-stan="${r.stanMagazynowy}"
                        ${!isAvailable ? 'disabled' : ''}
                        title="${isAvailable ? r.stanMagazynowy + ' szt.' : 'Wyprzedany'}">
                    ${r.rozmiar}
                </button>`;
    }).join('') : '';
    
    return `
        <div class="product-card" data-id="${product.id_produkt}">
            <div class="product-image" onclick="showProductDetail(${product.id_produkt})" style="cursor: pointer;">
                <img src="${imageUrl}" 
                     alt="${product.nazwa}" 
                     onerror="this.src='https://via.placeholder.com/300x400?text=Brak+zdjecia'"
                     style="width: 100%; height: 100%; object-fit: contain;">
                ${!available ? '<span class="out-of-stock">Wyprzedane</span>' : ''}
            </div>
            <div class="product-info">
                <h3 class="product-name" onclick="showProductDetail(${product.id_produkt})" style="cursor: pointer;">${product.nazwa}</h3>
                <p class="product-category">${product.kategoria}</p>
                <p class="product-color">Kolor: ${product.kolor}</p>
                <p class="product-price">${cena.toFixed(2)} zł</p>
                ${product.rozmiary ? `
                    <div class="sizes-container">
                        <p class="sizes-label">Rozmiary:</p>
                        <div class="sizes-grid">${sizesHtml}</div>
                    </div>
                ` : ''}
                ${available ? `
                    <div class="product-actions">
                        <input type="number" class="quantity-input" value="1" min="1" max="10">
                        <button class="add-to-cart-btn btn btn-primary" data-produkt-id="${product.id_produkt}">
                            Do koszyka
                        </button>
                    </div>
                ` : '<button class="btn btn-disabled" disabled>Brak w magazynie</button>'}
            </div>
        </div>
    `;
}

// Obsługa dodawania do koszyka
async function handleAddToCart(produktId, ilosc = 1, rozmiar = null) {
    // Sprawdź czy użytkownik jest zalogowany
    if (!getAuthToken()) {
        showToast('Zaloguj się, aby dodać produkt do koszyka', 'warning');
        showLoginModal();
        return;
    }
    
    // Jeśli nie podano rozmiaru, sprawdź czy produkt ma rozmiary i czy wybrano
    if (!rozmiar) {
        const productCard = document.querySelector(`.add-to-cart-btn[data-produkt-id="${produktId}"]`)
            ?.closest('.product-card');
        const selectedSize = productCard?.querySelector('.size-btn.selected');
        
        // Sprawdź czy produkt ma rozmiary
        const hasSizes = productCard?.querySelector('.sizes-grid');
        if (hasSizes && !selectedSize) {
            showToast('Wybierz rozmiar przed dodaniem do koszyka', 'warning');
            return;
        }
        
        rozmiar = selectedSize?.dataset.rozmiar || null;
    }
    
    // Pobierz ilość z inputa
    const quantityInput = document.querySelector(`.add-to-cart-btn[data-produkt-id="${produktId}"]`)
        ?.closest('.product-actions')?.querySelector('.quantity-input');
    if (quantityInput) {
        ilosc = parseInt(quantityInput.value) || 1;
    }
    
    try {
        let result; // Tworzymy zmienną na dane z serwera

        // Wywołujemy API i zapisujemy odpowiedź do 'result'
        if (rozmiar) {
            result = await addToCartWithSize(produktId, ilosc, rozmiar);
        } else {
            result = await addToCart(produktId, ilosc);
        }

        // Jeśli udało się dodać:
        showToast('Dodano do koszyka!', 'success');
        updateCartCount(); // To aktualizuje cyferkę na przycisku

        // WYWOŁANIE PODGLĄDU (to okienko pod nagłówkiem)
        if (result) {
            showCartDropdownPreview(result);
        }

    } catch (error) {
        showToast(error.message || 'Nie udało się dodać do koszyka', 'error');
    }
}

// Aktualizuj licznik koszyka
async function updateCartCount() {
    const cartCount = document.getElementById('cartCount');
    if (!cartCount) return;
    
    if (!getAuthToken()) {
        cartCount.textContent = '0';
        return;
    }
    
    try {
        const cart = await getCart();
        const totalItems = cart.pozycje?.reduce((sum, item) => sum + item.ilosc, 0) || 0;
        cartCount.textContent = totalItems;
    } catch (error) {
        cartCount.textContent = '0';
    }
}

// Wyszukiwarka
function setupSearch() {
    const searchInput = document.getElementById('searchInput');
    if (!searchInput) return;
    
    let debounceTimer;
    searchInput.addEventListener('input', (e) => {
        clearTimeout(debounceTimer);
        debounceTimer = setTimeout(() => {
            const query = e.target.value.toLowerCase();
            filterProductsOnPage(query);
        }, 300);
    });
}

// Filtrowanie po kategorii
function setupFilters() {
    // Obsługa kart kategorii w sekcji "Kategorie"
    document.querySelectorAll('.category-card').forEach(card => {
        card.addEventListener('click', async (e) => {
            e.preventDefault();
            const kategoria = card.dataset.kategoria || '';
            
            // Aktualizuj aktywne przyciski
            document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
            // Znajdź i aktywuj odpowiedni przycisk
            const matchingBtn = Array.from(document.querySelectorAll('.filter-btn')).find(b => b.dataset.kategoria === kategoria);
            if (matchingBtn) matchingBtn.classList.add('active');
            
            // Przewiń do sekcji produktów
            const productsSection = document.getElementById('produkty');
            if (productsSection) {
                productsSection.scrollIntoView({ behavior: 'smooth' });
            }
            
            await loadProducts(kategoria);
        });
    });
    
    // Obsługa przycisków filtrów w sekcji "Produkty"
    const filterButtons = document.querySelectorAll('.filter-btn');
    filterButtons.forEach(btn => {
        btn.addEventListener('click', async (e) => {
            e.preventDefault();
            const kategoria = btn.dataset.kategoria || '';
            
            // Aktualizuj aktywny przycisk
            filterButtons.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            
            await loadProducts(kategoria);
        });
    });
}

// Filtrowanie produktów na stronie (wyszukiwarka)
function filterProductsOnPage(query) {
    const cards = document.querySelectorAll('.product-card');
    cards.forEach(card => {
        const name = card.querySelector('.product-name')?.textContent.toLowerCase() || '';
        const category = card.querySelector('.product-category')?.textContent.toLowerCase() || '';
        const color = card.querySelector('.product-color')?.textContent.toLowerCase() || '';
        
        if (name.includes(query) || category.includes(query) || color.includes(query)) {
            card.style.display = 'block';
        } else {
            card.style.display = 'none';
        }
    });
}

// Toast notifications
function showToast(message, type = 'info') {
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.textContent = message;
    
    document.body.appendChild(toast);
    
    // Animacja wejścia
    setTimeout(() => toast.classList.add('show'), 10);
    
    // Usuń po 3 sekundach
    setTimeout(() => {
        toast.classList.remove('show');
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}

// Pokaż koszyk
async function showCart() {
    console.log('showCart - clicked');
    
    if (!getAuthToken()) {
        console.log('showCart - no token');
        showToast('Zaloguj się, aby zobaczyć koszyk', 'warning');
        showLoginModal();
        return;
    }
    
    console.log('showCart - has token');
    
    try {
        console.log('showCart - fetching cart...');
        const cart = await getCart();
        console.log('showCart - cart:', cart);
        console.log('showCart - cart.pozycje:', cart.pozycje);
        const modal = document.getElementById('cartModal');
        const cartContent = document.getElementById('cartContent');
        console.log('showCart - modal:', modal, 'cartContent:', cartContent);
        
        if (!cartContent || !modal) {
            console.error('showCart - modal lub cartContent nie istnieje!');
            return;
        }
        
        if (!cart.pozycje || cart.pozycje.length === 0) {
            console.log('showCart - koszyk pusty');
            cartContent.innerHTML = '<p class="empty-cart">Twój koszyk jest pusty</p>';
        } else {
            console.log('showCart - renderowanie produktów:', cart.pozycje.length);
            const total = cart.pozycje.reduce((sum, item) => {
                console.log('showCart - item:', item);
                return sum + (item.ilosc * item.cenaJednostkowa);
            }, 0);
            
            const html = `
                <div class="cart-items">
                    ${cart.pozycje.map(item => `
                        <div class="cart-item">
                            <div class="cart-item-info">
                                <h4>${item.produkt_nazwa || 'Produkt'}</h4>
                                ${item.rozmiar ? `<p><strong>Rozmiar:</strong> ${item.rozmiar}</p>` : ''}
                                <p>Ilość: ${item.ilosc}</p>
                                <p>Cena: ${parseFloat(item.cenaJednostkowa || 0).toFixed(2)} zł</p>
                            </div>
                            <div class="cart-item-actions">
                                <button class="btn btn-sm btn-danger" onclick="removeFromCart(${item.id_pozycjakoszyka})">Usuń</button>
                                <div class="cart-item-total">
                                    ${(item.ilosc * parseFloat(item.cenaJednostkowa || 0)).toFixed(2)} zł
                                </div>
                            </div>
                        </div>
                    `).join('')}
                </div>
                <div class="cart-summary">
                    <p class="cart-total">Suma: <strong>${total.toFixed(2)} zł</strong></p>
                    <button class="btn btn-primary checkout-btn" onclick="showCheckout()">Przejdź do kasy</button>
                </div>
            `;
            console.log('showCart - wstawiam HTML:', html);
            cartContent.innerHTML = html;
        }
        
        console.log('showCart - dodaję klasę active do modala');
        modal.classList.add('active');
        console.log('showCart - modal classList:', modal.classList);
    } catch (error) {
        console.error('showCart - błąd:', error);
        showToast('Nie udało się pobrać zawartości koszyka', 'error');
    }
}

// Usuń produkt z koszyka
async function removeFromCart(pozycjaId) {
    try {
        await removeFromCartApi(pozycjaId);
        showToast('Produkt usunięty z koszyka', 'success');
        updateCartCount();
        showCart(); // Odśwież widok koszyka
    } catch (error) {
        showToast(error.message || 'Nie udało się usunąć produktu z koszyka', 'error');
    }
}

// Pokaż formularz checkout

window.showCheckout = function() {
    const cartModal = document.getElementById('cartModal');
    const checkoutModal = document.getElementById('checkoutModal');
    
    if (cartModal) {
        cartModal.classList.remove('active');
        cartModal.style.display = 'none'; // Zamykamy okno koszyka
    }
    if (checkoutModal) {
        checkoutModal.classList.add('active');
        checkoutModal.style.display = 'flex'; // Otwieramy okno dostawy
    }
}
// Obsługa checkout

async function handleCheckout(e) {
    e.preventDefault();
    
    const adres = {
        ulica: document.getElementById('checkoutUlica').value,
        miasto: document.getElementById('checkoutMiasto').value,
        kodPocztowy: document.getElementById('checkoutKod').value,
        kraj: document.getElementById('checkoutKraj').value || 'Polska'
    };
    
    console.log('handleCheckout - adres:', adres);
    
    // Walidacja
    if (!adres.ulica || !adres.miasto || !adres.kodPocztowy) {
        showToast('Wypełnij wszystkie wymagane pola', 'error');
        return;
    }
    
    try {
        console.log('handleCheckout - wysyłam checkout...');
        
        // Odbieramy całą odpowiedź z backendu (zamówienie + checkout_url)
        const response = await checkout(adres); 
        console.log('handleCheckout - response:', response);
        
        // Zamknij okienko z formularzem adresu
        const modal = document.getElementById('checkoutModal');
        if (modal) modal.classList.remove('active');
        
        // Wyczyść formularz
        document.getElementById('checkoutForm')?.reset();
        
        // Zaktualizuj licznik koszyka (teraz na backendzie został wyczyszczony)
        updateCartCount();
        
        // --- KLUCZOWY MOMENT: PRZEKIEROWANIE DO STRIPE ---
        if (response.checkout_url) {
            showToast('Przekierowywanie do bezpiecznej płatności...', 'info');
            // Ta komenda każe przeglądarce załadować nową stronę:
            window.location.href = response.checkout_url; 
        } else {
            // Jeśli z jakiegoś powodu Stripe nie zwrócił linku
            showToast('Zamówienie złożone, opłać przy odbiorze.', 'success');
            // Zwracamy okienko potwierdzenia (response.zamowienie bo zmieniliśmy to w Pythonie)
            showOrderConfirmation(response.zamowienie || response); 
        }
        
    } catch (error) {
        showToast(error.message || 'Nie udało się złożyć zamówienia', 'error');
    }
}

// Pokaż potwierdzenie zamówienia
function showOrderConfirmation(order) {
    const modal = document.getElementById('orderConfirmationModal');
    const content = document.getElementById('orderConfirmationContent');
    
    if (!content || !modal) return;
    
    const kwota = parseFloat(order.kwota || 0);
    
    content.innerHTML = `
        <h2>Dziękujemy za zamówienie!</h2>
        <p>Numer zamówienia: <strong>#${order.id_zamowienie}</strong></p>
        <p>Kwota: <strong>${kwota.toFixed(2)} zł</strong></p>
        <p>Status: <span class="status-${order.status}">${order.status}</span></p>
        <p>Data: ${new Date(order.dataZlozenia).toLocaleString('pl-PL')}</p>
        <button class="btn btn-primary" onclick="closeModals()">Zamknij</button>
    `;
    
    modal.style.display = '';
    modal.classList.add('active');
}

// Zmienna globalna do przechowywania aktualnego filtra
let currentOrderFilter = '';

// Pokaż historię zamówień z filtrowaniem
async function showOrderHistory(statusFilter = '') {
    console.log('showOrderHistory - clicked, filter:', statusFilter);
    currentOrderFilter = statusFilter;
    
    if (!getAuthToken()) {
        console.log('showOrderHistory - no token');
        showToast('Zaloguj się, aby zobaczyć historię zamówień', 'warning');
        showLoginModal();
        return;
    }
    
    console.log('showOrderHistory - has token');
    
    try {
        console.log('showOrderHistory - fetching orders...');
        const orders = await getUserOrders();
        console.log('showOrderHistory - orders:', orders);
        
        const modal = document.getElementById('orderHistoryModal');
        const content = document.getElementById('orderHistoryContent');
        console.log('showOrderHistory - modal:', modal, 'content:', content);
        
        if (!content || !modal) {
            console.error('showOrderHistory - modal lub content nie istnieje!');
            return;
        }
        
        // Filtrowanie zamówień
        let filteredOrders = orders;
        if (statusFilter) {
            filteredOrders = orders.filter(order => order.status === statusFilter);
        }
        
        if (!filteredOrders || filteredOrders.length === 0) {
            console.log('showOrderHistory - brak zamówień');
            content.innerHTML = '<p class="empty-history">Brak zamówień' + (statusFilter ? ` w statusie "${statusFilter}"` : '') + '</p>';
        } else {
            console.log('showOrderHistory - renderowanie zamówień:', filteredOrders.length);
            content.innerHTML = `
                <div class="order-history">
                    ${filteredOrders.map(order => `
                        <div class="order-item">
                            <div class="order-header">
                                <span class="order-number">#${order.id_zamowienie}</span>
                                <span class="order-date">${new Date(order.dataZlozenia).toLocaleDateString('pl-PL')}</span>
                                <span class="order-status status-${order.status}">${order.status}</span>
                            </div>
                            <div class="order-details">
                                <p>Kwota: ${parseFloat(order.kwota || 0).toFixed(2)} zł</p>
                                ${order.status === 'oczekujące' ? `
                                    <button class="btn btn-sm btn-danger" onclick="handleCancelOrder(${order.id_zamowienie})" style="margin-top: 0.5rem; background-color: #dc3545; color: white; border: none; padding: 6px 12px; border-radius: 5px; cursor: pointer;">
                                        Anuluj zamówienie
                                    </button>
                                ` : ''}
                                ${order.status === 'zakończone' && !order.czy_zwrot_zgloszony ? `
                                    <button class="btn btn-sm btn-secondary" onclick="showReturnModal(${order.id_zamowienie})" style="margin-top: 0.5rem;">
                                        Zwróć produkt
                                    </button>
                                ` : (order.status === 'zakończone' && order.czy_zwrot_zgloszony) ? `
                                    <p style="margin-top: 0.5rem; color: #856404; font-weight: 600;">
                                        ✓ Zwrot został już zgłoszony
                                    </p>
                                ` : ''}
                            </div>
                        </div>
                    `).join('')}
                </div>
            `;
        }
        
        // Aktualizuj aktywne przyciski filtrów
        document.querySelectorAll('.order-filters .filter-btn').forEach(btn => {
            btn.classList.remove('active');
            if (btn.dataset.status === statusFilter) {
                btn.classList.add('active');
            }
        });
        
        console.log('showOrderHistory - dodaję klasę active');
        modal.style.display = '';
        modal.classList.add('active');
    } catch (error) {
        console.error('showOrderHistory - błąd:', error);
        showToast('Nie udało się pobrać historii zamówień', 'error');
    }
}

// Anulowanie zamówienia przez kupującego
async function handleCancelOrder(orderId) {
    if (!confirm(`Czy na pewno chcesz anulować zamówienie #${orderId}?`)) {
        return;
    }
    try {
        await apiRequest(`/zamowienia/${orderId}/anuluj/`, {
            method: 'POST',
        });
        showToast('Zamówienie zostało anulowane', 'success');
        showOrderHistory(currentOrderFilter); // Odśwież listę zamówień
        loadProducts(); // Odśwież stany magazynowe na stronie
    } catch (error) {
        showToast(error.message || 'Nie udało się anulować zamówienia', 'error');
    }
}

// Pokaż modal zwrotu
function showReturnModal(orderId) {
    const returnModal = document.getElementById('returnModal');
    const returnOrderId = document.getElementById('returnOrderId');
    if (returnModal && returnOrderId) {
        returnOrderId.value = orderId;
        returnModal.classList.add('active');
    }
}

// Obsługa zwrotu
async function handleReturn(e) {
    e.preventDefault();
    
    const orderId = document.getElementById('returnOrderId').value;
    const reason = document.getElementById('returnReason').value;
    
    console.log('handleReturn - orderId:', orderId, 'reason:', reason);
    
    if (!reason || reason.length < 10) {
        showToast('Powód zwrotu musi mieć co najmniej 10 znaków', 'error');
        return;
    }
    
    try {
        console.log('handleReturn - wysyłam zwrot...');
        const response = await fetch(`${API_BASE_URL}/zwroty/`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${getAuthToken()}`
            },
            body: JSON.stringify({
                id_zamowienie: parseInt(orderId),
                powod: reason
            })
        });
        
        const data = await response.json();
        console.log('handleReturn - response:', data);
        
        if (!response.ok) {
            throw new Error(data.detail || 'Błąd zgłoszenia zwrotu');
        }
        
        showToast('Zgłoszenie zwrotu zostało wysłane', 'success');
        
        // Zamknij modal
        const modal = document.getElementById('returnModal');
        if (modal) modal.classList.remove('active');
        
        // Wyczyść formularz
        document.getElementById('returnForm')?.reset();
        
        // Odśwież historię zamówień
        showOrderHistory();
    } catch (error) {
        console.error('handleReturn - błąd:', error);
        showToast(error.message || 'Nie udało się zgłosić zwrotu', 'error');
    }
}

// Pokaż szczegóły produktu z opiniami
async function showProductDetail(produktId) {
    try {
        const products = await getProducts();
        const product = products.find(p => p.id_produkt === parseInt(produktId));
        
        if (!product) {
            showToast('Nie znaleziono produktu', 'error');
            return;
        }
        
        const modal = document.getElementById('productDetailModal');
        const content = document.getElementById('productDetailContent');
        
        if (!content || !modal) return;
        
        const cena = parseFloat(product.cenaBrutto) || 0;
        const imageUrl = product.zdjecie_url || 'https://via.placeholder.com/400x500?text=Brak+zdjecia';
        const available = product.dostepne_rozmiary && product.dostepne_rozmiary.length > 0;
        
        // Oblicz całkowity stan magazynowy ze wszystkich rozmiarów
        const totalStock = product.rozmiary ? product.rozmiary.reduce((sum, r) => sum + (r.stanMagazynowy || 0), 0) : 0;
        
        // Pobierz opinie dla produktu
        const opinie = await getOpinie(produktId);
        const avgOcena = opinie.length > 0 
            ? (opinie.reduce((sum, o) => sum + o.ocena, 0) / opinie.length).toFixed(1)
            : 'Brak';
        
        // Generuj przyciski rozmiarów dla szczegółów produktu
        const sizesHtmlDetail = product.rozmiary && product.rozmiary.length > 0 ? product.rozmiary.map(r => {
            const isAvailable = r.stanMagazynowy > 0;
            return `<button class="size-btn ${isAvailable ? '' : 'size-unavailable'}" 
                            data-rozmiar="${r.rozmiar}" 
                            data-stan="${r.stanMagazynowy}"
                            ${!isAvailable ? 'disabled' : ''}
                            title="${isAvailable ? r.stanMagazynowy + ' szt.' : 'Wyprzedany'}">
                        ${r.rozmiar}
                    </button>`;
        }).join('') : '';
        
        content.innerHTML = `
            <div class="product-detail">
                <div class="product-detail-image">
                    <img src="${imageUrl}" alt="${product.nazwa}" style="width: 100%; max-width: 400px; height: auto; border-radius: 10px;">
                </div>
                <div class="product-detail-info">
                    <h2>${product.nazwa}</h2>
                    <p class="product-detail-price">${cena.toFixed(2)} zł</p>
                    <p class="product-detail-description"><strong>Opis:</strong> ${product.opis || 'Brak opisu'}</p>
                    <p><strong>Kategoria:</strong> ${product.kategoria}</p>
                    <p><strong>Kolor:</strong> ${product.kolor}</p>
                    ${product.rozmiary && product.rozmiary.length > 0 ? `
                        <div class="sizes-container">
                            <p class="sizes-label">Rozmiary:</p>
                            <div class="sizes-grid">${sizesHtmlDetail}</div>
                        </div>
                    ` : ''}
                    <p><strong>Średnia ocena:</strong> ${avgOcena}/5 (${opinie.length} opinii)</p>
                    ${available ? `
                        <div class="product-detail-actions">
                            <input type="number" id="detailQuantity" class="quantity-input" value="1" min="1" max="${totalStock}" style="width: 80px; padding: 10px; margin-right: 10px;">
                            <button class="btn btn-primary" onclick="addToCartFromDetail(${product.id_produkt})">Dodaj do koszyka</button>
                        </div>
                    ` : '<button class="btn btn-disabled" disabled>Brak w magazynie</button>'}
                    
                    <!-- Sekcja opinii -->
<div class="opinions-section" style="margin-top: 2rem; border-top: 2px solid #eee; padding-top: 1.5rem;">
                        <h3 style="margin-bottom: 1rem;">Opinie o produkcie</h3>
                        
                        <div class="opinions-scroll-container">
                            
                            ${getAuthToken() ? `
                                <div class="add-opinion-form" style="background: #f5f5f5; padding: 1rem; border-radius: 10px; margin-bottom: 1.5rem;">
                                    <h4>Dodaj opinię</h4>
                                    <div class="form-group" style="margin-bottom: 0.5rem;">
                                        <label>Ocena</label>
                                        <select id="opinionRating" style="width: 100%; padding: 0.5rem;">
                                            <option value="5">⭐⭐⭐⭐⭐ - 5</option>
                                            <option value="4">⭐⭐⭐⭐ - 4</option>
                                            <option value="3">⭐⭐⭐ - 3</option>
                                            <option value="2">⭐⭐ - 2</option>
                                            <option value="1">⭐ - 1</option>
                                        </select>
                                    </div>
                                    <div class="form-group">
                                        <label>Komentarz</label>
                                        <textarea id="opinionComment" rows="3" style="width: 100%; padding: 0.5rem;" placeholder="Napisz swoją opinię..."></textarea>
                                    </div>
                                    <button class="btn btn-primary" onclick="addOpinion(${product.id_produkt})">Dodaj opinię</button>
                                </div>
                            ` : '<p style="color: #666; margin-bottom: 1rem;">Zaloguj się, aby dodać opinię</p>'}
                            
                            <div class="opinions-list" id="opinionsList-${product.id_produkt}">
                                ${opinie.length > 0 ? opinie.map(opinia => `
                                    <div class="opinion-item" style="background: #f9f9f9; padding: 1rem; border-radius: 8px; margin-bottom: 1rem;">
                                        <div style="display: flex; justify-content: space-between; margin-bottom: 0.5rem;">
                                            <strong>${opinia.uzytkownik_imie} ${opinia.uzytkownik_nazwisko?.charAt(0)}.</strong>
                                            <span>${new Date(opinia.data).toLocaleDateString('pl-PL')}</span>
                                        </div>
                                        <div style="margin-bottom: 0.5rem;">${'⭐'.repeat(opinia.ocena)}</div>
                                        <p style="color: #555;">${opinia.komentarz || 'Brak komentarza'}</p>
                                    </div>
                                `).join('') : '<p style="color: #999;">Brak opinii o tym produkcie</p>'}
                            </div>
                        
                        </div> 
                        
                    </div>
                </div>
            </div>
        `;
        
        modal.classList.add('active');
        
        // Dodaj obsługę zaznaczania rozmiarów w szczegółach produktu
        setTimeout(() => {
            const detailSizesGrid = document.querySelector('#productDetailContent .sizes-grid');
            if (detailSizesGrid) {
                detailSizesGrid.addEventListener('click', (e) => {
                    if (e.target.classList.contains('size-btn') && !e.target.disabled) {
                        detailSizesGrid.querySelectorAll('.size-btn').forEach(btn => btn.classList.remove('selected'));
                        e.target.classList.add('selected');
                    }
                });
            }
        }, 100);
    } catch (error) {
        console.error('Error loading product detail:', error);
        showToast('Nie udało się załadować szczegółów produktu', 'error');
    }
}

// Dodaj opinię o produkcie
async function addOpinion(produktId) {
    const rating = parseInt(document.getElementById('opinionRating').value);
    const comment = document.getElementById('opinionComment').value;
    
    if (!comment || comment.trim().length < 3) {
        showToast('Komentarz musi mieć co najmniej 3 znaki', 'error');
        return;
    }
    
    try {
        await addOpinionApi(produktId, rating, comment);
        showToast('Dodano opinię!', 'success');
        
        // Odśwież widok szczegółów produktu
        showProductDetail(produktId);
    } catch (error) {
        showToast(error.message || 'Nie udało się dodać opinii', 'error');
    }
}

// Dodaj do koszyka z widoku szczegółów
async function addToCartFromDetail(produktId) {
    const ilosc = parseInt(document.getElementById('detailQuantity')?.value) || 1;
    
    // Sprawdź czy wybrano rozmiar
    const selectedSize = document.querySelector('#productDetailContent .size-btn.selected');
    if (!selectedSize) {
        // Sprawdź czy produkt ma rozmiary
        const hasSizes = document.querySelector('#productDetailContent .sizes-grid');
        if (hasSizes) {
            showToast('Wybierz rozmiar przed dodaniem do koszyka', 'warning');
            return;
        }
    }
    
    const rozmiar = selectedSize?.dataset.rozmiar || null;
    await handleAddToCart(produktId, ilosc, rozmiar);
}

// Inicjalizacja przycisków koszyka, zamówień i formularzy
document.addEventListener('DOMContentLoaded', () => {
    const cartBtn = document.getElementById('cartBtn');
    if (cartBtn) {
        cartBtn.addEventListener('click', showCart);
    }
    
    const ordersBtn = document.getElementById('ordersBtn');
    if (ordersBtn) {
        ordersBtn.addEventListener('click', () => showOrderHistory(''));
    }
    
    const checkoutForm = document.getElementById('checkoutForm');
    if (checkoutForm) {
        checkoutForm.addEventListener('submit', handleCheckout);
    }
    
    const returnForm = document.getElementById('returnForm');
    if (returnForm) {
        returnForm.addEventListener('submit', handleReturn);
    }
    
    // Obsługa filtrów zamówień (POPRAWNIE ZAMKNIĘTA PĘTLA)
    document.querySelectorAll('.order-filters .filter-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.preventDefault();
            const status = btn.dataset.status;
            showOrderHistory(status);
        });
    });

    // Obsługa zmiany hasła (WYCIĄGNIĘTA POZA FILTRY)
    const changePasswordForm = document.getElementById('changePasswordForm');
    if (changePasswordForm) {
        changePasswordForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const oldPassword = document.getElementById('oldPassword').value;
            const newPassword = document.getElementById('newPassword').value;
            const confirmNewPassword = document.getElementById('confirmNewPassword').value;

            if (newPassword !== confirmNewPassword) {
                showToast('Hasła nie są identyczne!', 'error');
                return;
            }

            try {
                await changePassword(oldPassword, newPassword);
                showToast('Hasło zostało pomyślnie zmienione!', 'success');
                changePasswordForm.reset();
            } catch (error) {
                showToast('Błąd: ' + error.message, 'error');
            }
        });
    }
});

function showCartDropdownPreview(cartData) {
    const dropdown = document.getElementById('cartDropdown');
    const container = document.getElementById('cartDropdownItems');
    const totalEl = document.getElementById('cartDropdownTotal');

    if (!dropdown || !container) return;

    container.innerHTML = '';
    const pozycje = cartData.pozycje || [];
    const recentItems = [...pozycje].reverse().slice(0, 3);

    recentItems.forEach(item => {
        const itemTotal = (parseFloat(item.cenaJednostkowa || 0) * item.ilosc).toFixed(2);
        container.innerHTML += `
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px; padding-bottom: 8px; border-bottom: 1px solid #f0f0f0;">
                <div style="text-align: left;">
                    <div style="font-weight: bold; font-size: 14px; color: #1a1a1a;">${item.produkt_nazwa || 'Produkt'}</div>
                    <div style="font-size: 12px; color: #888;">Rozmiar: ${item.rozmiar || '—'} | Ilość: ${item.ilosc}</div>
                </div>
                <div style="font-weight: bold; color: #000; font-size: 14px;">${itemTotal} zł</div>
            </div>
        `;
    });

    const totalSuma = pozycje.reduce((acc, curr) => acc + (parseFloat(curr.cenaJednostkowa || 0) * curr.ilosc), 0);
    if (totalEl) totalEl.innerText = totalSuma.toFixed(2) + ' zł';

    dropdown.style.display = 'block';

    clearTimeout(window.cartDropdownTimeout);
    window.cartDropdownTimeout = setTimeout(() => {
        dropdown.style.display = 'none';
    }, 4000);
}