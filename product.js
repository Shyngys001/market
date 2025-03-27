/************************************
 * Глобальные переменные
*************************************/
// Список всех товаров
let allProducts = [];

// Текущий товар (детально показываем)
let currentProduct = null;

// Корзина (хранится в LocalStorage)
let cart = JSON.parse(localStorage.getItem("cart")) || [];

/* Элементы на странице product.html:
1. #productDetailContainer – куда рендерим слайдер и инфо о товаре
2. #cartSidebar, #cartBtn, #closeCartBtn, #cartItems, #cartTotal, #cartCount – для боковой корзины
3. #checkoutModal, #checkoutForm, #cancelCheckoutBtn – оформление заказа (модалка)
4. #burgerMenuBtn, #navMenu – бургер-меню
5. #themeToggle, #themeIcon (опционально) – переключение темы
*/

// Детали товара
const productDetailContainer = document.getElementById("productDetailContainer");

// Корзина (sidebar)
const cartBtn = document.getElementById("cartBtn");
const cartSidebar = document.getElementById("cartSidebar");
const closeCartBtn = document.getElementById("closeCartBtn");
const cartItemsDiv = document.getElementById("cartItems");
const cartTotalEl = document.getElementById("cartTotal");
const cartCountEl = document.getElementById("cartCount");

// Модальное окно (оформление заказа)
const checkoutModal = document.getElementById("checkoutModal");
const checkoutForm = document.getElementById("checkoutForm");
const cancelCheckoutBtn = document.getElementById("cancelCheckoutBtn");

// Бургер-меню
const burgerBtn = document.getElementById("burgerMenuBtn");
const navMenu = document.getElementById("navMenu");

/************************************
 * ИНИЦИАЛИЗАЦИЯ
*************************************/
window.addEventListener("DOMContentLoaded", async () => {
  // 1) Получаем id товара из URL (product.html?id=...)
  const urlParams = new URLSearchParams(window.location.search);
  const productId = parseInt(urlParams.get("id"), 10);

  // 2) Загружаем все товары
  await loadProducts();

  // 3) Находим товар с нужным id
  currentProduct = allProducts.find((p) => p.id === productId);
  if (!currentProduct) {
    productDetailContainer.innerHTML = "<p>Товар не найден!</p>";
    return;
  }

  // 4) Рендерим детальную страницу (слайдер, кнопка «В корзину» и т.д.)
  renderProductDetail();

  // 5) Корзина
  cartBtn.addEventListener("click", toggleCart);
  closeCartBtn.addEventListener("click", toggleCart);
  updateCartUI();

  // 6) Оформление заказа (подключаем submit и т.д.)
  checkoutForm.addEventListener("submit", sendOrderToWhatsApp);
  cancelCheckoutBtn.addEventListener("click", closeCheckoutModal);
  document.getElementById("checkoutBtn").addEventListener("click", openCheckoutModal);

  // 7) Тёмная тема (если она нужна)
  initThemeToggle();

  // 8) Бургер-меню
  initBurgerMenu();
});

/************************************
 * 1) ЗАГРУЗКА ТОВАРОВ (products.json)
*************************************/
async function loadProducts() {
  try {
    const response = await fetch("products.json");
    if (!response.ok) {
      throw new Error("Ошибка загрузки products.json");
    }
    const data = await response.json();
    allProducts = data.products;
  } catch (err) {
    console.error("Ошибка при загрузке JSON:", err);
    productDetailContainer.innerHTML = "<p>Не удалось загрузить товар.</p>";
  }
}

