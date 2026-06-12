// ПРОВЕРКА ВХОДА В АДМИНКУ
(function() {
    // Проверяем, зашел ли пользователь через форму входа
    const isAuthenticated = sessionStorage.getItem('admin_authenticated');
    
    // Если не зашел и это не страница входа - отправляем на вход
    if (!isAuthenticated && window.location.pathname !== '/admin-login.html') {
        window.location.href = 'admin-login.html';
    }
})();

// Добавьте в начало admin.js
async function checkAuth() {
    const token = sessionStorage.getItem('admin_token');
    const loginTime = sessionStorage.getItem('admin_login_time');
    
    if (!token || !loginTime) {
        window.location.href = 'admin-login.html';
        return false;
    }
    
    // Проверка времени (30 минут)
    if (Date.now() - parseInt(loginTime) > 30 * 60 * 1000) {
        sessionStorage.clear();
        window.location.href = 'admin-login.html';
        return false;
    }
    
    // Валидация токена (опционально)
    try {
        const decoded = JSON.parse(atob(token));
        if (decoded.exp < Date.now()) {
            sessionStorage.clear();
            window.location.href = 'admin-login.html';
            return false;
        }
    } catch(e) {
        window.location.href = 'admin-login.html';
        return false;
    }
    
    return true;
}

// Вызов при загрузке
(async function() {
    const isAuth = await checkAuth();
    if (!isAuth) return;
    // Остальной код инициализации...
})();

// Добавьте в начало admin.js после существующего кода:

// Проверка аутентификации
(function checkAuth() {
    const isAuthenticated = sessionStorage.getItem('admin_authenticated');
    const loginTime = sessionStorage.getItem('admin_login_time');
    
    if (!isAuthenticated || !loginTime) {
        window.location.href = 'admin-login.html';
        return;
    }
    
    // Проверка времени сессии (30 минут)
    if (Date.now() - parseInt(loginTime) > 30 * 60 * 1000) {
        sessionStorage.clear();
        window.location.href = 'admin-login.html';
        return;
    }
    
    // Обновление времени сессии
    sessionStorage.setItem('admin_login_time', Date.now().toString());
})();

// Защита всех критических функций
const originalLocalStorageSet = localStorage.setItem;
localStorage.setItem = function(key, value) {
    // Блокируем запись чувствительных данных без шифрования
    if (key.includes('admin') || key.includes('user') || key.includes('token')) {
        if (typeof window.ReverageSecurity !== 'undefined') {
            const encryption = new window.ReverageSecurity.Encryption();
            value = encryption.encrypt(value);
        }
    }
    originalLocalStorageSet.call(this, key, value);
};

// Логирование всех действий администратора
function adminLog(action, details) {
    if (window.ReverageSecurity) {
        window.ReverageSecurity.SecurityLogger.log('ADMIN_ACTION', {
            action: action,
            details: details,
            timestamp: new Date().toISOString()
        });
    }
}

// Оверрайд критических функций с логированием
const originalDeleteProduct = deleteProductById;
window.deleteProductById = function(id) {
    adminLog('DELETE_PRODUCT', { productId: id });
    return originalDeleteProduct(id);
};

const originalSaveProduct = saveProductFromModal;
window.saveProductFromModal = function(event) {
    adminLog('SAVE_PRODUCT', { 
        productId: document.getElementById('productId').value || 'new' 
    });
    return originalSaveProduct(event);
};

// REVERAGE SS1 - Админ панель (полноценный функционал)

// ---- ГЛОБАЛЬНЫЕ ДАННЫЕ ----
let products = [];
let orders = [];
let users = [];
let activities = [];

