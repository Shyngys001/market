// lang.js
// Здесь логика переключения языка, сохранение в localStorage
// и функция applyTranslations(), которая подменяет тексты на странице.

let currentLang = localStorage.getItem("siteLang") || "ru";

function switchLanguage(lang) {
  currentLang = lang;
  localStorage.setItem("siteLang", lang);
  applyTranslations();
}

/**
 * applyTranslations – ищет в HTML элементы с data-i18n="ключ"
 * и заменяет их textContent на i18n[currentLang][ключ].
 * Также может дополнять элементы вроде placeholders, titles, etc.
 */
function applyTranslations() {
  const dict = window.i18n[currentLang];

  // Пример: ищем все элементы у которых есть data-i18n
  document.querySelectorAll("[data-i18n]").forEach(el => {
    const key = el.getAttribute("data-i18n");
    if (dict[key]) {
      el.textContent = dict[key];
    }
  });

  // Если нужно менять placeholders, titles – используем data-i18n-placeholder, data-i18n-title, и т. д.
  // Пример:
  document.querySelectorAll("[data-i18n-placeholder]").forEach(el => {
    const key = el.getAttribute("data-i18n-placeholder");
    if (dict[key]) {
      el.placeholder = dict[key];
    }
  });

  // ... аналогично для value, title, и т. п.

  // Если нужно, можно вручную обратиться к элементам (наподобие updateUI, как в предыдущем примере).
  // applyTranslations() – универсальный способ, если HTML размечен "ключами".
}

// Инициализация при загрузке:
document.addEventListener("DOMContentLoaded", () => {
  applyTranslations(); // Применить переводы при входе
});