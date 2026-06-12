// Данные товаров с категориями
const products = [
    { id: 1, name: "OVERSIZED HOODIE BLACK", price: 8990, desc: "Хлопок 100%, объемный крой, вышивка REVERAGE. Премиальное качество.", sizes: ["S", "M", "L", "XL"], category: "hoodies", img: "https://images.unsplash.com/photo-1556821840-3a63f95609a7?w=500" },
    { id: 2, name: "CARGO PANTS SS1", price: 7490, desc: "Утилитарные карго с множеством карманов, плотная ткань, регулируемые манжеты.", sizes: ["S", "M", "L", "XL"], category: "pants", img: "https://images.unsplash.com/photo-1594938298603-c8148c4dae35?w=500" },
    { id: 3, name: "TACTICAL VEST", price: 12990, desc: "Тактический жилет из нейлона, регулировка по размеру, молнии YKK.", sizes: ["M", "L", "XL"], category: "accessories", img: "https://images.unsplash.com/photo-1591047139829-d91aecb6caea?w=500" },
    { id: 4, name: "GRAPHIC TEE WHITE", price: 3990, desc: "Футболка с принтом SS1, 100% хлопок, принт высокого качества.", sizes: ["S", "M", "L", "XL", "XXL"], category: "tshirts", img: "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=500" },
    { id: 5, name: "BALACLAVA BEANIE", price: 2490, desc: "Бафф/балаклава с вышитым логотипом, унисекс, один размер.", sizes: ["ONE SIZE"], category: "accessories", img: "https://images.unsplash.com/photo-1576871337632-b9aef4c17ab9?w=500" },
    { id: 6, name: "DENIM JACKET REVERAGE", price: 15990, desc: "Джинсовая куртка с пэчворком и вышивкой, деним 100% хлопок.", sizes: ["S", "M", "L"], category: "jackets", img: "https://images.unsplash.com/photo-1576995853123-5a10305d93c0?w=500" },
    { id: 7, name: "SWEATPANTS BLACK", price: 6490, desc: "Спортивные штаны на флисе, карманы, утяжка на поясе.", sizes: ["S", "M", "L", "XL"], category: "pants", img: "https://images.unsplash.com/photo-1552902865-b72c031ac5ea?w=500" },
    { id: 8, name: "SNAPBACK CAP", price: 2990, desc: "Кепка-снапбэк с вышитым логотипом REVERAGE, регулировка.", sizes: ["ONE SIZE"], category: "accessories", img: "https://images.unsplash.com/photo-1588850561407-ed78c282e89b?w=500" },
    { id: 9, name: "SUMMER SHORTS", price: 4990, desc: "Хлопковые шорты с логотипом, удобный крой, два кармана.", sizes: ["S", "M", "L", "XL"], category: "shorts", img: "https://images.unsplash.com/photo-1591195853828-11db59a44f6b?w=500" },
    { id: 10, name: "CARGO SHORTS", price: 5990, desc: "Утилитарные шорты с множеством карманов.", sizes: ["S", "M", "L", "XL"], category: "shorts", img: "https://images.unsplash.com/photo-1594938298603-c8148c4dae35?w=500" },
    { id: 11, name: "ZIP HOODIE GREEN", price: 9990, desc: "Худи на молнии из премиального хлопка.", sizes: ["S", "M", "L", "XL"], category: "hoodies", img: "https://images.unsplash.com/photo-1556821840-3a63f95609a7?w=500" },
    { id: 12, name: "LEATHER KEYCHAIN", price: 1490, desc: "Брелок из натуральной кожи с логотипом.", sizes: ["ONE SIZE"], category: "accessories", img: "https://images.unsplash.com/photo-1588850561407-ed78c282e89b?w=500" }
];

let cart = [];
let currentProduct = null;
let selectedSize = null;
let currentCategory = "all";
let pendingAddToCart = null;

