// REVERAGE SS1 - АДМИН ПАНЕЛЬ (ПОЛНОСТЬЮ РАБОЧАЯ ВЕРСИЯ)

// ПРОВЕРКА ВХОДА
(function() {
    const currentPath = window.location.pathname;
    if (currentPath.includes('admin-login.html')) return;
    
    const isAuthenticated = sessionStorage.getItem('admin_authenticated');
    if (!isAuthenticated) {
        window.location.href = 'admin-login.html';
    }
})();

// ---- ГЛОБАЛЬНЫЕ ДАННЫЕ ----
let products = [];
let orders = [];

// ЗАГРУЗКА ДАННЫХ ИЗ localStorage
function loadData() {
    const storedProducts = localStorage.getItem('reverage_products');
    if (storedProducts && JSON.parse(storedProducts).length > 0) {
        products = JSON.parse(storedProducts);
    } else {
        products = [
            { id: 1, name: "OVERSIZED HOODIE BLACK", price: 8990, desc: "Хлопок 100%", sizes: ["S","M","L","XL"], category: "hoodies", img: "https://images.unsplash.com/photo-1556821840-3a63f95609a7?w=200" },
            { id: 2, name: "CARGO PANTS SS1", price: 7490, desc: "Утилитарные карго", sizes: ["S","M","L","XL"], category: "pants", img: "https://images.unsplash.com/photo-1594938298603-c8148c4dae35?w=200" },
            { id: 3, name: "GRAPHIC TEE WHITE", price: 3990, desc: "Принт SS1", sizes: ["S","M","L","XL"], category: "tshirts", img: "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=200" }
        ];
        saveProducts();
    }
    
    const storedOrders = localStorage.getItem('reverage_orders_admin');
    if (storedOrders) {
        orders = JSON.parse(storedOrders);
    } else {
        orders = [
            { id: 101, customer: "Алексей Иванов", total: 12490, status: "Доставлен", date: "2025-06-10" },
            { id: 102, customer: "Мария Смирнова", total: 3990, status: "В обработке", date: "2025-06-12" }
        ];
        saveOrders();
    }
}

function saveProducts() {
    localStorage.setItem('reverage_products', JSON.stringify(products));
    if (window.syncProductsFromAdmin) {
        window.syncProductsFromAdmin(products);
    }
}

function saveOrders() {
    localStorage.setItem('reverage_orders_admin', JSON.stringify(orders));
}

// РЕНДЕР ДАШБОРДА
function renderDashboard() {
    document.getElementById('totalProductsStat').innerText = products.length;
    document.getElementById('totalOrdersStat').innerText = orders.length;
    const revenue = orders.reduce((sum, o) => sum + o.total, 0);
    document.getElementById('totalRevenueStat').innerText = revenue.toLocaleString() + " ₽";
    const uniqueCustomers = [...new Set(orders.map(o => o.customer))];
    document.getElementById('totalCustomersStat').innerText = uniqueCustomers.length;
}

// РЕНДЕР ТАБЛИЦЫ ТОВАРОВ
function renderProductsTable() {
    const tbody = document.getElementById('productsTableBody');
    if (!tbody) return;
    
    if (products.length === 0) {
        tbody.innerHTML = `<tr><td colspan="7">Нет товаров, добавьте первый!</td></tr>`;
        return;
    }
    
    tbody.innerHTML = products.map(p => `
        <tr>
            <td>${p.id}</td>
            <td><img src="${p.img}" style="width:45px;height:45px;object-fit:cover;border-radius:8px;" onerror="this.src='https://placehold.co/60x60/333/white?text=REV'"></td>
            <td>${p.name}</td>
            <td>${p.price.toLocaleString()} ₽</td>
            <td>${p.category}</td>
            <td>${p.sizes.join(", ")}</td>
            <td>
                <button class="edit-product" data-id="${p.id}" style="background:#2a2a2a;border:none;color:white;padding:5px 10px;border-radius:5px;cursor:pointer;margin-right:5px;"><i class="fas fa-edit"></i> Изменить</button>
                <button class="delete-product" data-id="${p.id}" style="background:#ff4444;border:none;color:white;padding:5px 10px;border-radius:5px;cursor:pointer;"><i class="fas fa-trash-alt"></i> Удалить</button>
            </td>
        </tr>
    `).join('');
    
    document.querySelectorAll('.edit-product').forEach(btn => {
        btn.addEventListener('click', () => {
            const id = parseInt(btn.dataset.id);
            editProduct(id);
        });
    });
    
    document.querySelectorAll('.delete-product').forEach(btn => {
        btn.addEventListener('click', () => {
            const id = parseInt(btn.dataset.id);
            if (confirm('Удалить товар?')) {
                products = products.filter(p => p.id !== id);
                saveProducts();
                renderProductsTable();
                renderDashboard();
                alert('Товар удален! Обновите главную страницу, чтобы увидеть изменения.');
            }
        });
    });
}

function editProduct(id) {
    const product = products.find(p => p.id === id);
    if (!product) return;
    
    const newName = prompt("Название товара:", product.name);
    if (!newName) return;
    const newPrice = parseInt(prompt("Цена (₽):", product.price));
    if (!newPrice) return;
    const newCategory = prompt("Категория (tshirts/hoodies/jackets/shorts/pants/accessories):", product.category);
    const newSizes = prompt("Размеры (через запятую, например: S,M,L,XL):", product.sizes.join(","));
    
    product.name = newName;
    product.price = newPrice;
    if (newCategory) product.category = newCategory;
    if (newSizes) product.sizes = newSizes.split(',').map(s => s.trim().toUpperCase());
    
    saveProducts();
    renderProductsTable();
    renderDashboard();
    alert('Товар обновлен! Обновите главную страницу, чтобы увидеть изменения.');
}

