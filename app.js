let currentLanguage = "ru";
let currentCategory = null;
let cart = [];
let productsData = [];

const i18n = {
  ru: {
    allProducts: "Все товары",
    cart: "Корзина",
    categories: {
      vegetables: "Овощи",
      fruits: "Фрукты",
      berries: "Ягоды",
      meat: "Мясо",
      fish: "Рыба",
      seafood: "Морепродукты"
    },
    back: "← Назад",
    quantity: "Количество (кг)",
    addToCart: "Добавить в корзину",
    inCart: "В корзине",
    cartTitle: "Корзина",
    cartEmpty: "Ваша корзина пуста",
    cartTotal: "Итого:",
    checkout: "Оформить заказ (WhatsApp)",
    pay: "Оплатить (Kaspi Pay)",
    footer: "© 2025 Мой Интернет-магазин",
    searchPlaceholder: "Поиск...",
    sortDefault: "Сортировать по цене",
    sortAsc: "По возрастанию",
    sortDesc: "По убыванию"
  },
  kz: {
    allProducts: "Барлық тауарлар",
    cart: "Себет",
    categories: {
      vegetables: "Көкөністер",
      fruits: "Жемістер",
      berries: "Жидектер",
      meat: "Ет",
      fish: "Балық",
      seafood: "Теңіз өнімдері"
    },
    back: "← Артқа",
    quantity: "Саны (кг)",
    addToCart: "Себетке қосу",
    inCart: "Себетте",
    cartTitle: "Себет",
    cartEmpty: "Себетіңіз бос",
    cartTotal: "Жиынтығы:",
    checkout: "Тапсырысты рәсімдеу (WhatsApp)",
    pay: "Төлеу (Kaspi Pay)",
    footer: "© 2025 Менің Интернет-Дүкенім",
    searchPlaceholder: "Іздеу...",
    sortDefault: "Бағасы бойынша сұрыптау",
    sortAsc: "Өсу реті бойынша",
    sortDesc: "Кему реті бойынша"
  }
};

window.onload = async function() {
  // Загружаем товары
  await loadProductsData();

  // Языковые кнопки
  document.getElementById("lang-ru").addEventListener("click", () => switchLanguage("ru"));
  document.getElementById("lang-kz").addEventListener("click", () => switchLanguage("kz"));

  // Поиск + сортировка
  document.getElementById("searchInput").addEventListener("input", renderProducts);
  document.getElementById("sortSelect").addEventListener("change", renderProducts);

  // Подготовка категорий
  renderCategorySelect();

  // Статические тексты + первичная отрисовка
  updateStaticText();
  renderProducts();
  updateCartCount();

  // Бургер-меню
  document.getElementById("burgerBtn").addEventListener("click", toggleBurgerMenu);
};

// Загрузка JSON
async function loadProductsData() {
  try {
    const response = await fetch("products.json");
    if (!response.ok) {
      throw new Error("Ошибка загрузки products.json");
    }
    productsData = await response.json();
  } catch (error) {
    console.error("Ошибка при загрузке JSON:", error);
    productsData = [];
  }
}

// Переключение языка
function switchLanguage(lang) {
  currentLanguage = lang;
  document.getElementById("lang-ru").classList.remove("active");
  document.getElementById("lang-kz").classList.remove("active");
  document.getElementById(`lang-${lang}`).classList.add("active");

  updateStaticText();
  renderCategorySelect();
  renderProducts();
}

// Обновление текстов, плейсхолдеров
function updateStaticText() {
  const lang = currentLanguage;
  document.getElementById("searchInput").placeholder = i18n[lang].searchPlaceholder;
  document.getElementById("sortSelect").options[0].text = i18n[lang].sortDefault;
  document.getElementById("sortSelect").options[1].text = i18n[lang].sortAsc;
  document.getElementById("sortSelect").options[2].text = i18n[lang].sortDesc;
  document.getElementById("cartText").textContent = i18n[lang].cart;
  document.getElementById("cartTextMobile").textContent = i18n[lang].cart;
  document.getElementById("footerText").textContent = i18n[lang].footer;
  // Логотип можно не менять, либо сделать локализованным
  document.getElementById("siteLogo").textContent = "Online Market";
}