// База данных адресов
const addressDatabase = {
    "москва": { streets: ["Тверская", "Арбат", "Новый Арбат", "Ленинский проспект", "Кутузовский проспект", "Профсоюзная"], postal: "101000" },
    "санкт-петербург": { streets: ["Невский проспект", "Моховая", "Литейный проспект", "Садовая", "Восстания"], postal: "191000" },
    "новосибирск": { streets: ["Красный проспект", "Ленина", "Димитрова", "Горького"], postal: "630000" },
    "екатеринбург": { streets: ["Ленина", "Малышева", "Тверитина", "Белинского"], postal: "620000" },
    "казань": { streets: ["Баумана", "Кремлевская", "Пушкина", "Чернышевского"], postal: "420000" }
};

let streetDatabase = {};

// Загрузка при старте
document.addEventListener('DOMContentLoaded', function() {
    loadCartFromStorage();
    renderCatalog(products);
    initEventListeners();
    initChat();
    initVirtualCard();
    initMobileMenu();
});

function closeWelcomeModal() {
    const modal = document.getElementById('welcomeModal');
    if (modal) modal.style.display = 'none';
}

function getCategoryName(cat) {
    const names = {
        tshirts: "Футболки",
        hoodies: "Худи",
        jackets: "Куртки",
        shorts: "Шорты",
        pants: "Штаны",
        accessories: "Аксессуары"
    };
    return names[cat] || cat;
}

// Мобильное меню
function initMobileMenu() {
    const menuBtn = document.querySelector('.mobile-menu-btn');
    const navLinks = document.querySelector('.nav-links');
    
    if (menuBtn && navLinks) {
        menuBtn.addEventListener('click', function() {
            navLinks.classList.toggle('mobile-open');
            if (navLinks.classList.contains('mobile-open')) {
                menuBtn.innerHTML = '<i class="fas fa-times"></i>';
            } else {
                menuBtn.innerHTML = '<i class="fas fa-bars"></i>';
            }
        });
    }
}

// Рендер каталога
function renderCatalog(productsToRender) {
    const app = document.getElementById('app');
    if (!app) return;
    
    let filtered = productsToRender;
    if (currentCategory !== 'all') {
        filtered = productsToRender.filter(p => p.category === currentCategory);
    }
    
    app.innerHTML = `
        <div class="catalog-container">
            <div class="search-bar">
                <input type="text" id="searchInput" placeholder="ПОИСК ОДЕЖДЫ...">
            </div>
            <div class="categories">
                <button class="category-btn ${currentCategory === 'all' ? 'active' : ''}" data-category="all">ВСЕ</button>
                <button class="category-btn ${currentCategory === 'tshirts' ? 'active' : ''}" data-category="tshirts">ФУТБОЛКИ</button>
                <button class="category-btn ${currentCategory === 'hoodies' ? 'active' : ''}" data-category="hoodies">ХУДИ</button>
                <button class="category-btn ${currentCategory === 'jackets' ? 'active' : ''}" data-category="jackets">КУРТКИ</button>
                <button class="category-btn ${currentCategory === 'shorts' ? 'active' : ''}" data-category="shorts">ШОРТЫ</button>
                <button class="category-btn ${currentCategory === 'pants' ? 'active' : ''}" data-category="pants">ШТАНЫ</button>
                <button class="category-btn ${currentCategory === 'accessories' ? 'active' : ''}" data-category="accessories">АКСЕССУАРЫ</button>
            </div>
            <div class="products-grid" id="productsGrid"></div>
        </div>
    `;
    
    const grid = document.getElementById('productsGrid');
    if (!grid) return;
    
    if (filtered.length === 0) {
        grid.innerHTML = '<div style="text-align: center; padding: 3rem;">Товары не найдены</div>';
        return;
    }
    
    grid.innerHTML = filtered.map(p => `
        <div class="product-card" data-id="${p.id}">
            <img class="product-image" src="${p.img}" alt="${p.name}" onerror="this.src='https://placehold.co/400x500/1a1a1a/white?text=REVERAGE+SS1'">
            <div class="product-info">
                <div class="product-title">${p.name}</div>
                <div class="product-price">${p.price.toLocaleString()} ₽</div>
                <div class="product-category">${getCategoryName(p.category)}</div>
                <button class="add-to-cart-btn" data-id="${p.id}">
                    <i class="fas fa-shopping-bag"></i> В КОРЗИНУ
                </button>
            </div>
        </div>
    `).join('');
    
    document.querySelectorAll('.product-image').forEach(img => {
        img.addEventListener('click', function(e) {
            e.stopPropagation();
            const card = this.closest('.product-card');
            const id = parseInt(card.dataset.id);
            openProductModal(id);
        });
    });
    
    document.querySelectorAll('.add-to-cart-btn').forEach(btn => {
        btn.addEventListener('click', function(e) {
            e.stopPropagation();
            const id = parseInt(btn.dataset.id);
            const product = products.find(p => p.id === id);
            if (product) openQuickAddModal(product);
        });
    });
    
    document.querySelectorAll('.category-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            currentCategory = btn.dataset.category;
            renderCatalog(products);
        });
    });
    
    const searchInput = document.getElementById('searchInput');
    if (searchInput) {
        searchInput.addEventListener('input', function(e) {
            const query = e.target.value.toLowerCase();
            const filteredProducts = products.filter(p => p.name.toLowerCase().includes(query));
            renderCatalog(filteredProducts);
        });
    }
}

