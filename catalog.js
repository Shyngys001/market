/************************************
 * Глобальные переменные
*************************************/
let allProducts = []; // Все товары
let cart = JSON.parse(localStorage.getItem("cart")) || []; // Корзина

/* Элементы на странице catalog.html: 
1. #productsContainer – куда выводим товары 
2. #categorySelect, #sortSelect, #searchInput – фильтры/поиск
3. #cartBtn, #cartCount, #cartSidebar, #closeCartBtn, #cartItems, #cartTotal, #checkoutBtn – корзина
4. #checkoutModal, #checkoutForm, #cancelCheckoutBtn – оформление заказа
5. #burgerMenuBtn, #navMenu – бургер-меню
*/

const productsContainer = document.getElementById("productsContainer");
const categorySelect = document.getElementById("categorySelect");
const sortSelect = document.getElementById("sortSelect");
const searchInput = document.getElementById("searchInput");

const cartBtn = document.getElementById("cartBtn");
const cartCountEl = document.getElementById("cartCount");
const cartSidebar = document.getElementById("cartSidebar");
const closeCartBtn = document.getElementById("closeCartBtn");
const cartItemsDiv = document.getElementById("cartItems");
const cartTotalEl = document.getElementById("cartTotal");

const checkoutModal = document.getElementById("checkoutModal");
const checkoutForm = document.getElementById("checkoutForm");
const cancelCheckoutBtn = document.getElementById("cancelCheckoutBtn");

/************************************
 * ИНИЦИАЛИЗАЦИЯ
*************************************/
window.addEventListener("DOMContentLoaded", async () => {
  // 1) Загрузить товары
  await loadProducts();

  // 2) Инициализировать фильтры
  categorySelect.addEventListener("change", handleFilters);
  sortSelect.addEventListener("change", handleFilters);
  searchInput.addEventListener("input", handleFilters);

  // 3) Корзина
  cartBtn.addEventListener("click", toggleCart);
  closeCartBtn.addEventListener("click", toggleCart);
  updateCartUI();

  // 4) Оформление заказа
  checkoutForm.addEventListener("submit", sendOrderToWhatsApp);
  cancelCheckoutBtn.addEventListener("click", closeCheckoutModal);
  document.getElementById("checkoutBtn").addEventListener("click", openCheckoutModal);
});

/************************************
 * ЗАГРУЗКА ТОВАРОВ
*************************************/
async function loadProducts() {
  try {
    const response = await fetch("products.json");
    const data = await response.json();
    allProducts = data.products;

    // Категории в селектор
    const categories = [...new Set(allProducts.map((p) => p.category))];
    categories.forEach(cat => {
      const option = document.createElement("option");
      option.value = cat;
      option.textContent = cat;
      categorySelect.appendChild(option);
    });

    // Отобразить все товары
    displayProducts(allProducts);
  } catch (err) {
    console.error("Ошибка при загрузке товаров:", err);
    productsContainer.innerHTML = "<p>Товары не найдены.</p>";
  }
}

/************************************
 * ОТОБРАЖЕНИЕ ТОВАРОВ
*************************************/
function displayProducts(products) {
  if (!products || products.length === 0) {
    productsContainer.innerHTML = "<p>Нет товаров по вашему запросу.</p>";
    return;
  }

  // Генерируем HTML так, чтобы была кнопка "В корзину" + возможность перейти к деталям
  productsContainer.innerHTML = products
    .map(
      (prod) => `
      <div class="product-card slide-up">
        <!-- Клик по картинке/названию → goToProduct(id) -->
        <img 
          src="${prod.images[0]}" 
          alt="${prod.name}"
          class="product-image"
          onclick="goToProduct(${prod.id})"
        />
        <div class="product-content">
          <h3 onclick="goToProduct(${prod.id})">${prod.name}</h3>
          <p class="product-category">${prod.category}</p>
          <div class="product-price">${formatPrice(prod.price)}</div>
          <!-- Кнопка "Добавить в корзину" -->
          <button 
            class="btn btn-primary" 
            onclick="addProductToCart(event, ${prod.id})"
          >
             в корзину
          </button>
        </div>
      </div>
      `
    )
    .join("");
}