// Загрузка товаров из localStorage, инициализация демо-данных
function loadInitialData() {
    const storedProducts = localStorage.getItem('reverage_products');
    if(storedProducts && JSON.parse(storedProducts).length > 0) {
        products = JSON.parse(storedProducts);
    } else {
        // демо товары
        products = [
            { id: 1, name: "OVERSIZED HOODIE BLACK", price: 8990, desc: "Хлопок 100%", sizes: ["S","M","L","XL"], category: "hoodies", img: "https://images.unsplash.com/photo-1556821840-3a63f95609a7?w=200" },
            { id: 2, name: "CARGO PANTS SS1", price: 7490, desc: "Утилитарные карго", sizes: ["S","M","L","XL"], category: "pants", img: "https://images.unsplash.com/photo-1594938298603-c8148c4dae35?w=200" },
            { id: 3, name: "GRAPHIC TEE WHITE", price: 3990, desc: "Принт SS1", sizes: ["S","M","L","XL"], category: "tshirts", img: "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=200" }
        ];
        saveProductsToStorage();
    }

    const storedOrders = localStorage.getItem('reverage_orders_admin');
    if(storedOrders) orders = JSON.parse(storedOrders);
    else {
        orders = [
            { id: 101, customer: "Алексей Иванов", total: 12490, status: "Доставлен", date: "2025-06-10" },
            { id: 102, customer: "Мария Смирнова", total: 3990, status: "В обработке", date: "2025-06-12" }
        ];
        saveOrders();
    }

    const storedUsers = localStorage.getItem('reverage_users_admin');
    if(storedUsers) users = JSON.parse(storedUsers);
    else {
        users = [
            { id: 1, name: "Admin Main", email: "admin@reverage.com", role: "superadmin" },
            { id: 2, name: "Manager", email: "manager@reverage.com", role: "manager" }
        ];
        saveUsers();
    }
    activities = JSON.parse(localStorage.getItem('reverage_activities')) || [];
    if(activities.length === 0) addActivity("Система инициализирована", "info");
}

function saveProductsToStorage() { localStorage.setItem('reverage_products', JSON.stringify(products)); window.syncAdminProducts?.(products); }
function saveOrders() { localStorage.setItem('reverage_orders_admin', JSON.stringify(orders)); }
function saveUsers() { localStorage.setItem('reverage_users_admin', JSON.stringify(users)); }
function saveActivities() { localStorage.setItem('reverage_activities', JSON.stringify(activities.slice(0, 20))); }

function addActivity(message, type = "action") { activities.unshift({ message, time: new Date().toLocaleString(), type }); saveActivities(); renderActivities(); }

// --- UI Рендер ---
function renderDashboard() {
    document.getElementById('totalProductsStat').innerText = products.length;
    document.getElementById('totalOrdersStat').innerText = orders.length;
    const revenue = orders.reduce((sum, o) => sum + o.total, 0);
    document.getElementById('totalRevenueStat').innerText = revenue.toLocaleString() + " ₽";
    const uniqueCustomers = [...new Set(orders.map(o => o.customer))];
    document.getElementById('totalCustomersStat').innerText = uniqueCustomers.length;
}

function renderProductsTable() {
    const search = document.getElementById('productSearch')?.value.toLowerCase() || "";
    const category = document.getElementById('categoryFilter')?.value || "all";
    let filtered = products.filter(p => p.name.toLowerCase().includes(search));
    if(category !== "all") filtered = filtered.filter(p => p.category === category);
    const tbody = document.getElementById('productsTableBody');
    if(!tbody) return;
    if(filtered.length === 0) { tbody.innerHTML = "<tr><td colspan='7'>Нет товаров</td></tr>"; return; }
    tbody.innerHTML = filtered.map(p => `
        <tr>
            <td>${p.id}</td>
            <td><img src="${p.img}" class="product-img-small" onerror="this.src='https://placehold.co/60x60/333/white?text=REV'"></td>
            <td>${p.name}</td>
            <td>${p.price.toLocaleString()} ₽</td>
            <td>${p.category}</td>
            <td>${p.sizes.join(", ")}</td>
            <td><button class="edit-btn" data-id="${p.id}"><i class="fas fa-edit"></i></button> <button class="delete-btn" data-id="${p.id}"><i class="fas fa-trash-alt"></i></button></td>
        </tr>
    `).join('');
    document.querySelectorAll('.edit-btn').forEach(btn => btn.addEventListener('click', (e) => { const id = parseInt(btn.dataset.id); openProductModal(id); }));
    document.querySelectorAll('.delete-btn').forEach(btn => btn.addEventListener('click', (e) => { const id = parseInt(btn.dataset.id); deleteProductById(id); }));
}

function deleteProductById(id) {
    if(confirm("Удалить товар?")) {
        products = products.filter(p => p.id !== id);
        saveProductsToStorage();
        renderProductsTable();
        renderDashboard();
        addActivity(`Товар ID ${id} удален`, "delete");
    }
}