function openQuickAddModal(product) {
    pendingAddToCart = product;
    selectedSize = null;
    
    const modal = document.getElementById('quickAddModal');
    const img = document.getElementById('quickAddImg');
    const name = document.getElementById('quickAddName');
    const price = document.getElementById('quickAddPrice');
    const sizeContainer = document.getElementById('quickSizeOptions');
    
    if (img) img.src = product.img;
    if (name) name.innerText = product.name;
    if (price) price.innerHTML = `${product.price.toLocaleString()} ₽`;
    
    if (sizeContainer) {
        sizeContainer.innerHTML = product.sizes.map(size => 
            `<button class="size-btn" data-size="${size}">${size}</button>`
        ).join('');
        
        document.querySelectorAll('#quickSizeOptions .size-btn').forEach(btn => {
            btn.addEventListener('click', function(e) {
                document.querySelectorAll('#quickSizeOptions .size-btn').forEach(b => b.classList.remove('selected'));
                btn.classList.add('selected');
                selectedSize = btn.dataset.size;
            });
        });
    }
    
    modal.style.display = 'flex';
}

function openProductModal(productId) {
    currentProduct = products.find(p => p.id === productId);
    if (!currentProduct) return;
    selectedSize = null;
    
    const modalImg = document.getElementById('modalProductImg');
    const modalName = document.getElementById('modalProductName');
    const modalPrice = document.getElementById('modalProductPrice');
    const modalDesc = document.getElementById('modalProductDesc');
    const sizeContainer = document.getElementById('sizeOptions');
    
    if (modalImg) modalImg.src = currentProduct.img;
    if (modalName) modalName.innerText = currentProduct.name;
    if (modalPrice) modalPrice.innerHTML = `${currentProduct.price.toLocaleString()} ₽`;
    if (modalDesc) modalDesc.innerText = currentProduct.desc;
    
    if (sizeContainer) {
        sizeContainer.innerHTML = currentProduct.sizes.map(size => 
            `<button class="size-btn" data-size="${size}">${size}</button>`
        ).join('');
        
        document.querySelectorAll('#sizeOptions .size-btn').forEach(btn => {
            btn.addEventListener('click', function(e) {
                document.querySelectorAll('#sizeOptions .size-btn').forEach(b => b.classList.remove('selected'));
                btn.classList.add('selected');
                selectedSize = btn.dataset.size;
            });
        });
    }
    
    const productModal = document.getElementById('productModal');
    if (productModal) productModal.style.display = 'flex';
}

function addToCart(product, size) {
    if (!size) {
        showNotification('Пожалуйста, выберите размер!', 'error');
        return false;
    }
    
    const existing = cart.find(item => item.id === product.id && item.size === size);
    if (existing) {
        existing.quantity++;
    } else {
        cart.push({ ...product, size, quantity: 1 });
    }
    saveCart();
    updateCartUI();
    showNotification(`${product.name} (${size}) добавлен в корзину!`, 'success');
    return true;
}

function showNotification(msg, type = 'success') {
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.innerText = msg;
    document.body.appendChild(notification);
    setTimeout(() => notification.remove(), 2000);
}