// Категории в выпадающем списке
function renderCategorySelect() {
  const categorySelect = document.getElementById("categorySelect");
  categorySelect.innerHTML = "";

  // "Все товары"
  const allOption = document.createElement("option");
  allOption.value = "";
  allOption.textContent = i18n[currentLanguage].allProducts;
  categorySelect.appendChild(allOption);

  if (!productsData || productsData.length === 0) return;

  const uniqueCats = [...new Set(productsData.map(p => p.category))];

  uniqueCats.forEach(cat => {
    const opt = document.createElement("option");
    opt.value = cat;
    opt.textContent = i18n[currentLanguage].categories[cat] || cat;
    categorySelect.appendChild(opt);
  });

  categorySelect.addEventListener("change", () => {
    currentCategory = categorySelect.value || null;
    renderProducts();
  });
}

// Рендер каталога
function renderProducts() {
  const productsSection = document.getElementById("productsSection");
  const productsContainer = document.getElementById("productsContainer");
  const searchValue = document.getElementById("searchInput").value.toLowerCase();
  const sortValue = document.getElementById("sortSelect").value;
  const lang = currentLanguage;

  // Показываем каталог, скрываем остальное
  productsSection.classList.remove("hidden");
  productsSection.classList.add("active");
  document.getElementById("productDetailSection").classList.add("hidden");
  document.getElementById("cartSection").classList.add("hidden");

  // Заголовок
  if (currentCategory) {
    const catLabel = i18n[lang].categories[currentCategory] || currentCategory;
    document.getElementById("pageTitle").textContent = catLabel;
  } else {
    document.getElementById("pageTitle").textContent = i18n[lang].allProducts;
  }

  if (!productsData.length) {
    productsContainer.innerHTML = "<p>Нет данных о товарах</p>";
    return;
  }

  // Фильтрация по категории
  let filtered = currentCategory
    ? productsData.filter(p => p.category === currentCategory)
    : [...productsData];

  // Поиск
  filtered = filtered.filter(product => {
    const name = lang === "ru" ? product.name_ru : product.name_kz;
    return name.toLowerCase().includes(searchValue);
  });

  // Сортировка
  if (sortValue === "asc") {
    filtered.sort((a, b) => a.price - b.price);
  } else if (sortValue === "desc") {
    filtered.sort((a, b) => b.price - a.price);
  }

  // Отрисовка
  productsContainer.innerHTML = "";
  filtered.forEach(prod => {
    const card = document.createElement("div");
    card.className = "product-card";
    card.innerHTML = `
      <img src="${prod.image}" alt="${prod.name_ru}" />
      <div class="product-info">
        <div class="product-name">${ lang === "ru" ? prod.name_ru : prod.name_kz }</div>
        <div class="product-price">${prod.price} тг/кг</div>
      </div>
    `;
    card.addEventListener("click", () => openProductDetail(prod.id));
    productsContainer.appendChild(card);
  });
}

// Открыть детальную страницу товара
function openProductDetail(productId) {
  const product = productsData.find(p => p.id === productId);
  if (!product) return;

  document.getElementById("productsSection").classList.remove("active");
  document.getElementById("productsSection").classList.add("hidden");

  const detailSection = document.getElementById("productDetailSection");
  detailSection.classList.remove("hidden");

  const lang = currentLanguage;
  detailSection.querySelector(".back-btn").textContent = i18n[lang].back;

  const detailDiv = document.getElementById("productDetail");
  detailDiv.innerHTML = `
    <img src="${product.image}" alt="${product.name_ru}" />
    <div class="product-detail-info">
      <h2>${ lang === "ru" ? product.name_ru : product.name_kz }</h2>
      <p>${ lang === "ru" ? product.description_ru : product.description_kz }</p>
      <p><strong>${product.price} тг/кг</strong></p>
      <div class="quantity-input">
        <label>${i18n[lang].quantity}:</label>
        <input type="number" id="detailQuantity" value="1" min="1" max="100" style="width:80px;" />
      </div>
      <button class="order-btn" onclick="addToCart(${product.id})">
        ${i18n[lang].addToCart}
      </button>
    </div>
  `;
}

function closeProductDetail() {
  document.getElementById("productDetailSection").classList.add("hidden");
  document.getElementById("productsSection").classList.remove("hidden");
  document.getElementById("productsSection").classList.add("active");
}

// Добавление в корзину
function addToCart(productId) {
  const product = productsData.find(p => p.id === productId);
  if (!product) return;

  const quantityInput = document.getElementById("detailQuantity");
  const quantity = quantityInput ? parseFloat(quantityInput.value) : 1;

  const existingItem = cart.find(item => item.id === productId);
  if (existingItem) {
    existingItem.quantity += quantity;
  } else {
    cart.push({ ...product, quantity });
  }

  updateCartCount();
  closeProductDetail();
}

