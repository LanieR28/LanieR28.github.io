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
    const gachaOriginiumToCurrency = 75;
    const gachaCurrencyPerPull = 500;
    const gachaWeaponQuotaPerTenPull = 1980;
    const gachaDailyCurrency = 200;
    const gachaWeeklyCurrency = 500;
    const gachaPaidPackages = {
      "package-hongyuan": { originium: 6, price: 6 },
      "package-talent": { pullsPerPurchase: 10, price: 128 },
      "package-hr": { singlePulls: 10, price: 98 },
      "package-agreement": { pullsPerPurchase: 10, price: 198 },
      "package-xinghuo": { specialPulls: 10, pullsPerPurchase: 10, price: 98 },
    };
    const gachaStepperLimits = {
      "package-weapon": 7,
      "package-weapon-full": 3,
    };
    const gachaFirstChargeTiers = {
      "firstcharge-6": { originium: 6, price: 6 },
      "firstcharge-30": { originium: 24, price: 30 },
      "firstcharge-98": { originium: 84, price: 98 },
      "firstcharge-198": { originium: 170, price: 198 },
      "firstcharge-328": { originium: 282, price: 328 },
      "firstcharge-648": { originium: 560, price: 648 },
    };
    const gachaOriginiumShopTiers = {
      "originium-6": { originium: 3, price: 6 },
      "originium-30": { originium: 15, price: 30 },
      "originium-98": { originium: 50, price: 98 },
      "originium-198": { originium: 102, price: 198 },
      "originium-328": { originium: 171, price: 328 },
      "originium-648": { originium: 350, price: 648 },
    };
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

    const gachaSelector = document.getElementById("gacha-selector");
    const gachaModeSelector = document.getElementById("gacha-mode-selector");
    const gachaDisableOriginiumPulls = document.getElementById("gacha-disable-originium-pulls");
    const gachaDaysBadge = document.getElementById("gacha-days-badge");
    const gachaCharacterTotalPulls = document.getElementById("gacha-character-total-pulls");
    const gachaSourceInventoryBar = document.getElementById("gacha-source-inventory-bar");
    const gachaSourceDailyBar = document.getElementById("gacha-source-daily-bar");
    const gachaSourceEventBar = document.getElementById("gacha-source-event-bar");
    const gachaSourcePaidBar = document.getElementById("gacha-source-paid-bar");
    const gachaSourceInventoryShare = document.getElementById("gacha-source-inventory-share");
    const gachaSourceDailyShare = document.getElementById("gacha-source-daily-share");
    const gachaSourceEventShare = document.getElementById("gacha-source-event-share");
    const gachaSourcePaidShare = document.getElementById("gacha-source-paid-share");
    const gachaTotalOriginium = document.getElementById("gacha-total-originium");
    const gachaTotalCurrency = document.getElementById("gacha-total-currency");
    const gachaTotalFeaturedPermits = document.getElementById("gacha-total-featured-permits");
    const gachaTotalSpecialPermits = document.getElementById("gacha-total-special-permits");
    const gachaDailyDays = document.getElementById("gacha-daily-days");
    const gachaWeeklyCycles = document.getElementById("gacha-weekly-cycles");
    const gachaDailyCurrencyTotal = document.getElementById("gacha-daily-currency-total");
    const gachaWeeklyCurrencyTotal = document.getElementById("gacha-weekly-currency-total");
    const gachaDailySectionTotal = document.getElementById("gacha-daily-section-total");
    const gachaMonthCardLabel = document.getElementById("gacha-month-card-label");
    const gachaMonthCardCurrency = document.getElementById("gacha-month-card-currency");
    const gachaMonthCardOriginium = document.getElementById("gacha-month-card-originium");
    const gachaPaidSectionTotal = document.getElementById("gacha-paid-section-total");
    const gachaWeaponQuotaTotal = document.getElementById("gacha-weapon-quota-total");

    const gachaInputs = {
      currentOriginium: document.getElementById("gacha-current-originium"),
      currentCurrency: document.getElementById("gacha-current-currency"),
      currentFeaturedPermits: document.getElementById("gacha-current-featured-permits"),
      currentSinglePull: document.getElementById("gacha-current-single-pull"),
      currentWeaponQuota: document.getElementById("gacha-current-weapon-quota"),
      monthlyPassCurrency: document.getElementById("gacha-monthly-pass-currency"),
      paidMonthlyOriginium: document.getElementById("gacha-paid-monthly-originium"),
      weaponBlueTickets: document.getElementById("gacha-weapon-blue-tickets"),
      weaponFeaturedTickets: document.getElementById("gacha-weapon-featured-tickets"),
      eventCurrency: document.getElementById("gacha-event-currency"),
      eventFeaturedPermits: document.getElementById("gacha-event-featured-permits"),
    };
    const gachaOriginiumShopQuantityNodes = {
      "package-weapon": document.getElementById("gacha-package-weapon-qty"),
      "package-weapon-full": document.getElementById("gacha-package-weapon-full-qty"),
      "originium-6": document.getElementById("gacha-originium-6-qty"),
      "originium-30": document.getElementById("gacha-originium-30-qty"),
      "originium-98": document.getElementById("gacha-originium-98-qty"),
      "originium-198": document.getElementById("gacha-originium-198-qty"),
      "originium-328": document.getElementById("gacha-originium-328-qty"),
      "originium-648": document.getElementById("gacha-originium-648-qty"),
    };
    const gachaFirstChargeToggleNodes = {
      monthcard: document.querySelector('[data-toggle-key="monthcard"]'),
      "package-hongyuan": document.querySelector('[data-toggle-key="package-hongyuan"]'),
      "package-talent": document.querySelector('[data-toggle-key="package-talent"]'),
      "package-hr": document.querySelector('[data-toggle-key="package-hr"]'),
      "package-agreement": document.querySelector('[data-toggle-key="package-agreement"]'),
      "package-xinghuo": document.querySelector('[data-toggle-key="package-xinghuo"]'),
      "firstcharge-6": document.querySelector('[data-toggle-key="firstcharge-6"]'),
      "firstcharge-30": document.querySelector('[data-toggle-key="firstcharge-30"]'),
      "firstcharge-98": document.querySelector('[data-toggle-key="firstcharge-98"]'),
      "firstcharge-198": document.querySelector('[data-toggle-key="firstcharge-198"]'),
      "firstcharge-328": document.querySelector('[data-toggle-key="firstcharge-328"]'),
      "firstcharge-648": document.querySelector('[data-toggle-key="firstcharge-648"]'),
    };
    const gachaPaidState = {
      disableOriginiumPulls: false,
      monthCardSelected: false,
      packageSelections: {
        "package-hongyuan": false,
        "package-talent": false,
        "package-hr": false,
        "package-agreement": false,
        "package-xinghuo": false,
      },
      firstChargeSelections: {
        "firstcharge-6": false,
        "firstcharge-30": false,
        "firstcharge-98": false,
        "firstcharge-198": false,
        "firstcharge-328": false,
        "firstcharge-648": false,
      },
      originiumShopQuantities: {
        "package-weapon": 0,
        "package-weapon-full": 0,
        "originium-6": 0,
        "originium-30": 0,
        "originium-98": 0,
        "originium-198": 0,
        "originium-328": 0,
        "originium-648": 0,
      },
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
      if (!input) {
        return 0;
      }
      const value = Number.parseFloat(input.value);
      return Number.isFinite(value) && value > 0 ? value : 0;
    }

    function setSegmentWidth(node, share) {
      if (!node) {
        return;
      }
      node.style.width = `${share}%`;
    }

    function getWeaponPackagePrice(quantity) {
      if (quantity <= 0) {
        return 0;
      }
      const firstTierCount = Math.min(quantity, 1);
      const secondTierCount = Math.min(Math.max(quantity - 1, 0), 3);
      const thirdTierCount = Math.max(quantity - 4, 0);
      return firstTierCount * 88 + secondTierCount * 108 + thirdTierCount * 128;
    }

    function syncPaidControls() {
      if (gachaDisableOriginiumPulls) {
        gachaDisableOriginiumPulls.classList.toggle("is-active", gachaPaidState.disableOriginiumPulls);
        gachaDisableOriginiumPulls.setAttribute("aria-pressed", gachaPaidState.disableOriginiumPulls ? "true" : "false");
      }

      Object.entries(gachaOriginiumShopQuantityNodes).forEach(([key, node]) => {
        if (node) {
          const value = gachaPaidState.originiumShopQuantities[key];
          const maxValue = gachaStepperLimits[key];
          const stepper = node.closest(".gacha-stepper");
          node.textContent = `${value}`;
          if (stepper && Number.isFinite(maxValue)) {
            const decreaseButton = stepper.querySelector('[data-stepper-action="decrease"]');
            const increaseButton = stepper.querySelector('[data-stepper-action="increase"]');
            if (decreaseButton) {
              decreaseButton.classList.toggle("is-disabled", value <= 0);
            }
            if (increaseButton) {
              increaseButton.classList.toggle("is-disabled", value >= maxValue);
            }
          }
        }
      });

      Object.entries(gachaFirstChargeToggleNodes).forEach(([key, node]) => {
        if (!node) {
          return;
        }

        const isSelected =
          key === "monthcard"
            ? gachaPaidState.monthCardSelected
            : key in gachaPaidState.packageSelections
              ? gachaPaidState.packageSelections[key]
              : gachaPaidState.firstChargeSelections[key];
        node.classList.toggle("is-active", isSelected);
        node.setAttribute("aria-pressed", isSelected ? "true" : "false");
        node.textContent = isSelected ? "已选" : "未选";
      });
    }

    function getNextWeekStart(fromDate) {
      const nextWeekStart = new Date(fromDate);
      const day = fromDate.getDay();
      const daysUntilNextMonday = ((8 - day) % 7) || 7;
      nextWeekStart.setDate(fromDate.getDate() + daysUntilNextMonday);
      return nextWeekStart;
    }

    function getWeeklyRefreshCount(today, cutoffDate) {
      if (cutoffDate <= today) {
        return 0;
      }

      let count = 0;
      const nextWeekStart = getNextWeekStart(today);

      while (nextWeekStart <= cutoffDate) {
        count += 1;
        nextWeekStart.setDate(nextWeekStart.getDate() + 7);
      }

      return count;
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
      const gachaWeeks = getWeeklyRefreshCount(today, gachaCutoff);

      const currentOriginium = getNonNegativeNumber(gachaInputs.currentOriginium);
      const currentCurrency = getNonNegativeNumber(gachaInputs.currentCurrency);
      const currentFeaturedPermits = getNonNegativeNumber(gachaInputs.currentFeaturedPermits);
      const currentSinglePull = getNonNegativeNumber(gachaInputs.currentSinglePull);
      const currentWeaponQuota = getNonNegativeNumber(gachaInputs.currentWeaponQuota);
      const monthlyPassCurrency = getNonNegativeNumber(gachaInputs.monthlyPassCurrency);
      const paidMonthlyOriginium = getNonNegativeNumber(gachaInputs.paidMonthlyOriginium);
      const weaponBlueTickets = getNonNegativeNumber(gachaInputs.weaponBlueTickets);
      const weaponFeaturedTickets = getNonNegativeNumber(gachaInputs.weaponFeaturedTickets);
      const eventCurrency = getNonNegativeNumber(gachaInputs.eventCurrency);
      const eventFeaturedPermits = getNonNegativeNumber(gachaInputs.eventFeaturedPermits);

      const projectedDailyCurrency = gachaDays * gachaDailyCurrency;
      const projectedWeeklyCurrency = gachaWeeks * gachaWeeklyCurrency;
      const dailyCurrencyTotal = projectedDailyCurrency + projectedWeeklyCurrency + monthlyPassCurrency;
      const monthCardCount = gachaDays > 0 ? Math.ceil(gachaDays / 30) : 0;
      const paidMonthCardCurrency = gachaDays * 200;
      const paidMonthCardOriginium = Math.max(monthCardCount - 1, 0) * 6;
      const selectedPaidMonthCardCurrency = gachaPaidState.monthCardSelected ? paidMonthCardCurrency : 0;
      const selectedPaidMonthCardOriginium = gachaPaidState.monthCardSelected ? paidMonthCardOriginium : 0;
      const paidMonthCardPrice = gachaPaidState.monthCardSelected ? monthCardCount * 30 : 0;
      const paidMonthlyOriginiumPrice = paidMonthlyOriginium > 0 ? 68 : 0;
      const paidPackagePrice = Object.entries(gachaPaidPackages).reduce((total, [key, config]) => {
        return total + (gachaPaidState.packageSelections[key] ? config.price || 0 : 0);
      }, 0);
      const firstChargePrice = Object.entries(gachaFirstChargeTiers).reduce((total, [key, config]) => {
        return total + (gachaPaidState.firstChargeSelections[key] ? config.price || 0 : 0);
      }, 0);
      const normalOriginiumPrice = Object.entries(gachaOriginiumShopTiers).reduce((total, [key, config]) => {
        return total + (gachaPaidState.originiumShopQuantities[key] || 0) * (config.price || 0);
      }, 0);
      const weaponPackagePrice = getWeaponPackagePrice(gachaPaidState.originiumShopQuantities["package-weapon"] || 0);
      const weaponFullPackagePrice = (gachaPaidState.originiumShopQuantities["package-weapon-full"] || 0) * 328;

      const paidPackagePulls = Object.entries(gachaPaidPackages).reduce((total, [key, config]) => {
        if (!gachaPaidState.packageSelections[key]) {
          return total;
        }
        return total + (config.pullsPerPurchase || 0);
      }, 0);
      const paidWeaponQuota =
        (gachaPaidState.originiumShopQuantities["package-weapon"] || 0) * 2000 +
        (gachaPaidState.originiumShopQuantities["package-weapon-full"] || 0) * 5280;
      const firstChargeOriginiumTotal = Object.entries(gachaFirstChargeTiers).reduce((total, [key, config]) => {
        return total + (gachaPaidState.firstChargeSelections[key] ? config.originium : 0);
      }, 0);
      const normalOriginiumTotal = Object.entries(gachaOriginiumShopTiers).reduce((total, [key, config]) => {
        return total + (gachaPaidState.originiumShopQuantities[key] || 0) * config.originium;
      }, 0);
      const paidPackageOriginium = Object.entries(gachaPaidPackages).reduce((total, [key, config]) => {
        return total + (gachaPaidState.packageSelections[key] ? config.originium || 0 : 0);
      }, 0);
      const paidPackageFeaturedPermits = Object.entries(gachaPaidPackages).reduce((total, [key, config]) => {
        return total + (gachaPaidState.packageSelections[key] ? config.pullsPerPurchase || 0 : 0);
      }, 0);
      const paidPackageSpecialPermits = Object.entries(gachaPaidPackages).reduce((total, [key, config]) => {
        return total + (gachaPaidState.packageSelections[key] ? config.specialPulls || 0 : 0);
      }, 0);
      const paidPackageSinglePulls = Object.entries(gachaPaidPackages).reduce((total, [key, config]) => {
        return total + (gachaPaidState.packageSelections[key] ? config.singlePulls || 0 : 0);
      }, 0);
      const paidOriginiumTotal =
        selectedPaidMonthCardOriginium + paidMonthlyOriginium + paidPackageOriginium + firstChargeOriginiumTotal + normalOriginiumTotal;
      const originiumPullCurrencyTotal = gachaPaidState.disableOriginiumPulls ? 0 : paidOriginiumTotal * gachaOriginiumToCurrency;
      const paidFeaturedPullsFromOriginium = Math.floor(originiumPullCurrencyTotal / gachaCurrencyPerPull);
      const paidFeaturedPullsFromCurrency = Math.floor(selectedPaidMonthCardCurrency / gachaCurrencyPerPull);
      const paidFeaturedPulls = paidFeaturedPullsFromOriginium + paidFeaturedPullsFromCurrency + paidPackagePulls;
      const paidPriceTotal =
        paidMonthCardPrice +
        paidMonthlyOriginiumPrice +
        paidPackagePrice +
        firstChargePrice +
        normalOriginiumPrice +
        weaponPackagePrice +
        weaponFullPackagePrice;
      const totalOriginium = currentOriginium + paidOriginiumTotal;
      const totalCurrency = currentCurrency + dailyCurrencyTotal + eventCurrency + selectedPaidMonthCardCurrency;
      const totalFeaturedPermits = currentFeaturedPermits + eventFeaturedPermits + paidPackageFeaturedPermits;
      const totalSpecialPermits = paidPackageSpecialPermits;

      const currentOriginiumPullCurrency = gachaPaidState.disableOriginiumPulls ? 0 : currentOriginium * gachaOriginiumToCurrency;
      const currentFeaturedPullsFromOriginium = Math.floor(currentOriginiumPullCurrency / gachaCurrencyPerPull);
      const currentFeaturedPullsFromCurrency = Math.floor(currentCurrency / gachaCurrencyPerPull);
      const dailyFeaturedPulls = Math.floor(dailyCurrencyTotal / gachaCurrencyPerPull);
      const eventFeaturedPullsFromCurrency = Math.floor(eventCurrency / gachaCurrencyPerPull);
      const weaponTicketBonus = weaponFeaturedTickets >= 30 ? 10 : 0;
      const weaponTicketQuota = (weaponBlueTickets + weaponFeaturedTickets + weaponTicketBonus) * 50;
      const currentWeaponTenPulls = Math.floor(currentWeaponQuota / gachaWeaponQuotaPerTenPull);

      const inventoryFeaturedPullsTotal =
        currentFeaturedPullsFromOriginium + currentFeaturedPullsFromCurrency + currentFeaturedPermits + currentSinglePull;
      const eventFeaturedPullsTotal = eventFeaturedPullsFromCurrency + eventFeaturedPermits;
      const characterTotalPulls = inventoryFeaturedPullsTotal + dailyFeaturedPulls + eventFeaturedPullsTotal + paidFeaturedPulls;
      const weaponQuotaTotal = currentWeaponQuota + paidWeaponQuota + weaponTicketQuota;
      const inventoryShare = characterTotalPulls > 0 ? (inventoryFeaturedPullsTotal / characterTotalPulls) * 100 : 0;
      const dailyShare = characterTotalPulls > 0 ? (dailyFeaturedPulls / characterTotalPulls) * 100 : 0;
      const eventShare = characterTotalPulls > 0 ? (eventFeaturedPullsTotal / characterTotalPulls) * 100 : 0;
      const paidShare = characterTotalPulls > 0 ? (paidFeaturedPulls / characterTotalPulls) * 100 : 0;
      updateGachaButtons(today);

      if (gachaDaysBadge) {
        gachaDaysBadge.textContent = `${gachaDays}天`;
      }
      if (gachaCharacterTotalPulls) {
        gachaCharacterTotalPulls.textContent = `${characterTotalPulls} 抽`;
      }
      if (gachaDailyDays) {
        gachaDailyDays.textContent = `${gachaDays}`;
      }
      if (gachaWeeklyCycles) {
        gachaWeeklyCycles.textContent = `${gachaWeeks}`;
      }
      if (gachaDailyCurrencyTotal) {
        gachaDailyCurrencyTotal.textContent = `${projectedDailyCurrency}`;
      }
      if (gachaWeeklyCurrencyTotal) {
        gachaWeeklyCurrencyTotal.textContent = `${projectedWeeklyCurrency}`;
      }
      if (gachaDailySectionTotal) {
        gachaDailySectionTotal.textContent = `${dailyCurrencyTotal}`;
      }
      if (gachaMonthCardLabel) {
        gachaMonthCardLabel.textContent = `月卡（${gachaDays}天）`;
      }
      if (gachaMonthCardCurrency) {
        gachaMonthCardCurrency.textContent = `${paidMonthCardCurrency}`;
      }
      if (gachaMonthCardOriginium) {
        gachaMonthCardOriginium.textContent = `${paidMonthCardOriginium}`;
      }
      if (gachaPaidSectionTotal) {
        gachaPaidSectionTotal.textContent = `${paidPriceTotal}￥`;
      }
      if (gachaWeaponQuotaTotal) {
        gachaWeaponQuotaTotal.textContent = `${weaponQuotaTotal}`;
      }
      if (gachaTotalOriginium) {
        gachaTotalOriginium.textContent = `${totalOriginium}`;
      }
      if (gachaTotalCurrency) {
        gachaTotalCurrency.textContent = `${totalCurrency}`;
      }
      if (gachaTotalFeaturedPermits) {
        gachaTotalFeaturedPermits.textContent = `${totalFeaturedPermits}`;
      }
      if (gachaTotalSpecialPermits) {
        gachaTotalSpecialPermits.textContent = `${totalSpecialPermits}`;
      }
      setSegmentWidth(gachaSourceInventoryBar, inventoryShare);
      setSegmentWidth(gachaSourceDailyBar, dailyShare);
      setSegmentWidth(gachaSourceEventBar, eventShare);
      setSegmentWidth(gachaSourcePaidBar, paidShare);
      if (gachaSourceInventoryShare) {
        gachaSourceInventoryShare.textContent = `${Math.round(inventoryShare)}%`;
      }
      if (gachaSourceDailyShare) {
        gachaSourceDailyShare.textContent = `${Math.round(dailyShare)}%`;
      }
      if (gachaSourceEventShare) {
        gachaSourceEventShare.textContent = `${Math.round(eventShare)}%`;
      }
      if (gachaSourcePaidShare) {
        gachaSourcePaidShare.textContent = `${Math.round(paidShare)}%`;
      }

      syncPaidControls();
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

    document.addEventListener("click", function (event) {
      const stepperButton = event.target.closest("[data-stepper-action]");
      if (stepperButton) {
        const { stepperAction, stepperKey } = stepperButton.dataset;
        if (stepperKey in gachaPaidState.originiumShopQuantities) {
          const nextValue = gachaPaidState.originiumShopQuantities[stepperKey] + (stepperAction === "increase" ? 1 : -1);
          const maxValue = gachaStepperLimits[stepperKey] || Number.POSITIVE_INFINITY;
          gachaPaidState.originiumShopQuantities[stepperKey] = Math.min(maxValue, Math.max(0, nextValue));
          renderGachaCalculator();
          return;
        }
      }

      const toggleButton = event.target.closest("[data-toggle-key]");
      if (toggleButton) {
        const { toggleKey } = toggleButton.dataset;
        if (toggleKey === "disable-originium-pulls") {
          gachaPaidState.disableOriginiumPulls = !gachaPaidState.disableOriginiumPulls;
          renderGachaCalculator();
          return;
        }

        if (toggleKey === "monthcard") {
          gachaPaidState.monthCardSelected = !gachaPaidState.monthCardSelected;
          renderGachaCalculator();
          return;
        }

        if (toggleKey in gachaPaidState.packageSelections) {
          gachaPaidState.packageSelections[toggleKey] = !gachaPaidState.packageSelections[toggleKey];
          renderGachaCalculator();
          return;
        }

        if (toggleKey in gachaPaidState.firstChargeSelections) {
          gachaPaidState.firstChargeSelections[toggleKey] = !gachaPaidState.firstChargeSelections[toggleKey];
          renderGachaCalculator();
        }
      }
    });

    Object.values(gachaInputs).forEach((input) => {
      if (!input) {
        return;
      }
      input.addEventListener("input", renderGachaCalculator);
    });

    renderGachaCalculator();
  }
})();