function saveCart() {
    localStorage.setItem('reverage_cart', JSON.stringify(cart));
    updateCartCount();
}

function loadCartFromStorage() {
    const saved = localStorage.getItem('reverage_cart');
    if (saved) {
        try {
            cart = JSON.parse(saved);
        } catch(e) {
            cart = [];
        }
    }
    updateCartCount();
}

function updateCartCount() {
    const count = cart.reduce((sum, item) => sum + item.quantity, 0);
    const cartCountElem = document.getElementById('cartCount');
    if (cartCountElem) cartCountElem.innerText = count;
}

// Рендер корзины с крестиком для закрытия
function renderCart() {
    const app = document.getElementById('app');
    if (!app) return;
    
    if (cart.length === 0) {
        app.innerHTML = `
            <div class="cart-container">
                <span class="close-cart" id="closeCartBtn">&times;</span>
                <h2>КОРЗИНА</h2>
                <p style="text-align: center; padding: 2rem;">Ваша корзина пуста</p>
                <button class="btn-primary" id="goToCatalogBtn">ПЕРЕЙТИ В КАТАЛОГ</button>
            </div>
        `;
        const closeBtn = document.getElementById('closeCartBtn');
        if (closeBtn) closeBtn.addEventListener('click', () => renderCatalog(products));
        const goToCatalog = document.getElementById('goToCatalogBtn');
        if (goToCatalog) goToCatalog.addEventListener('click', () => renderCatalog(products));
        return;
    }
    
    const total = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
    
    app.innerHTML = `
        <div class="cart-container">
            <span class="close-cart" id="closeCartBtn">&times;</span>
            <h2>КОРЗИНА</h2>
            <div id="cartItemsList"></div>
            <div class="cart-total">ИТОГО: ${total.toLocaleString()} ₽</div>
            <button class="btn-primary" id="checkoutBtn">ОФОРМИТЬ ЗАКАЗ</button>
        </div>
    `;
    
    const closeBtn = document.getElementById('closeCartBtn');
    if (closeBtn) closeBtn.addEventListener('click', () => renderCatalog(products));
    
    const list = document.getElementById('cartItemsList');
    if (list) {
        list.innerHTML = cart.map((item, idx) => `
            <div class="cart-item">
                <div class="cart-item-info">
                    <h4>${item.name}</h4>
                    <p>Размер: ${item.size} | Кол-во: ${item.quantity}</p>
                    <p>${(item.price * item.quantity).toLocaleString()} ₽</p>
                </div>
                <div class="cart-item-actions">
                    <button onclick="changeQuantity(${idx}, -1)">-</button>
                    <button onclick="changeQuantity(${idx}, 1)">+</button>
                    <button onclick="removeFromCart(${idx})">🗑️</button>
                </div>
            </div>
        `).join('');
    }
    
    const checkoutBtn = document.getElementById('checkoutBtn');
    if (checkoutBtn) {
        checkoutBtn.onclick = function() {
            const deliveryModal = document.getElementById('deliveryModal');
            if (deliveryModal) deliveryModal.style.display = 'flex';
        };
    }
}

window.changeQuantity = function(idx, delta) {
    const newQty = cart[idx].quantity + delta;
    if (newQty <= 0) {
        cart.splice(idx, 1);
    } else {
        cart[idx].quantity = newQty;
    }
    saveCart();
    renderCart();
};

window.removeFromCart = function(idx) {
    cart.splice(idx, 1);
    saveCart();
    renderCart();
};

function updateCartUI() {
    if (document.querySelector('.cart-container')) renderCart();
    updateCartCount();
}

