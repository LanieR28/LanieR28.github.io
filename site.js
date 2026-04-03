(function () {
  const storageKey = "lanier-theme";
  const root = document.documentElement;
  const toggleButton = document.getElementById("theme-toggle");
  const searchForm = document.getElementById("site-search-form");
  const searchInput = document.getElementById("site-search-input");
  const themeImages = Array.from(document.querySelectorAll("img[data-light][data-dark]"));
  const navRegion = document.getElementById("nav-region");
  const navMega = document.getElementById("nav-mega");
  const navMegaInner = navMega ? navMega.querySelector(".nav-mega-inner") : null;
  const navTriggers = Array.from(document.querySelectorAll(".nav-trigger[data-menu]"));
  const navPanels = Array.from(document.querySelectorAll(".mega-panel[data-panel]"));
  const fadeDuration = 220;
  let closeTimer = null;

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

  function setMegaPanelSize(panel) {
    if (!navMegaInner || !panel) {
      return;
    }
    const nextWidth = Math.ceil(panel.offsetWidth + 16);
    const nextHeight = Math.ceil(panel.offsetHeight + 62);
    navMegaInner.style.width = `${nextWidth}px`;
    navMegaInner.style.height = `${nextHeight}px`;
  }

  function openMegaMenu(menuName) {
    if (!navRegion || !navMega) {
      return;
    }
    const nextPanel = navPanels.find((panel) => panel.dataset.panel === menuName);
    if (!nextPanel) {
      return;
    }
    navRegion.classList.add("is-open");
    navMega.setAttribute("aria-hidden", "false");
    setMegaPanelSize(nextPanel);
    navTriggers.forEach((trigger) => {
      trigger.classList.toggle("is-active", trigger.dataset.menu === menuName);
    });
    navPanels.forEach((panel) => {
      panel.classList.toggle("is-active", panel.dataset.panel === menuName);
    });
  }

  function closeMegaMenu() {
    if (!navRegion || !navMega) {
      return;
    }
    navRegion.classList.remove("is-open");
    navMega.setAttribute("aria-hidden", "true");
    if (navMegaInner) {
      navMegaInner.style.removeProperty("width");
      navMegaInner.style.removeProperty("height");
    }
    navTriggers.forEach((trigger) => trigger.classList.remove("is-active"));
    navPanels.forEach((panel) => panel.classList.remove("is-active"));
  }

  function clearCloseTimer() {
    if (closeTimer) {
      window.clearTimeout(closeTimer);
      closeTimer = null;
    }
  }

  function scheduleCloseMegaMenu() {
    clearCloseTimer();
    closeTimer = window.setTimeout(closeMegaMenu, 120);
  }

  navTriggers.forEach((trigger) => {
    trigger.addEventListener("mouseenter", function () {
      clearCloseTimer();
      openMegaMenu(trigger.dataset.menu);
    });
    trigger.addEventListener("focus", function () {
      clearCloseTimer();
      openMegaMenu(trigger.dataset.menu);
    });
  });

  if (navMega) {
    navMega.addEventListener("mouseenter", clearCloseTimer);
    navMega.addEventListener("mouseleave", scheduleCloseMegaMenu);
  }

  if (navRegion) {
    navRegion.addEventListener("mouseleave", scheduleCloseMegaMenu);
  }

  document.addEventListener("keydown", function (event) {
    if (event.key === "Escape") {
      clearCloseTimer();
      closeMegaMenu();
    }
  });
})();
