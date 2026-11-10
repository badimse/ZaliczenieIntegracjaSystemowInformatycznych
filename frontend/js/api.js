// API Configuration
const API_BASE_URL = '/api';

// Token management
function getAuthToken() {
    return localStorage.getItem('access_token');
}

function getRefreshToken() {
    return localStorage.getItem('refresh_token');
}

function setAuthToken(access, refresh) {
    localStorage.setItem('access_token', access);
    localStorage.setItem('refresh_token', refresh);
}

function logoutUser() {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    window.location.reload();
}

async function apiRequest(endpoint, options = {}) {
    const token = getAuthToken();
    const config = {
        ...options,
        headers: {
            'Content-Type': 'application/json',
            ...(token && { 'Authorization': `Bearer ${token}` }),
            ...options.headers,
        },
    };

    try {
        const response = await fetch(`${API_BASE_URL}${endpoint}`, config);

        if (response.status === 401 && getRefreshToken()) {
            const refreshed = await refreshToken();
            if (refreshed) {
                const newToken = getAuthToken();
                config.headers['Authorization'] = `Bearer ${newToken}`;
                const retryResponse = await fetch(`${API_BASE_URL}${endpoint}`, config);
                return retryResponse.status === 204 ? {} : await retryResponse.json();
            }
        }

        if (response.status === 204 || response.headers.get("content-length") === "0") {
            return {};
        }

        const text = await response.text();
        let data;
        try {
            data = JSON.parse(text);
        } catch (err) {
            console.error('Odpowiedź serwera nie jest JSON-em:', text);
            throw new Error(`Błąd serwera (${response.status})`);
        }

        if (!response.ok) {
            // Wyciągamy szczegółowy błąd z Django REST Framework
            let errorMsg = data.detail || data.message || data.error;
            if (!errorMsg && typeof data === 'object') {
                const firstKey = Object.keys(data)[0];
                const firstErr = Array.isArray(data[firstKey]) ? data[firstKey][0] : data[firstKey];
                errorMsg = `${firstKey}: ${firstErr}`;
            }
            throw new Error(errorMsg || 'Błąd API');
        }
        return data;
    } catch (error) {
        console.error('API Error:', error);
        throw error;
    }
}

// API request helper - NAPRAWIONA STRUKTURA
async function handleReset(e) {
    e.preventDefault();
    const submitButton = document.getElementById('submit-btn'); // sprawdź czy masz takie ID
    
    submitButton.innerText = 'Wysyłam...';
    submitButton.disabled = true;

    try {
        const email = document.getElementById('email').value;
        await apiRequest('/auth/password-reset-request/', {
            method: 'POST',
            body: JSON.stringify({ email })
        });

        alert('Link wysłany! Sprawdź terminal.');
        window.location.href = 'login.html'; // Automatyczne przekierowanie!

    } catch (error) {
        alert('Błąd: ' + error.message);
    } finally {
        // TO SIĘ WYKONA ZAWSZE - przycisk "odżyje"
        submitButton.innerText = 'Wyślij link';
        submitButton.disabled = false;
    }
}

// Token refresh
async function refreshToken() {
    try {
        const response = await fetch(`${API_BASE_URL}/auth/refresh/`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ refresh: getRefreshToken() }),
        });
        
        if (response.ok) {
            const data = await response.json();
            setAuthToken(data.access, getRefreshToken());
            return true;
        }
    } catch (error) {
        console.error('Token refresh failed:', error);
    }
    
    logoutUser();
    return false;
}

// Auth API
async function registerUser(userData) {
    return await apiRequest('/auth/register/', {
        method: 'POST',
        body: JSON.stringify(userData),
    });
}

async function loginUser(email, password) {
    // Tutaj też zmienione na apiRequest dla spójności
    return await apiRequest('/auth/login/', {
        method: 'POST',
        body: JSON.stringify({ email, password }),
    }).then(data => {
        setAuthToken(data.access, data.refresh);
        return data;
    });
}

async function getUserProfile() {
    return await apiRequest('/auth/profile/');
}

// Auth API - Resetowanie hasła
async function requestPasswordReset(email) {
    return await apiRequest('/auth/password-reset-request/', {
        method: 'POST',
        body: JSON.stringify({ email }),
    });
}

async function confirmPasswordReset(uid, token, password) {
    return await apiRequest('/auth/password-reset-confirm/', {
        method: 'POST',
        body: JSON.stringify({ uid, token, password }),
    });
}