function initVirtualCard() {
    const cardNumber = document.getElementById('cardNumberInput');
    const cardExpiry = document.getElementById('cardExpiryInput');
    const cardHolder = document.getElementById('cardHolderInput');
    const displayNumber = document.getElementById('displayCardNumber');
    const displayHolder = document.getElementById('displayCardHolder');
    const displayExpiry = document.getElementById('displayExpiry');
    
    if (cardNumber) {
        cardNumber.addEventListener('input', function(e) {
            let value = e.target.value.replace(/\D/g, '');
            let formatted = '';
            for (let i = 0; i < value.length && i < 16; i++) {
                if (i > 0 && i % 4 === 0) formatted += ' ';
                formatted += value[i];
            }
            e.target.value = formatted;
            if (displayNumber) displayNumber.innerText = formatted || '•••• •••• •••• ••••';
        });
    }
    
    if (cardExpiry) {
        cardExpiry.addEventListener('input', function(e) {
            let value = e.target.value.replace(/\D/g, '');
            if (value.length >= 2) {
                value = value.slice(0, 2) + '/' + value.slice(2, 4);
            }
            e.target.value = value;
            if (displayExpiry) displayExpiry.innerText = value || 'MM/YY';
        });
    }
    
    if (cardHolder) {
        cardHolder.addEventListener('input', function(e) {
            const value = e.target.value.toUpperCase();
            if (displayHolder) displayHolder.innerText = value || 'YOUR NAME';
        });
    }
}

function initAddressAutocomplete() {
    const cityInput = document.getElementById('cityInput');
    const streetInput = document.getElementById('streetInput');
    const citySuggestions = document.getElementById('citySuggestions');
    const streetSuggestions = document.getElementById('streetSuggestions');
    const postalInput = document.getElementById('postalInput');
    
    if (!cityInput) return;
    
    cityInput.addEventListener('input', function() {
        const val = cityInput.value.toLowerCase();
        if (val.length < 2) {
            if (citySuggestions) citySuggestions.style.display = 'none';
            return;
        }
        
        const filtered = Object.keys(addressDatabase).filter(city => 
            city.includes(val) || val.includes(city)
        );
        
        if (filtered.length && citySuggestions) {
            citySuggestions.innerHTML = filtered.map(city => `<div>${city.charAt(0).toUpperCase() + city.slice(1)}</div>`).join('');
            citySuggestions.style.display = 'block';
            
            document.querySelectorAll('#citySuggestions div').forEach(div => {
                div.onclick = function() {
                    const selectedCity = div.innerText.toLowerCase();
                    cityInput.value = div.innerText;
                    citySuggestions.style.display = 'none';
                    
                    if (addressDatabase[selectedCity]) {
                        streetDatabase = {};
                        addressDatabase[selectedCity].streets.forEach(s => {
                            streetDatabase[s.toLowerCase()] = s;
                        });
                        if (postalInput) postalInput.value = addressDatabase[selectedCity].postal;
                    }
                };
            });
        } else if (citySuggestions) {
            citySuggestions.style.display = 'none';
        }
    });
    
    if (streetInput && streetSuggestions) {
        streetInput.addEventListener('input', function() {
            const val = streetInput.value.toLowerCase();
            if (val.length < 2 || Object.keys(streetDatabase).length === 0) {
                streetSuggestions.style.display = 'none';
                return;
            }
            
            const filtered = Object.keys(streetDatabase).filter(street => 
                street.includes(val)
            );
            
            if (filtered.length) {
                streetSuggestions.innerHTML = filtered.slice(0, 5).map(street => 
                    `<div>${streetDatabase[street]}</div>`
                ).join('');
                streetSuggestions.style.display = 'block';
                
                document.querySelectorAll('#streetSuggestions div').forEach(div => {
                    div.onclick = function() {
                        streetInput.value = div.innerText;
                        streetSuggestions.style.display = 'none';
                    };
                });
            } else {
                streetSuggestions.style.display = 'none';
            }
        });
    }
    
    document.addEventListener('click', function(e) {
        if (citySuggestions && !cityInput.contains(e.target)) citySuggestions.style.display = 'none';
        if (streetSuggestions && !streetInput.contains(e.target)) streetSuggestions.style.display = 'none';
    });
}