function openProductModal(id = null) {
    const modal = document.getElementById('productModal');
    const form = document.getElementById('productForm');
    if(id) {
        const prod = products.find(p => p.id === id);
        if(prod) {
            document.getElementById('productId').value = prod.id;
            document.getElementById('prodName').value = prod.name;
            document.getElementById('prodPrice').value = prod.price;
            document.getElementById('prodDesc').value = prod.desc;
            document.getElementById('prodCategory').value = prod.category;
            document.getElementById('prodSizes').value = prod.sizes.join(",");
            document.getElementById('prodImg').value = prod.img;
            document.getElementById('modalTitle').innerText = "Редактировать товар";
        }
    } else {
        document.getElementById('productForm').reset();
        document.getElementById('productId').value = "";
        document.getElementById('modalTitle').innerText = "Добавить товар";
    }
    modal.style.display = "flex";
}

function saveProductFromModal(event) {
    event.preventDefault();
    const id = document.getElementById('productId').value;
    const name = document.getElementById('prodName').value;
    const price = parseInt(document.getElementById('prodPrice').value);
    const desc = document.getElementById('prodDesc').value;
    const category = document.getElementById('prodCategory').value;
    const sizesRaw = document.getElementById('prodSizes').value;
    const sizes = sizesRaw.split(',').map(s => s.trim().toUpperCase());
    const img = document.getElementById('prodImg').value || "https://images.unsplash.com/photo-1556821840-3a63f95609a7?w=200";
    
    if(id) {
        const index = products.findIndex(p => p.id == id);
        if(index !== -1) {
            products[index] = { ...products[index], name, price, desc, category, sizes, img };
            addActivity(`Товар "${name}" обновлен`, "edit");
        }
    } else {
        const newId = products.length ? Math.max(...products.map(p=>p.id)) + 1 : 100;
        products.push({ id: newId, name, price, desc, sizes, category, img });
        addActivity(`Новый товар "${name}" добавлен`, "add");
    }
    saveProductsToStorage();
    renderProductsTable();
    renderDashboard();
    document.getElementById('productModal').style.display = "none";
}

function renderOrdersTable() {
    const tbody = document.getElementById('ordersTableBody');
    if(!tbody) return;
    if(orders.length === 0) { tbody.innerHTML = "<tr><td colspan='6'>Нет заказов</td></tr>"; return; }
    tbody.innerHTML = orders.map(o => `
        <tr>
            <td>#${o.id}</td><td>${o.customer}</td><td>${o.total.toLocaleString()} ₽</td>
            <td><select class="order-status" data-id="${o.id}">${["В обработке","Отправлен","Доставлен","Отменен"].map(s => `<option ${o.status===s ? 'selected' : ''}>${s}</option>`).join('')}</select></td>
            <td>${o.date}</td>
            <td><button class="delete-order" data-id="${o.id}"><i class="fas fa-trash"></i></button></td>
        </tr>
    `).join('');
    document.querySelectorAll('.order-status').forEach(sel => sel.addEventListener('change', (e) => { const oid = parseInt(sel.dataset.id); const newStatus = sel.value; const order = orders.find(o=>o.id===oid); if(order) { order.status = newStatus; saveOrders(); addActivity(`Заказ #${oid} статус → ${newStatus}`); renderOrdersTable(); renderDashboard(); } }));
    document.querySelectorAll('.delete-order').forEach(btn => btn.addEventListener('click', (e) => { const oid = parseInt(btn.dataset.id); orders = orders.filter(o=>o.id !== oid); saveOrders(); renderOrdersTable(); renderDashboard(); addActivity(`Заказ #${oid} удален`); }));
}

function renderUsersTable() {
    const tbody = document.getElementById('usersTableBody');
    if(!tbody) return;
    tbody.innerHTML = users.map(u => `<tr><td>${u.id}</td><td>${u.name}</td><td>${u.email}</td><td>${u.role}</td><td><button class="delete-user" data-id="${u.id}"><i class="fas fa-user-minus"></i></button></td></tr>`).join('');
    document.querySelectorAll('.delete-user').forEach(btn => btn.addEventListener('click', (e) => { const uid = parseInt(btn.dataset.id); users = users.filter(u=>u.id !== uid); saveUsers(); renderUsersTable(); addActivity(`Пользователь удален`); }));
}

function renderActivities() { 
    const list = document.getElementById('recentActivitiesList');
    if(list) list.innerHTML = activities.slice(0,8).map(a => `<li><i class="fas fa-clock"></i> ${a.time} — ${a.message}</li>`).join('');
}