/************************************
 * 2) ОТОБРАЖЕНИЕ ДЕТАЛЕЙ ТОВАРА
*************************************/
function renderProductDetail() {
  // Если description нет в JSON – можно сгенерировать
  if (!currentProduct.description) {
    currentProduct.description = "Свежий и натуральный продукт высшего качества.";
  }

  productDetailContainer.innerHTML = `
    <div class="product-detail-wrapper">
      <div class="slider-container">
        <img id="mainImage" src="${currentProduct.images[0]}" alt="${currentProduct.name}" />
        <div class="thumbs" id="thumbsContainer"></div>
        <div class="slider-nav">
          <button id="prevBtn" class="slider-btn">←</button>
          <button id="nextBtn" class="slider-btn">→</button>
        </div>
      </div>
      <div class="product-info-block">
        <h2>${currentProduct.name}</h2>
        <p class="product-price">${formatPrice(currentProduct.price)}</p>
        <p class="product-desc">${currentProduct.description}</p>
        <div class="add-to-cart-section">
          <label>Количество:</label>
          <input type="number" id="quantityInput" value="50" min="50" max="100" />
          <button class="btn btn-primary" id="addToCartBtn">В корзину</button>
        </div>
      </div>
    </div>
  `;

  // Подключаем миниатюры (thumbs)
  const thumbsContainer = document.getElementById("thumbsContainer");
  let currentIndex = 0;
  currentProduct.images.forEach((imgUrl, idx) => {
    const thumb = document.createElement("img");
    thumb.src = imgUrl;
    thumb.alt = currentProduct.name + " thumb";
    thumb.classList.add("thumb-img");
    thumb.addEventListener("click", () => {
      document.getElementById("mainImage").src = imgUrl;
      currentIndex = idx;
    });
    thumbsContainer.appendChild(thumb);
  });

  // Слайдер (кнопки «← →»)
  const mainImage = document.getElementById("mainImage");
  document.getElementById("prevBtn").addEventListener("click", () => {
    currentIndex--;
    if (currentIndex < 0) {
      currentIndex = currentProduct.images.length - 1;
    }
    mainImage.src = currentProduct.images[currentIndex];
  });
  document.getElementById("nextBtn").addEventListener("click", () => {
    currentIndex++;
    if (currentIndex >= currentProduct.images.length) {
      currentIndex = 0;
    }
    mainImage.src = currentProduct.images[currentIndex];
  });

  // Кнопка "В корзину"
  document.getElementById("addToCartBtn").addEventListener("click", () => {
    const quantityVal = parseInt(document.getElementById("quantityInput").value, 10);
    addToCartDetail(currentProduct, quantityVal || 1);
  });
}

/************************************
 * 3) ДОБАВЛЕНИЕ ТОВАРА В КОРЗИНУ (ИЗ ДЕТАЛЕЙ)
*************************************/
function addToCartDetail(product, qty) {
  const existingItem = cart.find((item) => item.id === product.id);
  if (existingItem) {
    existingItem.quantity += qty;
  } else {
    cart.push({ ...product, quantity: qty });
  }
  saveCart();
  updateCartUI();
  alert("Добавлено в корзину!");
}

/************************************
 * 4) КОРЗИНА
*************************************/
/* Открыть/закрыть sidebar */
function toggleCart() {
  cartSidebar.classList.toggle("open");
}
/* Сохранить корзину */
function saveCart() {
  localStorage.setItem("cart", JSON.stringify(cart));
}
/* Отрисовать UI корзины */
function updateCartUI() {
  localStorage.setItem("cart", JSON.stringify(cart));
  const totalCount = cart.reduce((acc, i) => acc + i.quantity, 0);
  cartCountEl.textContent = totalCount;

  // Генерируем HTML для каждого товара
  cartItemsDiv.innerHTML = cart.map(item => `
    <div class="cart-item">
      <img src="${item.images[0]}" alt="${item.name}" class="cart-item-img" />
      <div class="cart-item-details">
        <h4>${item.name}</h4>
        <p class="cart-item-price">Цена: ${formatPrice(item.price)}</p>
        <div class="quantity-control">
          <button onclick="changeQuantity(${item.id}, -1)">-</button>
          <span>${item.quantity}</span>
          <button onclick="changeQuantity(${item.id}, 1)">+</button>
        </div>
        <button class="remove-btn" onclick="removeFromCart(${item.id})">Убрать</button>
      </div>
    </div>
  `).join("");

  // Считаем итог
  const totalPrice = cart.reduce((acc, cur) => acc + cur.price * cur.quantity, 0);
  cartTotalEl.textContent = formatPrice(totalPrice);
}
/* Удаление */
function removeFromCart(id) {
  cart = cart.filter((item) => item.id !== id);
  saveCart();
  updateCartUI();
}
/* Изменение кол-ва */
function changeQuantity(id, delta) {
  const item = cart.find((i) => i.id === id);
  if (!item) return;
  item.quantity += delta;
  if (item.quantity < 1) {
    cart = cart.filter((i) => i.id !== id);
  }
  saveCart();
  updateCartUI();
}