function renderContacts() {
    const app = document.getElementById('app');
    if (!app) return;
    
    app.innerHTML = `
        <div class="contacts-container">
            <h2>КОНТАКТЫ</h2>
            <div class="contacts-grid">
                <div class="contact-card">
                    <i class="fas fa-map-marker-alt"></i>
                    <h3>АДРЕС</h3>
                    <p>г. Норильск </p>
                    <p>Ежедневно 11:00 - 21:00</p>
                </div>
                <div class="contact-card">
                    <i class="fas fa-phone"></i>
                    <h3>ТЕЛЕФОН</h3>
                    <p>+7 (913) 531-74-05</p>
                    <p>+7 (923) 206-14-99</p>
                </div>
                <div class="contact-card">
                    <i class="fas fa-envelope"></i>
                    <h3>EMAIL</h3>
                    <p>info@reverage.c</p>
                    <p>support@reverage.com</p>
                </div>
                <div class="contact-card">
                    <i class="fab fa-instagram"></i>
                    <h3>INSTAGRAM</h3>
                    <p>@reverage_official</p>
                    <p>@reverage_ss1</p>
                </div>
                <div class="contact-card">
                    <i class="fab fa-telegram"></i>
                    <h3>TELEGRAM</h3>
                    <p>@REVmanager_bot</p>
                    <p>t.me/reveragest2026</p>
                </div>
                <div class="contact-card">
                    <i class="fab fa-whatsapp"></i>
                    <h3>WHATSAPP</h3>
                    <p>+7 (923) 206-14-99</p>
                </div>
            </div>
        </div>
    `;
}

// Чат бот
const botResponses = {
    "размер": "У нас представлены размеры от XS до XXL. В карточке каждого товара можно выбрать подходящий размер.",
    "доставка": "Доставляем по всей России. Сроки: 3-7 дней. Бесплатно от 5000₽.",
    "возврат": "Возврат товара возможен в течение 14 дней. Товар должен быть в оригинальной упаковке.",
    "скидки": "При первом заказе скидка 10% по промокоду REVERAGE10!",
    "ткань": "Используем 100% хлопок, премиальный полиэстер, нейлон. Состав указан в описании.",
    "привет": "Привет! Я ассистент REVERAGE. Чем могу помочь? 🖤",
    "контакты": "Наши контакты: +7 (913) 531-74-05, info@reverage.com, Instagram @reverage_official"
};

function getBotResponse(message) {
    const lowerMsg = message.toLowerCase();
    for (const [key, response] of Object.entries(botResponses)) {
        if (lowerMsg.includes(key)) return response;
    }
    const randomReplies = [
        "Интересный вопрос! Напишите нам в Instagram @reverage_official 🖤",
        "REVERAGE SS1 создан для улиц. Что именно вас интересует?",
        "Уточните вопрос о товаре или доставке. Я помогу!",
        "Посмотрите наши худи и карго — это топ этой коллекции!"
    ];
    return randomReplies[Math.floor(Math.random() * randomReplies.length)];
}

function initChat() {
    const chatBtn = document.getElementById('openChatBtn');
    const closeChatBtn = document.getElementById('closeChatBtn');
    const chatBox = document.getElementById('chatBot');
    const sendBtn = document.getElementById('sendChatBtn');
    const chatInput = document.getElementById('chatInput');
    const chatMessages = document.getElementById('chatMessages');
    
    if (!chatBtn) return;
    
    chatBtn.onclick = function() {
        if (chatBox) chatBox.style.display = 'flex';
        if (chatBtn) chatBtn.style.display = 'none';
    };
    
    if (closeChatBtn) {
        closeChatBtn.onclick = function() {
            if (chatBox) chatBox.style.display = 'none';
            if (chatBtn) chatBtn.style.display = 'flex';
        };
    }
    
    function addMessage(text, isUser) {
        if (!chatMessages) return;
        const div = document.createElement('div');
        div.className = `message ${isUser ? 'user' : 'bot'}`;
        div.innerText = text;
        chatMessages.appendChild(div);
        chatMessages.scrollTop = chatMessages.scrollHeight;
    }
    
    function sendMessage() {
        if (!chatInput) return;
        const msg = chatInput.value.trim();
        if (!msg) return;
        addMessage(msg, true);
        chatInput.value = '';
        setTimeout(() => addMessage(getBotResponse(msg), false), 500);
    }
    
    if (sendBtn) sendBtn.onclick = sendMessage;
    if (chatInput) chatInput.addEventListener('keypress', e => { if (e.key === 'Enter') sendMessage(); });
    
    document.querySelectorAll('.suggestion-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            if (chatInput) {
                chatInput.value = btn.innerText;
                sendMessage();
            }
        });
    });
}

