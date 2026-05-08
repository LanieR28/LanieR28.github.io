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
    const gachaStorageKey = "lanier28:endfield-gacha:v1";
    const gachaOriginiumToCurrency = 75;
    const gachaCurrencyPerPull = 500;
    const gachaWeaponQuotaPerTenPull = 1980;
    const gachaDailyCurrency = 200;
    const gachaWeeklyCurrency = 500;
    const gachaDailyFixedPermits = 5;
    const gachaSearchIntelPermits = 10;
    const gachaRefreshMonthCardExpiryDate = "2026-05-18";
    const gachaPaidPackages = {
      "package-hongyuan": { originium: 6, price: 6 },
      "package-talent": { pullsPerPurchase: 10, price: 128 },
      "package-hr": { singlePulls: 10, price: 98 },
      "package-agreement": { pullsPerPurchase: 10, weaponQuota: 2000, price: 198 },
      "package-xinghuo": { specialPulls: 10, price: 98 },
    };
    const gachaEventRewards = {
      "event-wuling-chef": { currency: 1200 },
      "event-xirang": { currency: 1200 },
      "event-survey": { currency: 300 },
      "event-yiliu": { currency: 1200 },
      "event-zhangzhong": { currency: 1600 },
      "event-keyu": { currency: 1400 },
      "event-zhensui": { currency: 1200 },
    };
    const gachaEventCurrencyKeys = Object.keys(gachaEventRewards);
    const gachaStepperLimits = {
      "package-weapon": 7,
      "package-weapon-full": 3,
      "event-wuling-chef": 1200,
      "event-xirang": 1200,
      "event-huiguang-signin": 5,
      "event-survey": 300,
      "event-yiliu": 1200,
      "event-zhangzhong": 1600,
      "event-keyu": 1400,
      "event-zhensui": 1200,
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
        hasSearchIntel: true,
      },
      nextGacha: {
        key: "nextGacha",
        tabLabel: "辉光庆典卡池",
        name: "辉光庆典卡池",
        startDate: "2026-05-14",
        endDate: "2026-06-04",
      },
      mifuGacha: {
        key: "mifuGacha",
        tabLabel: "弥弗卡池",
        name: "弥弗卡池",
        startDate: "2026-06-04",
        endDate: "2026-06-20",
        hasSearchIntel: true,
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
    const gachaTargetPotentialInput = document.getElementById("gacha-target-potential");
    const gachaTargetPotentialIcon = document.getElementById("gacha-target-potential-icon");
    const gachaTargetProbabilityFill = document.getElementById("gacha-target-probability-fill");
    const gachaTargetProbabilityValue = document.getElementById("gacha-target-probability-value");
    const gachaDailyDays = document.getElementById("gacha-daily-days");
    const gachaWeeklyCycles = document.getElementById("gacha-weekly-cycles");
    const gachaRefreshMonthCardDays = document.getElementById("gacha-refresh-month-card-days");
    const gachaDailyCurrencyTotal = document.getElementById("gacha-daily-currency-total");
    const gachaWeeklyCurrencyTotal = document.getElementById("gacha-weekly-currency-total");
    const gachaWeeklyWeaponQuotaTotal = document.getElementById("gacha-weekly-weapon-quota-total");
    const gachaRefreshMonthCardCurrencyTotal = document.getElementById("gacha-refresh-month-card-currency-total");
    const gachaSearchIntelItem = document.getElementById("gacha-search-intel-item");
    const gachaSearchIntelToggle = document.querySelector('[data-toggle-key="daily-search-intel"]');
    const gachaDailySectionTotal = document.getElementById("gacha-daily-section-total");
    const gachaMonthCardLabel = document.getElementById("gacha-month-card-label");
    const gachaMonthCardCurrency = document.getElementById("gacha-month-card-currency");
    const gachaMonthCardOriginium = document.getElementById("gacha-month-card-originium");
    const gachaPaidSectionTotal = document.getElementById("gacha-paid-section-total");
    const gachaPaidCard = document.getElementById("gacha-paid-card");
    const gachaPaidStickyTotal = document.getElementById("gacha-paid-sticky-total");
    const gachaScrollPanel = document.querySelector(".gacha-scroll-panel");
    const gachaWeaponQuotaTotal = document.getElementById("gacha-weapon-quota-total");
    const gachaWeaponQuotaPulls = document.getElementById("gacha-weapon-quota-pulls");

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
      "event-wuling-chef": document.getElementById("gacha-event-wuling-chef-qty"),
      "event-xirang": document.getElementById("gacha-event-xirang-qty"),
      "event-huiguang-signin": document.getElementById("gacha-event-huiguang-signin-qty"),
      "event-survey": document.getElementById("gacha-event-survey-qty"),
      "event-yiliu": document.getElementById("gacha-event-yiliu-qty"),
      "event-zhangzhong": document.getElementById("gacha-event-zhangzhong-qty"),
      "event-keyu": document.getElementById("gacha-event-keyu-qty"),
      "event-zhensui": document.getElementById("gacha-event-zhensui-qty"),
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
        "event-wuling-chef": 0,
        "event-xirang": 0,
        "event-huiguang-signin": 0,
        "event-survey": 0,
        "event-yiliu": 0,
        "event-zhangzhong": 0,
        "event-keyu": 0,
        "event-zhensui": 0,
      },
    };
    const gachaDailyState = {
      searchIntelSelections: {},
      targetPotential: 0,
    };
    let gachaStepperHoldTimer = null;
    let gachaStepperRepeatTimer = null;
    let gachaStepperRepeatDelay = 260;
    let gachaStepperDidHold = false;
    let gachaStepperHandledPointerDown = false;
    let gachaProbabilityWorker = null;
    let gachaProbabilityRequestId = 0;
    let gachaProbabilityDebounceTimer = null;
    let gachaProbabilityFallbackTimer = null;
    let gachaProbabilityLastKey = "";

    function parseGachaDate(value) {
      const [year, month, day] = value.split("-").map(Number);
      return { year, month, day, dayNumber: Date.UTC(year, month - 1, day) / 86400000 };
    }

    function getTodayAtStart() {
      const now = new Date();
      const tokyoParts = new Intl.DateTimeFormat("en-CA", {
        timeZone: "Asia/Tokyo",
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        hour12: false,
      }).formatToParts(now);
      const partValues = Object.fromEntries(tokyoParts.map((part) => [part.type, part.value]));
      let year = Number(partValues.year);
      let month = Number(partValues.month);
      let day = Number(partValues.day);
      const hour = Number(partValues.hour);
      let dayNumber = Date.UTC(year, month - 1, day) / 86400000;
      if (hour < 5) {
        dayNumber -= 1;
      }
      const effectiveDate = new Date(dayNumber * 86400000);
      year = effectiveDate.getUTCFullYear();
      month = effectiveDate.getUTCMonth() + 1;
      day = effectiveDate.getUTCDate();
      return { year, month, day, dayNumber };
    }

    function formatGachaDate(date) {
      const year = date.year;
      const month = `${date.month}`.padStart(2, "0");
      const day = `${date.day}`.padStart(2, "0");
      return `${year}.${month}.${day}`;
    }

    function getGachaDayDiff(fromDate, toDate) {
      const diff = toDate.dayNumber - fromDate.dayNumber;
      return diff > 0 ? Math.floor(diff) : 0;
    }

    function getRefreshMonthCardDays(today, gachaDays) {
      const expiryDate = parseGachaDate(gachaRefreshMonthCardExpiryDate);
      return Math.min(gachaDays, Math.max(0, getGachaDayDiff(today, expiryDate) - 1));
    }

    function hasSearchIntel(selectedGacha) {
      return Boolean(selectedGacha.hasSearchIntel) || /寻访$/.test(selectedGacha.name || selectedGacha.tabLabel || "");
    }

    function getNonNegativeNumber(input) {
      if (!input) {
        return 0;
      }
      const value = Number.parseFloat(input.value);
      return Number.isFinite(value) && value > 0 ? value : 0;
    }

    function saveGachaLocalState() {
      try {
        const inputValues = Object.fromEntries(
          Object.entries(gachaInputs).map(([key, input]) => [key, input ? input.value : ""]),
        );
        window.localStorage.setItem(
          gachaStorageKey,
          JSON.stringify({
            selectedGachaKey: gachaState.selectedGachaKey,
            settlementMode: gachaState.settlementMode,
            disableOriginiumPulls: gachaPaidState.disableOriginiumPulls,
            searchIntelSelections: gachaDailyState.searchIntelSelections,
            targetPotential: gachaDailyState.targetPotential,
            monthCardSelected: gachaPaidState.monthCardSelected,
            packageSelections: gachaPaidState.packageSelections,
            firstChargeSelections: gachaPaidState.firstChargeSelections,
            originiumShopQuantities: gachaPaidState.originiumShopQuantities,
            inputValues,
          }),
        );
      } catch (error) {
        return;
      }
    }

    function restoreGachaLocalState() {
      try {
        const rawValue = window.localStorage.getItem(gachaStorageKey);
        if (!rawValue) {
          return;
        }

        const savedState = JSON.parse(rawValue);
        if (savedState.selectedGachaKey in gachaCatalog) {
          gachaState.selectedGachaKey = savedState.selectedGachaKey;
        }
        if (savedState.settlementMode === "release" || savedState.settlementMode === "end") {
          gachaState.settlementMode = savedState.settlementMode;
        }
        gachaPaidState.disableOriginiumPulls = Boolean(savedState.disableOriginiumPulls);
        if (savedState.searchIntelSelections && typeof savedState.searchIntelSelections === "object") {
          Object.keys(gachaCatalog).forEach((key) => {
            gachaDailyState.searchIntelSelections[key] = Boolean(savedState.searchIntelSelections[key]);
          });
        }
        if (Number.isFinite(Number(savedState.targetPotential))) {
          gachaDailyState.targetPotential = Math.min(5, Math.max(0, Number.parseInt(savedState.targetPotential, 10)));
        }
        gachaPaidState.monthCardSelected = Boolean(savedState.monthCardSelected);

        Object.keys(gachaPaidState.packageSelections).forEach((key) => {
          if (savedState.packageSelections && key in savedState.packageSelections) {
            gachaPaidState.packageSelections[key] = Boolean(savedState.packageSelections[key]);
          }
        });
        Object.keys(gachaPaidState.firstChargeSelections).forEach((key) => {
          if (savedState.firstChargeSelections && key in savedState.firstChargeSelections) {
            gachaPaidState.firstChargeSelections[key] = Boolean(savedState.firstChargeSelections[key]);
          }
        });
        Object.keys(gachaPaidState.originiumShopQuantities).forEach((key) => {
          const savedValue = savedState.originiumShopQuantities ? Number(savedState.originiumShopQuantities[key]) : 0;
          const maxValue = gachaStepperLimits[key] || Number.POSITIVE_INFINITY;
          if (Number.isFinite(savedValue)) {
            gachaPaidState.originiumShopQuantities[key] = Math.min(maxValue, Math.max(0, savedValue));
          }
        });
        Object.entries(gachaInputs).forEach(([key, input]) => {
          if (input && savedState.inputValues && key in savedState.inputValues) {
            input.value = savedState.inputValues[key];
          }
        });
      } catch (error) {
        return;
      }
    }

    function setSegmentWidth(node, share) {
      if (!node) {
        return;
      }
      node.style.width = `${share}%`;
    }

    function interpolateColor(start, end, amount) {
      const ratio = Math.min(1, Math.max(0, amount));
      const values = start.map((channel, index) => Math.round(channel + (end[index] - channel) * ratio));
      return `rgb(${values[0]}, ${values[1]}, ${values[2]})`;
    }

    function getGachaProbabilityColor(probability) {
      if (probability <= 0.15) {
        return "#d94b4b";
      }
      if (probability <= 1 / 3) {
        return interpolateColor([217, 75, 75], [238, 142, 52], (probability - 0.15) / (1 / 3 - 0.15));
      }
      if (probability <= 2 / 3) {
        return interpolateColor([238, 142, 52], [235, 204, 73], (probability - 1 / 3) / (1 / 3));
      }
      return interpolateColor([235, 204, 73], [78, 178, 99], (probability - 2 / 3) / (1 / 3));
    }

    function syncTargetPotentialControls() {
      const value = Math.min(5, Math.max(0, gachaDailyState.targetPotential));
      gachaDailyState.targetPotential = value;
      if (gachaTargetPotentialInput) {
        gachaTargetPotentialInput.value = `${value}`;
      }
      if (gachaTargetPotentialIcon) {
        gachaTargetPotentialIcon.textContent = `${value}潜`;
      }
      const stepper = gachaTargetPotentialInput ? gachaTargetPotentialInput.closest(".gacha-stepper") : null;
      if (stepper) {
        const decreaseButton = stepper.querySelector('[data-stepper-action="decrease"]');
        const increaseButton = stepper.querySelector('[data-stepper-action="increase"]');
        if (decreaseButton) {
          decreaseButton.classList.toggle("is-disabled", value <= 0);
        }
        if (increaseButton) {
          increaseButton.classList.toggle("is-disabled", value >= 5);
        }
      }
    }

    function paintTargetProbability(probability, label) {
      const color = getGachaProbabilityColor(probability);
      gachaTargetProbabilityFill.style.width = `${probability * 100}%`;
      gachaTargetProbabilityValue.textContent = label || `${(probability * 100).toFixed(1)}%`;
      gachaTargetProbabilityValue.style.color = color;
    }

    function updateTargetProbabilityDisplay(characterTotalPulls, isSearchIntelAvailable) {
      if (!gachaTargetProbabilityFill || !gachaTargetProbabilityValue) {
        return;
      }
      if (!isSearchIntelAvailable) {
        gachaProbabilityLastKey = "";
        gachaProbabilityRequestId += 1;
        if (gachaProbabilityDebounceTimer) {
          window.clearTimeout(gachaProbabilityDebounceTimer);
          gachaProbabilityDebounceTimer = null;
        }
        if (gachaProbabilityWorker) {
          gachaProbabilityWorker.terminate();
          gachaProbabilityWorker = null;
        }
        paintTargetProbability(0, "—");
        return;
      }

      const requestKey = `${characterTotalPulls}:${gachaDailyState.targetPotential}`;
      if (requestKey === gachaProbabilityLastKey) {
        return;
      }
      gachaProbabilityLastKey = requestKey;
      if (gachaProbabilityDebounceTimer) {
        window.clearTimeout(gachaProbabilityDebounceTimer);
      }
      if (gachaProbabilityFallbackTimer) {
        window.clearTimeout(gachaProbabilityFallbackTimer);
        gachaProbabilityFallbackTimer = null;
      }
      gachaTargetProbabilityValue.textContent = "计算中";
      gachaTargetProbabilityValue.style.color = getGachaProbabilityColor(0);

      gachaProbabilityDebounceTimer = window.setTimeout(function () {
        const requestId = gachaProbabilityRequestId + 1;
        gachaProbabilityRequestId = requestId;
        const payload = {
          type: "calculate-target-potential",
          requestId,
          pulls: characterTotalPulls,
          targetPotential: gachaDailyState.targetPotential,
        };

        if (gachaProbabilityWorker) {
          gachaProbabilityWorker.terminate();
          gachaProbabilityWorker = null;
        }

        if (!gachaProbabilityWorker && "Worker" in window) {
          gachaProbabilityWorker = new Worker("./endfield-gacha-probability-worker.js?v=20260508-target-potential-probability");
          gachaProbabilityWorker.addEventListener("message", function (event) {
            const result = event.data || {};
            if (result.requestId !== gachaProbabilityRequestId) {
              return;
            }
            if (result.type === "target-potential-error") {
              paintTargetProbability(0, "计算失败");
              return;
            }
            const probability = Math.min(1, Math.max(0, result.successProbability || 0));
            paintTargetProbability(probability);
          });
        }

        if (gachaProbabilityWorker) {
          gachaProbabilityWorker.postMessage(payload);
          return;
        }

        if (!window.EndfieldGachaProbability) {
          return;
        }
        gachaProbabilityFallbackTimer = window.setTimeout(function () {
          const result = window.EndfieldGachaProbability.calculateTargetPotentialProbability({
            pulls: characterTotalPulls,
            targetPotential: gachaDailyState.targetPotential,
            minimumProbability: 1e-8,
          });
          if (requestId !== gachaProbabilityRequestId) {
            return;
          }
          const probability = Math.min(1, Math.max(0, result.successProbability || 0));
          paintTargetProbability(probability);
        }, 0);
      }, 160);
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

    function updateGachaStepper(stepperKey, stepperAction) {
      if (stepperKey === "target-potential") {
        const nextValue = gachaDailyState.targetPotential + (stepperAction === "increase" ? 1 : -1);
        const clampedValue = Math.min(5, Math.max(0, nextValue));
        if (clampedValue === gachaDailyState.targetPotential) {
          return false;
        }
        gachaDailyState.targetPotential = clampedValue;
        renderGachaCalculator();
        return true;
      }

      if (!(stepperKey in gachaPaidState.originiumShopQuantities)) {
        return false;
      }

      const stepValue = gachaEventCurrencyKeys.includes(stepperKey) ? 100 : 1;
      const nextValue = gachaPaidState.originiumShopQuantities[stepperKey] + (stepperAction === "increase" ? stepValue : -stepValue);
      const maxValue = gachaStepperLimits[stepperKey] || Number.POSITIVE_INFINITY;
      const clampedValue = Math.min(maxValue, Math.max(0, nextValue));
      if (clampedValue === gachaPaidState.originiumShopQuantities[stepperKey]) {
        return false;
      }

      gachaPaidState.originiumShopQuantities[stepperKey] = clampedValue;
      renderGachaCalculator();
      return true;
    }

    function stopGachaStepperHold() {
      if (gachaStepperHoldTimer) {
        window.clearTimeout(gachaStepperHoldTimer);
        gachaStepperHoldTimer = null;
      }
      if (gachaStepperRepeatTimer) {
        window.clearTimeout(gachaStepperRepeatTimer);
        gachaStepperRepeatTimer = null;
      }
    }

    function repeatGachaStepper(stepperKey, stepperAction) {
      gachaStepperDidHold = true;
      const didUpdate = updateGachaStepper(stepperKey, stepperAction);
      if (!didUpdate) {
        stopGachaStepperHold();
        return;
      }

      gachaStepperRepeatDelay = Math.max(48, Math.round(gachaStepperRepeatDelay * 0.82));
      gachaStepperRepeatTimer = window.setTimeout(function () {
        repeatGachaStepper(stepperKey, stepperAction);
      }, gachaStepperRepeatDelay);
    }

    function startGachaStepperHold(stepperKey, stepperAction) {
      stopGachaStepperHold();
      gachaStepperDidHold = false;
      gachaStepperRepeatDelay = 260;
      gachaStepperHoldTimer = window.setTimeout(function () {
        repeatGachaStepper(stepperKey, stepperAction);
      }, 750);
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
          node.value = `${value}`;
          if (Number.isFinite(maxValue)) {
            node.max = `${maxValue}`;
          }
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

    function syncPaidStickyTotalVisibility() {
      if (!gachaPaidCard || !gachaPaidStickyTotal || !gachaScrollPanel) {
        return;
      }

      const cardTop = gachaPaidCard.offsetTop;
      const cardBottom = cardTop + gachaPaidCard.offsetHeight;
      const viewportTop = gachaScrollPanel.scrollTop;
      const viewportBottom = viewportTop + gachaScrollPanel.clientHeight;
      const isPaidVisible = viewportBottom > cardTop && viewportTop < cardBottom;
      gachaPaidStickyTotal.classList.toggle("is-visible", isPaidVisible);
      gachaPaidStickyTotal.setAttribute("aria-hidden", isPaidVisible ? "false" : "true");
    }

    function getNextWeekStart(fromDate) {
      const utcDate = new Date(fromDate.dayNumber * 86400000);
      const day = utcDate.getUTCDay();
      const daysUntilNextMonday = ((8 - day) % 7) || 7;
      const nextWeekDayNumber = fromDate.dayNumber + daysUntilNextMonday;
      const nextWeekDate = new Date(nextWeekDayNumber * 86400000);
      return {
        year: nextWeekDate.getUTCFullYear(),
        month: nextWeekDate.getUTCMonth() + 1,
        day: nextWeekDate.getUTCDate(),
        dayNumber: nextWeekDayNumber,
      };
    }

    function getWeeklyRefreshCount(today, cutoffDate) {
      if (cutoffDate.dayNumber <= today.dayNumber) {
        return 0;
      }

      let count = 0;
      const nextWeekStart = getNextWeekStart(today);

      while (nextWeekStart.dayNumber <= cutoffDate.dayNumber) {
        count += 1;
        nextWeekStart.dayNumber += 7;
      }

      return count;
    }

    function getAvailableGachas(today) {
      return Object.values(gachaCatalog).filter(function (gachaItem) {
        return parseGachaDate(gachaItem.endDate).dayNumber >= today.dayNumber;
      });
    }

    function getDefaultGachaMode(selectedGacha, today) {
      const gachaStartDate = parseGachaDate(selectedGacha.startDate);
      return gachaStartDate.dayNumber > today.dayNumber ? "release" : "end";
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
        return gachaStartDate.dayNumber > today.dayNumber ? gachaStartDate : today;
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
      const isSearchIntelAvailable = hasSearchIntel(selectedGacha);
      const isSearchIntelSelected = Boolean(gachaDailyState.searchIntelSelections[selectedGacha.key]);
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
      const projectedWeeklyWeaponQuota = gachaWeeks * 100;
      const refreshMonthCardDays = getRefreshMonthCardDays(today, gachaDays);
      const refreshMonthCardCurrency = refreshMonthCardDays * gachaDailyCurrency;
      const dailyCurrencyTotal = projectedDailyCurrency + projectedWeeklyCurrency + refreshMonthCardCurrency + monthlyPassCurrency;
      const monthCardCount = gachaDays > 0 ? Math.ceil(gachaDays / 30) : 0;
      const paidMonthCardCurrency = gachaDays * 200;
      const paidMonthCardOriginium = Math.max(monthCardCount - 1, 0) * 12;
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
        (gachaPaidState.originiumShopQuantities["package-weapon-full"] || 0) * 5280 +
        Object.entries(gachaPaidPackages).reduce((total, [key, config]) => {
          return total + (gachaPaidState.packageSelections[key] ? config.weaponQuota || 0 : 0);
        }, 0);
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
      const paidFeaturedPulls = paidFeaturedPullsFromOriginium + paidFeaturedPullsFromCurrency + paidPackagePulls + paidPackageSpecialPermits;
      const paidPriceTotal =
        paidMonthCardPrice +
        paidMonthlyOriginiumPrice +
        paidPackagePrice +
        firstChargePrice +
        normalOriginiumPrice +
        weaponPackagePrice +
        weaponFullPackagePrice;
      const selectedEventCurrency = Object.entries(gachaEventRewards).reduce((total, [key]) => {
        return total + (gachaPaidState.originiumShopQuantities[key] || 0);
      }, 0);
      const selectedEventSpecialPulls = gachaPaidState.originiumShopQuantities["event-huiguang-signin"] || 0;
      const eventCurrencyTotal = eventCurrency + selectedEventCurrency;
      const eventPermitPullsTotal = eventFeaturedPermits + selectedEventSpecialPulls;
      const selectedDailySearchIntelPulls = isSearchIntelAvailable && isSearchIntelSelected ? gachaSearchIntelPermits : 0;
      const dailyPermitPulls = gachaDailyFixedPermits + selectedDailySearchIntelPulls;
      const totalOriginium = currentOriginium + paidOriginiumTotal;
      const totalCurrency = currentCurrency + dailyCurrencyTotal + eventCurrencyTotal + selectedPaidMonthCardCurrency;
      const totalFeaturedPermits = currentFeaturedPermits + eventFeaturedPermits + paidPackageFeaturedPermits;
      const totalSpecialPermits = paidPackageSpecialPermits + selectedEventSpecialPulls + dailyPermitPulls;

      const currentOriginiumPullCurrency = gachaPaidState.disableOriginiumPulls ? 0 : currentOriginium * gachaOriginiumToCurrency;
      const totalOriginiumPullCurrency = gachaPaidState.disableOriginiumPulls ? 0 : totalOriginium * gachaOriginiumToCurrency;
      const totalCurrencyPulls = Math.floor((totalOriginiumPullCurrency + totalCurrency) / gachaCurrencyPerPull);
      const inventoryPullShareValue = (currentOriginiumPullCurrency + currentCurrency) / gachaCurrencyPerPull + currentFeaturedPermits;
      const dailyPullShareValue = dailyCurrencyTotal / gachaCurrencyPerPull + dailyPermitPulls;
      const eventPullShareValue = eventCurrencyTotal / gachaCurrencyPerPull + eventPermitPullsTotal;
      const paidPullShareValue =
        (originiumPullCurrencyTotal + selectedPaidMonthCardCurrency) / gachaCurrencyPerPull + paidPackagePulls + paidPackageSpecialPermits;
      const weaponTicketBonus = weaponFeaturedTickets >= 30 ? 10 : 0;
      const weaponTicketQuota = (weaponBlueTickets + weaponFeaturedTickets + weaponTicketBonus) * 50;
      const characterTotalPulls = totalCurrencyPulls + totalFeaturedPermits + totalSpecialPermits;
      const weaponQuotaTotal = currentWeaponQuota + paidWeaponQuota + weaponTicketQuota + projectedWeeklyWeaponQuota;
      const weaponQuotaPulls = Math.floor(weaponQuotaTotal / gachaWeaponQuotaPerTenPull);
      const sourceShareTotal = inventoryPullShareValue + dailyPullShareValue + eventPullShareValue + paidPullShareValue;
      const inventoryShare = sourceShareTotal > 0 ? (inventoryPullShareValue / sourceShareTotal) * 100 : 0;
      const dailyShare = sourceShareTotal > 0 ? (dailyPullShareValue / sourceShareTotal) * 100 : 0;
      const eventShare = sourceShareTotal > 0 ? (eventPullShareValue / sourceShareTotal) * 100 : 0;
      const paidShare = sourceShareTotal > 0 ? (paidPullShareValue / sourceShareTotal) * 100 : 0;
      updateGachaButtons(today);

      if (gachaDaysBadge) {
        gachaDaysBadge.textContent = `${gachaDays}天`;
      }
      if (gachaCharacterTotalPulls) {
        gachaCharacterTotalPulls.textContent = `${characterTotalPulls}抽`;
      }
      syncTargetPotentialControls();
      updateTargetProbabilityDisplay(characterTotalPulls, isSearchIntelAvailable);
      if (gachaDailyDays) {
        gachaDailyDays.textContent = `${gachaDays}`;
      }
      if (gachaWeeklyCycles) {
        gachaWeeklyCycles.textContent = `${gachaWeeks}`;
      }
      if (gachaRefreshMonthCardDays) {
        gachaRefreshMonthCardDays.textContent = `${refreshMonthCardDays}`;
      }
      if (gachaDailyCurrencyTotal) {
        gachaDailyCurrencyTotal.textContent = `${projectedDailyCurrency}`;
      }
      if (gachaWeeklyCurrencyTotal) {
        gachaWeeklyCurrencyTotal.textContent = `${projectedWeeklyCurrency}`;
      }
      if (gachaWeeklyWeaponQuotaTotal) {
        gachaWeeklyWeaponQuotaTotal.textContent = `${projectedWeeklyWeaponQuota}`;
      }
      if (gachaRefreshMonthCardCurrencyTotal) {
        gachaRefreshMonthCardCurrencyTotal.textContent = `${refreshMonthCardCurrency}`;
      }
      if (gachaSearchIntelItem) {
        gachaSearchIntelItem.hidden = !isSearchIntelAvailable;
        gachaSearchIntelItem.style.display = isSearchIntelAvailable ? "" : "none";
      }
      if (gachaSearchIntelToggle) {
        gachaSearchIntelToggle.classList.toggle("is-active", isSearchIntelSelected);
        gachaSearchIntelToggle.setAttribute("aria-pressed", isSearchIntelSelected ? "true" : "false");
        gachaSearchIntelToggle.textContent = isSearchIntelSelected ? "已选" : "未选";
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
      if (gachaWeaponQuotaPulls) {
        gachaWeaponQuotaPulls.textContent = `${weaponQuotaPulls} 次`;
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
      syncPaidStickyTotalVisibility();
      saveGachaLocalState();
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
        if (gachaStepperHandledPointerDown || gachaStepperDidHold) {
          gachaStepperHandledPointerDown = false;
          gachaStepperDidHold = false;
          event.preventDefault();
          return;
        }

        const { stepperAction, stepperKey } = stepperButton.dataset;
        if (updateGachaStepper(stepperKey, stepperAction)) {
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

        if (toggleKey === "daily-search-intel") {
          gachaDailyState.searchIntelSelections[gachaState.selectedGachaKey] = !gachaDailyState.searchIntelSelections[gachaState.selectedGachaKey];
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

    document.addEventListener("pointerdown", function (event) {
      const stepperButton = event.target.closest("[data-stepper-action]");
      if (!stepperButton) {
        return;
      }

      const { stepperAction, stepperKey } = stepperButton.dataset;
      if (stepperKey !== "target-potential" && !(stepperKey in gachaPaidState.originiumShopQuantities)) {
        return;
      }

      gachaStepperHandledPointerDown = updateGachaStepper(stepperKey, stepperAction);
      startGachaStepperHold(stepperKey, stepperAction);
    });

    document.addEventListener("pointerup", stopGachaStepperHold);
    document.addEventListener("pointercancel", stopGachaStepperHold);
    document.addEventListener("pointerleave", stopGachaStepperHold);

    document.addEventListener("input", function (event) {
      const stepperInput = event.target.closest(".gacha-stepper-input");
      if (!stepperInput) {
        return;
      }

      if (stepperInput === gachaTargetPotentialInput) {
        const inputValue = Number.parseInt(stepperInput.value, 10);
        gachaDailyState.targetPotential = Number.isFinite(inputValue) ? Math.min(5, Math.max(0, inputValue)) : 0;
        renderGachaCalculator();
        return;
      }

      const stepperKey = Object.entries(gachaOriginiumShopQuantityNodes).find(([, node]) => node === stepperInput)?.[0];
      if (!stepperKey) {
        return;
      }

      const maxValue = gachaStepperLimits[stepperKey] || Number.POSITIVE_INFINITY;
      const inputValue = Number.parseInt(stepperInput.value, 10);
      const nextValue = Number.isFinite(inputValue) ? Math.min(maxValue, Math.max(0, inputValue)) : 0;
      gachaPaidState.originiumShopQuantities[stepperKey] = nextValue;
      renderGachaCalculator();
    });

    Object.values(gachaInputs).forEach((input) => {
      if (!input) {
        return;
      }
      input.addEventListener("input", renderGachaCalculator);
    });

    if (gachaScrollPanel) {
      gachaScrollPanel.addEventListener("scroll", syncPaidStickyTotalVisibility, { passive: true });
    }

    window.addEventListener("resize", syncPaidStickyTotalVisibility);

    restoreGachaLocalState();
    renderGachaCalculator();
  }
})();
