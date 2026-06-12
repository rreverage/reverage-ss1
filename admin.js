// REVERAGE SS1 - АДМИН ПАНЕЛЬ (РАБОЧАЯ ВЕРСИЯ)

// ПРОВЕРКА ВХОДА
(function() {
    const currentPath = window.location.pathname;
    if (currentPath.includes('admin-login.html')) return;
    
    const isAuthenticated = sessionStorage.getItem('admin_authenticated');
    if (!isAuthenticated) {
        window.location.href = 'admin-login.html';
    }
})();

let products = [];
let orders = [];

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
        orders = [];
    }
}

function saveProducts() {
    localStorage.setItem('reverage_products', JSON.stringify(products));
    if (window.syncProductsFromAdmin) window.syncProductsFromAdmin(products);
}

function saveOrders() {
    localStorage.setItem('reverage_orders_admin', JSON.stringify(orders));
}

function renderDashboard() {
    document.getElementById('totalProductsStat').innerText = products.length;
    document.getElementById('totalOrdersStat').innerText = orders.length;
    const revenue = orders.reduce((sum, o) => sum + o.total, 0);
    document.getElementById('totalRevenueStat').innerText = revenue.toLocaleString() + " ₽";
    const uniqueCustomers = [...new Set(orders.map(o => o.customer))];
    document.getElementById('totalCustomersStat').innerText = uniqueCustomers.length;
}

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
        btn.addEventListener('click', () => editProduct(parseInt(btn.dataset.id)));
    });
    document.querySelectorAll('.delete-product').forEach(btn => {
        btn.addEventListener('click', () => deleteProduct(parseInt(btn.dataset.id)));
    });
}

function editProduct(id) {
    const product = products.find(p => p.id === id);
    if (!product) return;
    const newName = prompt("Новое название:", product.name);
    if (!newName) return;
    const newPrice = parseInt(prompt("Новая цена:", product.price));
    if (!newPrice) return;
    product.name = newName;
    product.price = newPrice;
    saveProducts();
    renderProductsTable();
    renderDashboard();
    alert('Товар обновлен!');
}

function deleteProduct(id) {
    if (!confirm('Удалить товар?')) return;
    products = products.filter(p => p.id !== id);
    saveProducts();
    renderProductsTable();
    renderDashboard();
    alert('Товар удален!');
}

function addProduct() {
    const name = prompt("Название товара:");
    if (!name) return;
    const price = parseInt(prompt("Цена:"));
    if (!price) return;
    const newId = products.length > 0 ? Math.max(...products.map(p => p.id)) + 1 : 100;
    products.push({
        id: newId, name: name, price: price, desc: "",
        sizes: ["S","M","L","XL"], category: "tshirts",
        img: "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=200"
    });
    saveProducts();
    renderProductsTable();
    renderDashboard();
    alert('Товар добавлен!');
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
            <td><select class="order-status" data-id="${o.id}">${["В обработке","Отправлен","Доставлен","Отменен"].map(s => `<option ${o.status === s ? 'selected' : ''}>${s}</option>`).join('')}</select></td>
            <td>${o.date}</td>
            <td><button class="delete-order" data-id="${o.id}" style="background:#ff4444;border:none;color:white;padding:5px 10px;border-radius:5px;cursor:pointer;">Удалить</button></td>
        </tr>
    `).join('');
    document.querySelectorAll('.order-status').forEach(sel => {
        sel.addEventListener('change', (e) => {
            const order = orders.find(o => o.id === parseInt(sel.dataset.id));
            if (order) { order.status = sel.value; saveOrders(); alert('Статус обновлен!'); }
        });
    });
    document.querySelectorAll('.delete-order').forEach(btn => {
        btn.addEventListener('click', () => {
            orders = orders.filter(o => o.id !== parseInt(btn.dataset.id));
            saveOrders(); renderOrdersTable(); renderDashboard(); alert('Заказ удален!');
        });
    });
}

function init() {
    loadData();
    renderDashboard();
    renderProductsTable();
    renderOrdersTable();
    document.getElementById('addProductBtn')?.addEventListener('click', addProduct);
    document.getElementById('refreshDataBtn')?.addEventListener('click', () => { loadData(); renderDashboard(); renderProductsTable(); renderOrdersTable(); alert('Обновлено!'); });
    document.getElementById('logoutBtn')?.addEventListener('click', () => { sessionStorage.clear(); window.location.href = 'admin-login.html'; });
}

document.addEventListener('DOMContentLoaded', init);
