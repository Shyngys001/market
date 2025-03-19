let allProducts = [];
let cart = JSON.parse(localStorage.getItem("cart")) || [];

const productsContainer = document.getElementById("productsContainer");
const categorySelect = document.getElementById("categorySelect");
const sortSelect = document.getElementById("sortSelect");
const searchInput = document.getElementById("searchInput");

const cartBtn = document.getElementById("cartBtn");
const cartCountEl = document.getElementById("cartCount");
const cartSidebar = document.getElementById("cartSidebar");
const cartItemsDiv = document.getElementById("cartItems");
const cartTotalEl = document.getElementById("cartTotal");
const closeCartBtn = document.getElementById("closeCartBtn");

const checkoutModal = document.getElementById("checkoutModal");
const checkoutForm = document.getElementById("checkoutForm");
const cancelCheckoutBtn = document.getElementById("cancelCheckoutBtn");

window.addEventListener("DOMContentLoaded", async () => {
  await loadProducts();

  categorySelect.addEventListener("change", handleFilters);
  sortSelect.addEventListener("change", handleFilters);
  searchInput.addEventListener("input", handleFilters);

  cartBtn.addEventListener("click", toggleCart);
  closeCartBtn.addEventListener("click", toggleCart);
  updateCartUI();

  checkoutForm.addEventListener("submit", sendOrderToWhatsApp);
  cancelCheckoutBtn.addEventListener("click", closeCheckoutModal);
  document.getElementById("checkoutBtn").addEventListener("click", openCheckoutModal);

  initThemeToggle();
  initBurgerMenu();
});

async function loadProducts() {
  try {
    const response = await fetch("products.json");
    const data = await response.json();
    allProducts = data.products;

    // Заполняем селектор категорий
    const categories = [...new Set(allProducts.map((p) => p.category))];
    categories.forEach((cat) => {
      const option = document.createElement("option");
      option.value = cat;
      option.textContent = cat;
      categorySelect.appendChild(option);
    });

    displayProducts(allProducts);
  } catch (err) {
    console.error("Ошибка при загрузке товаров:", err);
    productsContainer.innerHTML = "<p>Товары не найдены.</p>";
  }
}

function displayProducts(products) {
  if (!products || products.length === 0) {
    productsContainer.innerHTML = `<p>Нет товаров по вашему запросу.</p>`;
    return;
  }

  productsContainer.innerHTML = products
    .map(
      (prod) => `
      <div class="product-card slide-up" onclick="goToProduct(${prod.id})">
        <img 
          src="${prod.images[0]}" 
          alt="${prod.name}"
          class="product-image"
        />
        <div class="product-content">
          <h3>${prod.name}</h3>
          <p class="product-category">${prod.category}</p>
          <div class="product-price">${formatPrice(prod.price)}</div>
        </div>
      </div>
    `
    )
    .join("");
}

// При клике на карточку — переход на product.html?id=...
function goToProduct(id) {
  window.location.href = `product.html?id=${id}`;
}

function handleFilters() {
  let filtered = [...allProducts];

  const selectedCat = categorySelect.value;
  if (selectedCat) {
    filtered = filtered.filter((p) => p.category === selectedCat);
  }

  const searchVal = searchInput.value.toLowerCase().trim();
  if (searchVal) {
    filtered = filtered.filter((p) => p.name.toLowerCase().includes(searchVal));
  }

  const sortVal = sortSelect.value;
  if (sortVal === "asc") {
    filtered.sort((a, b) => a.price - b.price);
  } else if (sortVal === "desc") {
    filtered.sort((a, b) => b.price - a.price);
  }

  displayProducts(filtered);
}

/* Корзина */
function toggleCart() {
  cartSidebar.classList.toggle("open");
}
function addToCart(product) {
  const existing = cart.find((item) => item.id === product.id);
  if (existing) {
    existing.quantity++;
  } else {
    cart.push({ ...product, quantity: 1 });
  }
  saveCart();
  updateCartUI();
}
function updateCartUI() {
  localStorage.setItem("cart", JSON.stringify(cart));
  const totalCount = cart.reduce((acc, i) => acc + i.quantity, 0);
  cartCountEl.textContent = totalCount;

  cartItemsDiv.innerHTML = cart
    .map(
      (item) => `
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
          <button class="remove-btn" onclick="removeFromCart(${item.id})">
            Убрать
          </button>
        </div>
      </div>
    `
    )
    .join("");

  const totalPrice = cart.reduce((acc, cur) => acc + cur.price * cur.quantity, 0);
  cartTotalEl.textContent = formatPrice(totalPrice);
}
function removeFromCart(id) {
  cart = cart.filter((item) => item.id !== id);
  saveCart();
  updateCartUI();
}
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
function saveCart() {
  localStorage.setItem("cart", JSON.stringify(cart));
}

/* Оформление заказа */
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

  let message = `Здравствуйте! Хочу оформить заказ:\n\nИмя: ${name}\nТелефон: ${phone}\nОплата: ${payment}\n\n`;
  let total = 0;
  cart.forEach((item) => {
    message += `- ${item.name}, кол-во: ${item.quantity}, цена: ${formatPrice(item.price)}\n`;
    total += item.price * item.quantity;
  });
  message += `\nИтого: ${formatPrice(total)}`;

  const encoded = encodeURIComponent(message);
  const whatsappURL = `https://wa.me/77000000000?text=${encoded}`;
  window.open(whatsappURL, "_blank");

  closeCheckoutModal();
}

/* Формат цены */
function formatPrice(num) {
  return new Intl.NumberFormat("ru-KZ", {
    style: "currency",
    currency: "KZT",
    maximumFractionDigits: 0,
  }).format(num);
}

/* Тёмная тема */
function initThemeToggle() {
  const themeToggleBtn = document.getElementById("themeToggle");
  const themeIcon = document.getElementById("themeIcon");

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

/* Бургер-меню */
function initBurgerMenu() {
  const burgerBtn = document.getElementById("burgerMenuBtn");
  const navMenu = document.getElementById("navMenu");

  burgerBtn.addEventListener("click", () => {
    const expanded = burgerBtn.getAttribute("aria-expanded") === "true";
    burgerBtn.setAttribute("aria-expanded", !expanded);
    navMenu.classList.toggle("nav-open");
  });
}