function initEventListeners() {
    const welcomeCloseBtn = document.getElementById('closeWelcomeBtn');
    if (welcomeCloseBtn) welcomeCloseBtn.onclick = closeWelcomeModal;
    
    document.querySelectorAll('.nav-links a').forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            document.querySelectorAll('.nav-links a').forEach(a => a.classList.remove('active'));
            link.classList.add('active');
            
            const page = link.dataset.page;
            if (page === 'catalog') renderCatalog(products);
            if (page === 'cart') renderCart();
            if (page === 'contacts') renderContacts();
            if (page === 'delivery') document.getElementById('deliveryModal').style.display = 'flex';
            
            // Закрываем мобильное меню после клика
            const navLinks = document.querySelector('.nav-links');
            const menuBtn = document.querySelector('.mobile-menu-btn');
            if (navLinks && navLinks.classList && navLinks.classList.contains('mobile-open')) {
                navLinks.classList.remove('mobile-open');
                if (menuBtn) menuBtn.innerHTML = '<i class="fas fa-bars"></i>';
            }
        });
    });
    
    const cartIcon = document.querySelector('.cart-icon-header');
    if (cartIcon) cartIcon.onclick = () => renderCart();
    
    const modals = document.querySelectorAll('.modal');
    const closeBtns = document.querySelectorAll('.close');
    closeBtns.forEach(btn => {
        btn.onclick = () => modals.forEach(m => m.style.display = 'none');
    });
    
    modals.forEach(modal => {
        modal.addEventListener('click', e => { if (e.target === modal) modal.style.display = 'none'; });
    });
    
    const confirmBtn = document.getElementById('confirmAddToCart');
    if (confirmBtn) {
        confirmBtn.onclick = function() {
            if (pendingAddToCart && addToCart(pendingAddToCart, selectedSize)) {
                document.getElementById('quickAddModal').style.display = 'none';
                selectedSize = null;
                pendingAddToCart = null;
            }
        };
    }
    
    const cancelBtn = document.getElementById('cancelQuickAdd');
    if (cancelBtn) {
        cancelBtn.onclick = function() {
            document.getElementById('quickAddModal').style.display = 'none';
            pendingAddToCart = null;
            selectedSize = null;
        };
    }
    
    const addToCartBtn = document.getElementById('addToCartFromModal');
    if (addToCartBtn) {
        addToCartBtn.onclick = function() {
            if (addToCart(currentProduct, selectedSize)) {
                document.getElementById('productModal').style.display = 'none';
                selectedSize = null;
            }
        };
    }
    
    const submitOrderBtn = document.getElementById('submitOrderBtn');
    if (submitOrderBtn) {
        submitOrderBtn.onclick = function(e) {
            e.preventDefault();
            const city = document.getElementById('cityInput');
            const street = document.getElementById('streetInput');
            const fullName = document.getElementById('fullNameInput');
            const phone = document.getElementById('phoneInput');
            if (!city.value || !street.value || !fullName.value || !phone.value) {
                showNotification('Пожалуйста, заполните ФИО, город, улицу и телефон', 'error');
                return;
            }
            
            // Добавляем заказ в localStorage для админки
            const newOrder = {
                id: Date.now(),
                customer: fullName.value,
                total: cart.reduce((sum, item) => sum + item.price * item.quantity, 0),
                status: "В обработке",
                date: new Date().toLocaleDateString(),
                items: [...cart]
            };
            const existingOrders = JSON.parse(localStorage.getItem('reverage_orders_admin') || '[]');
            existingOrders.unshift(newOrder);
            localStorage.setItem('reverage_orders_admin', JSON.stringify(existingOrders));
            
            showNotification(`Заказ оформлен! Спасибо за покупку в REVERAGE SS1!`, 'success');
            document.getElementById('deliveryModal').style.display = 'none';
            cart = [];
            saveCart();
            renderCatalog(products);
            document.querySelector('[data-page="catalog"]').classList.add('active');
        };
    }
    
    initAddressAutocomplete();
}

window.renderCatalog = renderCatalog;
window.products = products;
window.changeQuantity = changeQuantity;
window.removeFromCart = removeFromCart;