/************************************
 * 5) ОФОРМЛЕНИЕ ЗАКАЗА (WhatsApp)
*************************************/
function openCheckoutModal() {
  if (cart.length === 0) {
    alert("Корзина пуста!");
    return;
  }
  checkoutModal.style.display = "flex";
}
function closeCheckoutModal() {
  checkoutModal.style.display = "none";
}
function sendOrderToWhatsApp(e) {
  e.preventDefault();
  const name = document.getElementById("customerName").value.trim();
  const phone = document.getElementById("customerPhone").value.trim();
  const payment = document.getElementById("paymentMethod").value;

  if (!name || !phone) {
    alert("Пожалуйста, заполните все поля!");
    return;
  }

  // Формируем сообщение
  let message = `Здравствуйте! Хочу оформить заказ:\n\nИмя: ${name}\nТелефон: ${phone}\nОплата: ${payment}\n\n`;
  let total = 0;
  cart.forEach((item) => {
    message += `- ${item.name}, кол-во: ${item.quantity}, цена: ${formatPrice(item.price)}\n`;
    total += item.price * item.quantity;
  });
  message += `\nИтого: ${formatPrice(total)}`;

  // Открываем WhatsApp
  const encoded = encodeURIComponent(message);
  const whatsappURL = `https://wa.me/77473732348?text=${encoded}`;
  window.open(whatsappURL, "_blank");

  // Закрываем модалку
  closeCheckoutModal();
}

/************************************
 * 6) ВСПОМОГАТЕЛЬНЫЕ ФУНКЦИИ
*************************************/
function formatPrice(num) {
  return new Intl.NumberFormat("ru-KZ", {
    style: "currency",
    currency: "KZT",
    maximumFractionDigits: 0,
  }).format(num);
}

/************************************
 * 7) ТЁМНАЯ ТЕМА (опционально)
*************************************/
function initThemeToggle() {
  const themeToggleBtn = document.getElementById("themeToggle");
  const themeIcon = document.getElementById("themeIcon");

  // Если нет кнопки, пропускаем
  if (!themeToggleBtn || !themeIcon) return;

  const savedTheme = localStorage.getItem("theme-grocery");
  if (savedTheme === "light") {
    document.body.classList.remove("dark-theme");
    themeIcon.classList.remove("fa-sun");
    themeIcon.classList.add("fa-moon");
  } else {
    document.body.classList.add("dark-theme");
    themeIcon.classList.remove("fa-moon");
    themeIcon.classList.add("fa-sun");
  }

  themeToggleBtn.addEventListener("click", () => {
    document.body.classList.toggle("dark-theme");
    if (document.body.classList.contains("dark-theme")) {
      themeIcon.classList.remove("fa-moon");
      themeIcon.classList.add("fa-sun");
      localStorage.setItem("theme-grocery", "dark");
    } else {
      themeIcon.classList.remove("fa-sun");
      themeIcon.classList.add("fa-moon");
      localStorage.setItem("theme-grocery", "light");
    }
  });
}

/************************************
 * 8) БУРГЕР-МЕНЮ (адаптив)
*************************************/
function closeBurgerMenu() {
  navMenu.classList.remove('nav-open');
  burgerBtn.setAttribute('aria-expanded', 'false');
}

function initBurgerMenu() {
  // Клик на бургер
  burgerBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    const expanded = burgerBtn.getAttribute('aria-expanded') === 'true';
    burgerBtn.setAttribute('aria-expanded', !expanded);
    navMenu.classList.toggle('nav-open');
  });

  // Клик по ссылкам → закрыть меню
  const navLinks = navMenu.querySelectorAll('a');
  navLinks.forEach(link => {
    link.addEventListener('click', () => {
      closeBurgerMenu();
    });
  });

  // Клик вне меню
  document.addEventListener('click', (e) => {
    if (!navMenu.contains(e.target) && e.target !== burgerBtn) {
      closeBurgerMenu();
    }
  });
}