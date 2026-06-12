// REVERAGE SS1 - Админ панель (упрощенная версия)

// ПРОВЕРКА ВХОДА (исправленная)
(function() {
    const currentPath = window.location.pathname;
    
    // Если это страница входа - пропускаем
    if (currentPath.includes('admin-login.html')) {
        return;
    }
    
    // Проверяем авторизацию
    const isAuthenticated = sessionStorage.getItem('admin_authenticated');
    
    if (!isAuthenticated) {
        window.location.href = 'admin-login.html';
    }
})();

// ---- ГЛОБАЛЬНЫЕ ДАННЫЕ ----
let products = [];
let orders = [];
let users = [];
let activities = [];

// Загрузка товаров из localStorage
function loadInitialData() {
    const storedProducts = localStorage.getItem('reverage_products');
    if(storedProducts && JSON.parse(storedProducts).length > 0) {
        products = JSON.parse(storedProducts);
    } else {
        products = [
            { id: 1, name: "OVERSIZED HOODIE BLACK", price: 8990, desc: "Хлопок 100%", sizes: ["S","M","L","XL"], category: "hoodies", img: "https://images.unsplash.com/photo-1556821840-3a63f95609a7?w=200" },
            { id: 2, name: "CARGO PANTS SS1", price: 7490, desc: "Утилитарные карго", sizes: ["S","M","L","XL"], category: "pants", img: "https://images.unsplash.com/photo-1594938298603-c8148c4dae35?w=200" },
            { id: 3, name: "GRAPHIC TEE WHITE", price: 3990, desc: "Принт SS1", sizes: ["S","M","L","XL"], category: "tshirts", img: "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=200" }
        ];
        saveProductsToStorage();
    }
}

function saveProductsToStorage() { localStorage.setItem('reverage_products', JSON.stringify(products)); }

// Рендер таблицы товаров
function renderProductsTable() {
    const tbody = document.getElementById('productsTableBody');
    if(!tbody) return;
    
    if(products.length === 0) {
        tbody.innerHTML = "<tr><td colspan='7'>Нет товаров</td></tr>";
        return;
    }
    
    tbody.innerHTML = products.map(p => `
        <tr>
            <td>${p.id}</td>
            <td><img src="${p.img}" style="width:45px;height:45px;object-fit:cover;border-radius:8px;"></td>
            <td>${p.name}</td>
            <td>${p.price.toLocaleString()} ₽</td>
            <td>${p.category}</td>
            <td>${p.sizes.join(", ")}</td>
            <td>
                <button class="edit-btn" data-id="${p.id}"><i class="fas fa-edit"></i></button>
                <button class="delete-btn" data-id="${p.id}"><i class="fas fa-trash-alt"></i></button>
            </td>
        </tr>
    `).join('');
    
    document.querySelectorAll('.delete-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const id = parseInt(btn.dataset.id);
            if(confirm("Удалить товар?")) {
                products = products.filter(p => p.id !== id);
                saveProductsToStorage();
                renderProductsTable();
                document.getElementById('totalProductsStat').innerText = products.length;
            }
        });
    });
}

function renderDashboard() {
    document.getElementById('totalProductsStat').innerText = products.length;
}

// Инициализация
document.addEventListener('DOMContentLoaded', () => {
    loadInitialData();
    renderDashboard();
    renderProductsTable();
    
    // Кнопка добавления товара
    document.getElementById('addProductBtn')?.addEventListener('click', () => {
        const name = prompt("Название товара");
        const price = parseInt(prompt("Цена"));
        if(name && price) {
            const newId = products.length + 1;
            products.push({
                id: newId,
                name: name,
                price: price,
                desc: "",
                sizes: ["S","M","L"],
                category: "tshirts",
                img: "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=200"
            });
            saveProductsToStorage();
            renderProductsTable();
            renderDashboard();
        }
    });
});