// Обновление счётчика
function updateCartCount() {
  const totalCount = cart.reduce((acc, item) => acc + item.quantity, 0);
  const cartCountEl = document.getElementById("cartCount");
  const cartCountMobileEl = document.getElementById("cartCountMobile");
  if (cartCountEl) cartCountEl.textContent = totalCount;
  if (cartCountMobileEl) cartCountMobileEl.textContent = totalCount;
}

// Открыть / закрыть корзину
function openCart() {
  document.getElementById("productsSection").classList.add("hidden");
  document.getElementById("productDetailSection").classList.add("hidden");
  document.getElementById("cartSection").classList.remove("hidden");

  renderCart();
}
function closeCart() {
  document.getElementById("cartSection").classList.add("hidden");
  document.getElementById("productsSection").classList.remove("hidden");
  document.getElementById("productsSection").classList.add("active");
}

// Рендер корзины
function renderCart() {
  const lang = currentLanguage;
  document.getElementById("cartTitle").textContent = i18n[lang].cartTitle;
  document.querySelector("#cartSection .back-btn").textContent = i18n[lang].back;
  document.getElementById("cartTotalLabel").textContent = i18n[lang].cartTotal;
  document.getElementById("checkoutBtnText").textContent = i18n[lang].checkout;
  document.getElementById("payBtnText").textContent = i18n[lang].pay;

  const cartItemsDiv = document.getElementById("cartItems");
  cartItemsDiv.innerHTML = "";

  if (cart.length === 0) {
    cartItemsDiv.innerHTML = `<p>${ i18n[lang].cartEmpty }</p>`;
    document.getElementById("cartTotalPrice").textContent = "0 тг";
    return;
  }

  let total = 0;
  cart.forEach((item, index) => {
    const itemTotal = item.price * item.quantity;
    total += itemTotal;
    const row = document.createElement("div");
    row.className = "cart-item";
    row.innerHTML = `
      <div class="cart-item-name">
        ${ lang === "ru" ? item.name_ru : item.name_kz }
      </div>
      <div class="cart-item-quantity">
        <button class="quantity-btn" onclick="changeCartQuantity(${index}, -1)">-</button>
        <span>${item.quantity} кг</span>
        <button class="quantity-btn" onclick="changeCartQuantity(${index}, 1)">+</button>
      </div>
      <div class="cart-item-price">${itemTotal} тг</div>
      <button class="quantity-btn" onclick="removeFromCart(${index})">X</button>
    `;
    cartItemsDiv.appendChild(row);
  });

  document.getElementById("cartTotalPrice").textContent = total + " тг";
}

function changeCartQuantity(index, delta) {
  cart[index].quantity += delta;
  if (cart[index].quantity <= 0) {
    cart[index].quantity = 1;
  }
  renderCart();
  updateCartCount();
}
function removeFromCart(index) {
  cart.splice(index, 1);
  renderCart();
  updateCartCount();
}

// Оформление заказа (WhatsApp)
function checkoutOrder() {
  let message = "Здравствуйте, хочу оформить заказ:\n\n";
  let total = 0;

  cart.forEach(item => {
    const name = currentLanguage === "ru" ? item.name_ru : item.name_kz;
    const sum = item.price * item.quantity;
    total += sum;
    message += `${name} - ${item.quantity} кг = ${sum} тг\n`;
  });

  message += `\nИтого: ${total} тг`;

  const whatsappLink = `https://wa.me/77000000000?text=${encodeURIComponent(message)}`;
  window.open(whatsappLink, "_blank");
}

// Оплата (Kaspi Pay)
function payOrder() {
  alert("Переходим к оплате через Kaspi Pay (демо)");
}

// Бургер-меню
function toggleBurgerMenu() {
  document.getElementById("navLinks").classList.toggle("show");
}

// Прокрутка к каталогу из Hero-блока
function scrollToProducts() {
  document.getElementById("productsSection").scrollIntoView({ behavior: "smooth" });
}

// Обработка формы обратной связи (пока просто alert)
function handleFeedbackForm(e) {
  e.preventDefault();
  const name = document.getElementById("userName").value.trim();
  const msg = document.getElementById("userMessage").value.trim();
  if (name && msg) {
    // Здесь можно отправить на сервер, почту или в WhatsApp
    alert(`Спасибо за отклик, ${name}!\nВаше сообщение: "${msg}"`);
  }
  return false; // чтобы не перезагружать страницу
}