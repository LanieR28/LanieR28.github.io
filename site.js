(function () {
  const storageKey = "lanier-theme";
  const root = document.documentElement;
  const toggleButton = document.getElementById("theme-toggle");
  const searchForm = document.getElementById("site-search-form");
  const searchInput = document.getElementById("site-search-input");
  const themeImages = Array.from(document.querySelectorAll("img[data-light][data-dark]"));
  const fadeDuration = 220;

  function fadeSwapImage(img, nextSrc) {
    if (img.getAttribute("src") === nextSrc) {
      return;
    }
    img.classList.add("is-fading");
    window.setTimeout(function () {
      img.src = nextSrc;
      img.classList.remove("is-fading");
    }, fadeDuration);
  }

  function fadeSwapThemeIcon(icon, nextText) {
    if (icon.textContent === nextText) {
      return;
    }
    icon.classList.add("is-fading");
    window.setTimeout(function () {
      icon.textContent = nextText;
      icon.classList.remove("is-fading");
    }, fadeDuration);
  }

  function applyTheme(theme) {
    root.dataset.theme = theme;
    themeImages.forEach((img) => {
      const nextSrc = theme === "dark" ? img.dataset.dark : img.dataset.light;
      fadeSwapImage(img, nextSrc);
    });
    if (toggleButton) {
      const icon = toggleButton.querySelector(".theme-icon");
      if (icon) {
        fadeSwapThemeIcon(icon, theme === "dark" ? "☾" : "☀︎");
      }
    }
  }

  const initialTheme = localStorage.getItem(storageKey) || "light";
  applyTheme(initialTheme);

  if (toggleButton) {
    toggleButton.addEventListener("click", function () {
      const nextTheme = root.dataset.theme === "dark" ? "light" : "dark";
      localStorage.setItem(storageKey, nextTheme);
      applyTheme(nextTheme);
    });
  }

  function clearHighlights() {
    document.querySelectorAll(".search-hit").forEach((node) => node.classList.remove("search-hit"));
  }

  if (searchForm && searchInput) {
    searchForm.addEventListener("submit", function (event) {
      event.preventDefault();
      clearHighlights();

      const query = searchInput.value.trim().toLowerCase();
      if (!query) {
        return;
      }

      const candidates = Array.from(document.querySelectorAll("[data-search]"));
      const target = candidates.find((node) => (node.dataset.search || "").toLowerCase().includes(query));

      if (target) {
        target.classList.add("search-hit");
        target.scrollIntoView({ behavior: "smooth", block: "start" });
      }
    });
  }
})();