async function changePassword(oldPassword, newPassword) {
    return await apiRequest('/auth/password-change/', {
        method: 'POST',
        body: JSON.stringify({
            old_password: oldPassword,
            new_password: newPassword
        }),
    });
}

// Products API
async function getProducts(kategoria = '') {
    let url = '/produkty/';
    if (kategoria) {
        url += `?kategoria=${encodeURIComponent(kategoria)}`;
    }
    return await apiRequest(url);
}

// Cart API
async function getCart() {
    return await apiRequest('/koszyk/pobierz/');
}

async function addToCart(produktId, ilosc = 1) {
    return await apiRequest('/koszyk/dodaj/', {
        method: 'POST',
        body: JSON.stringify({ produkt_id: produktId, ilosc }),
    });
}

async function addToCartWithSize(produktId, ilosc = 1, rozmiar) {
    return await apiRequest('/koszyk/dodaj/', {
        method: 'POST',
        body: JSON.stringify({ produkt_id: produktId, ilosc, rozmiar }),
    });
}

async function updateCartItem(pozycjaId, ilosc) {
    return await apiRequest('/koszyk/aktualizuj_ilosc/', {
        method: 'POST',
        body: JSON.stringify({ pozycja_id: pozycjaId, ilosc }),
    });
}

async function removeFromCartApi(pozycjaId) {
    return await apiRequest('/koszyk/usun_pozycje/', {
        method: 'POST',
        body: JSON.stringify({ pozycja_id: pozycjaId }),
    });
}

async function clearCart() {
    return await apiRequest('/koszyk/wyczysc/', {
        method: 'POST',
    });
}

// Orders API
async function checkout(adres) {
    return await apiRequest('/zamowienia/checkout/', {
        method: 'POST',
        body: JSON.stringify({ adres }),
    });
}

async function getUserOrders() {
    return await apiRequest('/zamowienia/');
}

async function getOrderDetails(orderId) {
    return await apiRequest(`/zamowienia/${orderId}/`);
}

// Opinions API
async function getProductOpinions(produktId) {
    return await apiRequest(`/opinie/?id_produkt=${produktId}`);
}

async function addOpinionApi(produktId, ocena, komentarz) {
    return await apiRequest('/opinie/', {
        method: 'POST',
        body: JSON.stringify({
            id_produkt: produktId,
            ocena,
            komentarz,
        }),
    });
}

const getOpinie = getProductOpinions;

// Returns API
async function createReturn(idZamowienie, powod) {
    return await apiRequest('/zwroty/', {
        method: 'POST',
        body: JSON.stringify({
            id_zamowienie: idZamowienie,
            powod,
        }),
    });
}

async function getUserReturns() {
    return await apiRequest('/zwroty/');
}

// Admin API
async function adminGetOrdersToRealize() {
    return await apiRequest('/admin/zamowienia/do_realizacji/');
}

async function adminUpdateOrderStatus(orderId, status) {
    return await apiRequest(`/admin/zamowienia/${orderId}/zmien_status/`, {
        method: 'PATCH',
        body: JSON.stringify({ status }),
    });
}

async function adminGetReturns() {
    return await apiRequest('/admin/zwroty/');
}

async function adminApproveReturn(returnId) {
    return await apiRequest(`/admin/zwroty/${returnId}/zatwierdz/`, {
        method: 'POST',
    });
}

async function adminRejectReturn(returnId) {
    return await apiRequest(`/admin/zwroty/${returnId}/odrzuc/`, {
        method: 'POST',
    });
}

// Admin - Users API
async function adminGetUsers(statusFilter = '') {
    let url = '/admin/uzytkownicy/';
    if (statusFilter) {
        url += `?status=${statusFilter}`;
    }
    return await apiRequest(url);
}

async function adminBlockUser(userId) {
    return await apiRequest(`/admin/uzytkownicy/${userId}/zablokuj/`, {
        method: 'POST',
    });
}

async function adminUnblockUser(userId) {
    return await apiRequest(`/admin/uzytkownicy/${userId}/odblokuj/`, {
        method: 'POST',
    });
}

async function adminDeleteUser(userId) {
    return await apiRequest(`/admin/uzytkownicy/${userId}/usun/`, { 
        method: 'POST' 
    });
}

// Admin - Opinions API
async function adminGetOpinions() {
    return await apiRequest('/admin/opinie/');
}

async function adminDeleteOpinion(opinionId) {
    return await apiRequest(`/admin/opinie/${opinionId}/usun/`, {
        method: 'POST',
    });
}

