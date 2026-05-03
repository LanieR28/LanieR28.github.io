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
  const productLocalNav = document.querySelector(".project-page-view .product-local-nav");
  const productHero = document.getElementById("chunithm-bot");
  const fadeDuration = 220;
  const openingClassDuration = 1040;
  const isDarkDefaultPage =
    document.body.classList.contains("project-page-view") ||
    document.body.classList.contains("tech-page-view");
  let closeTimer = null;
  let openingTimer = null;
  let firstOpenAfterEnter = true;

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

  const initialTheme = isDarkDefaultPage ? "dark" : (localStorage.getItem(storageKey) || "light");
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
    const nextHeight = Math.ceil(panel.offsetHeight + 62);
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
    const wasOpen = navRegion.classList.contains("is-open");
    navRegion.classList.add("is-open");
    navMega.setAttribute("aria-hidden", "false");
    setMegaPanelSize(nextPanel);
    if (!wasOpen && firstOpenAfterEnter) {
      navRegion.classList.add("is-opening");
      firstOpenAfterEnter = false;
      if (openingTimer) {
        window.clearTimeout(openingTimer);
      }
      openingTimer = window.setTimeout(function () {
        navRegion.classList.remove("is-opening");
        openingTimer = null;
      }, openingClassDuration);
    }
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
    navRegion.classList.remove("is-opening");
    navMega.setAttribute("aria-hidden", "true");
    if (navMegaInner) {
      navMegaInner.style.removeProperty("height");
    }
    if (openingTimer) {
      window.clearTimeout(openingTimer);
      openingTimer = null;
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
    navRegion.addEventListener("mouseenter", function () {
      clearCloseTimer();
      if (!navRegion.classList.contains("is-open")) {
        firstOpenAfterEnter = true;
      }
    });
    navRegion.addEventListener("mouseleave", scheduleCloseMegaMenu);
  }

  document.addEventListener("keydown", function (event) {
    if (event.key === "Escape") {
      clearCloseTimer();
      closeMegaMenu();
    }
  });

  if (productLocalNav && productHero) {
    function updateProductNavVisibility() {
      const heroBottom = productHero.getBoundingClientRect().bottom;
      productLocalNav.classList.toggle("is-visible", heroBottom <= 120);
    }

    updateProductNavVisibility();
    window.addEventListener("scroll", updateProductNavVisibility, { passive: true });
    window.addEventListener("resize", updateProductNavVisibility);
  }

  if (document.body.classList.contains("endfield-gacha-page")) {
    const gachaCurrencyPerPull = 500;
    const gachaDailyCurrency = 200;
    const gachaWeeklyCurrency = 500;
    const gachaCatalog = {
      currentGacha: {
        key: "currentGacha",
        tabLabel: "庄方宜卡池",
        name: "庄方宜卡池",
        startDate: "2026-04-17",
        endDate: "2026-05-22",
      },
      nextGacha: {
        key: "nextGacha",
        tabLabel: "辉光庆时卡池",
        name: "辉光庆时卡池",
        startDate: "2026-05-14",
        endDate: "2026-06-05",
      },
    };

    const gachaState = {
      selectedGachaKey: "nextGacha",
      settlementMode: "release",
    };

    const gachaWeaponPulls = document.getElementById("gacha-weapon-pulls");
    const gachaWeaponHelper = document.getElementById("gacha-weapon-helper");
    const gachaSelector = document.getElementById("gacha-selector");
    const gachaModeSelector = document.getElementById("gacha-mode-selector");
    const gachaDaysBadge = document.getElementById("gacha-days-badge");

    const gachaInputs = {
      currentOriginium: document.getElementById("gacha-current-originium"),
      currentCurrency: document.getElementById("gacha-current-currency"),
      currentFeaturedPermits: document.getElementById("gacha-current-featured-permits"),
      currentWeaponQuota: document.getElementById("gacha-current-weapon-quota"),
      eventCurrency: document.getElementById("gacha-event-currency"),
      eventFeaturedPermits: document.getElementById("gacha-event-featured-permits"),
    };

    function parseGachaDate(value) {
      return new Date(`${value}T00:00:00`);
    }

    function getTodayAtStart() {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      return today;
    }

    function formatGachaDate(date) {
      const year = date.getFullYear();
      const month = `${date.getMonth() + 1}`.padStart(2, "0");
      const day = `${date.getDate()}`.padStart(2, "0");
      return `${year}.${month}.${day}`;
    }

    function getGachaDayDiff(fromDate, toDate) {
      const diff = toDate.getTime() - fromDate.getTime();
      return diff > 0 ? Math.floor(diff / 86400000) : 0;
    }

    function getNonNegativeNumber(input) {
      const value = Number.parseFloat(input.value);
      return Number.isFinite(value) && value > 0 ? value : 0;
    }

    function getAvailableGachas(today) {
      return Object.values(gachaCatalog).filter(function (gachaItem) {
        return parseGachaDate(gachaItem.endDate) >= today;
      });
    }

    function getDefaultGachaMode(selectedGacha, today) {
      const gachaStartDate = parseGachaDate(selectedGacha.startDate);
      return gachaStartDate > today ? "release" : "end";
    }

    function getSelectedGacha(today) {
      const availableGachas = getAvailableGachas(today);
      const matchedGacha = availableGachas.find((gachaItem) => gachaItem.key === gachaState.selectedGachaKey);
      return matchedGacha || availableGachas[0] || null;
    }

    function getGachaCutoff(selectedGacha, today) {
      const gachaStartDate = parseGachaDate(selectedGacha.startDate);
      const gachaEndDate = parseGachaDate(selectedGacha.endDate);

      if (gachaState.settlementMode === "release") {
        return gachaStartDate > today ? gachaStartDate : today;
      }

      return gachaEndDate;
    }

    function updateGachaButtons(today) {
      const availableGachas = getAvailableGachas(today);
      if (gachaSelector) {
        Array.from(gachaSelector.querySelectorAll("[data-gacha-key]")).forEach((button) => {
          const isVisible = availableGachas.some((gachaItem) => gachaItem.key === button.dataset.gachaKey);
          button.hidden = !isVisible;
          button.classList.toggle("is-active", button.dataset.gachaKey === gachaState.selectedGachaKey);
        });
      }

      if (gachaModeSelector) {
        Array.from(gachaModeSelector.querySelectorAll("[data-gacha-mode]")).forEach((button) => {
          button.classList.toggle("is-active", button.dataset.gachaMode === gachaState.settlementMode);
        });
      }
    }

    function renderGachaCalculator() {
      const today = getTodayAtStart();
      const selectedGacha = getSelectedGacha(today);
      if (!selectedGacha) {
        return;
      }
      gachaState.selectedGachaKey = selectedGacha.key;
      const gachaCutoff = getGachaCutoff(selectedGacha, today);
      const gachaDays = getGachaDayDiff(today, gachaCutoff);
      const gachaWeeks = Math.floor(gachaDays / 7);

      const currentCurrency = getNonNegativeNumber(gachaInputs.currentCurrency);
      const currentFeaturedPermits = getNonNegativeNumber(gachaInputs.currentFeaturedPermits);
      const eventCurrency = getNonNegativeNumber(gachaInputs.eventCurrency);
      const eventFeaturedPermits = getNonNegativeNumber(gachaInputs.eventFeaturedPermits);

      const projectedDailyCurrency = gachaDays * gachaDailyCurrency;
      const projectedWeeklyCurrency = gachaWeeks * gachaWeeklyCurrency;
      const projectedCurrencyTotal = projectedDailyCurrency + projectedWeeklyCurrency + eventCurrency;

      const currentFeaturedPullsFromCurrency = Math.floor(currentCurrency / gachaCurrencyPerPull);
      const projectedFeaturedPullsFromCurrency = Math.floor(projectedCurrencyTotal / gachaCurrencyPerPull);

      const currentFeaturedPullsTotal = currentFeaturedPullsFromCurrency + currentFeaturedPermits;
      const projectedFeaturedPullsTotal = projectedFeaturedPullsFromCurrency + eventFeaturedPermits;
      updateGachaButtons(today);

      if (gachaDaysBadge) {
        gachaDaysBadge.textContent = `${gachaDays}天`;
      }
      if (gachaWeaponPulls) {
        gachaWeaponPulls.textContent = "待补武器抽公式";
      }
      if (gachaWeaponHelper) {
        gachaWeaponHelper.textContent =
          `当前先保留武库配额的位置。等你下一步把武器抽的规则给我，我们就直接接在 ${selectedGacha.name} 这一套结算逻辑下面。`;
      }
    }

    if (gachaSelector) {
      gachaSelector.addEventListener("click", function (event) {
        const nextButton = event.target.closest("[data-gacha-key]");
        if (!nextButton) {
          return;
        }
        gachaState.selectedGachaKey = nextButton.dataset.gachaKey;
        gachaState.settlementMode = getDefaultGachaMode(gachaCatalog[gachaState.selectedGachaKey], getTodayAtStart());
        renderGachaCalculator();
      });
    }

    if (gachaModeSelector) {
      gachaModeSelector.addEventListener("click", function (event) {
        const nextButton = event.target.closest("[data-gacha-mode]");
        if (!nextButton) {
          return;
        }
        gachaState.settlementMode = nextButton.dataset.gachaMode;
        renderGachaCalculator();
      });
    }

    Object.values(gachaInputs).forEach((input) => {
      if (!input) {
        return;
      }
      input.addEventListener("input", renderGachaCalculator);
    });

    renderGachaCalculator();
  }
})();