function initAnalyticsChart() {
    const ctx = document.getElementById('salesChart')?.getContext('2d');
    if(ctx && window.Chart) {
        const catCount = { tshirts:0, hoodies:0, jackets:0, pants:0, accessories:0, shorts:0 };
        products.forEach(p => { if(catCount[p.category]) catCount[p.category]++; else catCount[p.category]=1; });
        new Chart(ctx, { type: 'bar', data: { labels: Object.keys(catCount), datasets: [{ label: 'Кол-во товаров', data: Object.values(catCount), backgroundColor: '#ffffff' }] }, options: { responsive: true, plugins: { legend: { labels: { color: 'white' } } } } });
    } else if(ctx) { console.warn("Chart lib not loaded, using fallback"); }
}

// TABS & EVENT LISTENERS
function initTabs() {
    document.querySelectorAll('.nav-item').forEach(item => {
        item.addEventListener('click', () => {
            const tab = item.dataset.tab;
            document.querySelectorAll('.nav-item').forEach(nav => nav.classList.remove('active'));
            item.classList.add('active');
            document.querySelectorAll('.tab-content').forEach(content => content.classList.remove('active'));
            const activeTab = document.getElementById(`${tab}Tab`);
            if(activeTab) activeTab.classList.add('active');
            document.getElementById('pageTitle').innerText = item.innerText.trim() || "Панель";
            if(tab === 'products') renderProductsTable();
            else if(tab === 'orders') renderOrdersTable();
            else if(tab === 'users') renderUsersTable();
            else if(tab === 'dashboard') renderDashboard();
            else if(tab === 'analytics') initAnalyticsChart();
        });
    });
}

function globalActions() {
    document.getElementById('addProductBtn')?.addEventListener('click', () => openProductModal(null));
    document.getElementById('productForm')?.addEventListener('submit', saveProductFromModal);
    document.querySelectorAll('.modal-close, .admin-modal').forEach(el => el.addEventListener('click', (e) => { if(e.target.classList.contains('modal-close') || e.target.classList.contains('admin-modal')) document.getElementById('productModal').style.display = 'none'; }));
    document.getElementById('refreshDataBtn')?.addEventListener('click', () => { loadInitialData(); renderDashboard(); renderProductsTable(); renderOrdersTable(); renderUsersTable(); addActivity("Ручная синхронизация данных"); });
    document.getElementById('exportDataBtn')?.addEventListener('click', () => { const data = { products, orders, users }; const blob = new Blob([JSON.stringify(data,null,2)], {type:"application/json"}); const a=document.createElement('a'); a.href=URL.createObjectURL(blob); a.download="reverage_backup.json"; a.click(); addActivity("Экспорт данных выполнен"); });
    document.getElementById('createAdminBtn')?.addEventListener('click', () => { const name = prompt("Имя администратора"); const email = prompt("Email"); if(name && email) { const newId = Date.now(); users.push({ id: newId, name, email, role: "admin" }); saveUsers(); renderUsersTable(); addActivity(`Новый админ: ${name}`); } });
    document.getElementById('saveSettingsBtn')?.addEventListener('click', () => { const shop = document.getElementById('shopName').value; const email = document.getElementById('adminEmail').value; localStorage.setItem('shopSettings', JSON.stringify({ shop, email })); addActivity("Настройки сохранены"); alert("Настройки сохранены"); });
    document.getElementById('logoutBtn')?.addEventListener('click', () => { alert("Выход из админ-панели (демо)"); });
    document.getElementById('productSearch')?.addEventListener('input', () => renderProductsTable());
    document.getElementById('categoryFilter')?.addEventListener('change', () => renderProductsTable());
}

document.addEventListener('DOMContentLoaded', () => {
    loadInitialData();
    renderDashboard();
    renderProductsTable();
    renderOrdersTable();
    renderUsersTable();
    renderActivities();
    initTabs();
    globalActions();
    if(document.getElementById('analyticsTab')) initAnalyticsChart();
    // загружаем chart.js для графиков
    if(typeof Chart === 'undefined') {
        const script = document.createElement('script');
        script.src = "https://cdn.jsdelivr.net/npm/chart.js@4.4.0/dist/chart.umd.min.js";
        script.onload = () => initAnalyticsChart();
        document.head.appendChild(script);
    }
});