function addProduct() {
    const name = prompt("Название товара:");
    if (!name) return;
    const price = parseInt(prompt("Цена (₽):"));
    if (!price) return;
    const category = prompt("Категория (tshirts/hoodies/jackets/shorts/pants/accessories):", "tshirts");
    const sizes = prompt("Размеры (через запятую, например: S,M,L,XL):", "S,M,L,XL");
    const img = prompt("URL изображения (оставьте пустым для стандартного):", "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=200");
    
    const newId = products.length > 0 ? Math.max(...products.map(p => p.id)) + 1 : 100;
    
    products.push({
        id: newId,
        name: name,
        price: price,
        desc: "",
        sizes: sizes.split(',').map(s => s.trim().toUpperCase()),
        category: category || "tshirts",
        img: img || "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=200"
    });
    
    saveProducts();
    renderProductsTable();
    renderDashboard();
    alert('Товар добавлен! Обновите главную страницу, чтобы увидеть изменения.');
}

function renderOrdersTable() {
    const tbody = document.getElementById('ordersTableBody');
    if (!tbody) return;
    
    if (orders.length === 0) {
        tbody.innerHTML = `<tr><td colspan="6">Нет заказов</td></tr>`;
        return;
    }
    
    tbody.innerHTML = orders.map(o => `
        <tr>
            <td>#${o.id}</td>
            <td>${o.customer}</td>
            <td>${o.total.toLocaleString()} ₽</td>
            <td>
                <select class="order-status" data-id="${o.id}" style="background:#1a1a1a;color:white;border:1px solid #333;padding:5px 10px;border-radius:5px;">
                    ${["В обработке", "Отправлен", "Доставлен", "Отменен"].map(s => `<option ${o.status === s ? 'selected' : ''}>${s}</option>`).join('')}
                </select>
            </td>
            <td>${o.date}</td>
            <td><button class="delete-order" data-id="${o.id}" style="background:#ff4444;border:none;color:white;padding:5px 10px;border-radius:5px;cursor:pointer;"><i class="fas fa-trash"></i> Удалить</button></td>
        </tr>
    `).join('');
    
    document.querySelectorAll('.order-status').forEach(sel => {
        sel.addEventListener('change', (e) => {
            const id = parseInt(sel.dataset.id);
            const order = orders.find(o => o.id === id);
            if (order) {
                order.status = sel.value;
                saveOrders();
                alert('Статус заказа обновлен!');
            }
        });
    });
    
    document.querySelectorAll('.delete-order').forEach(btn => {
        btn.addEventListener('click', () => {
            const id = parseInt(btn.dataset.id);
            if (confirm('Удалить заказ?')) {
                orders = orders.filter(o => o.id !== id);
                saveOrders();
                renderOrdersTable();
                renderDashboard();
                alert('Заказ удален!');
            }
        });
    });
}

// РЕНДЕР АКТИВНОСТИ
function renderActivities() {
    const list = document.getElementById('recentActivitiesList');
    if (!list) return;
    
    const activities = [
        { time: new Date().toLocaleString(), message: "Админ панель загружена" },
        { time: new Date().toLocaleString(), message: `Всего товаров: ${products.length}` },
        { time: new Date().toLocaleString(), message: `Всего заказов: ${orders.length}` }
    ];
    
    list.innerHTML = activities.map(a => `<li><i class="fas fa-clock"></i> ${a.time} — ${a.message}</li>`).join('');
}

// ИНИЦИАЛИЗАЦИЯ
document.addEventListener('DOMContentLoaded', () => {
    loadData();
    renderDashboard();
    renderProductsTable();
    renderOrdersTable();
    renderActivities();
    
    document.getElementById('addProductBtn')?.addEventListener('click', addProduct);
    
    document.getElementById('refreshDataBtn')?.addEventListener('click', () => {
        loadData();
        renderDashboard();
        renderProductsTable();
        renderOrdersTable();
        renderActivities();
        alert('Данные синхронизированы!');
    });
    
    document.getElementById('exportDataBtn')?.addEventListener('click', () => {
        const data = { products, orders, exportDate: new Date().toISOString() };
        const blob = new Blob([JSON.stringify(data, null, 2)], {type: "application/json"});
        const a = document.createElement('a');
        a.href = URL.createObjectURL(blob);
        a.download = `reverage_backup_${Date.now()}.json`;
        a.click();
        alert('Экспорт выполнен!');
    });
    
    document.getElementById('logoutBtn')?.addEventListener('click', () => {
        sessionStorage.clear();
        window.location.href = 'admin-login.html';
    });
    
    // Обновление статистики при переключении вкладок
    document.querySelectorAll('.nav-item').forEach(item => {
        item.addEventListener('click', () => {
            if (item.dataset.tab === 'dashboard') renderDashboard();
            if (item.dataset.tab === 'products') renderProductsTable();
            if (item.dataset.tab === 'orders') renderOrdersTable();
        });
    });
});