/* Переход на детальную страницу */
function goToProduct(id) {
  window.location.href = `product.html?id=${id}`;
}

/* Клик "Добавить в корзину" — останавливаем всплытие, чтобы не переходить на детальную */
function addProductToCart(e, productId) {
  e.stopPropagation(); // чтобы клик по кнопке не триггерил переход
  const product = allProducts.find((p) => p.id === productId);
  if (!product) return;

  const existing = cart.find((item) => item.id === productId);
  if (existing) {
    existing.quantity++;
  } else {
    cart.push({ ...product, quantity: 1 });
  }
  saveCart();
  updateCartUI();
  alert("Добавлено в корзину!");
}

/************************************
 * ФИЛЬТРЫ / СОРТИРОВКА / ПОИСК
*************************************/
function handleFilters() {
  let filtered = [...allProducts];

  const selectedCat = categorySelect.value;
  if (selectedCat) {
    filtered = filtered.filter(p => p.category === selectedCat);
  }

  const searchVal = searchInput.value.toLowerCase().trim();
  if (searchVal) {
    filtered = filtered.filter(p => p.name.toLowerCase().includes(searchVal));
  }

  const sortVal = sortSelect.value;
  if (sortVal === "asc") {
    filtered.sort((a, b) => a.price - b.price);
  } else if (sortVal === "desc") {
    filtered.sort((a, b) => b.price - a.price);
  }

  displayProducts(filtered);
}

/************************************
 * КОРЗИНА
*************************************/
function toggleCart() {
  cartSidebar.classList.toggle("open");
}
function updateCartUI() {
  localStorage.setItem("cart", JSON.stringify(cart));
  const totalCount = cart.reduce((acc, item) => acc + item.quantity, 0);
  cartCountEl.textContent = totalCount;

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

  const totalPrice = cart.reduce((acc, i) => acc + i.price * i.quantity, 0);
  cartTotalEl.textContent = formatPrice(totalPrice);
}

function changeQuantity(id, delta) {
  const item = cart.find(i => i.id === id);
  if (!item) return;
  item.quantity += delta;
  if (item.quantity < 1) {
    cart = cart.filter(i => i.id !== id);
  }
  saveCart();
  updateCartUI();
}
function removeFromCart(id) {
  cart = cart.filter(item => item.id !== id);
  saveCart();
  updateCartUI();
}
function saveCart() {
  localStorage.setItem('cart', JSON.stringify(cart));
}

/************************************
 * ОФОРМЛЕНИЕ ЗАКАЗА
*************************************/
function openCheckoutModal() {
  if (cart.length === 0) {
    alert("Корзина пуста!");
    return;
  }
  checkoutModal.style.display = 'flex';
}
function closeCheckoutModal() {
  checkoutModal.style.display = 'none';
}

function sendOrderToWhatsApp(e) {
  e.preventDefault();
  const name = document.getElementById('customerName').value.trim();
  const phone = document.getElementById('customerPhone').value.trim();
  const payment = document.getElementById('paymentMethod').value;

  if (!name || !phone) {
    alert("Пожалуйста, заполните все поля!");
    return;
  }

  let message = `Здравствуйте! Хочу оформить заказ:\n\nИмя: ${name}\nТелефон: ${phone}\nОплата: ${payment}\n\n`;
  let total = 0;
  cart.forEach(item => {
    message += `- ${item.name}, кол-во: ${item.quantity}, цена: ${formatPrice(item.price)}\n`;
    total += item.price * item.quantity;
  });
  message += `\nИтого: ${formatPrice(total)}`;

  const encoded = encodeURIComponent(message);
  const whatsappURL = `https://wa.me/77082763927?text=${encoded}`;
  window.open(whatsappURL, '_blank');
  closeCheckoutModal();
}

/************************************
 * ВСПОМОГАТЕЛЬНЫЕ ФУНКЦИИ
*************************************/
function formatPrice(value) {
  return new Intl.NumberFormat('ru-KZ', {
    style: 'currency',
    currency: 'KZT',
    maximumFractionDigits: 0
  }).format(value);
}